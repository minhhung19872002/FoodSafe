# Feature Gap Remediation Tracker

Generated from survey workflow `wf_70af9c43-a64` run on 2026-07-29.
Covers STT 19–57 gaps identified against functional requirements.

## Status legend

- `PENDING` — identified, not yet started
- `IN_WAVE_1` — being implemented in wave-1 parallel workflow (`wf_1b6d1263-100`)
- `IN_WAVE_2` — being implemented in wave-2 workflow
- `DONE_CODE` — code written, awaiting runtime verification
- `VERIFIED` — passed real full-stack test
- `SKIPPED` — deferred (reason noted)

---

## CRITICAL gaps

| ID     | STT  | Description                                            | Status      | Wave | Notes |
|--------|------|--------------------------------------------------------|-------------|------|-------|
| GAP-C1 | 28   | Export biên bản inspection PDF (QuestPDF)              | DONE_CODE   | 2    | ✅ InspectionBienBanPdfAppService + controller GET /inspection-result/{id}/bien-ban-pdf; FE "Tải biên bản PDF" row action |
| GAP-C2 | 30   | Rich text editor for news content (TipTap WYSIWYG)     | DONE_CODE   | 2    | ✅ TipTap v3 installed; RichTextEditor.tsx with toolbar; NewsEditorModal + AlertsNewsPage detail view updated |
| GAP-C3 | 31   | Export food poisoning case report PDF (QuestPDF)       | DONE_CODE   | 2    | ✅ FoodPoisoningCasePdfAppService + controller GET /food-poisoning-case/{id}/pdf; FE "Tải PDF" row action |
| GAP-C4 | 33   | PDF export for NDTP report (QuestPDF)                  | DONE_CODE   | 2    | ✅ ReportPdfAppService.GenerateNdtpReportPdfAsync + controller + FE download button (hidden for Draft/Returned) |
| GAP-C5 | 34   | PDF export for AttpWork report (QuestPDF)              | DONE_CODE   | 2    | ✅ Same ReportPdfAppService.GenerateAtpWorkReportPdfAsync + controller + FE |
| GAP-C6 | 35   | PDF export for ActionMonth report (QuestPDF)           | DONE_CODE   | 2    | ✅ Same ReportPdfAppService.GenerateActionMonthReportPdfAsync + controller + FE |
| GAP-C7 | 37   | Testing Results: attach phiếu KN PDF upload            | DONE_CODE   | 1    | ✅ StoragePath on TestingResult, migration 20260728200034, TestingResultPdfAppService + controller, FE upload UI |
| GAP-C8 | 44   | Public testing results lookup (entirely absent BE+FE)  | DONE_CODE   | 1    | ✅ PublicContentAppService.GetTestingResultsAsync, GET /public/testing-results, FE PublicGeneralSearchPage tab |
| GAP-C9 | 45   | Public inspection results lookup (entirely absent BE+FE)| DONE_CODE  | 1    | ✅ PublicContentAppService.GetInspectionResultsAsync, GET /public/inspection-results, FE tab |
| GAP-C10| 11   | Districts/Communes Excel import (DVHCVN standard)      | DONE_CODE   | 2    | ✅ GeographicCatalogAppService.ImportDistrictsAndCommunesFromExcelAsync (ClosedXML); controller POST /geographic-catalog/excel/import; FE GeographyImportModal + "Nhập từ Excel" button |

---

## MAJOR gaps

| ID     | STT   | Description                                               | Status      | Wave | Notes |
|--------|-------|-----------------------------------------------------------|-------------|------|-------|
| GAP-M1 | 19.1  | Business map markers colored by risk classification       | DONE_CODE   | 1    | ✅ BusinessLocationMap.tsx now uses RISK_COLORS keyed by riskLevel; legend added; BusinessManagementPage passes classifications |
| GAP-M2 | 19.2  | Cam kết VSATTP tab in BusinessDetailDrawer                | DONE_CODE   | 1    | ✅ BusinessVsattpCommitmentsTab.tsx created; 9th tab added to BusinessDetailDrawer.tsx |
| GAP-M3 | 19.5  | Business PDF export (profile / hồ sơ cơ sở)              | DONE_CODE   | 3    | ✅ BusinessProfilePdfAppService (5 sections: thông tin, giấy CN, sản phẩm, tự công bố, cam kết), controller, FE "Tải hồ sơ PDF" button |
| GAP-M4 | 19    | Management scope assignment UI for Business/BType/PGroup  | DONE_CODE   | 2    | ✅ DataScopeAssignmentAppService + controller; ScopeAssignmentModal.tsx; "Phân quyền dữ liệu" button in BusinessManagementPage |
| GAP-M5 | 49    | Assign step in citizen moderation workflow (domain fields) | DONE_CODE  | 2    | ✅ AtpAlert.Assign() domain method; AssignAsync AppService method; FoodSafePermissions.Alerts.Assign; FE assign action in queue |
| GAP-M6 | 49/29 | Dedicated moderation queue tab/UI for citizen submissions | DONE_CODE   | 2    | ✅ CitizenReportModerationQueue.tsx; 3rd tab "Hàng chờ phản ánh công dân" in AlertsNewsPage |
| GAP-M7 | 30    | News thumbnail upload field in NewsEditorModal            | DONE_CODE   | 1    | ✅ AtpNewsThumbnailAppService + controller; NewsEditorModal.tsx has upload field with preview |
| GAP-M8 | 33    | Auto-aggregate NdtpReport stats from poisoning records    | DONE_CODE   | 1    | ✅ NdtpReportAppService.PopulateFromPoisoningDataAsync; FE "Tự động tổng hợp từ dữ liệu ngộ độc" button in NdtpReportEditorModal |
| GAP-M9 | 33    | Submission snapshot SHA-256 hash                          | DONE_CODE   | 1    | ✅ BaseReport.Submit() computes SHA-256; migration 20260728202755; SubmissionHash in all 3 report DTOs + FE display |
| GAP-M10| 36    | Risk Analysis: linked product groups as FK (not text)     | DONE_CODE   | 3    | ✅ RiskAnalysis.ProductGroupIds as List<Guid> with JSON HasConversion; FE multi-Select from catalog; names displayed as tags |
| GAP-M11| 39    | Dashboard Leaflet map widget for businesses               | DONE_CODE   | 2    | ✅ DashboardPage: BusinessLocationMap card (400px) + Recharts trend chart (2026-08-04: verified — trend chart now uses real API `/food-poisoning-trend` via useFoodPoisoningTrend) |
| GAP-M12| 41    | Public business search — Leaflet map layer                | DONE_CODE   | 2    | ✅ PublicBusinessMap.tsx; map tab in PublicGeneralSearchPage; empty state until BE adds lat/lng to public API |
| GAP-M13| 49    | Citizen report tracking code + status lookup endpoint     | DONE_CODE   | 2    | ✅ AtpAlert.TrackingCode generated on Create; GET /public/citizen-reports/status; CitizenReportLookupPage at /tra-cuu-phan-anh |
| GAP-M14| 20    | Self-Declaration PDF download (FE button only)            | DONE_CODE   | 1    | ✅ selfDeclarationApi.downloadPdf + useDownloadSelfDeclarationPdf mutation + "Tải PDF" row action in SelfDeclarationPage |

---

## MINOR gaps

| ID     | STT  | Description                                                | Status      | Wave | Notes |
|--------|------|------------------------------------------------------------|-------------|------|-------|
| GAP-N1 | 19.3 | Product group checkbox tree in BusinessEditorModal         | DONE_CODE   | —    | ✅ 2026-08-04: TreeSelect treeCheckable built from parentId links (BusinessEditorModal.tsx) |
| GAP-N2 | 28   | Violation follow-up: show regulationReference + fineAmount | DONE_CODE   | 1    | ✅ InspectionFollowUpModal.tsx: "Điều khoản vi phạm" + "Tiền phạt (VNĐ)" columns added; modal widened to 1100px |
| GAP-N3 | 29   | Contextual "Share to external system" on alert detail      | DONE_CODE   | —    | ✅ 2026-08-04: row action "Chia sẻ hệ thống ngoài" trên cảnh báo Published → deep-link mở share modal prefill (?shareType=1&shareEntityId=) |
| GAP-N4 | 31   | Poisoning map marker clustering                            | DONE_CODE   | —    | ✅ 2026-08-04: zoom-aware grid clustering (clusterRecordsByZoom, không thêm dependency) + unit tests |
| GAP-N5 | 39   | Dashboard poisoning trend chart                            | DONE_CODE   | —    | ✅ 2026-08-04 verified: DashboardPage.tsx:569-631 LineChart "Diễn biến ngộ độc thực phẩm (12 tháng)" with real API data |
| GAP-N6 | 40   | Statistics chart PDF export (currently PNG only)           | PENDING     | —    | FE: print-to-PDF or QuestPDF server-side chart export |
| GAP-N7 | 40   | Statistics advanced date-range filter (beyond year)        | DONE_CODE   | —    | ✅ 2026-08-04: RangePicker + StatisticsFilterDto.FromDate/ToDate ghi đè kỳ năm/quý/tháng |
| GAP-N8 | 42   | Product search by manufacturer name                        | DONE_CODE   | 1    | ✅ PublicDirectoryAppService searches manufacturer field; manufacturer shown in public product table |

---

## Wave 1 agent summary (`wf_1b6d1263-100`, started 2026-07-29)

| Agent | Label                | Covers            | Target files                                            |
|-------|----------------------|-------------------|---------------------------------------------------------|
| A     | self-decl-pdf        | GAP-M14           | selfDeclarationApi.ts, selfDeclarationMutations.ts, page |
| B     | business-map-risk    | GAP-M1            | BusinessLocationMap.tsx                                 |
| C     | vsattp-tab           | GAP-M2            | BusinessVsattpCommitmentsTab.tsx (new), BusinessDetailDrawer.tsx |
| D     | news-thumbnail       | GAP-M7            | NewsEditorModal.tsx                                     |
| E     | violation-columns    | GAP-N2            | InspectionFollowUpModal.tsx                             |
| F     | public-portal-stt44-45-42 | GAP-C8, GAP-C9, GAP-N8 | PublicContentAppService.cs, PublicPortalControllers.cs, FE public portal |
| G     | ndtp-aggregate       | GAP-M8            | NdtpReportAppService.cs, reportingMutations.ts, NdtpReportPage.tsx |
| H     | testing-result-attachment | GAP-C7       | TestingResult.cs, migration, TestingResultEditorModal.tsx |
| I     | submission-snapshot-sha256 | GAP-M9      | BaseReport.cs, migration, NdtpReportDto (and others)    |

## Wave 2 planned (pending wave 1 completion)

| Priority | Covers                                    | Complexity |
|----------|-------------------------------------------|------------|
| 1        | GAP-C1, GAP-C3, GAP-C4/5/6 — PDF exports (QuestPDF) | HIGH |
| 2        | GAP-C2 — Rich text editor (TipTap)        | MEDIUM     |
| 3        | GAP-C10 — Districts/Communes Excel import | HIGH       |
| 4        | GAP-M3 — Business PDF export              | MEDIUM     |
| 5        | GAP-M4 — Management scope assignment UI   | MEDIUM     |
| 6        | GAP-M5/6 — Citizen moderation assign + queue | MEDIUM  |
| 7        | GAP-M10 — Risk Analysis product groups FK | MEDIUM     |
| 8        | GAP-M11/12 — Dashboard + Public portal maps | LOW      |
| 9        | GAP-M13 — Citizen tracking code           | MEDIUM     |

---

## After wave 2: remaining MINOR items (manual or deferred)

~~GAP-N1, GAP-N3, GAP-N4, GAP-N5, GAP-N7~~ — đã xong 2026-08-04 (xem docs/planning/SOFTWARE_FUNCTIONAL_COMPLETION_PLAN_2026-08-04.md §3b). Còn lại: GAP-N6 (stats chart PDF server-side; đã có print-to-PDF của trình duyệt).

---

*Last updated: 2026-07-29. Update Status column as waves complete.*
