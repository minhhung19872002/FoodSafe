# Đối chiếu nghiệp vụ thực tế vs FoodSafe — Gap Analysis pháp lý (08/2026)

> Bối cảnh: sau buổi demo, khách hàng phản hồi "nhiều chức năng và nghiệp vụ còn sai".
> Tài liệu này đối chiếu hiện trạng app với quy định HIỆN HÀNH (đến 02/08/2026),
> mỗi mục kèm căn cứ pháp lý, hiện trạng code và hành động.
>
> Trạng thái hành động: ✅ đã sửa trong đợt này · 🔧 backlog phải sửa · 📝 ghi nhận/theo dõi.

---

## 0. Dòng thời gian pháp lý 2025–2026 (khung áp dụng)

| Thời điểm | Văn bản | Nội dung |
|---|---|---|
| 01/03/2025 | NĐ 35/2025/NĐ-CP | Bộ NN&PTNT + Bộ TN&MT hợp nhất thành **Bộ Nông nghiệp và Môi trường** |
| 16/06/2025 | Luật 72/2025/QH15 | Chính quyền địa phương **2 cấp** (Tỉnh → Xã/Phường/**Đặc khu**), **bỏ cấp huyện** từ 01/07/2025 |
| 16/06/2025 | NQ 1679/NQ-UBTVQH15 | Quảng Ninh còn **54 ĐVHC cấp xã = 30 phường + 22 xã + 2 đặc khu** (Vân Đồn, Cô Tô) |
| 12/06/2025 | NĐ 147/2025/NĐ-CP | Phân định thẩm quyền 2 cấp lĩnh vực y tế: nhiệm vụ ATTP cấp huyện → cấp xã/cấp tỉnh |
| 12/06/2025 | NĐ 148/2025/NĐ-CP | Phân cấp 7 nhóm TTHC ATTP từ Bộ Y tế → **Sở Y tế** |
| 24/06/2025 | QĐ 2076/QĐ-BYT | Công bố 12 TTHC mới, bãi bỏ 16 TTHC ATTP từ 01/07/2025 |
| 24/06/2025 | QĐ 2069/QĐ-BYT | Bãi bỏ quy định cơ quan kiểm tra **cấp huyện** trong TT 48/2015/TT-BYT |
| 30/06/2025 | QĐ 19/2025/QĐ-TTg | Bảng danh mục + mã số ĐVHC mới: 34 tỉnh, 3321 xã, **mã xã 5 số, bỏ mã huyện** |
| 01/07/2025 | NĐ 189/2025/NĐ-CP | Thẩm quyền xử phạt VPHC mới: Chủ tịch UBND **cấp xã** phạt đến 50% mức tối đa lĩnh vực |
| 26/01/2026 | NĐ 46/2026/NĐ-CP | Thay thế NĐ 15/2018 — **NHƯNG đã bị tạm ngưng hiệu lực** |
| 06/04/2026 | NQ 15/2026/NQ-CP | Tạm ngưng NĐ 46/2026 + NQ 66.13/2026 vô thời hạn → **NĐ 15/2018 tiếp tục áp dụng** |
| 29/04/2026 | NQ 21/2026/NQ-CP | Từ 01/07/2026: xác nhận quảng cáo **TPBVSK** chuyển từ Cục ATTP → **Chủ tịch UBND cấp tỉnh** |
| 2026 (dự thảo) | Luật ATTP (sửa đổi), NĐ sửa NĐ 115/2018, TT chế độ báo cáo ATTP, Đề án "một đầu mối" | **Chưa ban hành** — thiết kế app phải cấu hình được, không hard-code |

**Nguyên tắc thiết kế rút ra**: khung nghiệp vụ hiện hành = Luật ATTP 2010 + NĐ 15/2018 + TT 48/2015 (sửa bởi TT 17/2023) + NĐ 115/2018 (sửa bởi NĐ 124/2021), vận hành trên bộ máy 2 cấp. KHÔNG áp các quy tắc của NĐ 46/2026 (đang tạm ngưng): ví dụ "bản công bố hiệu lực 3 năm", "bao bì phải đăng ký công bố".

---

## 1. Địa giới hành chính & tổ chức bộ máy

| # | Vấn đề | Căn cứ | Hiện trạng app | Hành động |
|---|---|---|---|---|
| 1.1 | Thiếu loại ĐVHC "Đặc khu"; còn "Thị trấn" (đã bãi bỏ) | Luật 72/2025/QH15 | `CommuneType` chỉ có Commune/Ward/Township | ✅ Thêm `SpecialZone = 4`; FE bỏ option tạo mới "Thị trấn", thêm "Đặc khu" |
| 1.2 | Không có dữ liệu 54 ĐVHC thật của Quảng Ninh (chỉ 6 phường demo, có "Phường Móng Cái" không tồn tại — thực tế là Móng Cái 1/2/3) | NQ 1679/NQ-UBTVQH15, QĐ 19/2025/QĐ-TTg | `ReferenceCatalogDataSeedContributor` không seed xã nào | ✅ Seed đủ 54 đơn vị với mã 5 số chính thức (06652–07192) |
| 1.3 | Demo/E2E data dùng "Phường Bạch Đằng" (đã nhập vào ĐVHC khác từ 01/07/2025) | NQ 1679 | `E2eTestDataSeedContributor`, `DemoDataSeedContributor` | 🔧 Chuyển demo data sang phường thật (VD Hồng Gai 06685); E2E giữ code `E2E-*` không đụng mã thật |
| 1.4 | Chi cục ATVSTP Quảng Ninh **vẫn tồn tại** thuộc Sở Y tế (QĐ 37/2025/QĐ-UBND) — mô hình 2 cấp Org của app đúng hướng | QĐ 37/2025/QĐ-UBND | `OrganizationLevel`: Province/Commune | 📝 Đúng; tên cơ quan nên lấy từ Settings thay vì hard-code 5 file PDF (xem 5.4) |
| 1.5 | Bộ máy có thể đổi tiếp (Đề án "một đầu mối" ATTP đang dự thảo 05/2026) | NQ 72-NQ/TW | — | 📝 Không hard-code tên/cơ cấu cơ quan |

## 2. Cấp phép, công bố sản phẩm (Licensing / BusinessManagement)

| # | Vấn đề | Căn cứ | Hiện trạng app | Hành động |
|---|---|---|---|---|
| 2.1 | GCN cơ sở đủ điều kiện ATTP có **thời hạn 3 năm** kể từ ngày cấp | Điều 37 Luật ATTP 2010 | `EligibilityCertificate.ExpiryDate` nullable, không ràng buộc | 🔧 Domain rule: ExpiryDate mặc định/tối đa = IssueDate + 3 năm |
| 2.2 | 10 nhóm cơ sở **miễn GCN** (Khoản 1 Điều 12 NĐ 15/2018), gồm miễn do có GMP/HACCP/ISO 22000/IFS/BRC/FSSC 22000 còn hiệu lực | NĐ 15/2018 Đ.12 | Không model lý do miễn; không lưu chứng nhận GMP/HACCP… | 🔧 Thêm trạng thái "miễn GCN + lý do"; tracking chứng nhận hệ thống chất lượng thay thế (số, loại, hạn) |
| 2.3 | Bản tự công bố / bản công bố **không có thời hạn hiệu lực** theo NĐ 15/2018 (quy tắc 3 năm của NĐ 46/2026 đang tạm ngưng) | NQ 15/2026/NQ-CP | `SelfDeclaration.ExpiryDate` + `EffectiveStatus(today)` tự tính hết hạn | 🔧 Không auto-expire tự công bố; ExpiryDate chỉ dùng khi có căn cứ khác |
| 2.4 | Thẩm quyền: đăng ký bản công bố **dinh dưỡng y học / chế độ ăn đặc biệt / dinh dưỡng trẻ ≤36 tháng** → Giám đốc Sở Y tế (7 ngày); TPBVSK, phụ gia mới → Cục ATTP (21 ngày) | NĐ 148/2025 | `CertifyingAuthority` free text | 📝 Đưa thẩm quyền + SLA vào hướng dẫn nhập liệu / danh mục cơ quan cấp |
| 2.5 | Từ **01/07/2026**: xác nhận nội dung quảng cáo **TPBVSK** thuộc Chủ tịch UBND cấp tỉnh (mã TTHC 1.006.424) | NQ 21/2026/NQ-CP | Module AdvertisementRegistration không phân thẩm quyền | 📝 Cập nhật hướng dẫn/mặc định cơ quan cấp; nội dung QC theo NĐ 342/2025 từ 15/02/2026 |
| 2.6 | "Giấy xác nhận kiến thức ATTP" **đã bãi bỏ** — thay bằng danh sách tập huấn do **chủ cơ sở tự xác nhận** | NĐ 155/2018 | `BusinessHandler.TrainingCertificateNumber/TrainingOrganization` gợi ý giấy nhà nước cấp | 🔧 Đổi nhãn FE thành "Tập huấn ATTP (chủ cơ sở xác nhận)"; không bắt buộc số giấy |
| 2.7 | Khám sức khỏe người trực tiếp SXKD: theo TT 32/2023/TT-BYT, định kỳ **12 tháng** | TT 32/2023/TT-BYT | Có HealthCheck fields, không ràng buộc chu kỳ | 📝 Cảnh báo hết hạn 12 tháng (đã có HealthCheckExpiryDate — kiểm tra logic nhắc hạn) |
| 2.8 | Tên bộ: "Bộ Nông nghiệp và Phát triển nông thôn" → "**Bộ Nông nghiệp và Môi trường**" | NĐ 35/2025 | Seed ProductGroup nhóm BNN tên cũ | ✅ Đã đổi tên trong seed (DB đã seed cần data-fix — xem §6) |

## 3. Thanh kiểm tra (Inspection)

| # | Vấn đề | Căn cứ | Hiện trạng app | Hành động |
|---|---|---|---|---|
| 3.1 | Cơ quan kiểm tra chỉ còn: Cục ATTP (TƯ) — Sở Y tế/Chi cục (tỉnh) — **UBND xã/Trạm Y tế xã** | TT 48/2015 sửa bởi QĐ 2069/QĐ-BYT | Org 2 cấp — phù hợp | 📝 OK |
| 3.2 | Quy trình chuẩn: **Quyết định kiểm tra** → công bố → kiểm tra → **biên bản** → báo cáo kết quả; biểu mẫu theo phụ lục **TT 17/2023** (6 mẫu; 3 loại biên bản: cơ sở SXKD / dịch vụ ăn uống / thức ăn đường phố) | TT 48/2015 Đ.9, TT 17/2023 | Không có entity Quyết định kiểm tra; 1 mẫu biên bản tự thiết kế không gắn số mẫu | 🔧 Thêm số Quyết định kiểm tra vào InspectionResult; PDF biên bản theo mẫu TT 17/2023, tách 3 biến thể theo loại hình cơ sở |
| 3.3 | Kế hoạch kiểm tra hằng năm phê duyệt trước 15/11 (cấp tỉnh; mốc cấp huyện đã bãi bỏ) | TT 48/2015 Đ.7 | InspectionPlan có Year/Status | 📝 Gợi ý deadline khi lập kế hoạch |
| 3.4 | Xử phạt theo NĐ 115/2018 (sửa NĐ 124/2021): tối đa 100tr cá nhân/200tr tổ chức; Chủ tịch UBND **xã** phạt đến 50% mức tối đa (NĐ 189/2025); dự thảo NĐ sửa 115 sẽ tăng mức | NĐ 115/2018, 124/2021, 189/2025 | `InspectionViolation.RegulationReference` free text; không có danh mục hành vi/khung phạt | 🔧 Danh mục hành vi vi phạm (điều/khoản NĐ 115/2018 + khung phạt) dạng catalog cấu hình được |
| 3.5 | Tần suất kiểm tra theo phân loại A/B/C hard-code "01/02/03 lần/năm" — văn bản gốc (TT 30/2012, 16/2012) đã bị sửa/bãi bỏ một phần bởi TT 17/2023 | TT 17/2023 | Seed `BusinessClassification.Criteria` | 🔧 Bỏ câu tần suất cứng khỏi mô tả seed hoặc chuyển thành tham số cấu hình |

## 4. Ngộ độc thực phẩm (FoodPoisoning)

| # | Vấn đề | Căn cứ | Hiện trạng app | Hành động |
|---|---|---|---|---|
| 4.1 | Định nghĩa **vụ NĐTP**: ≥2 người mắc cùng ăn 1 loại thực phẩm; **1 người tử vong cũng tính là 1 vụ** | QĐ 39/2006/QĐ-BYT Đ.3 | Không có ràng buộc/phân loại | 🔧 Domain: cờ phân loại vụ; validation khi tạo vụ |
| 4.2 | **Vụ lớn ≥ 30 người mắc** là chỉ tiêu thống kê riêng ngành y tế | TT 20/2019 + TT 23/2025/TT-BYT | Không có | 🔧 `IsLargeScale` (AffectedCount ≥ 30) + chỉ tiêu "số vụ ≥30 người" trong báo cáo/thống kê |
| 4.3 | Báo cáo **khẩn** NĐTP: báo ngay khi tiếp nhận; mẫu báo cáo khẩn ban đầu / cập nhật / kết thúc vụ | QĐ 01/2006/QĐ-BYT | Workflow Draft→Reported→Verified→Concluded, không có mốc khẩn | 📝 Bổ sung nhắc thời hạn báo khẩn; 3 mẫu báo cáo vụ |
| 4.4 | Điều tra: hồi cứu bữa ăn 24–48h trước khởi phát; phiếu điều tra cá thể; lấy mẫu thức ăn lưu/bệnh phẩm | QĐ 39/2006 | Có trường tự do InvestigationTeam, Symptoms… | 📝 Backlog form điều tra chi tiết + liên kết TestingResult |
| 4.5 | Phân nhóm căn nguyên: vi sinh / hóa chất / độc tố tự nhiên / không xác định | Thống kê ngành (QĐ 39/2006) | `CausativeAgent`, `Pathogen` free text | 🔧 Enum nhóm căn nguyên + giữ mô tả chi tiết |
| 4.6 | Kiểm thực 3 bước + **lưu mẫu bắt buộc với bữa ăn ≥30 suất** (lưu ≥24h) | QĐ 1246/QĐ-BYT 2017 | Không có | 📝 Backlog: checklist kiểm tra bếp ăn tập thể tham chiếu QĐ 1246 |

## 5. Báo cáo & vận hành

| # | Vấn đề | Căn cứ | Hiện trạng app | Hành động |
|---|---|---|---|---|
| 5.1 | Chế độ báo cáo ATTP ngành y tế (dự thảo TT 01/2026): định kỳ **6 tháng (chốt 16/6)** và **năm (chốt 16/12)** + đột xuất | Dự thảo TT (chưa ban hành) | AtpWorkReport theo HalfYear/FullYear — khớp | 📝 Khi TT ban hành: thêm deadline nhắc 16/6, 16/12 |
| 5.2 | Tháng hành động vì ATTP: **15/4–15/5 hằng năm**, chủ đề từng năm (2026: "phòng ngừa NĐTP trong dịch vụ ăn uống và thức ăn đường phố") | Kế hoạch BCĐ TƯ | `ActionMonthDates` chuỗi tự do | 🔧 Mặc định kỳ 15/4–15/5; danh mục chủ đề theo năm |
| 5.3 | Hậu kiểm sau tự công bố: kế hoạch hằng năm, 2026 trọng tâm 3 nhóm (tự công bố vi chất; TPBVSK nguy cơ chất cấm; bếp ăn tập thể/trường học) | CV 494/ATTP-PCTTR 2026 | Không có module kế hoạch hậu kiểm riêng (dùng InspectionPlan) | 📝 Dùng InspectionPlanType, thêm loại "Hậu kiểm" nếu cần |
| 5.4 | Tên cơ quan hard-code 5 file PDF (`IssuingAgency = "CHI CỤC ATVSTP TỈNH QUẢNG NINH"`) | — | 5 AppService PDF | 🔧 Chuyển sang Settings (đã có `Homepage.*` settings) |
| 5.5 | Truy xuất nguồn gốc (TT 25/2019) + thu hồi (TT 23/2018): hình thức tự nguyện/bắt buộc, xử lý sau thu hồi (khắc phục nhãn/chuyển mục đích/tái xuất/tiêu hủy) | TT 25/2019, TT 23/2018 | Chưa có module thu hồi | 📝 Backlog lớn — cần xác nhận phạm vi với Chi cục |

## 6. Data-fix cho DB đã seed (production/staging)

Seed contributor guard theo `Code` nên **DB hiện hữu không tự nhận bản sửa**:

1. Nhóm `BNN`: update Name/Description sang "Bộ Nông nghiệp và Môi trường" (SQL data-fix hoặc chạy tay qua UI catalog).
2. Chạy lại DbMigrator/seed để nạp 54 xã mới (guard theo code 5 số — an toàn, idempotent).
3. Rà bản ghi Commune cũ nhập tay (nếu có) không thuộc danh mục 54 đơn vị → map sang đơn vị mới theo NQ 1679 (map theo **mã**, không theo tên — có trùng tên giữa đơn vị cũ/mới, VD phường Hạ Long ≠ TP Hạ Long cũ).
4. Businesses đang trỏ `AddressCommuneId` vào phường demo (Bạch Đằng…) → migrate sang ĐVHC thật.

## 6b. Cập nhật đợt 2 — 02/08/2026 (thực hiện toàn bộ P còn lại)

Đã triển khai thêm trong đợt 2 (migration `20260802094608_LegalAlignmentViolationCatalogRecallExemption`):

| Mục | Kết quả |
|---|---|
| 3.4 Danh mục hành vi vi phạm NĐ 115/2018 | ✅ Bảng `cat_violation_types` + 14 hành vi seed với khung phạt cá nhân verify từ toàn văn NĐ 115/2018 + NĐ 124/2021 (tổ chức ×2), CRUD + tab danh mục FE. RegulationReference trên biên bản vẫn free text — picker prefill là bước tiếp theo |
| 3.2 Quyết định kiểm tra + biểu mẫu TT 17/2023 | ✅ `DecisionNumber`/`DecisionDate` (validate ≤ ngày kiểm tra), PDF biên bản tiêu đề động theo loại hình (SXKD / dịch vụ ăn uống / thức ăn đường phố) + dòng căn cứ QĐ + ghi chú mẫu TT 17/2023 |
| 2.2 Miễn GCN Điều 12 NĐ 15/2018 | ✅ `EligibilityExemptionReason` (10 điểm a→k) + tracking chứng nhận GMP/HACCP/ISO 22000/IFS/BRC/FSSC 22000 (loại/số/hạn, guard điểm k), tag "Miễn GCN" + cảnh báo hết hạn trên FE |
| 4.5 Nhóm căn nguyên NĐTP | ✅ `PoisoningCauseCategory` (vi sinh / hóa chất / độc tố tự nhiên / không xác định) BE+FE |
| 4.3 Báo cáo khẩn NĐTP | ✅ (một phần) Cảnh báo nghĩa vụ báo cáo khẩn (QĐ 39/2006 + QĐ 01/2006) khi tạo vụ mới; 3 mẫu báo cáo khẩn/cập nhật/kết thúc vụ vẫn là backlog |
| 5.5 Thu hồi sản phẩm TT 23/2018/TT-BYT | ✅ v1: module `ProductRecalls` — hình thức tự nguyện/bắt buộc (bắt buộc số QĐ khi cưỡng chế), workflow Draft→InProgress→Completed/Cancelled, 4 biện pháp xử lý sau thu hồi, permission riêng, FE đầy đủ (route `/product-recalls`) |
| 5.2 Tháng hành động 15/4–15/5 | ✅ Mặc định "15/04/năm - 15/05/năm" khi tạo, đồng bộ theo năm kỳ |
| 3.3 Deadline kế hoạch 15/11 | ✅ Hint trên form kế hoạch loại hằng năm (Điều 7 TT 48/2015) |
| 2.4 + 2.5 Thẩm quyền cấp phép | ✅ Alert hướng dẫn NĐ 148/2025 (Sở Y tế 7 ngày / Cục ATTP 21 ngày) và NQ 21/2026 + NĐ 342/2025 trên form tạo |
| 1.3 Demo/E2E dùng ĐVHC thật | ✅ Phường Bạch Đằng → Hồng Gai (06685), Móng Cái → Móng Cái 1 (06712)... mã thật theo QĐ 19/2025; fixtures test đã rà và cập nhật |

Backlog còn lại (P3 sâu, cần chốt phạm vi với Chi cục): form điều tra NĐTP đầy đủ + phiếu điều tra cá thể (4.4), checklist kiểm thực 3 bước/lưu mẫu (4.6), 3 mẫu báo cáo khẩn vụ NĐTP (4.3), Excel import/export cho danh mục vi phạm và 4 trường miễn GCN, picker hành vi vi phạm prefill vào biên bản, chế độ báo cáo theo TT mới khi ban hành (5.1).

## 7. Thứ tự ưu tiên đề xuất

1. **P0 — đã sửa**: Đặc khu + 54 ĐVHC thật + tên Bộ NN&MT (mục 1.1, 1.2, 2.8).
2. **P1**: GCN 3 năm (2.1); bỏ auto-expire tự công bố (2.3); danh mục hành vi vi phạm NĐ 115 (3.4); phân loại vụ NĐTP ≥30 (4.1, 4.2); IssuingAgency ra Settings (5.4); data-fix §6.
3. **P2**: biểu mẫu biên bản theo TT 17/2023 (3.2); miễn GCN + tracking GMP/HACCP (2.2); nhãn tập huấn ATTP (2.6); Tháng hành động 15/4–15/5 (5.2); căn nguyên NĐTP (4.5).
4. **P3**: thu hồi/truy xuất (5.5); form điều tra NĐTP đầy đủ (4.4); kiểm thực 3 bước (4.6); chế độ báo cáo theo TT mới khi ban hành (5.1).

---

*Nguồn: research 02/08/2026 từ thuvienphapluat.vn, xaydungchinhsach.chinhphu.vn, baochinhphu.vn, vfa.gov.vn, luatvietnam.vn, nso.gov.vn, quangninh.gov.vn — chi tiết URL trong lịch sử phiên làm việc.*
