# Load Test Results — NFR-01..06

- **Date**: 2026-07-27
- **Branch**: `feature/close-remaining-gaps`
- **Tool**: k6 (grafana/k6 Docker image)
- **Script**: `scripts/load-test.k6.js`
- **Target**: local Docker stack (`docker-compose --profile development`), `http://host.docker.internal:8080` (nginx → API)
- **Auth**: real cookie login via `POST /api/account/login` (antiforgery header + Turnstile test-key captcha), one login per VU, session kept with `noCookiesReset`
- **API interception used**: No — real HTTP against the running stack

## Scenario

Ramping VUs: 0 → 30 trong 30s, giữ **30 concurrent users trong 2 phút**, ramp down 15s.
Mỗi vòng lặp user gọi 6 endpoint luồng chính (có think-time 0.5–1.5s giữa request):

| Endpoint | Ý nghĩa |
|---|---|
| `GET /api/v1/app/current-user-context` | context người dùng |
| `GET /api/v1/app/dashboard/stats` | dashboard tổng quan |
| `GET /api/v1/app/business?SkipCount=0&MaxResultCount=15` | danh sách cơ sở |
| `GET /api/v1/app/inspection-plan?...` | kế hoạch thanh kiểm tra |
| `GET /api/v1/app/inspection-result?...` | kết quả thanh kiểm tra |
| `GET /api/v1/app/statistics?Year=2026` | thống kê tổng hợp |

## Results

| Metric | Result | NFR limit | Status |
|---|---|---|---|
| Total requests | 3,270 | — | — |
| Failed rate | 0.00% | < 1% (threshold) | ✅ PASS |
| Avg response | **31 ms** | < 10,000 ms (NFR-01) | ✅ PASS |
| p95 response | 42 ms | < 5,000 ms (sanity threshold) | ✅ PASS |
| Max response | **418 ms** | < 30,000 ms (NFR-02) | ✅ PASS |
| Concurrent VUs held | **30** | ≥ 30 (NFR-05) | ✅ PASS |
| Active users simultaneously | 30 (all VUs iterate with think-time) | ≥ 5 (NFR-06) | ✅ PASS |

k6 exit code: 0 (mọi threshold pass).

## Server CPU under load (docker stats, 6 mẫu cách nhau 20s trong lúc chịu tải)

| Container | CPU samples | Avg | NFR limit | Status |
|---|---|---|---|---|
| foodsafe-api-1 (app server) | 36.7 / 38.8 / 77.8 / 59.8 / 64.1 / 49.2 % | **~54%** | avg ≤ 75% (NFR-04) | ✅ PASS |
| foodsafe-postgres-1 (data server) | 14.8 / 13.3 / 25.9 / 20.8 / 25.1 / 21.1 % | **~20%** | avg ≤ 75% (NFR-03) | ✅ PASS |
| foodsafe-redis-1 | < 3.1% | — | — | — |
| foodsafe-frontend-1 (nginx) | < 4.1% | — | — | — |

## Reproduce

```powershell
$pw = (Select-String -Path FoodSafe.BE\.env -Pattern '^SEED_ADMIN_PASSWORD=(.+)$').Matches[0].Groups[1].Value
Get-Content scripts\load-test.k6.js -Raw | docker run --rm -i `
  --add-host=host.docker.internal:host-gateway `
  -e BASE_URL=http://host.docker.internal:8080 -e ADMIN_PASSWORD=$pw `
  grafana/k6 run -
```

## Notes

- Kết quả đo trên máy dev (Docker Desktop, Windows 11) — production servers dự kiến mạnh hơn; headroom so với NFR rất lớn (avg 31ms vs limit 10s).
- NFR-03/04 ở production còn phụ thuộc hạ tầng thật; kết quả này chứng minh phần mềm không phải điểm nghẽn.
