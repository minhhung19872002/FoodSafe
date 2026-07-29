# F-035 — Address Geocoding (Định vị cơ sở theo địa chỉ)

## Status: VERIFIED

## Why this feature exists

Business coordinates (`AddressLatitude`/`AddressLongitude`) and the address
fields (`AddressStreet` + province/district/commune) were entirely independent:
the only way to set coordinates was clicking the map, so editing an address
never moved the pin. A production record (`CS-HL-0008`, "Cơ sở Giò chả Ông
Toàn") showed this — its address had been edited to "Số 12 Nguyễn Văn Cừ" while
the pin stayed at the seeded Cao Thắng coordinates. There was no geocoding
anywhere in the codebase.

## Verification evidence

- **Feature ID**: F-035
- **Feature name**: Address Geocoding
- **Status**: VERIFIED
- **Verified Git commit**: wt-post-`0894c54`
- **Verification date**: 2026-07-29
- **Environment**: local Docker stack (`docker compose up --build`) — PostgreSQL
  15, Redis 7, MinIO, API and nginx frontend images rebuilt from this working
  tree; real migrations; real seed data
- **Frontend route**: `/businesses` (business create/edit modal)
- **Backend endpoints**: `POST /api/v1/app/geocoding/resolve`
- **Real database used**: Yes
- **Test account used**: `admin` (seeded)
- **API interception used**: **No**
- **E2E spec**: `e2e/business-geocoding.spec.ts` — **4/4 passed**

### Flows tested

| Check | Result |
|---|---|
| Resolves "Số 12 phố Cao Thắng" + province to coordinates inside Quảng Ninh | PASS |
| No-match answers `204`, distinguishable from an error | PASS |
| Anonymous caller rejected (4xx) | PASS |
| Real browser: button fills coordinates and shows the matched address | PASS |
| Backend unit/contract tests (`FullyQualifiedName~Geocoding`) | 23/23 PASS |

### Not covered

- **Permission denial for a view-only user** was not exercised in the browser.
  The service checks `Businesses.Create` OR `Businesses.Edit` via
  `IPermissionChecker` and the anonymous case is covered, but a logged-in
  read-only user was not tested end to end.
- **Organization / administrative-area isolation**: not applicable — the
  endpoint reads no FoodSafe business data. It takes an address, returns a
  coordinate, and touches only the shared administrative-area catalog.
- **Persistence after reload**: covered indirectly by F-006 (coordinates are
  saved through the existing business update path, unchanged by this feature).

## Provider notes

The provider is the **public OpenStreetMap Nominatim** service, chosen by the
product owner over a self-hosted or paid alternative. Its usage policy caps
traffic at roughly one request per second and requires an identifying
`User-Agent`; both are honoured:

- `NominatimGeocoder` serialises upstream calls through a process-wide gate with
  a configurable minimum interval (`MinimumRequestIntervalMilliseconds`,
  default 1100 ms).
- `GeocodingAppService` caches every answer — **including misses** — in Redis
  for `CacheDays` (default 30), so repeated lookups never reach the provider.
- `Geocoding:UserAgent` in `appsettings.json` identifies the deployment.

**Operational risk**: this is a free, best-effort, third-party service with no
SLA. If it rate-limits or blocks the deployment, geocoding silently degrades to
"no match" and the user falls back to clicking the map. Nothing else breaks.

### Vietnamese address matching

Empirical probing of the provider drove the query strategy:

| Query | Result |
|---|---|
| `"Phố Cao Thắng, Hạ Long, Quảng Ninh"` (free text) | no match |
| `"Cao Thắng, Hạ Long, Quảng Ninh"` (free text) | no match |
| `street=Cao Thắng&state=Quảng Ninh` (structured) | match |
| `city=Hạ Long&state=Quảng Ninh` (structured) | match |
| `city=Phường Hồng Hà&state=Quảng Ninh` (structured) | no match |
| `"Phường Hồng Hà, Thành phố Hạ Long, Quảng Ninh"` (free text) | match |
| `street=Cao Thắng&city=Hạ Long` (no province) | matched **Bình Dương** |

So the implementation tries, in order:

1. structured `street` (house number and "phố"/"đường" stripped) + `state`
2. structured raw street + `state`
3. free text commune + district + province
4. free text district + province
5. free text province

Every candidate is province-constrained, which is what stops a same-named
street in another province from winning. The matched address is shown to the
user ("Đã khớp: …") so a coarse fallback is visible rather than silent.

## Related source paths

- `FoodSafe.BE/src/FoodSafe.Application.Contracts/Geocoding/GeocodingDtos.cs`
- `FoodSafe.BE/src/FoodSafe.Application/Geocoding/` (AppService, provider,
  options, `AddressQuery`)
- `FoodSafe.BE/src/FoodSafe.HttpApi/Geocoding/GeocodingController.cs`
- `FoodSafe.BE/src/FoodSafe.HttpApi.Host/FoodSafeHttpApiHostModule.cs`
  (`ConfigureGeocoding`)
- `FoodSafe.FE/src/features/businesses/api/businessApi.ts` (`geocodingApi`)
- `FoodSafe.FE/src/features/businesses/api/businessMutations.ts`
  (`useGeocodeAddress`)
- `FoodSafe.FE/src/features/businesses/components/BusinessEditorModal.tsx`
- `FoodSafe.FE/src/features/businesses/components/MapPicker.tsx`

## Shared dependencies

- Administrative-area catalog (F-005) — supplies the province/district/commune
  names used to build the query.
- Business editor form (F-006) — hosts the button.

## Conditions requiring retest

- Any change to `IAddressGeocoder`, the candidate chain, or the provider config.
- Switching geocoding provider.
- Changes to the administrative-area catalog naming or `Prefix()` mapping.
- Changes to `MapPicker` or the business editor address block.
