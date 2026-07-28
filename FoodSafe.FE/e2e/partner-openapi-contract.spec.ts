/**
 * FR-50-05 — executable contract test: the partner OpenAPI document
 * (docs/integration/partner-openapi.yaml) is validated against the RUNNING
 * stack (real nginx → ASP.NET Core → PostgreSQL, no interception).
 *
 * What "verified" means here:
 *  1. Every operation declared in the OpenAPI document is exercised over real
 *     HTTP (a coverage set of operationIds is enforced at the end).
 *  2. All seven dataType path-segment enum values are accepted for an
 *     allow-all partner — the enum in the spec IS the runtime segment map.
 *  3. Every partner-facing error.code in the PartnerError enum is reproduced
 *     with its documented HTTP status — the enum matches runtime completely.
 *  4. Success/error response bodies are validated structurally against the
 *     spec's JSON Schemas ($ref/allOf resolved; type/required/enum/pattern/
 *     format/nullable checked).
 *  5. Vietnamese Unicode payloads round-trip verbatim into the stored
 *     submission payload.
 *
 * Partner calls use the cookie-less `request` fixture, so authentication is
 * provably the X-Api-Key header alone.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import {
  test,
  expect,
  type APIRequestContext,
  type Page,
} from "@playwright/test";
import { signInAsAdmin, requestVerificationToken } from "./helpers/auth";

const BASE_URL = "http://127.0.0.1:8080";
const ADMIN_API = "/api/v1/app/partner-account";
const RECEIVE_API = "/api/v1/partner/submissions";
const SPEC_PATH = fileURLToPath(
  new URL("../../docs/integration/partner-openapi.yaml", import.meta.url),
);
const RUN = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;

// ── minimal OpenAPI schema validator (subset used by the spec) ───────────────

interface OpenApiSpec {
  paths: Record<string, Record<string, { operationId?: string }>>;
  components: { schemas: Record<string, SchemaObject> };
}
interface SchemaObject {
  $ref?: string;
  allOf?: SchemaObject[];
  type?: string;
  properties?: Record<string, SchemaObject>;
  required?: string[];
  items?: SchemaObject;
  enum?: unknown[];
  nullable?: boolean;
  pattern?: string;
  format?: string;
  minLength?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
}

function resolveRef(spec: OpenApiSpec, ref: string): SchemaObject {
  let node: unknown = spec;
  for (const part of ref.replace(/^#\//, "").split("/")) {
    node = (node as Record<string, unknown>)[part];
    if (node === undefined) throw new Error(`Unresolvable $ref: ${ref}`);
  }
  return node as SchemaObject;
}

function validateAgainst(
  spec: OpenApiSpec,
  value: unknown,
  schema: SchemaObject,
  path = "$",
  errors: string[] = [],
): string[] {
  if (schema.$ref) {
    return validateAgainst(spec, value, resolveRef(spec, schema.$ref), path, errors);
  }
  if (schema.allOf) {
    for (const sub of schema.allOf) validateAgainst(spec, value, sub, path, errors);
    return errors;
  }
  if (value === null || value === undefined) {
    if (!schema.nullable) errors.push(`${path}: is ${value} but not nullable`);
    return errors;
  }
  if (schema.enum && !schema.enum.includes(value)) {
    errors.push(`${path}: ${JSON.stringify(value)} not in enum ${JSON.stringify(schema.enum)}`);
  }
  switch (schema.type) {
    case "object": {
      if (typeof value !== "object" || Array.isArray(value)) {
        errors.push(`${path}: expected object, got ${typeof value}`);
        break;
      }
      const record = value as Record<string, unknown>;
      for (const req of schema.required ?? []) {
        if (record[req] === undefined) errors.push(`${path}.${req}: required property missing`);
      }
      for (const [key, sub] of Object.entries(schema.properties ?? {})) {
        if (key in record) validateAgainst(spec, record[key], sub, `${path}.${key}`, errors);
      }
      break;
    }
    case "array": {
      if (!Array.isArray(value)) {
        errors.push(`${path}: expected array, got ${typeof value}`);
        break;
      }
      if (schema.minItems !== undefined && value.length < schema.minItems)
        errors.push(`${path}: ${value.length} items < minItems ${schema.minItems}`);
      if (schema.maxItems !== undefined && value.length > schema.maxItems)
        errors.push(`${path}: ${value.length} items > maxItems ${schema.maxItems}`);
      if (schema.items && Object.keys(schema.items).length > 0) {
        value.forEach((item, i) =>
          validateAgainst(spec, item, schema.items!, `${path}[${i}]`, errors));
      }
      break;
    }
    case "string": {
      if (typeof value !== "string") {
        errors.push(`${path}: expected string, got ${typeof value}`);
        break;
      }
      if (schema.pattern && !new RegExp(schema.pattern).test(value))
        errors.push(`${path}: "${value}" does not match ${schema.pattern}`);
      if (schema.maxLength !== undefined && value.length > schema.maxLength)
        errors.push(`${path}: length ${value.length} > maxLength ${schema.maxLength}`);
      if (schema.minLength !== undefined && value.length < schema.minLength)
        errors.push(`${path}: length ${value.length} < minLength ${schema.minLength}`);
      if (schema.format === "uuid" &&
          !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value))
        errors.push(`${path}: "${value}" is not a uuid`);
      if (schema.format === "date-time" && Number.isNaN(Date.parse(value)))
        errors.push(`${path}: "${value}" is not a date-time`);
      break;
    }
    case "integer":
    case "number": {
      if (typeof value !== "number") errors.push(`${path}: expected number, got ${typeof value}`);
      break;
    }
    case "boolean": {
      if (typeof value !== "boolean") errors.push(`${path}: expected boolean, got ${typeof value}`);
      break;
    }
    default:
      break; // empty schema {} — any JSON value is valid
  }
  return errors;
}

function expectValid(spec: OpenApiSpec, value: unknown, schemaName: string) {
  const schema = spec.components.schemas[schemaName];
  expect(schema, `schema ${schemaName} exists in spec`).toBeDefined();
  const errors = validateAgainst(spec, value, schema);
  expect(
    errors,
    `${schemaName} violations for ${JSON.stringify(value).slice(0, 500)}`,
  ).toEqual([]);
}

// ── request helpers ──────────────────────────────────────────────────────────

const spec: OpenApiSpec = parse(readFileSync(SPEC_PATH, "utf8"));
const covered = new Set<string>();
const observedErrorCodes = new Set<string>();

function specOperationIds(): string[] {
  const ids: string[] = [];
  for (const operations of Object.values(spec.paths)) {
    for (const op of Object.values(operations)) {
      if (op && typeof op === "object" && op.operationId) ids.push(op.operationId);
    }
  }
  return ids;
}

function segmentEnumFromSpec(): string[] {
  const params = (spec.paths["/api/v1/partner/submissions/{dataType}"].post as {
    parameters?: Array<{ name: string; schema?: { enum?: string[] } }>;
  }).parameters;
  const dataType = params?.find((p) => p.name === "dataType");
  expect(dataType?.schema?.enum?.length, "dataType enum present in spec").toBeGreaterThan(0);
  return dataType!.schema!.enum!;
}

function errorCodeEnumFromSpec(): string[] {
  const codes = spec.components.schemas.PartnerError.properties?.error
    ?.properties?.code?.enum as string[] | undefined;
  expect(codes?.length, "PartnerError code enum present in spec").toBeGreaterThan(0);
  return codes!;
}

async function csrf(page: Page) {
  return { RequestVerificationToken: await requestVerificationToken(page) };
}

interface SubmitOptions {
  segment?: string;
  requestId?: string | null;
  timestamp?: string | null;
  schemaVersion?: string;
  records?: unknown[];
  sourceSystem?: string;
  correlationId?: string;
  rawBody?: string;
}

async function submit(
  partnerClient: APIRequestContext,
  rawKey: string | undefined,
  options: SubmitOptions = {},
) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (rawKey) headers["X-Api-Key"] = rawKey;
  if (options.requestId !== null)
    headers["X-Request-Id"] = options.requestId ?? `req-${RUN}-${Math.random()}`;
  if (options.timestamp !== null)
    headers["X-Timestamp"] = options.timestamp ?? new Date().toISOString();
  if (options.correlationId) headers["X-Correlation-Id"] = options.correlationId;

  const body =
    options.rawBody ??
    JSON.stringify({
      schemaVersion: options.schemaVersion ?? "1.0",
      records: options.records ?? [
        { title: `Cảnh báo liên thông hợp đồng ${RUN}`, severity: "Medium" },
      ],
      sourceSystem: options.sourceSystem ?? "Hệ thống kiểm thử hợp đồng",
      sentAt: new Date().toISOString(),
    });

  return partnerClient.post(
    `${BASE_URL}${RECEIVE_API}/${options.segment ?? "alert"}`,
    { headers, data: body },
  );
}

async function expectPartnerError(
  response: Awaited<ReturnType<APIRequestContext["post"]>>,
  status: number,
  code: string,
) {
  expect(response.status(), await response.text()).toBe(status);
  const body = (await response.json()) as { error: { code: string } };
  expectValid(spec, body, "PartnerError");
  expect(body.error.code).toBe(code);
  observedErrorCodes.add(body.error.code);
}

async function createPartner(
  page: Page,
  suffix: string,
  allowedDataTypes: number[],
): Promise<{ id: string }> {
  const response = await page.context().request.post(ADMIN_API, {
    headers: await csrf(page),
    data: {
      code: `CT-${RUN}-${suffix}`,
      name: `Đối tác hợp đồng ${suffix} ${RUN}`,
      externalSystem: "Bộ Y tế",
      allowedDataTypes,
      description: "Kiểm thử hợp đồng OpenAPI (FR-50-05)",
    },
  });
  expect(response.status(), await response.text()).toBe(200);
  const body = (await response.json()) as { id: string };
  expectValid(spec, body, "PartnerAccount");
  covered.add("createPartnerAccount");
  return body;
}

async function issueKey(page: Page, partnerId: string): Promise<{ id: string; rawKey: string }> {
  const response = await page.context().request.post(
    `${ADMIN_API}/${partnerId}/keys`,
    { headers: await csrf(page), data: { description: `contract ${RUN}` } },
  );
  expect(response.status(), await response.text()).toBe(200);
  const body = (await response.json()) as { id: string; rawKey: string };
  expectValid(spec, body, "IssuedPartnerApiKey");
  covered.add("issuePartnerKey");
  return body;
}

async function deletePartner(page: Page, id: string) {
  const response = await page
    .context()
    .request.delete(`${ADMIN_API}/${id}`, { headers: await csrf(page) });
  expect(response.status(), "spec documents 204 for delete").toBe(204);
  covered.add("deletePartnerAccount");
}

// ── the contract test ────────────────────────────────────────────────────────

test.describe("FR-50-05 — partner OpenAPI contract vs. running API", () => {
  test("every documented operation, dataType segment and error code matches runtime", async ({
    page,
    request: partnerClient,
  }) => {
    test.setTimeout(180_000);
    await signInAsAdmin(page);

    const allTypes = [1, 2, 3, 4, 5, 6, 7];
    const allowAll = await createPartner(page, "all", allTypes);
    const restricted = await createPartner(page, "alert-only", [1]);
    const allowAllKey = await issueKey(page, allowAll.id);
    const restrictedKey = await issueKey(page, restricted.id);

    try {
      // ── 1. every dataType enum segment in the spec is accepted ────────────
      let firstSubmissionId = "";
      const firstRequestId = `ct-${RUN}-alert`;
      for (const segment of segmentEnumFromSpec()) {
        const requestId = segment === "alert" ? firstRequestId : `ct-${RUN}-${segment}`;
        const response = await submit(partnerClient, allowAllKey.rawKey, {
          segment,
          requestId,
          correlationId: `corr-${RUN}-${segment}`,
        });
        expect(response.status(), `${segment}: ${await response.text()}`).toBe(200);
        const body = (await response.json()) as {
          submissionId: string;
          correlationId: string;
          duplicate: boolean;
        };
        expectValid(spec, body, "InboundReceiveResult");
        expect(body.duplicate).toBe(false);
        expect(body.correlationId).toBe(`corr-${RUN}-${segment}`);
        if (segment === "alert") firstSubmissionId = body.submissionId;
      }
      covered.add("receiveSubmission");

      // Unix-seconds X-Timestamp variant (spec documents both formats).
      const unixTs = await submit(partnerClient, allowAllKey.rawKey, {
        requestId: `ct-${RUN}-unix`,
        timestamp: String(Math.floor(Date.now() / 1000)),
      });
      expect(unixTs.status(), await unixTs.text()).toBe(200);

      // ── 2. idempotency: redelivery echoes the ORIGINAL submission ─────────
      const replay = await submit(partnerClient, allowAllKey.rawKey, {
        requestId: firstRequestId,
      });
      expect(replay.status()).toBe(200);
      const replayBody = (await replay.json()) as {
        submissionId: string;
        duplicate: boolean;
      };
      expectValid(spec, replayBody, "InboundReceiveResult");
      expect(replayBody.duplicate).toBe(true);
      expect(replayBody.submissionId).toBe(firstSubmissionId);

      // ── 3. every PartnerError code in the spec enum is reproducible ───────
      await expectPartnerError(
        await submit(partnerClient, allowAllKey.rawKey, { segment: "unknown-type" }),
        400, "UnknownDataType");
      await expectPartnerError(
        await submit(partnerClient, allowAllKey.rawKey, { rawBody: "null" }),
        400, "MalformedBody");
      await expectPartnerError(
        await submit(partnerClient, allowAllKey.rawKey, { requestId: null }),
        400, "MissingRequestId");
      await expectPartnerError(
        await submit(partnerClient, allowAllKey.rawKey, { requestId: "r".repeat(129) }),
        400, "MissingRequestId");
      await expectPartnerError(
        await submit(partnerClient, allowAllKey.rawKey, { timestamp: null }),
        400, "MissingTimestamp");
      await expectPartnerError(
        await submit(partnerClient, allowAllKey.rawKey, { timestamp: "not-a-time" }),
        400, "MissingTimestamp");
      await expectPartnerError(
        await submit(partnerClient, allowAllKey.rawKey, {
          timestamp: new Date(Date.now() - 10 * 60_000).toISOString(),
        }),
        400, "StaleTimestamp");
      await expectPartnerError(
        await submit(partnerClient, allowAllKey.rawKey, { schemaVersion: "9.9" }),
        400, "UnsupportedSchemaVersion");
      await expectPartnerError(
        await submit(partnerClient, allowAllKey.rawKey, { records: [] }),
        400, "InvalidRecords");
      await expectPartnerError(
        await submit(partnerClient, allowAllKey.rawKey, {
          records: Array.from({ length: 501 }, (_, i) => ({ i })),
        }),
        400, "InvalidRecords");
      await expectPartnerError(
        await submit(partnerClient, allowAllKey.rawKey, { sourceSystem: "s".repeat(257) }),
        400, "InvalidSourceSystem");
      await expectPartnerError(
        await submit(partnerClient, undefined), 401, "InvalidApiKey");
      await expectPartnerError(
        await submit(partnerClient, `fsp_${"0".repeat(40)}`), 401, "InvalidApiKey");
      await expectPartnerError(
        await submit(partnerClient, "not-prefixed-key"), 401, "InvalidApiKey");
      await expectPartnerError(
        await submit(partnerClient, restrictedKey.rawKey, { segment: "product" }),
        403, "DataTypeNotAllowed");

      const missing = errorCodeEnumFromSpec().filter((c) => !observedErrorCodes.has(c));
      expect(missing, "every spec error code reproduced at runtime").toEqual([]);

      // ── 4. admin surface matches the spec schemas ─────────────────────────
      const adminRequest = page.context().request;

      const list = await adminRequest.get(
        `${ADMIN_API}?Filter=${encodeURIComponent(`CT-${RUN}`)}&MaxResultCount=10`);
      expect(list.status()).toBe(200);
      const listBody = (await list.json()) as { totalCount: number; items: unknown[] };
      expectValid(spec, listBody, "PagedPartnerAccountResult");
      expect(listBody.items.length).toBe(2);
      covered.add("listPartnerAccounts");

      const detail = await adminRequest.get(`${ADMIN_API}/${allowAll.id}`);
      expect(detail.status()).toBe(200);
      const detailBody = (await detail.json()) as { allowedDataTypes: number[] };
      expectValid(spec, detailBody, "PartnerAccount");
      expect([...detailBody.allowedDataTypes].sort()).toEqual(allTypes);
      covered.add("getPartnerAccount");

      const update = await adminRequest.put(`${ADMIN_API}/${restricted.id}`, {
        headers: await csrf(page),
        data: {
          name: `Đối tác hợp đồng đã sửa ${RUN}`,
          externalSystem: "Sở Nông nghiệp",
          allowedDataTypes: [1],
        },
      });
      expect(update.status(), await update.text()).toBe(200);
      expectValid(spec, await update.json(), "PartnerAccount");
      covered.add("updatePartnerAccount");

      const keys = await adminRequest.get(`${ADMIN_API}/${allowAll.id}/keys`);
      expect(keys.status()).toBe(200);
      const keysBody = (await keys.json()) as Array<Record<string, unknown>>;
      expect(keysBody.length).toBeGreaterThan(0);
      for (const key of keysBody) {
        expectValid(spec, key, "PartnerApiKey");
        // One-time visibility: raw key material never appears after issuance.
        expect(key.rawKey).toBeUndefined();
        expect(key.keyHash).toBeUndefined();
      }
      covered.add("listPartnerKeys");

      const submissions = await adminRequest.get(
        `${ADMIN_API}/submissions?PartnerAccountId=${allowAll.id}&MaxResultCount=20`);
      expect(submissions.status()).toBe(200);
      const submissionsBody = (await submissions.json()) as {
        items: Array<{ id: string; requestId: string }>;
      };
      expectValid(spec, submissionsBody, "PagedInboundSubmissionResult");
      expect(
        submissionsBody.items.filter((s) => s.requestId === firstRequestId),
      ).toHaveLength(1);
      covered.add("listInboundSubmissions");

      const submissionDetail = await adminRequest.get(
        `${ADMIN_API}/submissions/${firstSubmissionId}`);
      expect(submissionDetail.status()).toBe(200);
      const submissionDetailBody =
        (await submissionDetail.json()) as { payload: string };
      expectValid(spec, submissionDetailBody, "InboundSubmissionDetail");
      // Vietnamese Unicode is stored verbatim, not \uXXXX-escaped.
      expect(submissionDetailBody.payload).toContain(
        `Cảnh báo liên thông hợp đồng ${RUN}`);
      covered.add("getInboundSubmission");

      // ── 5. lifecycle operations behave as documented ──────────────────────
      const toggle = await adminRequest.post(
        `${ADMIN_API}/${restricted.id}/toggle-status`,
        { headers: await csrf(page) });
      expect(toggle.status(), "spec documents 204 for toggle-status").toBe(204);
      covered.add("togglePartnerStatus");
      await expectPartnerError(
        await submit(partnerClient, restrictedKey.rawKey), 401, "InvalidApiKey");

      const revoke = await adminRequest.delete(
        `${ADMIN_API}/${allowAll.id}/keys/${allowAllKey.id}`,
        { headers: await csrf(page) });
      expect(revoke.status(), "spec documents 204 for revoke").toBe(204);
      covered.add("revokePartnerKey");
      await expectPartnerError(
        await submit(partnerClient, allowAllKey.rawKey), 401, "InvalidApiKey");

      // Unauthenticated admin access is rejected (documented 401).
      const anonymous = await partnerClient.get(`${BASE_URL}${ADMIN_API}`, {
        headers: { Accept: "application/json" },
        maxRedirects: 0,
      });
      expect([401, 302]).toContain(anonymous.status());
    } finally {
      await deletePartner(page, allowAll.id);
      await deletePartner(page, restricted.id);
    }

    // ── 6. coverage gate: no operation in the spec goes unexercised ─────────
    const unexercised = specOperationIds().filter((id) => !covered.has(id));
    expect(unexercised, "spec operations without a runtime probe").toEqual([]);
  });
});
