# Kế hoạch hoàn thiện chức năng phần mềm — 04/08/2026

**Baseline**: commit `c65d882` (2026-08-02, working tree sạch trừ 3 file docs chưa track)
**Phương pháp**: rà soát chéo toàn bộ backlog trong `docs/` (gap analysis, tracker 80, backlog JSON, legal-alignment) và **xác minh từng mục trên code hiện tại** bằng 4 lượt khảo sát song song (tracker-80 minors, data-integration, public/UX/security, legal-alignment).
**Phạm vi**: chỉ chức năng phần mềm. Loại khỏi phạm vi theo yêu cầu: TLS/IPv6/DNSSEC, manual người dùng/quản trị, hồ sơ ATTT cấp 2, monitoring/backup/SMTP/hạ tầng production, đào tạo, SLA hỗ trợ (Track D/E cũ).

---

## 1. Kết luận rà soát

**App đã phủ gần như toàn bộ yêu cầu chức năng trong docs.** Tại freeze 28/07: 372/372 FR có implementation (100% coverage). Sau đó 3 wave remediation + 2 đợt legal-alignment (02/08) đã đóng tiếp phần lớn gap. Nhiều mục backlog cũ ghi "chưa làm" thực tế **đã làm xong** (docs stale — xem §4).

Số gap phần mềm còn lại thực sự (xác minh trên code): **12 gap chức năng + 4 gap UI nhỏ + nhóm gap kiểm chứng/chất lượng**.

### Đã xác minh LÀ ĐÃ XONG (docs cũ ghi sai/stale — không cần làm lại)

| Mục backlog cũ | Thực tế trên code |
|---|---|
| FUNC-INT-002 polling trạng thái partner | ✅ `PartnerInboundController.cs:30-57` + `PartnerInboundAppService.cs:373-429` (còn thiếu audit log + OpenAPI + test — xem GAP-INT-1) |
| FUNC-INT-004 Polly resilience outbound | ✅ `AddStandardResilienceHandler()` — `FoodSafeHttpApiHostModule.cs:140-150` |
| G-04 disposition inbound submission | ✅ Process/Reject end-to-end, permission `Partners.Moderate`, FE đầy đủ |
| FUNC-USER-001 lockout cấu hình được | ✅ SystemSettings đọc/ghi + áp runtime `LoginPasswordVerificationMiddleware.cs:103-120` |
| FUNC-UX-001 global search + chuông thông báo | ✅ `GlobalSearchAppService` (9 loại entity, data-scope) + `AppNotification` + SignalR hub |
| FUNC-DOC-001 loại văn bản từ catalog | ✅ `DocumentsPage.tsx` dùng `useDocumentTypes()` |
| SEC-003 CORS | ✅ `WithOrigins` từ config, fail-fast `PUBLIC_BASE_URL` |
| SEC-006 org-scope /dashboard /statistics | ✅ `ICurrentDataScopeProvider` áp trong cả 2 AppService |
| SEC-007 Redis | ✅ `AbpCachingStackExchangeRedisModule` + compose wiring |
| GAP-M11/N5 dashboard trend chart | ✅ Chart 12 tháng dùng API thật `/food-poisoning-trend` (tracker 80 ghi stale) |
| FUNC-STAT-001 org filter + print | ✅ Org filter BE+FE + nút in (còn thiếu 1 export — GAP-STAT-1) |
| Legal 2.1 GCN 3 năm | ✅ `EligibilityCertificate.cs:77-88` statutory expiry |
| Legal 2.3 bỏ auto-expire tự công bố | ✅ `SelfDeclaration.EffectiveStatus` chỉ còn Revoked/Active |
| Legal 5.4 IssuingAgency ra Settings | ✅ Tất cả PDF service đọc từ Settings |
| Legal §6 seed 54 ĐVHC + demo mã thật | ✅ Seed đủ 54 đơn vị 06652–07192, E2E/demo dùng mã thật |

---

## 2. Danh sách gap còn lại (đã xác minh trên code)

### Nhóm A — Chức năng nghiệp vụ (P1)

| ID | Gap | Bằng chứng | Effort |
|---|---|---|---|
| GAP-PUB-1 | **PDF công khai cho đăng ký quảng cáo** — cổng công khai có PDF cho 5/6 loại giấy; thiếu ad-registration | `CertificatePdfAppService.cs` không có method ad; `PublicCertificateSearchPage.tsx:431-436` tab duy nhất không có `pdfPath` | S |
| GAP-STAT-1 | **Excel "trạng thái báo cáo theo đơn vị"** — dữ liệu có trên dashboard nhưng không export được | `StatisticsExcelAppService.cs` chỉ 4 kind; `DashboardPage.tsx:542-544` bảng on-screen | S |
| GAP-INSP-1 | **Picker hành vi vi phạm NĐ 115/2018 prefill biên bản** — catalog `cat_violation_types` đã có (14 hành vi) nhưng biên bản vẫn nhập tay free text | `InspectionViolation.cs:8-17` không có `ViolationTypeId`; `InspectionResultEditorModal.tsx:464-475` bare Input | M |
| GAP-POIS-1 | **Validation định nghĩa vụ NĐTP + chỉ tiêu ≥30 người** — domain đã có `MeetsIncidentDefinition`/`IsLargeScale` nhưng (a) không validate/cảnh báo khi tạo, (b) FE không render meetsIncidentDefinition, (c) NdtpReport thiếu chỉ tiêu "số vụ ≥30 người" trong aggregation | `FoodPoisoningIncidentAppService.cs` không dùng; `NdtpReport.cs:10-18` + `PopulateFromPoisoningDataAsync:122-160` không có large-scale count | M |
| GAP-INT-1 | **Hoàn thiện polling trạng thái partner** — endpoint có nhưng: không ghi `ApiCallLog` (poll không audit — vi phạm yêu cầu "lưu lịch sử mọi API call"), thiếu path trong `partner-openapi.yaml`, thiếu contract test | `PartnerInboundAppService.cs:373-429` không gọi `LogInboundAsync`; `partner-openapi.yaml:36` chỉ có POST | S |
| GAP-INT-2 | **Catalog "hệ thống ngoài"** — hard-code 2 chỗ FE, BE free-text | `DataIntegrationPage.tsx:84`, `PartnersTab.tsx:58` | S |

### Nhóm B — UI nhỏ còn lại từ tracker 80 (P1–P2)

| ID | Gap | Bằng chứng | Effort |
|---|---|---|---|
| GAP-N1 | TreeSelect nhóm sản phẩm trong form cơ sở (đang flat multi-select) | `BusinessEditorModal.tsx:373-390` | S |
| GAP-N3 | Nút chia sẻ nhanh cảnh báo sang hệ thống ngoài từ detail drawer | `AlertsNewsPage.tsx:489-492` dùng RecordDetailDrawer read-only | S |
| GAP-N7 | Bộ lọc khoảng ngày tùy chọn ở Thống kê (đang chỉ năm/quý/tháng) | `StatisticsPage.tsx:143-202` không có RangePicker | S |
| GAP-N4 | Clustering marker bản đồ ngộ độc theo zoom (đã có gom trùng tọa độ) | `PoisoningMap.tsx` không dùng markercluster | S |

### Nhóm C — Nghiệp vụ pháp lý sâu (P2–P3, từ legal-alignment §6b)

| ID | Gap | Ghi chú | Effort |
|---|---|---|---|
| GAP-CAT-1 | Excel import/export danh mục vi phạm + 4 trường miễn GCN trong Business workbook | TODO sẵn trong code: `MasterCatalogAppService.cs:285`, `catalogApi.ts:43`; `BusinessExcelWorkbook.cs:19-31` thiếu 4 cột | M |
| GAP-POIS-2 | 3 mẫu báo cáo khẩn vụ NĐTP (ban đầu/cập nhật/kết thúc) theo QĐ 01/2006 | Hiện chỉ có 1 PDF generic + banner nhắc | M |
| GAP-POIS-3 | Form điều tra NĐTP chi tiết + phiếu điều tra cá thể (hồi cứu 24–48h, link TestingResult) | Chưa có entity nào; **nên chốt phạm vi với Chi cục trước khi làm** | L |
| GAP-POIS-4 | Checklist kiểm thực 3 bước / lưu mẫu ≥30 suất (QĐ 1246) | Chưa có; **cần chốt phạm vi với Chi cục** | M |
| GAP-INT-3 | Rate-limit per-partner + IP allowlist cho endpoint partner | Hiện dùng bucket IP chung 300/min | M |

### Nhóm D — Kiểm chứng & chất lượng phần mềm (P2, tùy chọn)

| ID | Gap | Effort |
|---|---|---|
| GAP-QA-1 | Playwright E2E job trong CI (hiện suite ~80 spec chỉ chạy tay) | M |
| GAP-QA-2 | Spec evidence còn thiếu: audit-log detail drawer, profile/avatar, formatted report views FR-34-08/35-08 | S |
| GAP-QA-3 | Pin `Seed__EnableE2eData: "false"` vào compose prod/cloud | XS |
| GAP-QA-4 | Đổi key ABP SPA client `"Angular"` (cosmetic) | XS |

### Ngoài phạm vi làm ngay (blocked bên ngoài — không phải thiếu code)

- **GAP-INT-4** Ingestion inbound JSON → domain tables: blocked chờ field map chính thức TT 31/2026/TT-BCT.
- **FR-LIC-01** PDF đúng mẫu NĐ 15/2018: chờ khách cung cấp template chính thức.
- Kết nối thật Bộ Y tế / Sở NN / Sở CT: chờ endpoint + credentials.

---

## 3. Kế hoạch thực hiện (theo Feature Build Loop §10 CLAUDE.md)

### Batch 1 — Quick wins nghiệp vụ (P1, ~1 buổi)
1. **GAP-PUB-1**: thêm `GetAdvertisementRegistrationPdfAsync` vào `CertificatePdfAppService` + route trong `PublicPortalControllers.cs` + `pdfPath: "advertisement-registrations"` ở FE + e2e cập nhật `certificate-pdf-verification.spec.ts` (5→6 loại).
2. **GAP-STAT-1**: thêm kind `report-status-by-organization` vào `StatisticsExcelAppService` (+ `ReportExportKind` FE) + nút export ở dashboard/statistics.
3. **GAP-INT-1**: ghi `ApiCallLog` (Inbound) cho poll; thêm path GET vào `partner-openapi.yaml`; thêm assertion vào `partner-openapi-contract.spec.ts`.
4. **GAP-QA-3**: pin `Seed__EnableE2eData=false` ở 2 file compose.

### Batch 2 — UI minors (P1, ~1 buổi)
5. **GAP-N1**: TreeSelect nhóm sản phẩm (cây theo parent group).
6. **GAP-N7**: RangePicker tùy chọn ở Thống kê (BE `StatisticsFilterDto` đã có from/to hoặc bổ sung).
7. **GAP-N3**: action "Chia sẻ hệ thống ngoài" trong alert detail → mở modal share có prefill entityId (tái dùng flow data-integration).
8. **GAP-N4**: thêm `leaflet.markercluster` vào PoisoningMap.

### Batch 3 — Biên bản kiểm tra + danh mục (P1–P2, ~2 buổi)
9. **GAP-INSP-1**: thêm `ViolationTypeId` (nullable FK) vào `InspectionViolation` + migration; FE picker chọn từ catalog prefill mã/căn cứ/khung phạt, vẫn cho sửa tay; giữ free text tương thích dữ liệu cũ.
10. **GAP-INT-2**: seed catalog "Hệ thống ngoài" (MasterCatalog kind mới hoặc enum + API options); FE 2 chỗ dùng chung 1 hook.
11. **GAP-CAT-1**: định nghĩa `ViolationType` trong `MasterCatalogExcelWorkbook` (template/import/export); thêm 4 cột miễn GCN vào `BusinessExcelWorkbook`.

### Batch 4 — NĐTP nâng cao (P2, ~2 buổi)
12. **GAP-POIS-1**: cảnh báo/confirm khi tạo vụ không đạt định nghĩa (≥2 người hoặc ≥1 tử vong); render tag "Đạt định nghĩa vụ NĐTP"; thêm `LargeScaleIncidentCount` vào `NdtpReport` + migration + aggregation + FE + Excel/PDF báo cáo.
13. **GAP-POIS-2**: 3 biến thể PDF báo cáo vụ (ban đầu/cập nhật/kết thúc) — tham số `kind` trên `FoodPoisoningIncidentPdfAppService`, nội dung theo mẫu QĐ 01/2006.
14. **GAP-INT-3**: rate-limit partition theo API-key prefix cho `/api/v1/partner/*` + trường `AllowedIps` (optional) trên PartnerAccount.

### Batch 5 — Kiểm chứng (P2, song song được)
15. **GAP-QA-1**: job Playwright trong `ci.yml` (compose stack, workers=1, artifacts on failure).
16. **GAP-QA-2**: bổ sung 3 spec evidence thiếu.
17. **GAP-QA-4**: rename key "Angular" + e2e reset-password vẫn xanh.

### Batch 6 — Chờ chốt phạm vi với Chi cục (P3)
18. **GAP-POIS-3** form điều tra chi tiết + phiếu cá thể; **GAP-POIS-4** checklist kiểm thực 3 bước. Đề xuất: xác nhận scope/biểu mẫu với khách trước khi build (tránh làm lại).

**Quy tắc chung mỗi batch**: theo đúng Feature Build Loop (API contract → domain → tests → AppService → FE types/hooks/UI → e2e thật không interception) + cập nhật `docs/testing/01-feature-verification-registry.md` + impact map; mỗi batch kết thúc bằng `dotnet test` + tsc/oxlint + Playwright subset liên quan.

---

## 3b. Trạng thái thực hiện (cập nhật 04/08/2026 — cùng ngày)

Toàn bộ Batch 1–5 đã được thực hiện trong ngày:

| Batch | Trạng thái | Ghi chú |
|---|---|---|
| 1 — Quick wins | ✅ DONE + e2e xanh | PDF quảng cáo công khai (6/6 loại giấy, spec 5/5), export report-compliance, audit log cho poll partner + OpenAPI + contract test (1/1), pin `Seed__EnableE2eData=false` |
| 2 — UI minors | ✅ DONE | TreeSelect nhóm SP, quick-share cảnh báo (deep-link `?shareType=`), RangePicker thống kê (BE `FromDate/ToDate`), cluster bản đồ theo zoom (+3 unit test) |
| 3 — Vi phạm + catalog | ✅ DONE | `ViolationTypeId` FK + picker prefill biên bản (migration `AddViolationTypeLinkToInspectionViolations`); catalog hệ thống ngoài từ API (`/data-integration/external-systems`); Excel template/import/export ViolationType + 4 cột miễn GCN trong export cơ sở |
| 4 — NĐTP + partner | ✅ DONE | Confirm định nghĩa vụ (QĐ 39/2006), `LargeScaleIncidentCount` end-to-end (domain→PDF→FE, migration `AddNdtpLargeScaleIncidentCount`); 3 mẫu báo cáo khẩn PDF (QĐ 01/2006, endpoint `emergency-report-pdf?kind=`); rate-limit bucket per API-key + IP allowlist trên PartnerAccount (migration `AddPartnerAccountIpAllowlist`) |
| 5 — Kiểm chứng | ✅ DONE | Job Playwright thật trong `ci.yml` (compose + workers=1 + artifacts); spec evidence `evidence-remainders.spec.ts` (audit drawer, profile+avatar, formatted views); rename key "Angular" → "FoodSafeWeb" (BE+FE) |

**6 lỗi sản phẩm thật bị bắt và đã sửa trong đợt test** — chi tiết ở
`docs/testing/03-regression-log.md` (2 mục ngày 2026-08-04):

1. Migrator chết trên DB đã seed — constraint `chk_cat_communes_type` thiếu giá trị Đặc khu (4).
2. Tên hành vi vi phạm seed dài 211 ký tự > giới hạn 200 → seed ném exception.
3. Lưu hồ sơ cá nhân xong bị đăng xuất (security-stamp xoay mỗi lần lưu số điện thoại).
4. Cột URL trong Lịch sử gọi API rộng 0px — người dùng không thấy.
5. Không sửa được kết quả kiểm tra không gắn kế hoạch (form bắt buộc trường mà API cho phép trống).
6. **Duyệt nội bộ báo cáo ATTP / Tháng hành động trả HTTP 500** — 3 check constraint
   trạng thái báo cáo chưa có `InternallyApproved = 6`; báo cáo không thể gửi lên tuyến trên.

Kèm 1 lỗi nhỏ: link cũ `/co-so-bi-canh-bao` rơi vào trang đăng nhập (thiếu redirect).

**Khoảng trống bảo mật ghi nhận, chưa sửa**: endpoint đăng nhập ẩn danh không yêu cầu
CSRF token (login CSRF). Mọi request ghi đã-đăng-nhập đều được bảo vệ đúng (400 nếu
thiếu token) — đã kiểm chứng bằng `auth-verification.spec`.

**Còn lại ngoài phạm vi đợt này** (đúng như §2): GAP-POIS-3/4 (chờ chốt phạm vi
với Chi cục), GAP-INT-4 + FR-LIC-01 + kết nối bộ/sở (blocked bên ngoài), GAP-N6
(chart PDF server-side — đã có print-to-PDF).

## 4. Việc dọn docs (kèm theo, XS)

- `docs/testing/80-feature-gap-remediation-tracker.md`: GAP-M11 bỏ ghi chú "demo data; TODO real API"; GAP-N5 → DONE; các dòng DONE_CODE đã verify chuyển VERIFIED theo registry.
- `docs/planning/REMAINING_TASK_BACKLOG.md` + `REMAINING_PLAN_SUMMARY.json`: đánh dấu FUNC-INT-002/004, FUNC-USER-001, FUNC-UX-001, FUNC-DOC-001, SEC-003/006/007 đã DONE.
- `docs/legal-alignment/00-legal-gap-analysis-2026-08.md`: cập nhật trạng thái các mục §7 P1 đã xong.
