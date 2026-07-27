# Phân tích Yêu cầu Chức năng — FoodSafe

> Hệ thống quản lý an toàn thực phẩm — Chi cục ATVSTP tỉnh Quảng Ninh  
> Cấp độ ATTT: Cấp độ 2 — Nghị định 85/2016/NĐ-CP  
> Tài liệu tham chiếu: Mẫu số 03. YCKT (1).pdf (42 trang)

---

## Tổng quan phân nhóm chức năng

| Nhóm | Tên | STT | Số chức năng |
|------|-----|-----|-------------|
| A | Quản trị hệ thống | 1–5 | 5 |
| B | Quản lý danh mục | 6–18 | 13 |
| C | Quản lý ATTP | 19–40 | 22 |
| E | Cổng thông tin công khai | 41–49 | 9 |
| F | Tích hợp dữ liệu | 50–57 | 8 |
| **Tổng** | | | **57** |

### Quy tắc liên chức năng về tệp đính kèm

Tệp đính kèm kế thừa owner, `organization_id`, mức công khai và vòng đời của
aggregate cha. Mỗi tệp phải tham chiếu một `document_owner` có FK; không dùng
chuỗi loại + UUID tự do. Tệp của báo cáo đã gửi thuộc snapshot submission bất
biến tương ứng, không thuộc header báo cáo đang tiếp tục chỉnh sửa.

---

## NHÓM A — Quản trị Hệ thống (STT 1–5)

### STT 1 — Quản lý Vai trò (Roles)

**Mô tả:** Quản lý các vai trò trong hệ thống, gán quyền cho từng vai trò.

**Chức năng chi tiết:**
- Danh sách vai trò: tìm kiếm, phân trang, lọc theo trạng thái
- Thêm mới vai trò: tên, mô tả, danh sách quyền
- Chỉnh sửa vai trò: cập nhật tên, mô tả, thêm/bỏ quyền
- Xóa vai trò (kiểm tra không có user đang dùng)
- Xem chi tiết vai trò + danh sách user được gán
- Phân quyền dạng cây theo module/chức năng
- Vai trò mặc định: Admin Tỉnh, Cán bộ Tỉnh, Admin Huyện, Cán bộ Huyện, Admin Xã, Cán bộ Xã

**Ràng buộc:**
- Không được xóa vai trò đang có user được gán
- Không được tự xóa quyền Admin của chính mình
- Phải có ít nhất 1 admin tỉnh trong hệ thống

**API liên quan:**
```
GET    /api/identity/roles
POST   /api/identity/roles
PUT    /api/identity/roles/{id}
DELETE /api/identity/roles/{id}
GET    /api/identity/roles/{id}/permissions
PUT    /api/identity/roles/{id}/permissions
```

---

### STT 2 — Quản lý Người dùng (Users)

**Mô tả:** Quản lý tài khoản người dùng — tạo, phân quyền, khóa, reset mật khẩu.

**Chức năng chi tiết:**
- Danh sách người dùng: tìm kiếm (tên, email, đơn vị), lọc theo vai trò/đơn vị/trạng thái
- Tạo người dùng mới:
  - Thông tin cá nhân: họ tên, email, số điện thoại
  - Thông tin tổ chức: đơn vị, chức vụ, phòng ban
  - Tài khoản: username (tự động từ email), mật khẩu tạm thời
  - Gán vai trò (1 hoặc nhiều)
  - Gửi email thông báo tài khoản
- Chỉnh sửa thông tin người dùng
- Khóa/mở khóa tài khoản
- Reset mật khẩu (gửi email)
- Xem lịch sử hoạt động của user
- Bắt buộc đổi mật khẩu lần đầu đăng nhập
- Mật khẩu hết hạn 90 ngày — bắt buộc đổi

**Chính sách mật khẩu:**
- Tối thiểu 8 ký tự
- Bao gồm: chữ hoa, chữ thường, số, ký tự đặc biệt
- Không trùng 5 mật khẩu gần nhất
- Hết hạn sau 90 ngày

**Ràng buộc:**
- User bị ràng buộc với 1 đơn vị (OrganizationId)
- Chỉ Admin cùng cấp hoặc cao hơn mới tạo được user
- User cấp tỉnh không tự tạo được user cấp huyện (và ngược lại)

---

### STT 3 — Nhật ký kiểm soát hệ thống (Audit Log)

**Mô tả:** Ghi và tra cứu toàn bộ lịch sử thao tác của người dùng.

**Chức năng chi tiết:**
- Xem danh sách nhật ký: tìm kiếm theo user, thời gian, module, loại hành động
- Lọc: theo user, theo đơn vị, theo chức năng, theo khoảng thời gian
- Chi tiết nhật ký: thông tin thay đổi trước/sau (diff), IP, browser, thời gian
- Export nhật ký ra Excel
- Nhật ký được ghi tự động cho tất cả thao tác: Tạo, Sửa, Xóa, Đăng nhập, Đăng xuất
- Nhật ký đăng nhập thất bại (quan trọng cho bảo mật)
- Lưu trữ tối thiểu 2 năm

**Dữ liệu ghi nhận:**
- User ID + tên + email
- Organization ID + tên đơn vị
- Module + chức năng
- Action type (Create/Update/Delete/Login/Logout/Export)
- Entity type + Entity ID
- Dữ liệu thay đổi (before/after, JSON diff)
- IP address, User agent, Browser
- Timestamp (UTC)
- Execution time (ms)
- Success/Failure + error message

---

### STT 4 — Quản lý Cấu hình hệ thống (Settings)

**Mô tả:** Cấu hình tham số vận hành của hệ thống.

**Chức năng chi tiết:**
- Cấu hình chung:
  - Tên hệ thống, logo, thông tin đơn vị chủ quản
  - Định dạng ngày tháng (dd/mm/yyyy — mặc định)
  - Định dạng tiền tệ VND
  - Múi giờ (UTC+7)
  - Ngôn ngữ mặc định (Tiếng Việt)
- Cấu hình bảo mật:
  - Số lần đăng nhập sai tối đa trước khi khóa (mặc định: 5)
  - Thời gian khóa tài khoản (mặc định: 30 phút)
  - Session timeout (mặc định: 30 phút không hoạt động)
  - Độ dài mật khẩu tối thiểu
  - Thời gian hết hạn mật khẩu (ngày)
- Cấu hình email:
  - SMTP server, port, SSL
  - Sender email, sender name
  - Template email thông báo
- Cấu hình MinIO (file storage):
  - Endpoint, bucket, access key (không hiển thị full)
  - Max file size (MB)
  - Allowed file types
- Cấu hình thông báo:
  - Số ngày trước khi giấy phép hết hạn để cảnh báo (mặc định: 30, 60, 90 ngày)

---

### STT 5 — Quản lý Phân quyền (Access Management)

**Mô tả:** Định nghĩa và quản lý cây phân quyền chi tiết cho toàn hệ thống.

**Chức năng chi tiết:**
- Xem cây phân quyền toàn hệ thống (theo module)
- Gán/thu hồi quyền cho vai trò theo từng chức năng
- Ma trận quyền: vai trò × chức năng
- Kế thừa quyền theo cấp tổ chức
- Phân quyền theo đơn vị (organization-scoped permissions)
- Kiểm tra xung đột quyền

**Cây phân quyền (Permission Tree):**
```
SystemAdmin.*
Organizations.*
Catalogs.*
BusinessManagement.Businesses.*
BusinessManagement.Products.*
BusinessManagement.SelfDeclarations.*
Licensing.ProductRegistrations.*
Licensing.AdRegistrations.*
Licensing.EligibilityCertificates.*
Licensing.CfsCertificates.*
Licensing.ExportCertificates.*
Inspection.Plans.*
Inspection.Results.*
FoodPoisoning.Cases.*
FoodPoisoning.Incidents.*
Reporting.NdtpReports.*
Reporting.AtpWorkReports.*
Reporting.ActionMonthReports.*
AlertsAndTesting.Alerts.*
AlertsAndTesting.News.*
AlertsAndTesting.RiskAnalyses.*
AlertsAndTesting.TestingResults.*
AlertsAndTesting.Documents.*
Dashboard.*
DataIntegration.*
```

---

## NHÓM B — Quản lý Danh mục (STT 6–18)

### STT 6 — Quản lý Đơn vị Tổ chức (Organizations)

**Mô tả:** Quản lý 3 cấp đơn vị hành chính: Tỉnh → Huyện/TP → Xã/Phường.

**Chức năng chi tiết:**
- Hiển thị cây tổ chức 3 cấp
- Thêm/sửa/xóa đơn vị theo từng cấp
- Thông tin đơn vị: tên, mã, địa chỉ, điện thoại, fax, email, trưởng đơn vị
- Chuyển đơn vị lên/xuống cấp (thay đổi parent)
- Kích hoạt/vô hiệu hóa đơn vị
- Xem danh sách người dùng thuộc đơn vị

**Cấu trúc 3 cấp:**
- Cấp 1: Chi cục ATVSTP tỉnh Quảng Ninh (1 đơn vị)
- Cấp 2: Trung tâm Y tế các huyện/TP (13 đơn vị)
- Cấp 3: Trạm Y tế các xã/phường (>200 đơn vị)

---

### STT 7 — Quản lý Tài khoản Đơn vị (Unit Accounts)

**Mô tả:** Quản lý tài khoản người dùng thuộc từng đơn vị — phân cấp theo organization.

**Chức năng chi tiết:**
- Xem danh sách tài khoản theo đơn vị (scoped)
- Admin đơn vị cấp cao hơn có thể quản lý tài khoản đơn vị cấp dưới
- Tạo/sửa/khóa tài khoản trong phạm vi đơn vị của mình
- Gán vai trò phù hợp với cấp đơn vị

*Note: Chức năng này là view phân cấp của STT 2, không phải module riêng biệt trong code.*

---

### STT 8 — Quản lý Quốc gia (Countries)

**Chức năng:** CRUD danh mục quốc gia (dùng cho xuất xứ sản phẩm, CFS, Export Certificate).
- Mã ISO 3166-1 alpha-2 và alpha-3
- Tên tiếng Việt, tên tiếng Anh
- Kích hoạt/vô hiệu hóa
- Tìm kiếm, phân trang

---

### STT 9 — Quản lý Vùng/Miền (Regions)

**Chức năng:** CRUD vùng miền địa lý Việt Nam (Bắc/Trung/Nam + các vùng kinh tế).
- 8 vùng kinh tế-xã hội theo Nghị quyết
- Tên, mô tả, kích hoạt/vô hiệu hóa

---

### STT 10 — Quản lý Tỉnh/Thành phố (Provinces)

**Chức năng:** CRUD danh mục tỉnh/TP (63 tỉnh thành Việt Nam).
- Liên kết với Vùng/Miền
- Mã tỉnh theo VNDIVISION, tên đầy đủ, tên viết tắt
- Import từ Excel (bulk update)

---

### STT 11 — Quản lý Huyện/Quận và Xã/Phường (Districts & Communes)

**Chức năng:** CRUD huyện/quận và xã/phường/thị trấn.
- Huyện: liên kết tỉnh, mã huyện, tên, loại (Huyện/Quận/Thị xã/TP trực thuộc)
- Xã/Phường: liên kết huyện, mã xã, tên, loại (Xã/Phường/Thị trấn)
- Import từ Excel (ĐVHCVN standard)
- Chỉ hiển thị xã/phường thuộc huyện của Quảng Ninh trong workflow

---

### STT 12 — Quản lý Phân loại cơ sở (Business Classification)

**Chức năng:** CRUD phân loại nguy cơ cơ sở SXKD thực phẩm.

**Dữ liệu chuẩn:**
- Nguy cơ cao
- Nguy cơ vừa
- Nguy cơ thấp

**Thông tin:** Mã, tên, mô tả tiêu chí phân loại, trạng thái.

---

### STT 13 — Quản lý Nhóm Sản phẩm (Product Groups)

**Chức năng:** CRUD danh mục nhóm sản phẩm thực phẩm theo Thông tư của Bộ Y tế.

**Cấu trúc phân cấp** (2 cấp):
- Nhóm chính: Thịt và sản phẩm thịt, Thủy sản, Rau củ quả, Bánh kẹo, Đồ uống...
- Nhóm phụ: chi tiết hơn

**Thông tin:** Mã, tên, cấp, nhóm cha, mô tả, thứ tự sắp xếp, trạng thái.

---

### STT 14 — Quản lý Loại hình cơ sở (Business Types)

**Chức năng:** CRUD loại hình kinh doanh thực phẩm.

**Dữ liệu chuẩn:**
- Sản xuất thực phẩm
- Kinh doanh thực phẩm
- Dịch vụ ăn uống
- Nhập khẩu thực phẩm
- Xuất khẩu thực phẩm
- Bảo quản thực phẩm
- Vận chuyển thực phẩm

---

### STT 15 — Quản lý Loại hình Quảng cáo (Ad Types)

**Chức năng:** CRUD loại hình quảng cáo thực phẩm.

**Dữ liệu:** Truyền hình, Radio, Báo in, Báo điện tử, Tờ rơi, Banner, Website, Mạng xã hội, Khác.

---

### STT 16 — Quản lý Cơ sở Kiểm nghiệm (Testing Centers)

**Chức năng:** CRUD danh mục cơ sở kiểm nghiệm được chỉ định.

**Thông tin:**
- Tên, mã, địa chỉ (xã/huyện/tỉnh), SĐT, email
- Số chứng chỉ công nhận (ISO 17025 hoặc tương đương)
- Phạm vi kiểm nghiệm (dịch vụ cung cấp)
- Ngày hết hạn chứng nhận
- Trạng thái hoạt động

---

### STT 17 — Quản lý Dịch vụ Kiểm nghiệm (Testing Services)

**Chức năng:** CRUD dịch vụ kiểm nghiệm theo từng cơ sở.

**Thông tin:**
- Tên dịch vụ, mã, mô tả
- Cơ sở kiểm nghiệm (FK)
- Đơn vị kiểm nghiệm, phương pháp (TCVN/ISO)
- Đơn giá, thời gian trả kết quả
- Trạng thái cung cấp

---

### STT 18 — Quản lý Loại Văn bản (Document Types)

**Chức năng:** CRUD danh mục loại văn bản hành chính.

**Dữ liệu:** Thông tư, Nghị định, Quyết định, Công văn, Hướng dẫn, Kế hoạch, Báo cáo, Biên bản, Khác.

---

## NHÓM C — Quản lý ATTP (STT 19–40)

### STT 19 — Quản lý Cơ sở SXKD (Businesses)

**Mô tả:** Quản lý toàn bộ thông tin cơ sở sản xuất kinh doanh thực phẩm trên địa bàn, có hiển thị bản đồ.

**Chức năng chi tiết:**

**19.1 — Danh sách cơ sở:**
- Bảng dữ liệu với cột: Tên, Địa chỉ, Loại hình, Phân loại nguy cơ, Trạng thái, Tình trạng giấy phép
- Tìm kiếm: tên/mã/mã số thuế, địa chỉ
- Lọc: loại hình, phân loại nguy cơ, trạng thái, có/chưa có giấy phép, theo đơn vị quản lý
- Sắp xếp đa cột
- Phân trang
- Export Excel danh sách
- **Hiển thị bản đồ (Leaflet.js)**: các cơ sở theo marker màu theo phân loại nguy cơ

**19.2 — Chi tiết cơ sở:**
- Thông tin cơ bản: tên, mã, mã số thuế, loại hình, phân loại nguy cơ
- Địa chỉ + tọa độ GPS (MapPicker component để chọn trên bản đồ)
- Thông tin liên hệ: SĐT, email, người đại diện
- Nhóm sản phẩm kinh doanh (many-to-many)
- Người trực tiếp kinh doanh (có giấy ATTP)
- Tabs lịch sử: Tự công bố, DKCB, Quảng cáo, DDK, CFS, XK, Thanh kiểm tra, Kiểm nghiệm
- Trạng thái giấy phép đang hiệu lực

**19.3 — Thêm/Sửa cơ sở:**
- Form đầy đủ với validation
- Chọn địa chỉ có bản đồ
- Gán nhóm sản phẩm (checkbox tree)
- Thêm người trực tiếp kinh doanh

**19.4 — Import Excel:**
- Template Excel download
- Upload file
- Validate dữ liệu trước khi insert (báo lỗi từng dòng)
- Preview kết quả import
- Confirm insert

**19.5 — Export Excel + PDF (danh sách, chi tiết)**

**Data scoping:** User chỉ xem/sửa cơ sở trong phạm vi hợp nhất của cây
đơn vị/địa bàn được quản lý và phân công **đầu mối quản lý** còn hiệu lực
(theo địa bàn, cơ sở cụ thể, loại hình cơ sở hoặc nhóm sản phẩm). Phân công
đầu mối không thay đổi `organization_id` sở hữu bản ghi và không tự động cấp
quyền chức năng; cả permission và data scope đều phải thỏa.

---

### STT 20 — Quản lý Sản phẩm (Products)

**Mô tả:** Quản lý danh sách sản phẩm thực phẩm của từng cơ sở.

**Chức năng:**
- Danh sách sản phẩm: lọc theo cơ sở, nhóm sản phẩm, trạng thái
- Tìm kiếm theo tên, mã, thương hiệu, nhà sản xuất
- Thêm/sửa sản phẩm: tên, nhóm SP, thương hiệu, NSX, xuất xứ, thành phần, hạn dùng, BQ, hướng dẫn
- Upload file đính kèm (ảnh sản phẩm, nhãn hàng hóa)
- Liên kết với cơ sở
- Trạng thái sản phẩm (đang kinh doanh/ngừng kinh doanh)

**Ràng buộc sở hữu:** Sản phẩm phải cùng cơ sở và `organization_id` với
quan hệ cơ sở cha. Mọi giấy phép chọn sản phẩm phải chọn sản phẩm của chính
cơ sở trên giấy phép.

---

### STT 21 — Tự công bố sản phẩm (Self Declarations)

**Mô tả:** Quản lý giấy tự công bố sản phẩm (Nghị định 15/2018).

**Chức năng:**
- Danh sách tự công bố: lọc theo cơ sở, sản phẩm, trạng thái, ngày hết hạn
- Cảnh báo sắp hết hạn (30/60/90 ngày)
- Thêm/sửa: số giấy tự công bố, ngày công bố, tên SP, NSX, thông tin sản phẩm
- Upload file tự công bố (PDF)
- Trạng thái: Còn hiệu lực / Hết hạn / Đã thu hồi
- Export danh sách, export theo cơ sở

---

### STT 22 — Đăng ký Công bố Sản phẩm — DKCB (Product Registrations)

**Mô tả:** Quản lý giấy đăng ký công bố sản phẩm (áp dụng cho sản phẩm nhập khẩu, phụ gia, etc.).

**Chức năng:**
- Danh sách DKCB: lọc theo cơ sở, sản phẩm, trạng thái, ngày hết hạn
- Cảnh báo sắp hết hạn
- Thêm/sửa: số đăng ký, số tiếp nhận, ngày đăng ký, ngày tiếp nhận, ngày hết hạn, tên SP, NSX, cơ quan cấp
- Upload file giấy đăng ký
- Tra cứu công khai (portal)
- Export

---

### STT 23 — Đăng ký Nội dung Quảng cáo — DDK Quảng cáo (Ad Registrations)

**Mô tả:** Quản lý xác nhận nội dung quảng cáo thực phẩm.

**Chức năng:**
- Danh sách đăng ký quảng cáo: lọc theo cơ sở, loại hình QC, trạng thái
- Thêm/sửa: số đăng ký, loại hình QC, sản phẩm quảng cáo, phương tiện, nội dung mô tả, ngày cấp/hết hạn
- Upload nội dung quảng cáo (file)
- Cảnh báo hết hạn
- Export

---

### STT 24 — Cấp Giấy Xác nhận Đủ Điều kiện — DDK (Eligibility Certificates)

**Mô tả:** Quản lý giấy xác nhận cơ sở đủ điều kiện ATTP.

**Chức năng:**
- Danh sách DDK: lọc theo cơ sở, trạng thái, ngày hết hạn
- Thêm/sửa: số giấy, ngày cấp, ngày hết hạn, phạm vi chứng nhận, cơ quan cấp
- Upload file giấy chứng nhận
- Cảnh báo hết hạn
- Liên kết với cơ sở
- Tra cứu công khai

---

### STT 25 — Giấy Chứng nhận Lưu hành Tự do — CFS (CFS Certificates)

**Mô tả:** Quản lý giấy chứng nhận lưu hành tự do cho sản phẩm xuất khẩu.

**Chức năng:**
- Danh sách CFS: lọc theo cơ sở, sản phẩm, quốc gia đích, trạng thái
- Thêm/sửa: số giấy, ngày cấp/hết hạn, quốc gia đích, cơ sở, sản phẩm
- Upload file CFS
- Export danh sách

---

### STT 26 — Giấy Chứng nhận Thực phẩm Xuất khẩu (Export Certificates)

**Mô tả:** Quản lý giấy chứng nhận thực phẩm xuất khẩu.

**Chức năng:**
- Danh sách: lọc theo cơ sở, sản phẩm, quốc gia đích, ngày cấp
- Thêm/sửa: số giấy, ngày cấp, lô hàng, số lượng, quốc gia đích
- Upload file chứng nhận
- Export

---

### STT 27 — Kế hoạch Thanh Kiểm tra (Inspection Plans)

**Mô tả:** Lập và quản lý kế hoạch thanh kiểm tra định kỳ/đột xuất.

**Chức năng:**

**27.1 — Danh sách kế hoạch:**
- Tìm kiếm, lọc theo năm, loại hình (định kỳ/đột xuất), trạng thái
- Xem tổng quan tiến độ thực hiện

**27.2 — Tạo kế hoạch:**
- Thông tin chung: tên, mã, loại hình, năm, thời gian, mô tả, mục tiêu
- Danh sách cơ sở cần thanh kiểm tra (chọn từ danh sách cơ sở)
- Phân công cán bộ thanh tra cho từng cơ sở
- Ngày dự kiến thanh tra từng cơ sở
- Upload quyết định thanh tra

**27.3 — Phê duyệt kế hoạch:**
- Trình kế hoạch → Lãnh đạo phê duyệt
- Ghi nhận ý kiến phê duyệt/từ chối

**27.4 — Theo dõi thực hiện:**
- Theo dõi tiến độ từng cơ sở trong kế hoạch
- Cập nhật trạng thái từng item

**Trạng thái:** Draft → Approved → InProgress → Completed | Cancelled

---

### STT 28 — Kết quả Thanh Kiểm tra (Inspection Results)

**Mô tả:** Ghi nhận kết quả thanh kiểm tra từng cơ sở.

**Chức năng:**
- Danh sách kết quả: lọc theo cơ sở, kế hoạch, ngày, kết quả (đạt/không đạt)
- Tạo kết quả (gắn với kế hoạch hoặc độc lập):
  - Ngày thanh tra, loại hình thanh tra
  - Thành phần đoàn thanh tra
  - Nội dung kiểm tra (checklist theo quy định)
  - Kết quả: Đạt / Không đạt / Đạt có điều kiện
  - Các vi phạm phát hiện (danh sách, ghi theo điều khoản)
  - Số tiền phạt, số quyết định xử phạt
  - Yêu cầu khắc phục và hạn khắc phục
- Upload biên bản, quyết định xử phạt
- Theo dõi khắc phục vi phạm
- Export biên bản (PDF)

---

### STT 29 — Cảnh báo VSATTP (ATTP Alerts)

**Mô tả:** Quản lý cảnh báo an toàn vệ sinh thực phẩm từ nhiều nguồn.

**Chức năng:**
- Danh sách cảnh báo: lọc theo loại, mức độ, nguồn, trạng thái
- Tạo cảnh báo nội bộ:
  - Tiêu đề, nội dung, loại cảnh báo, mức độ (Thấp/Vừa/Cao/Nghiêm trọng)
  - Sản phẩm/khu vực liên quan
  - Cơ sở liên quan (nếu có)
  - Upload tài liệu đính kèm
- Phê duyệt cảnh báo từ dân (public submissions — STT 49)
- Xuất bản / Thu hồi cảnh báo
- Đăng cảnh báo lên cổng công khai
- Chia sẻ với Bộ Y tế (Module F)
- Export

**Trạng thái:** Draft → Published → Recalled  
**Nguồn:** Nội bộ / Từ dân / Từ hệ thống ngoài

---

### STT 30 — Tin tức, Hoạt động ATTP (News)

**Mô tả:** Quản lý tin tức và hoạt động liên quan ATTP để đăng lên cổng công khai.

**Chức năng:**
- Danh sách tin: lọc theo chuyên mục, trạng thái, ngày đăng
- Soạn thảo tin (rich text editor với ảnh/video embed)
- Gán chuyên mục, thẻ (tags)
- Liên kết với cảnh báo ATTP
- Đăng/Thu hồi tin
- Thống kê lượt xem
- Export

**Trạng thái:** Draft → Published → Recalled

---

### STT 31 — Ca Ngộ độc nhỏ lẻ (Food Poisoning Cases)

**Mô tả:** Ghi nhận và theo dõi ca ngộ độc thực phẩm riêng lẻ.

**Chức năng:**
- Danh sách ca ngộ độc: tìm kiếm, lọc theo thời gian, địa bàn, kết quả
- Nhập ca ngộ độc:
  - Thông tin nạn nhân: họ tên, tuổi, giới tính, SĐT, địa chỉ
  - Thời điểm, địa điểm xảy ra (chọn bản đồ)
  - Thực phẩm nghi ngờ, nguồn thực phẩm
  - Triệu chứng, thời gian khởi phát
  - Cơ sở điều trị, kết quả điều trị
  - Người báo cáo (tên, SĐT, tổ chức, mối quan hệ)
- Xác minh ca ngộ độc (cán bộ cấp trên xác minh)
- Ghi nhận phiếu sai sót (sau khi đã Verified, nếu cần sửa)
- Xuất báo cáo ca

**Trạng thái:** Draft → Reported → Verified  
**Sau Verified:** Chỉ được tạo Phiếu Sai sót, không sửa trực tiếp

---

### STT 32 — Vụ Ngộ độc Thực phẩm (Food Poisoning Incidents)

**Mô tả:** Ghi nhận và điều tra vụ ngộ độc nhiều người (≥2 người cùng nguồn).

**Chức năng:**
- Danh sách vụ ngộ độc: tìm kiếm, lọc theo thời gian, địa bàn, mức độ
- Nhập vụ ngộ độc:
  - Thời gian, địa điểm (bản đồ)
  - Số người phơi nhiễm, số mắc, số nhập viện, số tử vong
  - Thực phẩm nghi ngờ, loại hình dịch vụ ăn uống
  - Triệu chứng chung
  - Đoàn điều tra
  - Tác nhân gây bệnh (sau điều tra)
  - Biện pháp xử lý, phòng chống
  - Kết luận điều tra
- Xác minh vụ ngộ độc → Kết thúc điều tra (Concluded)
- Phiếu kết thúc điều tra
- Phiếu sai sót (nếu cần)
- Liên kết bản đồ (Leaflet) vị trí vụ ngộ độc
- Thống kê vụ ngộ độc trên bản đồ

**Trạng thái:** Draft → Reported → Verified → Concluded

---

### STT 33 — Báo cáo Ngộ độc Thực phẩm — NĐTP (NDTP Reports, monthly)

**Mô tả:** Báo cáo tổng hợp tình hình ngộ độc thực phẩm theo tháng, gửi lên cấp trên.

**Chức năng:**
- Tổng hợp số liệu tự động từ ca/vụ ngộ độc trong kỳ
- Chỉnh sửa số liệu tổng hợp (nếu cần)
- Nhập nội dung tường thuật: biện pháp phòng chống, yếu tố nguy cơ, kiến nghị
- Nộp báo cáo (Submit)
- Theo dõi trạng thái xác minh từ cấp trên
- Nhận phiếu thông báo sai sót → Sửa → Nộp lại

**Workflow State Machine:**  
`Draft → Submitted → Verified → Returned → (Draft lại) → Submitted → Completed`

**Submission evidence:** Mỗi lần Submit tạo một snapshot bất biến gồm toàn bộ
nội dung báo cáo, phiên bản, đơn vị gửi, đơn vị nhận, người/thời điểm gửi và
SHA-256. Header báo cáo chỉ giữ workflow hiện tại; không dùng header đã chỉnh
sửa để tái dựng nội dung của lần gửi trước.

**Dữ liệu báo cáo:**
- Số ca ngộ độc: tổng số, số mắc, số nhập viện, số tử vong
- Số vụ ngộ độc: tổng số, số mắc, số nhập viện, số tử vong
- Biện pháp phòng chống đã triển khai
- Yếu tố nguy cơ phát hiện
- Kiến nghị, đề xuất

---

### STT 34 — Báo cáo Công tác ATTP (ATTP Work Reports, 6 tháng + năm)

**Mô tả:** Báo cáo tổng kết công tác ATTP 6 tháng đầu năm và cả năm.

**Chức năng:**
- Loại báo cáo: 6 tháng đầu năm | Cả năm
- Tổng hợp số liệu tự động từ hệ thống
- Chỉnh sửa số liệu và nhập nội dung tường thuật
- Workflow giống NĐTP Report
- Export PDF (theo mẫu chuẩn)

Mỗi lần gửi áp dụng cùng quy tắc snapshot bất biến và đơn vị nhận như STT 33.

**Nội dung báo cáo:**
- Tổng quan tình hình cơ sở SXKD
- Kết quả cấp phép, chứng nhận
- Kết quả thanh kiểm tra
- Tình hình ngộ độc thực phẩm
- Công tác truyền thông, tập huấn
- Văn bản ban hành
- Kết quả kiểm nghiệm
- Đánh giá, tồn tại, giải pháp
- Kế hoạch kỳ tiếp theo

---

### STT 35 — Báo cáo Tháng Hành động ATTP (Action Month Reports, yearly)

**Mô tả:** Báo cáo kết quả Tháng hành động vì an toàn thực phẩm (tháng 4-5 hàng năm).

**Chức năng:**
- Báo cáo theo năm
- Nhập chủ đề, thời gian tháng hành động
- Số liệu: truyền thông, tập huấn, thanh kiểm tra, tự công bố trong tháng hành động
- Đánh giá: kết quả, tồn tại, bài học kinh nghiệm, kiến nghị
- Workflow giống NĐTP Report
- Export PDF

Mỗi lần gửi áp dụng cùng quy tắc snapshot bất biến và đơn vị nhận như STT 33.

---

### STT 36 — Phân tích Mối nguy cơ (Risk Analysis)

**Mô tả:** Quản lý tài liệu phân tích mối nguy cơ ATTP, công bố lên cổng công khai.

**Chức năng:**
- Danh sách phân tích: lọc theo chuyên mục, mức độ nguy cơ, trạng thái
- Tạo phân tích: tiêu đề, chuyên mục, nội dung, mức độ (Thấp/Vừa/Cao/Nghiêm trọng)
- Sản phẩm/nhóm sản phẩm liên quan
- Bằng chứng, khuyến nghị
- Xuất bản lên cổng công khai

**Trạng thái:** Draft → Published

---

### STT 37 — Kết quả Kiểm nghiệm (Testing Results)

**Mô tả:** Ghi nhận kết quả kiểm nghiệm mẫu thực phẩm.

**Chức năng:**
- Danh sách kết quả: lọc theo cơ sở, sản phẩm, cơ sở kiểm nghiệm, kết quả
- Nhập kết quả:
  - Mã mẫu, tên mẫu, mô tả
  - Cơ sở kiểm nghiệm, dịch vụ kiểm nghiệm
  - Cơ sở lấy mẫu, sản phẩm (nếu có)
  - Ngày lấy mẫu, ngày nộp, ngày có kết quả
  - Kết quả: Đạt / Không đạt / Có điều kiện
  - Chỉ tiêu không đạt (nếu có)
  - Số phiếu kiểm nghiệm
  - Liên kết với thanh kiểm tra (nếu là mẫu lấy trong TKT)
- Upload phiếu kiểm nghiệm (PDF)
- Export

---

### STT 38 — Quản lý Văn bản (Documents)

**Mô tả:** Quản lý văn bản chỉ đạo, điều hành liên quan ATTP.

**Chức năng:**
- Danh sách văn bản: tìm kiếm, lọc theo loại VB, cơ quan ban hành, ngày
- Thêm văn bản: loại VB, số VB, tiêu đề, cơ quan ban hành, ngày ban hành/hiệu lực/hết hiệu lực
- Upload file PDF
- Đánh dấu công khai (hiển thị trên cổng)
- Tra cứu văn bản (full-text search)
- Export

---

### STT 39 — Dashboard Thống kê tổng hợp

**Mô tả:** Bảng tổng hợp các chỉ số quan trọng theo thời gian thực, lọc theo đơn vị và kỳ.

**Widget dự kiến:**
- Tổng số cơ sở SXKD (có bản đồ phân bố)
- Cơ sở có giấy phép hợp lệ / sắp hết hạn / đã hết hạn
- Số ca/vụ ngộ độc trong tháng, quý, năm (biểu đồ đường)
- Kết quả thanh kiểm tra: số cơ sở thanh tra, tỷ lệ đạt (biểu đồ tròn)
- Cảnh báo đang hiệu lực (badge)
- Báo cáo chờ xử lý (chờ xác minh)
- Tin tức mới nhất

**Lọc dashboard:**
- Theo đơn vị (cấp tỉnh xem tất cả, cấp huyện xem huyện mình, etc.)
- Theo kỳ: tháng, quý, năm, tùy chọn khoảng

---

### STT 40 — Thống kê Báo cáo (Statistics)

**Mô tả:** Báo cáo thống kê nâng cao với biểu đồ xuất được.

**Chức năng:**
- Thống kê cơ sở theo: loại hình, phân loại nguy cơ, địa bàn
- Thống kê giấy phép: đang hiệu lực / sắp hết hạn / đã hết hạn theo loại
- Thống kê thanh kiểm tra: số lần, kết quả, vi phạm, tiền phạt theo kỳ
- Thống kê ngộ độc: theo tháng/quý/năm, theo địa bàn, theo nguyên nhân
- Biểu đồ: cột, đường, tròn (Ant Design Charts)
- Filter: đơn vị, kỳ thời gian
- Export biểu đồ ra PNG/PDF
- Export số liệu ra Excel

---

## NHÓM E — Cổng Thông tin Công khai (STT 41–49)

*Không yêu cầu đăng nhập — giao diện riêng, responsive.*

### STT 41 — Tra cứu Cơ sở SXKD (Public Business Lookup)

- Tìm kiếm theo tên, địa chỉ, loại hình
- Hiển thị thông tin cơ bản (địa chỉ, loại hình, trạng thái giấy phép hiệu lực)
- Bản đồ phân bố cơ sở (Leaflet)
- Phân trang kết quả

---

### STT 42 — Tra cứu Sản phẩm (Public Product Lookup)

- Tìm kiếm theo tên sản phẩm, thương hiệu, NSX
- Xem thông tin: tên, thành phần, hạn dùng, xuất xứ
- Liên kết đến cơ sở sở hữu sản phẩm

---

### STT 43 — Tra cứu Giấy phép (Public License Lookup)

- Tra cứu tất cả loại giấy phép: DKCB, Tự công bố, Quảng cáo, DDK, CFS, XK
- Tìm kiếm theo số giấy phép, tên cơ sở, tên sản phẩm
- Xem thông tin hiệu lực (số giấy, ngày cấp, hết hạn, trạng thái)

---

### STT 44 — Tra cứu Kết quả Kiểm nghiệm (Public Testing Results)

- Tìm kiếm theo tên mẫu, cơ sở, thời gian
- Xem kết quả kiểm nghiệm công khai
- Download phiếu kiểm nghiệm (nếu public)

---

### STT 45 — Tra cứu Kết quả Thanh Kiểm tra (Public Inspection Lookup)

- Tra cứu kết quả thanh kiểm tra theo cơ sở, thời gian
- Xem vi phạm phát hiện (nếu được phép công khai)

---

### STT 46 — Tra cứu Cảnh báo VSATTP (Public Alert Lookup)

- Danh sách cảnh báo đang hiệu lực
- Tìm kiếm, lọc theo loại, mức độ
- Xem chi tiết cảnh báo

---

### STT 47 — Tra cứu Phân tích Mối nguy cơ (Public Risk Analysis)

- Danh sách phân tích nguy cơ công khai
- Tìm kiếm theo chuyên mục, mức độ
- Xem nội dung đầy đủ

---

### STT 48 — Tra cứu Tin tức, Hoạt động ATTP (Public News)

- Danh sách tin tức công khai
- Lọc theo chuyên mục
- Xem chi tiết tin

---

### STT 49 — Gửi Phản ánh Cảnh báo (Public Alert Submission)

**Mô tả:** Cho phép người dân gửi phản ánh về vấn đề ATTP.

**Chức năng:**
- Form gửi phản ánh (CAPTCHA bắt buộc)
- Thông tin người gửi (không bắt buộc điền đủ): tên, SĐT, email
- Mô tả vấn đề, thực phẩm liên quan, địa điểm, thời gian
- Upload ảnh/video chứng minh
- Gửi → Nhận mã tra cứu trạng thái
- Tra cứu trạng thái phản ánh (theo mã)
- **Phía nội bộ:** Phân công xử lý → Xác minh → Chuyển thành Cảnh báo hoặc Bác bỏ

---

## NHÓM F — Tích hợp Dữ liệu (STT 50–57)

### STT 50 — Quản lý Đặc tả API (API Spec Management)

**Mô tả:** Quản lý thông tin API tích hợp với các hệ thống ngoài.

**Chức năng:**
- Danh sách API: lọc theo đối tác, loại dữ liệu, trạng thái
- Thêm/sửa đặc tả API:
  - Tên API, mã, phiên bản
  - Hệ thống đối tác (Bộ Y tế / Sở NN / Sở CT / Khác)
  - Base URL, loại dữ liệu (Cảnh báo/KTK/NĐTP/Giấy phép/Sản phẩm/Tin tức/Cơ sở)
  - Hướng giao tiếp: Gửi đi / Nhận về / Hai chiều
  - Loại xác thực: API Key / OAuth 2.0 / Basic / Không
  - Thông tin xác thực (lưu encrypted)
- Upload file đặc tả OpenAPI/Swagger
- Kiểm tra kết nối (Test Connection)
- Kích hoạt/vô hiệu hóa

**Tuân thủ:** Thông tư 31/2026/TT-BCT về chia sẻ dữ liệu

---

### STT 51 — Lịch sử Chia sẻ Cảnh báo (Alert Sharing History)

**Mô tả:** Lịch sử gửi/nhận dữ liệu cảnh báo VSATTP với hệ thống ngoài.

---

### STT 52 — Lịch sử Chia sẻ Kết quả Thanh kiểm tra (Inspection Result Sharing)

**Mô tả:** Lịch sử gửi/nhận dữ liệu kết quả thanh kiểm tra.

---

### STT 53 — Lịch sử Chia sẻ Ngộ độc Thực phẩm (Food Poisoning Sharing)

**Mô tả:** Lịch sử gửi/nhận dữ liệu ngộ độc thực phẩm với Bộ Y tế.

---

### STT 54 — Lịch sử Chia sẻ Giấy phép (License Sharing)

**Mô tả:** Lịch sử gửi/nhận dữ liệu giấy phép (DKCB, CFS, DDK, XK).

---

### STT 55 — Lịch sử Chia sẻ Sản phẩm (Product Sharing)

**Mô tả:** Lịch sử gửi/nhận dữ liệu sản phẩm với Sở NN, Sở CT.

---

### STT 56 — Lịch sử Chia sẻ Tin tức (News Sharing)

**Mô tả:** Lịch sử gửi/nhận tin tức, hoạt động ATTP.

---

### STT 57 — Lịch sử Chia sẻ Cơ sở (Business Sharing)

**Mô tả:** Lịch sử gửi/nhận dữ liệu cơ sở SXKD.

**Chức năng chung cho STT 51–57:**
- Danh sách lịch sử chia sẻ (mỗi loại dữ liệu có màn hình riêng)
- Tìm kiếm, lọc: đối tác, thời gian, kết quả (thành công/thất bại), hướng (gửi/nhận)
- Xem chi tiết: request payload, response, thời gian, mã lỗi (nếu thất bại)
- Thử lại (Retry) giao tiếp thất bại
- Export lịch sử ra Excel

**Lịch sử attempt:** Một lần giao tiếp logic là một envelope. Lần gửi/nhận ban
đầu và từng retry là các attempt bất biến riêng, lưu số lần, endpoint, thời
điểm bắt đầu/kết thúc, request/response, checksum, outcome và lỗi. Retry không
được ghi đè bằng chứng của attempt trước.

---

## Tổng kết chức năng theo Bounded Context

| Bounded Context | STT | Số màn hình ước tính |
|----------------|-----|----------------------|
| Organizations (Admin) | 1, 2, 3, 4, 5, 6, 7 | 12 |
| Catalogs | 8–18 | 22 |
| BusinessManagement | 19, 20, 21 | 8 |
| Licensing | 22–26 | 15 |
| Inspection | 27, 28 | 8 |
| FoodPoisoning | 31, 32 | 6 |
| Reporting | 33, 34, 35 | 9 |
| AlertsAndTesting | 29, 30, 36, 37, 38, 39, 40 | 14 |
| PublicPortal | 41–49 | 10 |
| DataIntegration | 50–57 | 10 |
| **Tổng** | | **~114 màn hình** |
