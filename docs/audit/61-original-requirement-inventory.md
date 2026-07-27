# 61 — Original Requirement Inventory (Independent Re-extraction)

**Source of truth**: `docs/Mẫu số 03. YCKT (1).pdf` (42 pages), extracted in full via `pdftotext -layout` on 2026-07-27.
**Extraction method**: complete read of all 42 pages. The PDF's §4 functional table uses a 3-column layout whose STT column is visually offset; STT↔function mapping below was reconstructed from the running order of function-group headings (A–F) and the 57 sequential STT values. This mapping was cross-checked against `docs/01-functional-requirements.md`, which is treated **only as a claim**; where the two disagree (notably group E), the PDF text was followed and the discrepancy recorded.

**Scope note**: this is a lease-of-software-service procurement ("Thuê dịch vụ phần mềm quản lý ATTP — giai đoạn 1", Chi cục ATVSTP tỉnh Quảng Ninh, 90 days, level-2 information system per NĐ 85/2016/NĐ-CP).

ID scheme: `FR-<STT>-<nn>` functional; `INT-nn` integration; `NFR-nn` performance; `IPV-nn` IPv6/TLS; `SEC-nn` app security; `DBS-nn` DB security; `SUP-nn` support; `UI-nn` UI/UX; `DT-nn` data tolerance; `TRN-nn` training; `L2-nn` level-2 InfoSec; `OWN-nn` ownership; `HND-nn` handover; `ACC-nn` acceptance; `TECH-nn` technology.

Mandatory: all items below are mandatory (the PDF marks nothing optional). "Role" abbreviations: ADMIN (system admin), OFF (chi cục/officer), COMM (commune officer), PROV (province level), PUB (anonymous citizen), EXT (external system).

---

## A — Quản trị hệ thống (STT 1–5, PDF pp. 15–17)

### STT 1 — Quản lý vai trò người dùng (p. 15)
| ID | Sub-requirement | Type | Role |
|---|---|---|---|
| FR-01-01 | Thêm mới vai trò | FR | ADMIN |
| FR-01-02 | Sửa vai trò | FR | ADMIN |
| FR-01-03 | Xóa vai trò | FR | ADMIN |
| FR-01-04 | Tìm kiếm vai trò | FR | ADMIN |
| FR-01-05 | Đặt các quyền (permissions) cho vai trò | FR | ADMIN |
| FR-01-06 | Phân vai trò cho người dùng | FR | ADMIN |

### STT 2 — Quản lý người dùng (p. 15)
| ID | Sub-requirement | Type | Role |
|---|---|---|---|
| FR-02-01 | Danh sách + tìm kiếm người dùng | FR | ADMIN |
| FR-02-02 | Tìm kiếm theo quyền / theo vai trò | FR | ADMIN |
| FR-02-03 | Tạo mới người dùng | FR | ADMIN |
| FR-02-04 | Sửa thông tin người dùng | FR | ADMIN |
| FR-02-05 | Xóa tài khoản người dùng | FR | ADMIN |
| FR-02-06 | Thay đổi mật khẩu người dùng (đặt lại) | FR | ADMIN |
| FR-02-07 | Tạo ngẫu nhiên mật khẩu | FR | ADMIN |
| FR-02-08 | Gửi email kích hoạt tài khoản | FR | ADMIN |
| FR-02-09 | Bắt buộc đổi mật khẩu ở lần đăng nhập tiếp theo | FR | ADMIN |
| FR-02-10 | Vô hiệu hóa / kích hoạt tài khoản | FR | ADMIN |
| FR-02-11 | Tự động vô hiệu hóa khi đăng nhập sai nhiều lần (lockout) | FR | System |
| FR-02-12 | Mở khóa tài khoản | FR | ADMIN |
| FR-02-13 | Xuất excel danh sách người dùng | FR | ADMIN |

### STT 3 — Nhật ký hệ thống (audit log) (p. 15–16)
| ID | Sub-requirement | Type | Role |
|---|---|---|---|
| FR-03-01 | Tìm kiếm các thao tác của người dùng | FR | ADMIN |
| FR-03-02 | Xem chi tiết thao tác | FR | ADMIN |
| FR-03-03 | Xuất excel danh sách thao tác | FR | ADMIN |

### STT 4 — Cài đặt hệ thống (p. 16)
| ID | Sub-requirement | Type | Role |
|---|---|---|---|
| FR-04-01 | Thay đổi logo ứng dụng | FR | ADMIN |
| FR-04-02 | Thay đổi màn hình đăng nhập | FR | ADMIN |
| FR-04-03 | Thiết lập độ dài mật khẩu lớn nhất/nhỏ nhất | FR | ADMIN |
| FR-04-04 | Cấu hình vô hiệu tài khoản khi đăng nhập thất bại nhiều lần | FR | ADMIN |
| FR-04-05 | Cấu hình Email (SMTP) | FR | ADMIN |
| FR-04-06 | Cấu hình thông tin trang chủ | FR | ADMIN |

### STT 5 — Quản lý truy cập (p. 17)
| ID | Sub-requirement | Type | Role |
|---|---|---|---|
| FR-05-01 | Đăng nhập | FR | All |
| FR-05-02 | Đăng xuất | FR | All |
| FR-05-03 | Đổi mật khẩu (tự phục vụ) | FR | All |
| FR-05-04 | Chỉnh sửa thông tin tài khoản | FR | All |
| FR-05-05 | Thay đổi ảnh đại diện | FR | All |

## B — Quản lý danh mục (STT 6–18, PDF pp. 17–20)

### STT 6 — Quản lý đơn vị (p. 17)
| ID | Sub-requirement | Type | Role |
|---|---|---|---|
| FR-06-01 | Danh sách + tìm kiếm đơn vị cơ sở | FR | ADMIN |
| FR-06-02 | Tìm kiếm nâng cao theo phân loại + đặt lại tiêu chí | FR | ADMIN |
| FR-06-03 | Tạo đơn vị cơ sở trực thuộc (và "tạo nhanh") | FR | ADMIN |
| FR-06-04 | Sửa thông tin đơn vị | FR | ADMIN |
| FR-06-05 | Xóa đơn vị | FR | ADMIN |
| FR-06-06 | Xuất thông tin đơn vị (excel) | FR | ADMIN |

### STT 7 — Quản lý tài khoản đơn vị (p. 17)
| ID | Sub-requirement | Type | Role |
|---|---|---|---|
| FR-07-01 | Danh sách + tìm kiếm tài khoản đơn vị (kèm nâng cao, đặt lại, làm mới) | FR | ADMIN |
| FR-07-02 | Tạo tài khoản đơn vị (kèm "tạo nhanh tài khoản cơ sở") | FR | ADMIN |
| FR-07-03 | Sửa / xóa tài khoản đơn vị | FR | ADMIN |
| FR-07-04 | Đặt mật khẩu mặc định; bắt buộc đổi mật khẩu lần đăng nhập sau | FR | ADMIN |
| FR-07-05 | Mở khóa / đổi mật khẩu tài khoản đơn vị | FR | ADMIN |
| FR-07-06 | Phân quyền tài khoản đơn vị | FR | ADMIN |

### STT 8–16 — Danh mục dùng chung (pp. 18–19)
Mỗi danh mục yêu cầu: tìm kiếm, thêm, sửa, xóa (4 items each).

| ID range | Catalog | Items |
|---|---|---|
| FR-08-01..04 | Quốc gia | search/create/update/delete |
| FR-09-01..04 | Vùng miền | search/create/update/delete |
| FR-10-01..04 | Tỉnh/Thành phố | search/create/update/delete |
| FR-11-01..04 | Xã/Phường | search/create/update/delete |
| FR-12-01..04 | Phân loại cơ sở | search/create/update/delete |
| FR-13-01..04 | Nhóm sản phẩm | search/create/update/delete |
| FR-14-01..04 | Loại hình cơ sở | search/create/update/delete |
| FR-15-01..04 | Loại hình quảng cáo | search/create/update/delete |
| FR-16-01..04 | Cơ sở kiểm nghiệm | search/create/update/delete |

### STT 17 — Danh mục dịch vụ kiểm nghiệm (p. 19)
FR-17-01 search; FR-17-02 create; FR-17-03 update; FR-17-04 delete; FR-17-05 **xuất excel danh sách dịch vụ**.

### STT 18 — Danh mục loại văn bản (p. 20)
FR-18-01 search; FR-18-02 create; FR-18-03 update; FR-18-04 delete.

## C — Quản lý về ATTP (STT 19–40, PDF pp. 20–36)

### STT 19 — Quản lý cơ sở SXKD ATTP trên địa bàn (pp. 20–21)
| ID | Sub-requirement |
|---|---|
| FR-19-01 | Danh sách + tìm kiếm cơ sở |
| FR-19-02 | Tìm kiếm nâng cao theo phân loại + đặt lại tiêu chí |
| FR-19-03 | Thêm mới cơ sở (từng trường hợp) |
| FR-19-04 | Import cơ sở từ file excel |
| FR-19-05 | Sửa thông tin cơ sở |
| FR-19-06 | Xóa cơ sở |
| FR-19-07 | Xem chi tiết từng cơ sở |
| FR-19-08 | Xuất danh sách cơ sở ra excel |
| FR-19-09 | Chọn vị trí cơ sở trên bản đồ |
| FR-19-10 | Chọn nhóm sản phẩm cơ sở đang SXKD |
| FR-19-11 | Thêm/sửa/xóa giấy tờ công bố của cơ sở |
| FR-19-12 | Thêm/sửa/xóa giấy đăng ký công bố của cơ sở |
| FR-19-13 | Thêm/sửa/xóa giấy đăng ký quảng cáo của cơ sở |
| FR-19-14 | Thêm/sửa/xóa người trực tiếp SXKD thực phẩm |
| FR-19-15 | Thêm/sửa/xóa kết quả thanh tra cơ sở |
| FR-19-16 | Xác nhận cơ sở đủ điều kiện SXKD |
| FR-19-17 | Xác nhận cơ sở đã nộp bản cam kết đảm bảo VSATTP |
| FR-19-18 | Phân quyền dữ liệu theo địa bàn quản lý / đầu mối quản lý |

### STT 20 — Quản lý sản phẩm của các cơ sở (pp. 21–22)
| ID | Sub-requirement |
|---|---|
| FR-20-01 | Hiển thị danh sách sản phẩm |
| FR-20-02 | Tìm kiếm sản phẩm |
| FR-20-03 | Thêm mới sản phẩm |
| FR-20-04 | Chỉnh sửa sản phẩm |
| FR-20-05 | Xóa sản phẩm |
| FR-20-06 | Xem chi tiết thông tin sản phẩm |
| FR-20-07 | Thêm mới từ danh sách excel (import) |
| FR-20-08 | Xuất danh sách excel |

### STT 21 — Quản lý tự công bố sản phẩm (p. 22)
| ID | Sub-requirement |
|---|---|
| FR-21-01 | Tìm kiếm bản tự công bố (kèm nâng cao, làm mới) |
| FR-21-02 | Thêm mới bản tự công bố |
| FR-21-03 | Sửa bản tự công bố |
| FR-21-04 | Xóa bản tự công bố |
| FR-21-05 | Xem thông tin sản phẩm TCB |
| FR-21-06 | Đính kèm bản tự công bố (file) |
| FR-21-07 | Xem file đính kèm |
| FR-21-08 | Xóa file đính kèm |
| FR-21-09 | Xuất danh sách TCB ra excel |

### STT 22 — Đăng ký công bố sản phẩm (p. 23)
FR-22-01 search (+nâng cao, đặt lại, làm mới); FR-22-02 create; FR-22-03 update; FR-22-04 delete; FR-22-05 view detail; FR-22-06 đính kèm giấy tiếp nhận ĐKCB; FR-22-07 xem file; FR-22-08 xóa file; FR-22-09 export excel.

### STT 23 — Đăng ký xác nhận nội dung quảng cáo (pp. 23–24)
FR-23-01 search (+nâng cao); FR-23-02 create; FR-23-03 update; FR-23-04 delete; FR-23-05 view; FR-23-06 chọn sản phẩm đăng ký quảng cáo; FR-23-07 đính kèm giấy xác nhận; FR-23-08 xem file; FR-23-09 xóa file; FR-23-10 export excel; FR-23-11 làm mới danh sách.

### STT 24 — Đăng ký cơ sở đủ điều kiện (pp. 24–25)
FR-24-01 lọc/tìm kiếm (+nâng cao); FR-24-02 create; FR-24-03 update; FR-24-04 delete; FR-24-05 view; FR-24-06 đính kèm GCN cơ sở ĐĐK; FR-24-07 xem file; FR-24-08 xóa file; FR-24-09 export excel; FR-24-10 làm mới.

### STT 25 — Giấy chứng nhận lưu hành tự do (CFS) (pp. 25–26)
FR-25-01 search (+nâng cao); FR-25-02 create; FR-25-03 update; FR-25-04 delete; FR-25-05 view; FR-25-06 chọn sản phẩm cấp CFS; FR-25-07 đính kèm giấy; FR-25-08 xem file; FR-25-09 xóa file; FR-25-10 export excel; FR-25-11 làm mới.

### STT 26 — Giấy chứng nhận thực phẩm xuất khẩu (p. 26)
FR-26-01 search (+nâng cao); FR-26-02 create; FR-26-03 update; FR-26-04 delete; FR-26-05 view; FR-26-06 chọn sản phẩm; FR-26-07 đính kèm giấy; FR-26-08 xem file; FR-26-09 xóa file; FR-26-10 export excel; FR-26-11 làm mới.

**Cross-cutting cho STT 21–26 (từ mô tả, p. 22–23)**: FR-LIC-01 biểu mẫu giấy phép theo NĐ 15/2018/NĐ-CP; FR-LIC-02 phân quyền dữ liệu giấy phép theo địa bàn/đầu mối quản lý.

### STT 27 — Kế hoạch thanh, kiểm tra VSATTP (p. 27)
| ID | Sub-requirement |
|---|---|
| FR-27-01 | Lọc, tìm kiếm kế hoạch |
| FR-27-02 | Thêm mới kế hoạch |
| FR-27-03 | Thêm cơ sở SXKD cần thanh kiểm tra vào kế hoạch |
| FR-27-04 | Xóa cơ sở khỏi kế hoạch |
| FR-27-05 | Sửa kế hoạch |
| FR-27-06 | Xóa kế hoạch |
| FR-27-07 | Xem chi tiết kế hoạch |
| FR-27-08 | Upload tài liệu liên quan |
| FR-27-09 | Xem / tải tài liệu liên quan |
| FR-27-10 | Xuất danh sách kế hoạch ra excel |
| FR-27-11 | Phân quyền dữ liệu theo địa bàn / đầu mối |

### STT 28 — Kết quả thanh, kiểm tra VSATTP (p. 28)
| ID | Sub-requirement |
|---|---|
| FR-28-01 | Lọc / tìm kiếm kết quả theo kế hoạch |
| FR-28-02 | Xem kế hoạch + kết quả |
| FR-28-03 | Đóng (chốt) thông tin chi tiết kết quả cho từng cơ sở |
| FR-28-04 | Cập nhật kết quả thanh kiểm tra cho từng cơ sở |
| FR-28-05 | Tải/xuất tài liệu liên quan |
| FR-28-06 | Tải lại / đặt lại tìm kiếm |
| FR-28-07 | Phân quyền dữ liệu theo địa bàn / đầu mối |

### STT 29 — Cảnh báo vệ sinh ATTP (p. 29)
| ID | Sub-requirement |
|---|---|
| FR-29-01 | Lọc, tìm kiếm cảnh báo (+đặt lại) |
| FR-29-02 | Thêm mới cảnh báo |
| FR-29-03 | Sửa cảnh báo |
| FR-29-04 | Xóa cảnh báo |
| FR-29-05 | Xem cảnh báo |
| FR-29-06 | Duyệt cảnh báo do người dân gửi lên (xác minh) |
| FR-29-07 | Thu hồi cảnh báo |
| FR-29-08 | Xuất thông tin cảnh báo |
| FR-29-09 | Phân quyền dữ liệu cảnh báo theo địa bàn / đầu mối |

### STT 30 — Quản lý tin tức, hoạt động ATTP (p. 29)
| ID | Sub-requirement |
|---|---|
| FR-30-01 | Lọc, tìm kiếm tin tức |
| FR-30-02 | Thêm mới tin tức |
| FR-30-03 | Sửa tin tức |
| FR-30-04 | Xóa tin tức |
| FR-30-05 | Xem tin tức |
| FR-30-06 | Gắn cảnh báo cơ sở vi phạm VSATTP cho tin tức |
| FR-30-07 | Duyệt tin tức do người dân gửi lên |
| FR-30-08 | Thu hồi tin tức |
| FR-30-09 | Công bố tin để người dân tra cứu (publish) |

### STT 31 — Ca ngộ độc nhỏ lẻ (p. 30)
| ID | Sub-requirement |
|---|---|
| FR-31-01 | Tìm kiếm ca ngộ độc nhỏ lẻ |
| FR-31-02 | Khai báo ngộ độc thực phẩm (tạo phiếu) |
| FR-31-03 | Sửa phiếu khai báo |
| FR-31-04 | Xóa phiếu khai báo |
| FR-31-05 | Xem chi tiết phiếu khai báo |
| FR-31-06 | Xác minh phiếu khai báo |
| FR-31-07 | Xem chi tiết phiếu đã xác minh |
| FR-31-08 | Tạo phiếu (báo cáo) sai sót |
| FR-31-09 | Xem chi tiết phiếu sai sót |
| FR-31-10 | Xuất excel danh sách ca ngộ độc |
| FR-31-11 | Phân quyền dữ liệu theo cấp đơn vị / đầu mối |

### STT 32 — Vụ ngộ độc (p. 30–31)
| ID | Sub-requirement |
|---|---|
| FR-32-01 | Tìm kiếm vụ ngộ độc |
| FR-32-02 | Thêm mới vụ ngộ độc |
| FR-32-03 | Chỉnh sửa báo cáo vụ ngộ độc |
| FR-32-04 | Xóa báo cáo vụ ngộ độc |
| FR-32-05 | Xác minh phiếu khai báo |
| FR-32-06 | Xem phiếu đã xác minh / phiếu sai sót |
| FR-32-07 | Nhập phiếu kết thúc vụ ngộ độc (chỉ cấp Tỉnh/TP) |
| FR-32-08 | Xem phiếu kết thúc |
| FR-32-09 | Xuất excel phiếu báo cáo |
| FR-32-10 | Phân quyền dữ liệu theo cấp đơn vị / đầu mối |

### STT 33 — Báo cáo ATTP ngành: tình hình ngộ độc thực phẩm (NĐTP, hàng tháng) (p. 31)
| ID | Sub-requirement |
|---|---|
| FR-33-01 | Tìm kiếm báo cáo NĐTP (+nâng cao) |
| FR-33-02 | Tạo báo cáo NĐTP (cán bộ tuyến xã lập Báo cáo ban đầu; tuyến TP tổng hợp + Báo cáo kết thúc) |
| FR-33-03 | Sửa báo cáo (chỉ khi chưa gửi — lưu tạm/Draft) |
| FR-33-04 | Gửi báo cáo lên tuyến trên; sau gửi KHÔNG được sửa (immutable) |
| FR-33-05 | Gửi báo cáo sai sót (tuyến dưới báo sai sót lên tuyến trên) |
| FR-33-06 | Tuyến trên quyết định trả lại cho tuyến dưới sửa (return) |
| FR-33-07 | Xác minh báo cáo (tuyến trên) |
| FR-33-08 | Xem chi tiết báo cáo |
| FR-33-09 | Xóa báo cáo (khi chưa gửi) |
| FR-33-10 | Xuất danh sách báo cáo ra excel |
| FR-33-11 | Chu kỳ báo cáo theo tháng |

### STT 34 — Báo cáo công tác ATTP (6 tháng + 1 năm) (p. 32)
| ID | Sub-requirement |
|---|---|
| FR-34-01 | Tìm kiếm báo cáo công tác ATTP |
| FR-34-02 | Tạo báo cáo công tác ATTP |
| FR-34-03 | Sửa báo cáo (Draft) |
| FR-34-04 | Gửi báo cáo lên tuyến trên; phê duyệt trước khi gửi; immutable sau gửi |
| FR-34-05 | Báo cáo sai sót sau khi đã gửi |
| FR-34-06 | Tuyến trên trả lại báo cáo cho tuyến dưới |
| FR-34-07 | Xóa báo cáo |
| FR-34-08 | Xem báo cáo; xem dưới dạng văn bản |
| FR-34-09 | Xuất excel báo cáo |
| FR-34-10 | Tự tính số liệu (auto-aggregate from system data) |
| FR-34-11 | Chu kỳ 6 tháng và 1 năm |

### STT 35 — Báo cáo Tháng hành động ATTP (1 năm/lần) (p. 33)
| ID | Sub-requirement |
|---|---|
| FR-35-01 | Tìm kiếm báo cáo tháng hành động |
| FR-35-02 | Tạo báo cáo |
| FR-35-03 | Sửa báo cáo (Draft) |
| FR-35-04 | Gửi lên tuyến trên; immutable sau gửi |
| FR-35-05 | Báo cáo sai sót sau gửi |
| FR-35-06 | Tuyến trên trả lại báo cáo |
| FR-35-07 | Xóa báo cáo |
| FR-35-08 | Xem dưới dạng văn bản |
| FR-35-09 | Xuất excel |
| FR-35-10 | Chu kỳ 1 năm/lần |

### STT 36 — Quản lý phân tích mối nguy cơ (p. 33–34)
| ID | Sub-requirement |
|---|---|
| FR-36-01 | Hiển thị danh sách nội dung phân tích mối nguy cơ |
| FR-36-02 | Tìm kiếm |
| FR-36-03 | Tạo mới nội dung |
| FR-36-04 | Chỉnh sửa nội dung |
| FR-36-05 | Xem nội dung |
| FR-36-06 | Xóa nội dung |
| FR-36-07 | Công bố thông tin phân tích mối nguy cơ lên cổng thông tin |
| FR-36-08 | In / xuất nội dung |

### STT 37 — Quản lý kết quả kiểm nghiệm (p. 34)
FR-37-01 search; FR-37-02 create; FR-37-03 update; FR-37-04 view detail; FR-37-05 delete; FR-37-06 export excel.

### STT 38 — Quản lý văn bản chỉ đạo, điều hành (p. 34–35)
FR-38-01 hiển thị danh sách; FR-38-02 tìm kiếm; FR-38-03 thêm mới; FR-38-04 chỉnh sửa; FR-38-05 xóa; FR-38-06 xem chi tiết; FR-38-07 in/xuất thông tin.

### STT 39 — Dashboard thống kê (p. 35)
| ID | Sub-requirement |
|---|---|
| FR-39-01 | Thống kê số lượng cơ sở, sản phẩm (theo cấp quản lý Tỉnh/TP, Xã) |
| FR-39-02 | Chọn thống kê theo thời gian và đơn vị quản lý |
| FR-39-03 | Xem tình hình báo cáo công tác ATTP của các đơn vị |
| FR-39-04 | Xem tình hình báo cáo Tháng hành động ATTP |
| FR-39-05 | Xem số lượng cơ sở SXKD theo loại hình |
| FR-39-06 | Xem số liệu thống kê NĐTP theo thời gian |
| FR-39-07 | Xem bản đồ tình hình NĐTP |
| FR-39-08 | Xem biểu đồ cột tình hình NĐTP theo thời gian |
| FR-39-09 | Lưu/Tải (download) các số liệu, biểu đồ thống kê |

### STT 40 — Báo cáo thống kê (p. 36)
| ID | Sub-requirement |
|---|---|
| FR-40-01 | Thống kê số giấy phép được cấp theo từng loại hình cơ sở |
| FR-40-02 | Xuất excel thống kê giấy phép |
| FR-40-03 | Thống kê tình hình ngộ độc thực phẩm trên địa bàn |
| FR-40-04 | Xuất excel thống kê NĐTP |
| FR-40-05 | Thống kê kết quả thanh kiểm tra: số vụ vi phạm, số vụ xử lý, số kế hoạch |
| FR-40-06 | Xuất excel kết quả thanh kiểm tra |
| FR-40-07 | Thống kê cơ sở SXKD theo loại hình, vùng, địa bàn, đầu mối quản lý |
| FR-40-08 | Xuất excel thống kê cơ sở |

## E — Dành cho người dân (public portal, STT 41–49, PDF pp. 36–38)

> Note: nhóm D không tồn tại riêng trong bảng PDF (ký tự "D" xuất hiện do lệch cột); nhóm E là cổng công khai. `docs/01-functional-requirements.md` ánh xạ nhóm E khác PDF (thêm "tra cứu kết quả kiểm nghiệm/thanh kiểm tra/phân tích nguy cơ", bỏ "tra cứu TCB/ĐKCB/cơ sở bị cảnh báo" thành các mục riêng) — **sai lệch tài liệu, PDF là chuẩn**.

### STT 41 — Tra cứu thông tin chung (p. 36–37)
FR-41-01 tìm kiếm thông tin cơ sở SXKD; FR-41-02 hiển thị kết quả tìm cơ sở; FR-41-03 tìm kiếm thông tin sản phẩm, thực phẩm; FR-41-04 hiển thị kết quả tìm sản phẩm. (Anonymous)

### STT 42 — Tra cứu cơ sở được cấp GCN đủ điều kiện (p. 37)
FR-42-01 hiển thị danh sách cơ sở; FR-42-02 xem thông tin một cơ sở; FR-42-03 xem giấy chứng nhận; FR-42-04 in/tải giấy chứng nhận.

### STT 43 — Tra cứu sản phẩm doanh nghiệp tự công bố (p. 37)
FR-43-01 danh sách; FR-43-02 xem thông tin sản phẩm; FR-43-03 xem giấy chứng nhận; FR-43-04 in/tải giấy.

### STT 44 — Tra cứu sản phẩm đã được cấp giấy tiếp nhận đăng ký công bố (p. 37)
FR-44-01 danh sách; FR-44-02 xem sản phẩm; FR-44-03 xem giấy; FR-44-04 in/tải giấy.

### STT 45 — Tra cứu danh sách cơ sở bị cảnh báo mất VSATTP (p. 38)
FR-45-01 hiển thị danh sách cơ sở bị cảnh báo; FR-45-02 xem thông tin cơ sở; FR-45-03 xem nội dung cảnh báo.

### STT 46 — Tra cứu giấy chứng nhận lưu hành tự do (p. 38)
FR-46-01 danh sách sản phẩm; FR-46-02 xem sản phẩm; FR-46-03 xem giấy; FR-46-04 in/tải giấy.

### STT 47 — Tra cứu giấy chứng nhận sản phẩm xuất khẩu (p. 38)
FR-47-01 danh sách; FR-47-02 xem sản phẩm; FR-47-03 xem giấy; FR-47-04 in/tải giấy.

### STT 48 — Cảnh báo vệ sinh ATTP (công dân) (p. 38)
FR-48-01 hiển thị danh sách tin tức cảnh báo VSATTP; FR-48-02 tìm kiếm tin tức (từ khóa, đặt lại); FR-48-03 gửi cảnh báo ATVSTP (citizen submission → được cán bộ duyệt tại FR-29-06).

### STT 49 — Tra cứu thông tin văn bản (p. 38)
FR-49-01 tra cứu văn bản pháp luật về VSATTP; FR-49-02 xem thông tin văn bản.

## F — Quản lý tích hợp và chia sẻ dữ liệu (STT 50–57, PDF pp. 39–41)

### STT 50 — Quản lý đặc tả API tích hợp, chia sẻ dữ liệu (p. 39)
| ID | Sub-requirement |
|---|---|
| FR-50-01 | Hiển thị danh sách đặc tả API |
| FR-50-02 | Thêm đặc tả API |
| FR-50-03 | Sửa đặc tả API |
| FR-50-04 | Xóa đặc tả API |
| FR-50-05 | Xem chi tiết đặc tả, hướng dẫn cấu hình, kết nối |
| FR-50-06 | Xuất danh sách API |

### STT 51–57 — Lịch sử nhận/chia sẻ dữ liệu (pp. 39–41)
Mỗi loại yêu cầu 4 items: (a) hiển thị lịch sử nhận, (b) chia sẻ thông tin (gửi đi), (c) xem chi tiết, (d) tìm kiếm.

| ID range | Data type |
|---|---|
| FR-51-01..04 | Thông tin cảnh báo ATTP |
| FR-52-01..04 | Kết quả thanh, kiểm tra |
| FR-53-01..04 | Vụ ngộ độc thực phẩm |
| FR-54-01..04 | Thông tin giấy phép |
| FR-55-01..04 | Sản phẩm, thực phẩm |
| FR-56-01..04 | Tin tức, hoạt động ATTP nổi bật |
| FR-57-01..04 | Cơ sở sản xuất kinh doanh ATTP |

---

## Integration (§2.4, p. 2, INT)
| ID | Requirement |
|---|---|
| INT-01 | Khả năng kết nối, chia sẻ dữ liệu với hệ thống thông tin ATTP của Bộ Y tế |
| INT-02 | Đáp ứng tích hợp/chia sẻ dữ liệu theo Thông tư 31/2026/TT-BCT và NĐ 37/2026/NĐ-CP (truy xuất nguồn gốc) |
| INT-03 | Cung cấp tài khoản kết nối (username, password, API address) cho hệ thống Sở NN&PTNT và Sở Công thương; phiên làm việc giữa 2 hệ thống; dữ liệu liên thông đẩy lên/nhận về qua API |
| INT-04 | API cung cấp phải có tài liệu đặc tả quy định dữ liệu, kiểu, định dạng |
| INT-05 | Dữ liệu liên thông, chia sẻ được lưu lịch sử phục vụ quản lý, tra cứu |

## Performance (§2.5, p. 3, NFR)
| ID | Requirement |
|---|---|
| NFR-01 | Thời gian phản hồi trung bình < 10s cho mỗi luồng công việc chính (trừ thống kê/báo cáo) |
| NFR-02 | Thời gian phản hồi chậm nhất < 30s toàn trang |
| NFR-03 | CPU máy chủ dữ liệu trung bình ≤ 75% |
| NFR-04 | CPU máy chủ ứng dụng trung bình ≤ 75% |
| NFR-05 | ≥ 30 truy cập đồng thời |
| NFR-06 | Người dùng hoạt động đồng thời ≥ 1/6 số truy cập đồng thời (≥5) |

## IPv6 / HTTPS (§2.6, p. 4, IPV)
| ID | Requirement |
|---|---|
| IPV-01 | Phần mềm hỗ trợ IPv6 |
| IPV-02 | Đường truyền Internet cho webserver hỗ trợ IPv6 |
| IPV-03 | Webserver lắng nghe kết nối qua IPv6 |
| IPV-04 | Bản ghi AAAA cho tên miền trên DNS hosting |
| IPV-05 | Máy chủ DNS hosting hỗ trợ IPv6; sẵn sàng DNSSEC |
| IPV-06 | HTTPS với TLS ≥ 1.2, bộ mã hóa an toàn cho xác thực và dữ liệu nhạy cảm |

## Application security (§3.1, pp. 4–8, SEC)
| ID | Requirement |
|---|---|
| SEC-01 | Tên đăng nhập duy nhất; chỉ chữ cái, chữ số, gạch dưới |
| SEC-02 | Mật khẩu tối thiểu 8 ký tự |
| SEC-03 | Mật khẩu chứa chữ cái, chữ số và ký tự đặc biệt |
| SEC-04 | Mật khẩu hết hạn tối đa 90 ngày; mật khẩu mới không trùng mật khẩu hiện tại |
| SEC-05 | Link reset mật khẩu qua email mất hiệu lực sau lần truy cập đầu hoặc sau 8 giờ |
| SEC-06 | Mật khẩu gửi qua email (nếu có) phải sinh ngẫu nhiên, tuân theo chính sách mạnh |
| SEC-07 | Mật khẩu lưu dạng hash + salt (ngẫu nhiên, duy nhất mỗi người dùng); không lưu rõ |
| SEC-08 | CAPTCHA (hoặc tương đương) cho đăng nhập và các chức năng quan trọng; kiểm tra hợp lệ trước khi xử lý |
| SEC-09 | Chỉ dùng POST cho thông tin nhạy cảm (username/password); khuyến nghị HTTPS |
| SEC-10 | Session timeout hợp lý |
| SEC-11 | Tạo session mới sau đăng nhập; hủy session + xóa sessionId khi đăng xuất |
| SEC-12 | Cookie session: HTTP-Only; Secure khi HTTPS |
| SEC-13 | CSRF: token ngẫu nhiên cho mọi request thêm/sửa/xóa; kiểm tra hợp lệ trước xử lý |
| SEC-14 | UI chỉ hiển thị thành phần đúng quyền; không dùng CSS/JS để ẩn chức năng không được phép |
| SEC-15 | Server kiểm tra quyền chức năng trong MỌI request |
| SEC-16 | Server kiểm tra quyền miền dữ liệu (data scope theo đơn vị) trong MỌI request |
| SEC-17 | Kiểm tra quyền dựa trên đối tượng lưu tại server, không tin giá trị từ client |
| SEC-18 | Validate dữ liệu ở server (kiểu, phạm vi, độ dài, định dạng, whitelist ký tự) |
| SEC-19 | HTML-encode ký tự đặc biệt từ nguồn không an toàn (chống XSS/HTML injection) |
| SEC-20 | Lọc \n \r khỏi dữ liệu client xuất hiện trong response header (chống response splitting) |
| SEC-21 | Không lưu dữ liệu nhạy cảm trên cookie; nếu cần phải mã hóa đối xứng mạnh, key tại server |
| SEC-22 | Hạn chế redirect/forward; nếu có phải whitelist URI |
| SEC-23 | Xử lý XML an toàn: encode ký tự đặc biệt, tắt external entity + remote doctype (chống XXE) |
| SEC-24 | Try-catch với thông báo lỗi chung, không lộ thông tin nhạy cảm |
| SEC-25 | Log lỗi/ngoại lệ phục vụ bảo trì; file log ngoài thư mục web; không log dữ liệu nhạy cảm |

## Database security (§3.2, pp. 8–10, DBS)
| ID | Requirement |
|---|---|
| DBS-01 | Cài đặt hệ quản trị CSDL an toàn trên máy chủ đạt yêu cầu ATTT; cập nhật bản vá security mới nhất |
| DBS-02 | Gỡ bỏ thành phần thừa; xóa tài khoản/CSDL không sử dụng; tắt các hàm tương tác tài nguyên HĐH |
| DBS-03 | Chính sách tài khoản CSDL: mọi tài khoản có mật khẩu ≥8 ký tự (chữ+số+ký tự đặc biệt); đổi mật khẩu quản trị ≤ 3 tháng, không trùng 5 mật khẩu gần nhất |
| DBS-04 | Ứng dụng không dùng tài khoản có quyền quản trị để kết nối CSDL; tài khoản riêng, least-privilege |
| DBS-05 | Không chạy dịch vụ CSDL bằng tài khoản quản trị HĐH; phân quyền thư mục dữ liệu/log |
| DBS-06 | Tài khoản + mật khẩu kết nối CSDL được mã hóa trong file cấu hình (key + thuật toán tại ứng dụng) |
| DBS-07 | Ghi log audit mọi lần đăng nhập CSDL (thành công + thất bại); log lưu 3 tháng, log quan trọng đẩy lưu trữ tập trung ≥ 6 tháng |
| DBS-08 | Giới hạn IP được kết nối đến CSDL |
| DBS-09 | Mã hóa dữ liệu lưu trữ và trên đường truyền; data redaction/masking dữ liệu nhạy cảm; privileged user controls |
| DBS-10 | Giải pháp kiểm soát truy cập CSDL của bên thứ 3 (Database Activity Monitoring/Firewall) với cảnh báo thời gian thực và báo cáo định kỳ |

## User support (§3.3, p. 10, SUP — non-software service obligations)
SUP-01 khắc phục sự cố trong 48 giờ; SUP-02 giải pháp đảm bảo liên tục trong thời gian sửa; SUP-03 ≥ 2 kênh tiếp nhận hỗ trợ (điện thoại/email/tại chỗ); SUP-04 hoạt động 24x7.

## UI/UX (§3.4, pp. 10–12, UI)
| ID | Requirement |
|---|---|
| UI-01 | Giao diện trực quan, thân thiện, phù hợp các nhóm người dùng (mục 18) |
| UI-02 | Giao diện người dùng cuối trên nền web (19) |
| UI-03 | Tìm được dịch vụ sau tối đa 3 lần bấm chuột (20) |
| UI-04 | Hỗ trợ tối đa thao tác bàn phím; màn hình nhập thống nhất về thao tác, màu sắc, font; màn hình tra cứu/lọc thống nhất; biểu tượng/phím nóng thống nhất (21) |
| UI-05 | Thiết kế đơn giản hiệu quả, ít tab, xử lý ảnh nhanh, chuẩn giao diện thống nhất (22) |
| UI-06 | Lưu trữ Unicode, tiếng Việt có dấu TCVN 6909:2001; font hệ thống chuẩn (Arial/Times New Roman), không cần cài font (23) |
| UI-07 | Thông báo lỗi thân thiện, Việt hóa, phân biệt lỗi người dùng vs lỗi hệ thống, chỉ ra hướng khắc phục (24) |
| UI-08 | Lỗi hệ thống: thông báo nguyên nhân + cách xử lý; tự phục hồi trong các trường hợp xác định; ghi log (25) |
| UI-09 | Tín hiệu trạng thái đang xử lý (spinner) thống nhất toàn hệ thống (26) |
| UI-10 | Tuân thủ chuẩn nội dung web theo TT 39/2017/TT-BTTTT (27) |

## Data tolerance / input control (§3.5, pp. 12–13, DT)
| ID | Requirement |
|---|---|
| DT-01 | Ngày tháng lưu năm 4 chữ số, hiển thị dd/mm/yyyy (28) |
| DT-02 | Tiền tệ VND ≥ 15 chữ số nguyên + 2 thập phân (29) |
| DT-03 | Kiểm tra tức thời tính hợp lệ khi nhập trực tiếp (30) |
| DT-04 | Kiểm tra tức thời khi nhập trực tiếp hoặc qua tệp dữ liệu (31) |
| DT-05 | Kiểm tra nhất quán/toàn vẹn dữ liệu quan hệ qua ràng buộc khóa trong CSDL (32) |
| DT-06 | Kiểm tra cấu trúc/định dạng/logic trước khi nhập; thông báo ngay khi lỗi (33) |
| DT-07 | Hiển thị dấu bắt buộc/tùy chọn cho ô nhập (34) |
| DT-08 | Ô nhập chuyên biệt theo định dạng (ngày, số...) (35) |
| DT-09 | Thứ tự ô nhập theo logic văn bản; di chuyển hoàn toàn bằng bàn phím (36) |
| DT-10 | Ô nhập dữ liệu cố định hiển thị danh sách chọn (dropdown) (37) |
| DT-11 | Quy trình giảm thiểu lỗi cú pháp lập trình, lỗi logic (38) |
| DT-12 | Định dạng tập tin vào/ra tuân thủ TT 39/2017/TT-BTTTT (39) |

## Training (§3.6, pp. 13–14, TRN — non-software deliverable)
TRN-01 01 lớp đào tạo, 01 ngày, 120 học viên (cán bộ Chi cục + 2 cán bộ/xã), trực tiếp hoặc trực tuyến, nội dung theo danh mục PDF.

## Level-2 information security (§3.7, p. 14, L2)
L2-01 Hồ sơ + biện pháp bảo đảm ATTT hệ thống cấp độ 2 theo NĐ 85/2016/NĐ-CP, TT 12/2022/TT-BTTTT, QĐ 742/QĐ-BTTTT (một phần software — các SEC/DBS ở trên; một phần thủ tục: hồ sơ đề xuất cấp độ, phê duyệt).

## Data ownership (§3.8, p. 14, OWN — non-software)
OWN-01 dữ liệu thuộc sở hữu bên thuê; OWN-02 chuyển giao đầy đủ dữ liệu + công cụ khi kết thúc hợp đồng; OWN-03 cam kết bảo mật, tuân thủ pháp luật ATTT; OWN-04 pháp nhân Việt Nam nắm quyền kiểm soát.

## Handover (§3.9, p. 14, HND — non-software)
HND-01 cung cấp toàn bộ dữ liệu dạng truy xuất, đọc được khi chấm dứt hợp đồng; HND-02 cam kết bảo mật cấu trúc, sơ đồ hệ thống, thông tin.

## Technology (§2.2, p. 2, TECH)
TECH-01 chạy ổn định trên HĐH máy chủ phổ biến; TECH-02 DBMS phổ biến, ổn định, sao lưu/phục hồi/mở rộng; TECH-03 ngôn ngữ/nền tảng phổ biến được hỗ trợ; TECH-04 kiến trúc mở, tích hợp qua giao thức chuẩn; TECH-05 web app tương thích Chrome, Edge, Firefox.

## Acceptance (§5, pp. 41–42, ACC — process deliverables)
ACC-01 kiểm tra hoàn thành hạng mục theo hợp đồng; ACC-02 kiểm tra chức năng, quy trình nghiệp vụ; ACC-03 kiểm tra kết nối, chia sẻ, tích hợp; ACC-04 kiểm tra ổn định, hiệu năng, vận hành, ATTT; ACC-05 tài liệu HDSD, tài liệu quản trị hệ thống; ACC-06 hồ sơ nghiệm thu (biên bản, thanh lý, hóa đơn...).

---

## Totals

| Category | Items |
|---|---|
| FR (functional, STT 1–57 + FR-LIC-01/02) | 372 |
| INT | 5 |
| NFR (performance) | 6 |
| IPV | 6 |
| SEC | 25 |
| DBS | 10 |
| UI | 10 |
| DT | 12 |
| TECH | 5 |
| SUP (non-software) | 4 |
| TRN (non-software) | 1 |
| L2 (mixed) | 1 |
| OWN (non-software) | 4 |
| HND (non-software) | 2 |
| ACC (process; ACC-05 partially software-adjacent docs) | 6 |
| **Total** | **469** |

Item breakdown per group: A=33 (STT1:6, STT2:13, STT3:3, STT4:6, STT5:5); B=57 (STT6:6, STT7:6, STT8–16:36, STT17:5, STT18:4); C=216 (19:18, 20:8, 21:9, 22:9, 23:11, 24:10, 25:11, 26:11, LIC:2, 27:11, 28:7, 29:9, 30:9, 31:11, 32:10, 33:11, 34:11, 35:10, 36:8, 37:6, 38:7, 39:9, 40:8); E=32; F=34. FR total = 372.

Software-assessable denominator (FR 372 + INT 5 + NFR 6 + IPV 6 + SEC 25 + DBS 10 + UI 10 + DT 12 + TECH 5 + L2 1): **452** (DBS-01/02/08/10 and several IPV items are deployment-environment obligations — kept in denominator as OPS-type software-delivery items, flagged in matrix).
Non-software deliverables tracked separately: SUP×4, TRN×1, OWN×4, HND×2, ACC×6 = **17**.

## Ambiguities / assumptions recorded
1. **STT column offset**: the PDF table's STT numbers are visually misaligned with row text; mapping reconstructed from reading order (57 groups, A→F). Confidence high for group boundaries; individual numbering within groups follows sequence.
2. **Group E discrepancy**: `docs/01-functional-requirements.md` substitutes different public lookups (testing results, inspection results, risk analysis) for the PDF's actual list (TCB lookup, ĐKCB lookup, warned-business lookup, CFS, export certs). The PDF list is used here. Public risk-analysis publication IS separately implied by FR-36-07 (công bố lên cổng thông tin) and STT 36's description ("công bố trên cổng thông tin để người dân tra cứu").
3. **"Tài khoản đơn vị" (STT 7)** interpreted as organization-linked user accounts (may be implemented via the same user management as STT 2 + organization assignment).
4. **STT 28 "Đóng thông tin chi tiết kết quả"** interpreted as closing/finalizing the per-business inspection result record.
5. **Districts**: PDF catalogs only name Tỉnh and Xã (post-2025 two-tier model), while organization hierarchy mentions Tỉnh → Thành phố/TP → Xã; commune catalog assessed as required, district treated as optional intermediate.
6. **DBS-09/10, IPV-02/04/05, NFR-03/04**: require production infrastructure (DAM/DB firewall appliance, ISP IPv6, DNS hosting, real servers) — assessed as to whether the delivered software/config *supports* them; full satisfaction is a deployment-time obligation.
7. **FR-34-10 "Tự tính số liệu"** applies to ATTP work reports; assumed to mean server-side aggregation from system data into the report form.
