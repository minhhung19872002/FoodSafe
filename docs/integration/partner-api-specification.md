# FoodSafe Partner API Specification (FR-50-05)

**Đặc tả API liên thông dành cho đối tác — Hệ thống quản lý an toàn thực phẩm tỉnh Quảng Ninh**

| | |
|---|---|
| Document version | 1.0 |
| API version | v1 (`ApiContract.Version = "1.0"`) |
| Envelope schema version | `1.0` (exact match required) |
| Status | Generated from the committed implementation; verified against the running API by `FoodSafe.FE/e2e/partner-openapi-contract.spec.ts` |
| Machine-readable contract | [`partner-openapi.yaml`](partner-openapi.yaml) (OpenAPI 3.0.3) |
| Onboarding guide | [`partner-onboarding-guide.md`](partner-onboarding-guide.md) |
| Examples | [`examples/`](examples/) |

This document describes the **inbound partner integration surface (INT-03)**: how an external partner system (Bộ Y tế, Sở Nông nghiệp, Sở Công thương, …) pushes data into FoodSafe, and how FoodSafe operators manage partner accounts and API keys. Every statement in this document is derived from the implementation in `FoodSafe.BE/src` (controllers `PartnerInboundController`, `PartnerAccountController`; services `PartnerInboundAppService`, `PartnerAccountAppService`; entities `PartnerAccount`, `PartnerApiKey`, `InboundSubmission`, `ApiCallLog`).

---

## 1. Environments and base URLs

| Environment | Base URL | Notes |
|---|---|---|
| Local development | `http://127.0.0.1:8080` | Docker Compose stack (`FoodSafe.BE/docker-compose.yml`); nginx frontend proxies `/api/*` to the backend |
| Production / staging | `https://<host-assigned-at-deployment>` | HTTPS with TLS 1.2+ is mandatory; served behind an nginx reverse proxy (`docker-compose.prod.yml`). The concrete hostname is assigned by the Chi cục at deployment and communicated during onboarding. |

All paths below are relative to the base URL. The URL structure is identical in every environment.

- Requests and responses are JSON (`application/json`), UTF-8. Vietnamese text is transported and stored as literal Unicode (not `\uXXXX`-escaped).
- The partner endpoint is server-to-server: no cookies, no CSRF token, no CORS involvement.

## 2. Authentication — `X-API-Key`

Partner requests authenticate with a single header:

```
X-Api-Key: fsp_<40 random characters>
```

(Header names are case-insensitive per HTTP; `X-API-Key` and `X-Api-Key` are equivalent.)

- Raw keys are exactly 44 characters: the fixed prefix `fsp_` followed by 40 characters from `[A-Za-z0-9]`.
- The server stores only the first 12 characters (lookup prefix) and a SHA-256 hash of the full key. Verification uses a fixed-time comparison, so timing cannot be used to probe key material.
- **All** credential failures return the same response — HTTP 401 with error code `InvalidApiKey` and message `"Invalid API key."` — regardless of whether the key is missing, malformed, unknown, revoked, expired, or belongs to a suspended partner. A caller cannot distinguish these cases by probing.

### 2.1 Key issuance, rotation, revocation

Keys are managed by FoodSafe operators through the admin API/UI (section 5), not by partners:

- **Issuance** — `POST /api/v1/app/partner-account/{id}/keys`. The response contains `rawKey`. **This is the only time the raw key is ever visible**; it is never stored and can never be retrieved again. If it is lost, a new key must be issued. An optional `expiresAt` (UTC) and `description` can be set at issuance.
- **Rotation** — issue a new key, switch the partner system to it, then revoke the old key. Multiple keys per partner may be live simultaneously, so rotation requires no downtime.
- **Revocation** — `DELETE /api/v1/app/partner-account/{id}/keys/{keyId}`. Takes effect immediately: the next request with the revoked key receives 401. Revocation is recorded (`revokedAt`) and is not reversible. Deleting a partner account revokes all of its live keys.
- **Expiry** — a key with `expiresAt` in the past authenticates nothing (401). `lastUsedAt` is updated on each successfully authenticated request, so operators can identify stale keys.

## 3. Partner-facing endpoint

### 3.1 `POST /api/v1/partner/submissions/{dataType}`

Delivers one submission envelope of the given data type. Anonymous at the HTTP-session level; authentication is the `X-Api-Key` header alone.

#### Path parameter — supported `dataType` values

The segment is matched case-insensitively:

| Segment | SharedDataType (numeric) | Meaning |
|---|---|---|
| `alert` | 1 | Cảnh báo ATTP |
| `inspection-result` | 2 | Kết quả thanh kiểm tra |
| `food-poisoning` | 3 | Ngộ độc thực phẩm |
| `license` | 4 | Giấy phép / chứng nhận |
| `product` | 5 | Sản phẩm |
| `news` | 6 | Tin tức |
| `business` | 7 | Cơ sở SXKD |

Any other segment → 400 `UnknownDataType`. A partner may only submit the data types on its allow-list (section 3.5).

#### Request headers

| Header | Required | Rules |
|---|---|---|
| `X-Api-Key` | Yes | Section 2. |
| `X-Request-Id` | Yes | Partner-chosen idempotency key, 1–128 characters. Uniqueness is scoped **per partner** (section 3.6). Missing, blank, or longer than 128 → 400 `MissingRequestId`. |
| `X-Timestamp` | Yes | Request time as **Unix seconds** (e.g. `1785283200`) or **ISO-8601** (e.g. `2026-07-28T09:00:00Z`; values without an offset are treated as UTC). Must be within **±300 seconds** of server time, otherwise 400 `StaleTimestamp` (replay protection). Missing/unparseable → 400 `MissingTimestamp`. |
| `X-Correlation-Id` | No | Trace id echoed back in the response. Values longer than 64 characters are truncated to 64. If absent, the server generates one (32 hex characters). |
| `Content-Type` | Yes | `application/json`. |

#### Request body — submission envelope

```json
{
  "schemaVersion": "1.0",
  "records": [ { "…": "opaque JSON object per record" } ],
  "sourceSystem": "He thong Bo Y te",
  "sentAt": "2026-07-28T09:00:00Z"
}
```

| Field | Required | Rules |
|---|---|---|
| `schemaVersion` | Yes | Must equal `"1.0"` exactly (ordinal comparison). Anything else → 400 `UnsupportedSchemaVersion`. |
| `records` | Yes | Array of 1–500 JSON values. Empty, missing, or more than 500 → 400 `InvalidRecords`. Record **content** is currently opaque: it is validated structurally, stored verbatim, and will be mapped to business entities once the official TT 31/2026 field mapping is published (see section 9). |
| `sourceSystem` | No | Free text, at most 256 characters, otherwise 400 `InvalidSourceSystem`. |
| `sentAt` | No | ISO-8601 timestamp; informational, stored with the payload. |

A body that deserializes to `null` (e.g. literal `null`, or an empty body) → 400 `MalformedBody`.

#### Validation and evaluation order

The server evaluates in this order and stops at the first failure — request-hygiene checks run **before** any credential is touched:

1. `dataType` segment known → else 400 `UnknownDataType`
2. body present → else 400 `MalformedBody`
3. `X-Request-Id` present, ≤128 → else 400 `MissingRequestId`
4. `X-Timestamp` parseable → else 400 `MissingTimestamp`
5. `X-Timestamp` within ±300 s → else 400 `StaleTimestamp`
6. `schemaVersion` == `1.0` → else 400 `UnsupportedSchemaVersion`
7. `records` count 1–500 → else 400 `InvalidRecords`
8. `sourceSystem` ≤256 → else 400 `InvalidSourceSystem`
9. API key present, `fsp_`-prefixed, known prefix, hash matches → else 401
10. Key not revoked, not expired; partner Active → else 401
11. Data type on the partner's allow-list → else 403 `DataTypeNotAllowed`
12. Idempotency check (section 3.6) → duplicate returns 200 with `duplicate: true`
13. Submission persisted → 200 with `duplicate: false`

Consequence of this ordering: a 400 response does **not** confirm that the presented API key is valid, and hygiene failures (steps 1–8) are not attributed to any partner in the call history.

#### Success response — HTTP 200

```json
{
  "submissionId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "correlationId": "6f9619ff8b86d0119b0000c04fc964ff",
  "duplicate": false,
  "receivedAt": "2026-07-28T09:00:01.234Z"
}
```

| Field | Type | Meaning |
|---|---|---|
| `submissionId` | GUID | Server id of the stored submission. Quote it in support requests. |
| `correlationId` | string | Echo of `X-Correlation-Id` (possibly truncated to 64) or server-generated. |
| `duplicate` | boolean | `true` when this `X-Request-Id` was already received — see 3.6. |
| `receivedAt` | ISO-8601 UTC | When the (original) submission was received. |

#### Error responses

All partner-facing errors use one body shape:

```json
{ "error": { "code": "StaleTimestamp", "message": "X-Timestamp outside the ±300s replay window." } }
```

| HTTP | `error.code` | Trigger |
|---|---|---|
| 400 | `UnknownDataType` | Path segment is not one of the seven supported values |
| 400 | `MalformedBody` | Body missing or deserializes to null |
| 400 | `MissingRequestId` | `X-Request-Id` missing/blank/&gt;128 chars |
| 400 | `MissingTimestamp` | `X-Timestamp` missing or unparseable |
| 400 | `StaleTimestamp` | `X-Timestamp` outside ±300 s of server time |
| 400 | `UnsupportedSchemaVersion` | `schemaVersion` ≠ `"1.0"` |
| 400 | `InvalidRecords` | `records` missing, empty, or &gt;500 items |
| 400 | `InvalidSourceSystem` | `sourceSystem` &gt;256 chars |
| 401 | `InvalidApiKey` | Any credential failure (missing/malformed/unknown/revoked/expired key, suspended partner) — single generic message by design |
| 403 | `DataTypeNotAllowed` | Authenticated, but the data type is not on the partner's allow-list |
| 500 | — | Unexpected server error; retry per section 7 |

Error messages are English diagnostic strings; the `code` value is the stable contract — branch on `error.code`, not on `message`.

### 3.2 Replay-window behavior

Every request must carry `X-Timestamp` within **±300 seconds (5 minutes)** of server clock (`PartnerInboundAppService.TimestampToleranceSeconds = 300`). Requests outside the window are rejected with 400 `StaleTimestamp` before authentication. This bounds the usefulness of a captured request. Partner clocks should be NTP-synchronized; when retrying, always send a **fresh** `X-Timestamp` with the **same** `X-Request-Id`.

### 3.3 Idempotency behavior

- The pair **(partner account, `X-Request-Id`)** is unique among live submissions, enforced by a database unique index (`uq_di_is_partner_request`), not just an application check — two racing identical deliveries persist exactly one row.
- Redelivering the same `X-Request-Id` (any payload) returns HTTP 200 with `duplicate: true`, the **original** `submissionId`, `correlationId` and `receivedAt`. The redelivered payload is not stored.
- Idempotency is scoped **per partner**: the same `X-Request-Id` from two different partners produces two independent submissions.
- Recommended `X-Request-Id`: a UUID, or a stable business key of the export batch (e.g. `alert-batch-2026-07-28-001`), so that a resend after a network failure is recognized as a duplicate.

### 3.4 Authorization rules

- Each partner account carries an **allow-list of data types** (`allowedDataTypes`, set by the operator). Submitting an allowed segment with a valid key succeeds; a known segment outside the allow-list → 403 `DataTypeNotAllowed`.
- Partner status `Suspended` disables **all** submissions for that partner (401), even with live keys.
- Every submission is attributed to the partner's owning organization (`OrganizationId`); admin visibility of submissions follows the standard FoodSafe organization data-scope rules.

### 3.5 Request correlation and logging

- Send `X-Correlation-Id` to correlate a delivery across both systems; it is echoed in the response and stored on the submission. Without it the server generates one.
- Every **attributable** attempt (valid key prefix + hash ⇒ known partner) is recorded as an immutable `Inbound` row in the API call history (`ApiCallLog`): endpoint, timestamp, duration, success flag, `X-Request-Id`/`X-Correlation-Id`, error reason (e.g. "API key revoked."), and on success the request body truncated to 4 000 characters. Operators see these rows in the *Lịch sử gọi API* tab.
- Unattributable attempts (unknown/malformed key) and pre-authentication 400s are recorded in server logs only.
- The full payload is stored verbatim on the `InboundSubmission` row and is visible to authorized operators in the *Dữ liệu nhận về* tab.

## 4. Status codes summary (partner endpoint)

| HTTP | When | Body |
|---|---|---|
| 200 | Accepted (`duplicate: false`) or idempotent replay (`duplicate: true`) | Receive result (3.1) |
| 400 | Request hygiene / envelope validation failure | `{ "error": { code, message } }` |
| 401 | Credential failure (generic) | `{ "error": { code, message } }` |
| 403 | Data type not allowed for this partner | `{ "error": { code, message } }` |
| 500 | Unexpected server error | unspecified |

## 5. Operator (admin) endpoints

These endpoints manage partners and are **not** partner-facing. They require an authenticated FoodSafe session (HTTP-only cookie), a CSRF token (`RequestVerificationToken` header from the `XSRF-TOKEN` cookie) on write operations, and the listed permission. All reads/writes are organization-data-scoped.

Base route: `/api/v1/app/partner-account`

| Method & path | Permission | Purpose |
|---|---|---|
| `GET /` | `FoodSafe.DataIntegration.Partners.View` | Paged partner list (`Filter` matches code/name/system; `Status` filter) |
| `GET /{id}` | …`.View` | Partner detail incl. `activeKeyCount` |
| `POST /` | …`.Create` | Create partner (`code` unique among live partners → error `PartnerCodeAlreadyExists`) |
| `PUT /{id}` | …`.Edit` | Update name, external system, allow-list, description |
| `POST /{id}/toggle-status` | …`.Edit` | Active ↔ Suspended |
| `DELETE /{id}` | …`.Delete` | Soft-delete partner; revokes all live keys |
| `GET /{id}/keys` | …`.ManageKeys` | Key metadata (prefix, expiry, revocation, last use) — never raw keys |
| `POST /{id}/keys` | …`.ManageKeys` | Issue key — response includes `rawKey` exactly once |
| `DELETE /{id}/keys/{keyId}` | …`.ManageKeys` | Revoke key immediately |
| `GET /submissions` | …`.View` | Paged inbound submissions (filters: partner, data type, status, date range) |
| `GET /submissions/{submissionId}` | …`.View` | Submission detail incl. verbatim payload |

Unauthenticated calls receive 401; authenticated calls without permission receive 403; both use the standard ABP error envelope, which differs from the partner error shape in section 3.1. Full request/response schemas are in [`partner-openapi.yaml`](partner-openapi.yaml).

## 6. Data type payloads

Until the official TT 31/2026 field mapping is published (externally blocked — see `docs/functional-audit`), record content is accepted as opaque JSON per section 3.1 and stored verbatim with status `Received` for later ingestion (`Received → Processed / Rejected`). Illustrative record shapes partners may use today are in [`examples/`](examples/); they exercise real Vietnamese Unicode content. When the official mapping is published, field-level validation will be introduced under a **new** `schemaVersion` (section 8) — payloads accepted under `1.0` remain stored and replayable.

## 7. Retry and timeout guidance

- **Client timeout:** set ≥ 30 s (system SLA: p50 &lt; 10 s, worst-case &lt; 30 s). Typical accept latency is well under a second.
- **Retry on:** network errors, timeouts, HTTP 5xx. Use the **same `X-Request-Id`** and a **fresh `X-Timestamp`**; idempotency guarantees at-most-once storage, so blind resends are safe.
- **Recommended schedule:** exponential backoff with jitter, e.g. 1 s, 5 s, 30 s, 5 min, then queue for manual attention.
- **Do not retry unchanged:** 400 (fix the request), 403 (ask the Chi cục to extend the allow-list), 401 (check key/rotation state; if persistent, contact the operator — the message is intentionally generic).
- A 200 with `duplicate: true` after a retry is success — the original delivery got through.

## 8. Versioning and backward-compatibility policy

- **Transport version** is in the path (`/api/v1/...`, `ApiContract.Version = "1.0"`). Breaking transport changes (routes, headers, status-code semantics) will only ship under a new `/api/v2/...` prefix; `/api/v1/` remains available during an announced migration window.
- **Envelope version** is `schemaVersion`, matched exactly; currently only `"1.0"` is accepted, anything else is rejected with 400 `UnsupportedSchemaVersion` (fail-fast — no silent best-effort parsing). New envelope/record schemas will be introduced as new accepted `schemaVersion` values alongside `1.0`.
- **Non-breaking changes** that may occur within v1 without notice: new optional response fields, new `dataType` segments, new `error.code` values for new failure modes. Partner clients must tolerate unknown JSON fields and unknown error codes.
- **Never changing within v1:** existing `error.code` strings, the success-body field set of section 3.1, header names, the ±300 s replay window semantics, and the idempotency contract.

## 9. Security recommendations for partners

1. Treat the raw API key like a password: store it in a secrets manager, never in source control, logs, tickets, or client-side code.
2. Call only over HTTPS in production (TLS 1.2+; the production host does not serve plain HTTP).
3. Use one key per partner system/environment so keys can be rotated or revoked independently; set `expiresAt` at issuance where feasible and rotate periodically (≤ 90 days recommended).
4. Keep server clocks NTP-synchronized (the ±300 s replay window rejects skewed clocks).
5. Monitor for 401/403 responses: a burst of 401s after working traffic usually means the key was revoked/expired or the partner was suspended — contact the Chi cục operator.
6. Log `submissionId` and `correlationId` from every response; they are the join keys for cross-system support.
7. Restrict outbound egress so only your integration host can use the key; report suspected key exposure immediately so the operator can revoke and reissue (zero-downtime rotation, section 2.1).

## 10. Verification evidence

- Machine-readable contract: [`partner-openapi.yaml`](partner-openapi.yaml), linted with Redocly CLI.
- Executable contract test: `FoodSafe.FE/e2e/partner-openapi-contract.spec.ts` — drives the **running** stack (real nginx → ASP.NET Core → PostgreSQL, no interception): every operation in the OpenAPI document is exercised, every documented partner-facing status code and `error.code` is reproduced, all seven `dataType` segments are accepted for an allow-all partner, and response bodies are validated against the OpenAPI schemas.
- Behavioural regression evidence: `FoodSafe.FE/e2e/data-integration-partners.spec.ts` (registry F-019f).
