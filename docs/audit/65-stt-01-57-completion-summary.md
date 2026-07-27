# 65 — STT 1–57 Top-Level Completion Summary

Columns: Sub = extracted sub-requirements; C = complete (not runtime verified, 0.85); P = partial; M = missing (0); RV = runtime verified. **RV = 0 for every STT** (registry: 0/32 features VERIFIED; last real e2e run: 25 failures). "Complete" never means runtime-proven here.

| STT | Function | Sub | C | P | M | % | Main missing items / evidence |
|---|---|---|---|---|---|---|---|
| 1 | Quản lý vai trò | 6 | 6 | 0 | 0 | 85% | IdentityAdministrationAppService + roles tab; e2e failed at last run |
| 2 | Quản lý người dùng | 13 | 9 | 3¹ | 1 | 71% | Excel export users missing; user delete BE-only; permission-based search missing |
| 3 | Nhật ký hệ thống | 3 | 1 | 1 | 1 | 48% | Excel export missing; no per-entry detail view |
| 4 | Cài đặt hệ thống | 6 | 0 | 3² | 3 | 5% | **Whole module effectively missing** — FE page is a static stub; no logo/login-screen/password/lockout/email/homepage configuration |
| 5 | Quản lý truy cập | 5 | 3 | 1 | 1 | 56% | Profile editing minimal; avatar change missing |
| 6 | Quản lý đơn vị | 6 | 5 | 0 | 1 | 71% | Excel export missing |
| 7 | Tài khoản đơn vị | 6 | 5 | 1 | 0 | 79% | Delete FE missing (via users) |
| 8 | DM Quốc gia | 4 | 4 | 0 | 0 | 85% | MasterCatalog CRUD |
| 9 | DM Vùng miền | 4 | 4 | 0 | 0 | 85% | |
| 10 | DM Tỉnh/TP | 4 | 4 | 0 | 0 | 85% | GeographicCatalog CRUD |
| 11 | DM Xã/Phường | 4 | 4 | 0 | 0 | 85% | (+district level extra) |
| 12 | DM Phân loại cơ sở | 4 | 4 | 0 | 0 | 85% | |
| 13 | DM Nhóm sản phẩm | 4 | 4 | 0 | 0 | 85% | 2-level hierarchy |
| 14 | DM Loại hình cơ sở | 4 | 4 | 0 | 0 | 85% | |
| 15 | DM Loại hình quảng cáo | 4 | 4 | 0 | 0 | 85% | |
| 16 | DM Cơ sở kiểm nghiệm | 4 | 4 | 0 | 0 | 85% | |
| 17 | DM Dịch vụ kiểm nghiệm | 5 | 4 | 0 | 1 | 68% | Excel export missing |
| 18 | DM Loại văn bản | 4 | 4 | 0 | 0 | 85% | Catalog exists; Documents feature ignores it |
| 19 | Cơ sở SXKD | 18 | 13 | 5 | 0 | 80% | Advanced classification filter; per-business license/inspection tabs (covered by separate modules) |
| 20 | Sản phẩm | 8 | 8 | 0 | 0 | 85% | Import/export/attachments all present |
| 21 | Tự công bố | 9 | 9 | 0 | 0 | 85% | |
| 22 | Đăng ký công bố | 9 | 9 | 0 | 0 | 85% | |
| 23 | ĐK quảng cáo | 11 | 11 | 0 | 0 | 85% | |
| 24 | Cơ sở đủ điều kiện | 10 | 10 | 0 | 0 | 85% | |
| 25 | CFS | 11 | 11 | 0 | 0 | 85% | |
| 26 | GCN thực phẩm XK | 11 | 11 | 0 | 0 | 85% | (LIC cross-cut: no NĐ15 templates/PDF generation) |
| 27 | Kế hoạch thanh kiểm tra | 11 | 9 | 0 | 2 | 70% | **Plan document upload/view/download missing** |
| 28 | Kết quả thanh kiểm tra | 7 | 5 | 2 | 0 | 76% | No result finalize/lock; no result attachments |
| 29 | Cảnh báo VSATTP | 9 | 8 | 0 | 1 | 76% | **Citizen-alert approval impossible (no citizen channel)** |
| 30 | Tin tức ATTP | 9 | 7 | 1 | 1 | 71% | Citizen-news approval missing; publish doesn't reach a public page |
| 31 | Ca ngộ độc nhỏ lẻ | 11 | 11 | 0 | 0 | 85% | Full workflow + error reports + map |
| 32 | Vụ ngộ độc | 10 | 10 | 0 | 0 | 85% | Conclude (phiếu kết thúc) permission-gated |
| 33 | Báo cáo NĐTP | 11 | 9+1rv | 1 | 0 | 84% | No commune→city roll-up; **error-notification (báo sai sót) has DB+domain only — no endpoint/UI** |
| 34 | Báo cáo công tác ATTP | 11 | 8+1rv | 1 | 1 | 75% | **"Tự tính số liệu" (auto-aggregation) missing — all stats manual**; error-notification unreachable; document view partial |
| 35 | BC Tháng hành động | 10 | 8+1rv | 1 | 0 | 82% | Error-notification unreachable; document view partial; free-text date defect |
| 36 | Phân tích mối nguy cơ | 8 | 6 | 2 | 0 | 76% | Publication doesn't reach public portal; no print |
| 37 | Kết quả kiểm nghiệm | 6 | 6 | 0 | 0 | 85% | Testing center free-text (catalog unused) |
| 38 | Văn bản chỉ đạo | 7 | 4 | 3 | 0 | 77% | Hard-coded type list; no print; no attachment of document file |
| 39 | Dashboard thống kê | 9 | 5 | 1 | 3 | 51% | **Report-compliance widgets missing; no time/unit filters; no chart download** |
| 40 | Báo cáo thống kê | 8 | 3 | 1 | 4 | 38% | **All 4 statistics excel exports missing**; region/area breakdowns missing |
| 41 | Tra cứu thông tin chung | 4 | 0 | 2 | 2 | 28% | Public product search missing; business lookup single-record only |
| 42 | Tra cứu GCN đủ điều kiện | 4 | 1 | 1 | 2 | 29% | No public list; no certificate view/print/download |
| 43 | Tra cứu tự công bố | 4 | 1 | 1 | 2 | 29% | Same |
| 44 | Tra cứu ĐKCB | 4 | 1 | 1 | 2 | 29% | Same |
| 45 | Tra cứu cơ sở bị cảnh báo | 3 | 0 | 0 | 3 | 0% | **Entirely missing** |
| 46 | Tra cứu CFS | 4 | 1 | 1 | 2 | 29% | Same as 42 |
| 47 | Tra cứu GCN XK | 4 | 1 | 1 | 2 | 29% | Same |
| 48 | Cảnh báo VSATTP (công dân) | 3 | 0 | 0 | 3 | 0% | **Entirely missing** — no public news list, no search, no citizen submission |
| 49 | Tra cứu văn bản | 2 | 0 | 0 | 2 | 0% | **Entirely missing** |
| 50 | Quản lý đặc tả API | 6 | 5 | 1 | 0 | 79% | No partner-facing spec/config guidance; FE toggle URL bug |
| 51 | LS chia sẻ cảnh báo | 4 | 0 | 3³ | 1 | 15% | Generic empty call-log viewer only; no send; nothing writes logs |
| 52 | LS chia sẻ thanh kiểm tra | 4 | 0 | 3³ | 1 | 15% | Same |
| 53 | LS chia sẻ ngộ độc | 4 | 0 | 3³ | 1 | 15% | Same |
| 54 | LS chia sẻ giấy phép | 4 | 0 | 3³ | 1 | 15% | Same |
| 55 | LS chia sẻ sản phẩm | 4 | 0 | 3³ | 1 | 15% | Same |
| 56 | LS chia sẻ tin tức | 4 | 0 | 3³ | 1 | 15% | Same |
| 57 | LS chia sẻ cơ sở | 4 | 0 | 3³ | 1 | 15% | Same |

¹ "P" columns include non-CNRV statuses: STT 2 includes 1 BACKEND_ONLY; STT 33/34/35 each include 1 DATABASE_ONLY (report error notifications). ² PLACEHOLDER_OR_SHALLOW. ³ PLACEHOLDER_OR_SHALLOW (0.20).

Totals over STT 1–57 (+2 LIC cross-cut items): 372 sub-requirements — 265 complete-unverified · 33 partial · 1 backend-only · 3 database-only · 24 placeholder/shallow · 46 missing · **0 runtime verified**.
