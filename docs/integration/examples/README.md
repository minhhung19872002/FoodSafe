# Partner API Examples

Companion examples for the [Partner API Specification](../partner-api-specification.md)
(INT-03 / FR-50-05). All submission payloads carry real Vietnamese Unicode
content — the API transports and stores it verbatim (never `\uXXXX`-escaped).

| File | What it shows |
|---|---|
| [`alert-submission.json`](alert-submission.json) | Envelope with two `alert` records (Cảnh báo ATTP) |
| [`food-poisoning-submission.json`](food-poisoning-submission.json) | Envelope with one `food-poisoning` case record (Ngộ độc thực phẩm) |
| [`inspection-result-submission.json`](inspection-result-submission.json) | Envelope with one `inspection-result` record incl. violations (Kết quả thanh kiểm tra) |
| [`accepted-response.json`](accepted-response.json) | HTTP 200 body for a first delivery (`duplicate: false`) |
| [`duplicate-response.json`](duplicate-response.json) | HTTP 200 body for an idempotent redelivery (`duplicate: true`, original `submissionId`) |
| [`error-responses.json`](error-responses.json) | Every partner-facing `error.code` with its actual message text |
| [`curl-examples.sh`](curl-examples.sh) | Runnable curl walkthrough: happy path, both timestamp formats, idempotent replay, and the main error cases |

Record fields inside `records[]` are illustrative: until the official
TT 31/2026 field mapping is published, record content is accepted as opaque
JSON (structural validation only) and stored verbatim — see specification §6.
The envelope fields (`schemaVersion`, `records` 1–500, `sourceSystem` ≤256,
`sentAt`) and all headers ARE strictly validated as specified.
