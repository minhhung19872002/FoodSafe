# F-010 — Eligibility Certificates (Giấy chứng nhận đủ điều kiện ATTP)

## Status: VERIFIED

- **Feature ID**: F-010 · **Verified Git commit**: `e6ce3f7` · **Date**: 2026-07-28
- **Environment**: Docker Compose full stack at `http://127.0.0.1:8080` · **Database**: real PostgreSQL 15 · **API interception**: **No**
- **Accounts**: `admin`, `district.staff@foodsafe.local`, `noperm@foodsafe.local`
- **Frontend route**: `/eligibility-certificates` (+ public `/tra-cuu-giay-du-dieu-kien`)
- **Endpoints**: `GET/POST /api/v1/app/eligibility-certificate`, `GET/PUT/DELETE .../{id}`, `POST .../{id}/revoke`, `.../business-options`, `.../excel/export`, `.../{id}/attachments*`, `GET /api/v1/public/eligibility-certificates`

## 2026-07-28 hardening batch (commit `e6ce3f7`)

Recon chạy thật trước khi sửa (browser + API, không mock) tìm ra và đã đóng:

- **L1 (nghiêm trọng)**: `BusinessAppService.DeleteAsync` không chặn xóa cơ sở khi
  còn giấy chứng nhận/đăng ký tham chiếu — tồn tại thật 1 cert active mồ côi trỏ về
  cơ sở đã xóa mềm (tên trống trên list + tra cứu công khai). Guard mở rộng cho
  eligibility/CFS/export certificates + product/advertisement registrations; message
  `FoodSafe:Business:0010` cập nhật vi/en. Cert `DeleteAsync` thêm đường dọn orphan
  (cơ sở đã xóa mềm → bỏ qua đồng bộ cờ thay vì 403; ngoài scope vẫn chặn). Orphan
  `E2E-STT24-78125469/QN` đã dọn qua UI, xác nhận mất hẳn sau reload.
- **L2**: localization vi/en cho `EligibilityCertificate:0001–0005` + `EligibilityCertificateExport:TooLarge`
  (trùng số giấy trước đó hiện "An internal error occurred..."; giờ: "Số giấy chứng nhận đủ điều kiện đã tồn tại.").
- **L3**: bộ lọc scope gộp về `EligibilityCertificateScope` (trước bị copy nguyên văn ở AppService + DataScopeChecker).
- **L6**: guard đổi cơ sở dùng `BusinessException` code 0005 thay chuỗi cứng.
- **X1**: `extractApiError` cho toàn bộ 9 toast lỗi (save/PDF/delete/export/upload/download/xóa tệp/revoke).
- **X2/X3/U2**: confirm xóa nêu số giấy; empty state tùy biến (phân biệt có/không bộ lọc);
  placeholder select cơ sở + DatePicker; fallback "(Cơ sở đã xóa)"; ngày zero-pad qua `formatDate` dùng chung.
- Spec cập nhật theo hành vi mới: delete-guard message regex, nút confirm `/^(Xóa|Đồng ý|OK)$/`,
  empty-state matcher chấp nhận mô tả tùy biến (helper `licensing.ts` dùng chung 5 feature).

Ghi nhận, không sửa (giữ nguyên chủ đích): revoke dùng quyền Edit (không có quyền Revoke
riêng — nhất quán toàn nhóm giấy phép); duplicate trả HTTP 403 (quy ước BusinessException
của ABP); business-options cắt ở 500; xóa được giấy đã thu hồi (spec lifecycle phụ thuộc);
console 401 khi load anonymous (site-wide, thuộc `lib/axios.ts` — Level 3 nếu sửa);
`ProductRegistrationAttachmentsModal` import chéo 6 feature (đề xuất PR refactor riêng).

## Evidence (2026-07-28, stack rebuild từ tree `e6ce3f7`)

- `e2e/eligibility-certificates.spec.ts` — lifecycle đầy đủ: 1/1.
- `e2e/eligibility-certificates-verification.spec.ts` — 5/5: unauthenticated 401; noperm 403;
  cross-org ẩn + GET chặn; revoke/double-revoke/duplicate/missing-number; persistence + empty state.
- `e2e/business-delete-guard.spec.ts` — 2/2 (retest F-006 sau khi mở rộng guard).
- `e2e/businesses-verification.spec.ts` — 6/6 (retest F-006).
- Sibling verification suites dùng chung helper (F-008/F-011/F-012 + advertisement) — 20/20.
- Browser thủ công (scripts audit, không intercept): duplicate toast Việt hóa; guard xóa cơ sở
  403 + message mới; orphan delete OK + reload; modal placeholders; confirm có số giấy;
  empty state 2 biến thể; ngày "28/07/2026"; attachments upload/download/delete; export xlsx;
  public lookup found/not-found; noperm page + API 403; district list rỗng + GET 403; mobile 390px.
- Vitest feature 4/4; BE Application build 0 lỗi; FE `tsc` sạch.

## Checklist

| Check | Result |
|---|---|
| Unauthenticated / permission / org scope / area scope | PASS |
| Validation, duplicate certificateNumber (toast Việt hóa) | PASS |
| Revoke workflow incl. invalid transition | PASS |
| Business delete guard (certificates block deletion) | PASS |
| Orphaned certificate cleanup + "(Cơ sở đã xóa)" fallback | PASS |
| Persistence after reload, empty/loading/error states | PASS |
| Public lookup, expiry cache, Excel export, attachments | PASS |

## Paths & dependencies

- FE `src/features/eligibility-certificates/**`, `src/utils/format.ts` (formatDate — additive shared)
- BE `Application/Licensing/EligibilityCertificate*`, `Application/BusinessManagement/BusinessAppService.cs` (delete guard — shared với F-006)
- e2e `eligibility-certificates*.spec.ts`, `helpers/licensing.ts` (shared 5 licensing features), `business-delete-guard.spec.ts`
- Depends on Business (F-006), auth/scope/axios (Level 3)
- Invalid for commits after `e6ce3f7` touching these paths
