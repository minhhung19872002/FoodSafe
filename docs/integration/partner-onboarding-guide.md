# FoodSafe Partner Onboarding Guide (INT-03)

**Hướng dẫn kết nối liên thông dành cho đối tác** — companion to the
[Partner API Specification](partner-api-specification.md) and the machine-readable
[`partner-openapi.yaml`](partner-openapi.yaml).

Audience: the integration team of a partner agency (Bộ Y tế, Sở Nông nghiệp,
Sở Công thương, …) and the FoodSafe operator (Chi cục ATVSTP Quảng Ninh) who
provisions them.

---

## 1. Roles

| Step | Done by | Where |
|---|---|---|
| Register the partner account, choose allowed data types | FoodSafe operator | Admin UI → *Tích hợp dữ liệu* → tab **Đối tác liên thông** (or admin API) |
| Issue / rotate / revoke API keys | FoodSafe operator | Same tab → **Khóa API** (or admin API) |
| Deliver the raw key to the partner | FoodSafe operator | Out-of-band secure channel |
| Call the receive endpoint | Partner system | `POST /api/v1/partner/submissions/{dataType}` |
| Monitor received submissions & call history | FoodSafe operator | Tabs **Dữ liệu nhận về** and **Lịch sử gọi API** |

## 2. Operator: provisioning a partner

1. **Create the partner account** — *Thêm đối tác*: unique machine `code`
   (letters, digits, `-`, `_`; max 64), display `name`, `externalSystem`
   (e.g. "Bộ Y tế"), and the **allow-list of data types** the partner may
   submit (at least one). The account is created `Active` and belongs to your
   organization (all later visibility is organization-scoped).
2. **Issue a key** — *Cấp khóa mới*, optionally with an expiry date and a
   description (e.g. "khóa môi trường production"). The dialog shows the raw
   key (`fsp_…`, 44 characters) **exactly once** — copy it now; only the
   12-character prefix remains visible afterwards.
3. **Deliver the key securely** — never by plain e-mail in full; use an agreed
   secure channel. Record only the key *prefix* in tickets.
4. **Verify** — after the partner's first successful call, the submission
   appears under *Dữ liệu nhận về* and an `Inbound` row under *Lịch sử gọi
   API*; the key's *lần dùng cuối* (`lastUsedAt`) updates.

Ongoing operations:

- **Rotation (no downtime):** issue a second key → partner switches → revoke
  the old key. Revocation (*Thu hồi*) takes effect on the very next request.
- **Suspension:** toggling the partner to *Tạm ngưng* immediately turns all of
  its calls into 401, without touching its keys. Toggle back to re-enable.
- **Deletion:** soft-deletes the account and revokes all live keys.
- Required permissions: `FoodSafe.DataIntegration.Partners.View / Create /
  Edit / Delete / ManageKeys`.

## 3. Partner: integration checklist

1. Receive from the operator: base URL, your raw API key, your allowed data
   types, and this documentation.
2. Store the key in a secrets manager. Never commit or log it.
3. Sync your server clock via NTP (the API rejects timestamps outside ±5 minutes).
4. Implement the request per the [specification §3](partner-api-specification.md):
   - headers `X-Api-Key`, `X-Request-Id` (your idempotency key, ≤128 chars),
     `X-Timestamp` (Unix seconds or ISO-8601), optional `X-Correlation-Id`;
   - JSON envelope `{ schemaVersion: "1.0", records: [1..500 items], sourceSystem?, sentAt? }`.
5. Persist the returned `submissionId` + `correlationId` with your batch record.
6. Implement retries: same `X-Request-Id`, fresh `X-Timestamp`, exponential
   backoff; treat `duplicate: true` as success. Do not blind-retry 400/401/403.
7. Branch error handling on `error.code` (stable), never on `error.message`.

### 3.1 First call (smoke test)

```bash
BASE_URL="http://127.0.0.1:8080"          # environment base URL
API_KEY="fsp_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"  # your issued key

curl -sS -X POST "$BASE_URL/api/v1/partner/submissions/alert" \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: $API_KEY" \
  -H "X-Request-Id: onboard-smoke-001" \
  -H "X-Timestamp: $(date -u +%s)" \
  -H "X-Correlation-Id: onboard-$(date -u +%Y%m%d)" \
  --data @docs/integration/examples/alert-submission.json
```

Expected: HTTP 200 with `"duplicate": false`. Run it a second time unchanged:
HTTP 200 with `"duplicate": true` and the **same** `submissionId` — that is the
idempotency contract working. More curl variants (each supported data type,
each error case) are in [`examples/curl-examples.sh`](examples/curl-examples.sh).

### 3.2 Troubleshooting

| Symptom | Likely cause | Action |
|---|---|---|
| 401 `InvalidApiKey` on every call | Key mistyped/revoked/expired, or partner suspended (the message is intentionally identical for all of these) | Re-check the key value; then ask the operator to check key + partner status |
| 400 `StaleTimestamp` | Clock skew > 5 min, or you re-sent an old `X-Timestamp` on retry | Fix NTP; always regenerate `X-Timestamp` per attempt |
| 400 `MissingTimestamp` | Header absent or not Unix-seconds/ISO-8601 | Fix the format |
| 403 `DataTypeNotAllowed` | Segment valid but not on your allow-list | Ask the operator to extend the allow-list |
| 400 `UnknownDataType` | Typo in the path segment | Use one of the seven documented segments |
| 400 `UnsupportedSchemaVersion` | `schemaVersion` ≠ `"1.0"` | Send exactly `"1.0"` |
| 400 `InvalidRecords` | `records` empty or > 500 items | Batch into ≤500-record envelopes |
| `duplicate: true` unexpectedly | `X-Request-Id` reused from an earlier batch | Use a fresh id per logical batch; reuse it only for retries of the same batch |

## 4. Data delivered — what happens next

Accepted envelopes are stored verbatim (full Unicode preserved) with status
*Received* and are visible to authorized operators immediately. Field-level
business ingestion is activated once the official TT 31/2026 mapping is
published; payloads accepted under schema `1.0` remain stored and will be
processed then. See specification §6 and §8 for the versioning policy.

## 5. Security summary for partners

Short version of specification §9: HTTPS only in production; one key per
system/environment; rotate ≤90 days or on personnel change; NTP-synced clocks;
monitor 401/403 bursts; log `submissionId`/`correlationId`; report suspected
key exposure immediately — rotation is zero-downtime.
