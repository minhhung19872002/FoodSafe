# 63 — Đối chiếu YCKT gốc (Mẫu số 03) với docs/01-functional-requirements.md

> Ngày đối chiếu: 27/07/2026
> Nguồn gốc: `docs/Mẫu số 03. YCKT (1).pdf` (42 trang, trích text bằng pypdf)
> Tài liệu được đối chiếu: `docs/01-functional-requirements.md`, kiểm tra nhanh `docs/07-non-functional-requirements.md`
> Kết luận tổng quát: **Đủ 57/57 STT ở cấp mục. 1 chức năng bị diễn giải sai nội dung (STT 5), 1 lệch mô hình phân cấp cần xác nhận, ~10 điểm thiếu chi tiết, một số chức năng doc tự thêm ngoài phạm vi YCKT, và nhiều yêu cầu phi chức năng cụ thể chưa được tài liệu hóa.**

---

## 1. SAI NỘI DUNG — mức độ: Cao

### F-01. STT 5 bị diễn giải sai hoàn toàn

- **YCKT:** STT 5 = **"Quản lý truy cập"** — chức năng self-service của người dùng:
  - Đăng nhập / Đăng xuất
  - Đổi mật khẩu
  - Chỉnh sửa thông tin tài khoản
  - **Thay đổi ảnh đại diện**
- **Doc 01:** ghi thành "Quản lý Phân quyền (Access Management)" — cây phân quyền, ma trận vai trò × chức năng.
- **Ghi chú:** Việc đặt/phân quyền trong YCKT đã nằm ở STT 1 (Đặt các quyền cho vai trò, Phân quyền vai trò người dùng) và STT 7 (Phân quyền tài khoản). Hệ quả của diễn giải sai: nhóm chức năng hồ sơ cá nhân (profile, avatar, tự đổi mật khẩu) **không được tài liệu hóa ở bất kỳ đâu**.
- **Đề xuất:** Sửa doc 01 STT 5 về đúng nội dung "Quản lý truy cập"; giữ nội dung cây phân quyền như một mục thiết kế bổ sung (không gắn STT).

---

## 2. LỆCH MÔ HÌNH PHÂN CẤP — mức độ: Cao, cần xác nhận với chủ đầu tư

### F-02. YCKT chỉ mô tả 2 tuyến quản lý, không có cấp huyện

- **YCKT:**
  - STT 11 chỉ có **"Danh mục xã"** — không tồn tại danh mục huyện/quận (phù hợp mô hình chính quyền địa phương 2 cấp sau sáp nhập 2025).
  - STT 33: "Cán bộ tuyến xã… Cán bộ tuyến Thành phố/TP" — chỉ 2 tuyến báo cáo.
  - STT 32: phiếu kết thúc do "người dùng thuộc cấp Tỉnh/TP" nhập.
  - STT 39: "thống kê theo các cấp quản lý, cấp Tỉnh/TP, Cấp xã".
- **Doc 01 + CLAUDE.md:** thiết kế 3 cấp Tỉnh → Huyện/TP → Xã/Phường, thêm danh mục Huyện/Quận (STT 11 của doc), cơ cấu 1 + 13 + >200 đơn vị.
- **Ảnh hưởng:** toàn bộ data scoping, cây tổ chức, luồng gửi/xác minh báo cáo.
- **Đề xuất:** xác nhận lại với Chi cục; nếu giữ 3 cấp phải có văn bản làm rõ, nếu 2 cấp phải điều chỉnh docs 01/02/03 và seed dữ liệu tổ chức.

### F-03. Nhóm D trong YCKT bị gộp vào nhóm C

- **YCKT:** có nhóm **D — "Quản lý thông tin giấy phép đã được cấp"** bao trùm STT 22–26, kèm yêu cầu chung: biểu mẫu giấy phép theo Nghị định 15/2018/NĐ-CP, phân quyền dữ liệu theo địa bàn hoặc đầu mối quản lý.
- **Doc 01:** gộp 22–26 vào nhóm C (bảng tổng quan ghi nhóm A, B, C, E, F).
- **Mức độ:** thấp — chỉ khác trình bày, nhưng nên ghi lại yêu cầu chung của nhóm D (biểu mẫu theo NĐ 15/2018) vì hiện chưa xuất hiện trong doc.

---

## 3. CHỨC NĂNG YCKT YÊU CẦU NHƯNG DOC 01 THIẾU — mức độ: Trung bình

| # | STT | Nội dung thiếu |
|---|-----|----------------|
| F-04 | 4 | Thay đổi **màn hình đăng nhập**; cấu hình **thông tin trang chủ** |
| F-05 | 19 | Thao tác **"Xác nhận cơ sở đủ điều kiện sản xuất, kinh doanh thực phẩm"** và **"Xác nhận cơ sở đã nộp bản cam kết đảm bảo vệ sinh ATTP"** — "bản cam kết" là loại giấy tờ riêng (cơ sở nhỏ lẻ không thuộc diện cấp DDK), doc chưa có khái niệm này |
| F-06 | 20 | **Import sản phẩm từ file Excel** ("Thêm mới từ danh sách excel") và **Xuất danh sách excel** sản phẩm |
| F-07 | 30 | **Duyệt tin tức do người dân gửi lên** — YCKT có luồng người dân gửi tin tức (không chỉ gửi cảnh báo như STT 48/49) |
| F-08 | 32 | Ràng buộc **chỉ người dùng cấp Tỉnh/TP được nhập phiếu kết thúc** vụ ngộ độc |
| F-09 | 36 | Phạm vi YCKT rộng hơn: quản lý **danh sách nhóm nguy cơ, danh sách nguy cơ, dự báo nguy cơ**, quản lý thông tin xét nghiệm/kiểm nghiệm phục vụ phân tích (Điều 47 Luật ATTP 55/2010/QH12); doc rút gọn thành "bài phân tích để công bố" |
| F-10 | 39 | Widget **tình hình thực hiện báo cáo của các đơn vị** (đơn vị nào đã/chưa nộp: NĐTP, công tác ATTP, tháng hành động); chức năng **Lưu/Tải số liệu và biểu đồ** từ dashboard |
| F-11 | 41–47 (E) | Với từng loại giấy tra cứu công khai, YCKT yêu cầu **"Xem giấy chứng nhận"** và **"In/Tải giấy chứng nhận"** — doc chưa ghi rõ việc xem/tải file giấy phép trên cổng công khai |
| F-12 | 45 (PDF) | **Tra cứu danh sách cơ sở bị cảnh báo** mất VSATTP (góc nhìn theo cơ sở) — doc 46 chỉ là tra cứu cảnh báo chung |
| F-13 | 49 (PDF) | **Tra cứu văn bản pháp luật về VSATTP trên cổng công khai** — nhóm E của doc hoàn toàn không có mục này (STT 38 nội bộ mới chỉ có cờ "đánh dấu công khai") |
| F-14 | 50 | **Xuất danh sách API** ra file |

---

## 4. DOC 01 TỰ THÊM NGOÀI PHẠM VI YCKT — mức độ: Cần quyết định scope

### F-15. Chức năng công khai không có trong YCKT

- **Tra cứu công khai kết quả kiểm nghiệm** (doc STT 44) — YCKT không yêu cầu.
- **Tra cứu công khai kết quả thanh kiểm tra** (doc STT 45) — YCKT không yêu cầu; công khai kết quả thanh tra/vi phạm có rủi ro pháp lý, cần văn bản chấp thuận của chủ đầu tư.
- **Tra cứu công khai đăng ký quảng cáo** (FE có `PublicAdRegistrationLookupPage`) — YCKT không yêu cầu tra cứu QC công khai.
- Nhóm E của YCKT thực tế gồm: tra cứu chung (cơ sở + sản phẩm), DDK, tự công bố, DKCB, cơ sở bị cảnh báo, CFS, XK, cảnh báo (xem + gửi), văn bản.

### F-16. Mở rộng thiết kế hợp lý (giữ được, nhưng là phần thêm, không phải nghĩa vụ hợp đồng)

- Cảnh báo giấy phép sắp hết hạn 30/60/90 ngày (STT 4, 21, 22, 23, 24).
- Workflow phê duyệt kế hoạch thanh kiểm tra (Draft → Approved → …) — YCKT chỉ yêu cầu tạo/cập nhật/upload tài liệu.
- Bản đồ Leaflet ở danh sách cơ sở (YCKT chỉ yêu cầu "chọn vị trí cơ sở trên bản đồ" khi nhập).
- Mã tra cứu trạng thái phản ánh của người dân.
- Retry + export Excel cho lịch sử chia sẻ dữ liệu (STT 51–57).
- Snapshot bất biến + SHA-256 cho mỗi lần gửi báo cáo.
- CAPTCHA cho form phản ánh công khai (đây thực ra là yêu cầu phi chức năng mục 3.1 của YCKT — hợp lệ).

---

## 5. YÊU CẦU PHI CHỨC NĂNG TRONG YCKT CHƯA ĐƯỢC TÀI LIỆU HÓA (kiểm tra nhanh doc 07) — mức độ: Trung bình–Cao

### F-17. Xác thực & mật khẩu (YCKT mục 3.1)

- Link reset/quên mật khẩu phải **mất hiệu lực sau lần truy cập đầu tiên hoặc sau 8 giờ**.
- Mật khẩu gửi qua email khi reset phải **sinh ngẫu nhiên** theo chính sách mật khẩu mạnh.
- Hash mật khẩu: YCKT khuyến nghị SHA-256/SHA-512 + salt ngẫu nhiên duy nhất mỗi user — ABP Identity dùng PBKDF2 (mạnh hơn); cần **ghi chú tương đương** trong tài liệu để phục vụ nghiệm thu.
- Username chỉ chứa chữ cái, chữ số, gạch dưới; là duy nhất.

### F-18. Input/output security (YCKT mục 3.1)

- Lọc ký tự `\n`, `\r` khi dữ liệu client xuất hiện trong Response header (chống HTTP Response splitting).
- Chống XML injection / XXE: tắt external entity resolve và remote doctype của XML parser.
- Whitelist URI khi chuyển hướng/chuyển tiếp.
- Không lưu dữ liệu nhạy cảm trên cookie; nếu buộc phải lưu thì mã hóa đối xứng mạnh, key giữ ở server.

### F-19. Xử lý ngoại lệ & log ứng dụng (YCKT mục 3.1)

- Try-catch trả thông báo lỗi chung đã custom, không lộ thông tin nhạy cảm; cấu hình error page.
- File log đặt **ngoài thư mục web**; không ghi log dữ liệu nhạy cảm (sessionId, thông tin người dùng).

### F-20. An toàn thông tin CSDL (YCKT mục 3.2 — toàn bộ mục chưa được tài liệu hóa)

- Ứng dụng dùng **tài khoản DB riêng, quyền tối thiểu**, không dùng tài khoản quản trị.
- Credential kết nối DB **mã hóa** trong file cấu hình (key + thuật toán chỉ ứng dụng có).
- Mật khẩu quản trị CSDL đổi tối đa 3 tháng, không trùng 5 mật khẩu gần nhất.
- **Giới hạn IP** được phép kết nối CSDL.
- Mã hóa dữ liệu lưu trữ và trên đường truyền; **Data Redaction/Masking** dữ liệu nhạy cảm; kiểm soát tài khoản đặc quyền (Privileged User Controls).
- Giải pháp giám sát truy cập CSDL của **bên thứ 3 độc lập** (Activity Monitoring / Database Firewall), cảnh báo thời gian thực, báo cáo định kỳ.
- Log audit đăng nhập CSDL (thành công + thất bại); lưu 3 tháng tại chỗ, log quan trọng đẩy lưu trữ tập trung **tối thiểu 6 tháng**.

### F-21. Hiệu năng (YCKT mục 2.5)

- Đã có: phản hồi trung bình <10s, chậm nhất <30s, ≥30 truy cập đồng thời, CPU ≤75%.
- Thiếu: **số người dùng hoạt động đồng thời ≥ 1/6 số truy cập đồng thời** (≥5 active users thao tác thực).
- CPU ≤75% áp dụng riêng cho **cả máy chủ dữ liệu và máy chủ ứng dụng**.

### F-22. IPv6/DNS (YCKT mục 2.6)

- Đã có IPv6 listener; thiếu: **bản ghi AAAA** trên DNS hosting, máy chủ DNS hỗ trợ IPv6, **DNSSEC**.

### F-23. Vận hành, hỗ trợ, đào tạo, chuyển giao (YCKT mục 3.3, 3.6, 3.8, 3.9)

- Hỗ trợ **24x7**, khắc phục sự cố trong **48 giờ**, **≥2 kênh** tiếp nhận (điện thoại/email/tại chỗ), giải pháp đảm bảo liên tục trong thời gian khắc phục.
- Đào tạo: **1 lớp / 1 ngày / 120 học viên** (mỗi xã/phường 2 cán bộ), trực tiếp hoặc trực tuyến.
- Sở hữu dữ liệu thuộc bên thuê; chuyển giao đầy đủ dữ liệu dạng truy xuất được khi kết thúc hợp đồng; nhà cung cấp do pháp nhân/thể nhân Việt Nam nắm quyền kiểm soát chi phối.

### F-24. Định dạng dữ liệu (YCKT mục 3.5)

- Năm 4 chữ số, hiển thị dd/mm/yyyy.
- Tiền tệ VND: **≥15 chữ số nguyên + 2 chữ số thập phân** (cần đối chiếu kiểu cột `numeric` trong schema).
- Định dạng tập tin nhập/xuất/lưu trữ tuân thủ **Thông tư 39/2017/TT-BTTTT** (áp dụng cả chuẩn nội dung web).

### F-25. Nghiệm thu (YCKT mục 5)

- Nghiệm thu theo Nghị định 224/2026/NĐ-CP; kiểm tra chức năng, tích hợp, hiệu năng, ATTT, **tài liệu hướng dẫn sử dụng + tài liệu quản trị hệ thống** — 2 tài liệu này là sản phẩm bàn giao bắt buộc, chưa thấy trong docs.

---

## 6. Ghi chú khác

- Tiêu đề STT 27 trong PDF bị lỗi soạn thảo ("Làm mới thông tin danh sách chứng nhận lưu hành tự do") nhưng nội dung thực là Kế hoạch thanh kiểm tra — doc 01 đã hiểu đúng, không phải lỗi.
- YCKT nhóm E STT 41 gộp tra cứu cơ sở + sản phẩm thành "Tra cứu thông tin chung"; doc tách thành 41/42 — chấp nhận được, chỉ lệch cách đánh số so với YCKT (toàn bộ nhóm E của doc lệch số so với PDF, cần bảng ánh xạ khi làm hồ sơ nghiệm thu).

## 7. Bảng ánh xạ nhóm E (YCKT ↔ doc 01)

| YCKT | Nội dung YCKT | Doc 01 tương ứng |
|------|---------------|------------------|
| 41 | Tra cứu chung (cơ sở + sản phẩm) | 41 + 42 |
| 42 | Tra cứu cơ sở được cấp GCN đủ điều kiện | 43 (một phần) |
| 43 | Tra cứu sản phẩm tự công bố | 43 (một phần) |
| 44 | Tra cứu sản phẩm được cấp giấy tiếp nhận ĐKCB | 43 (một phần) |
| 45 | Tra cứu cơ sở bị cảnh báo | 46 (một phần — thiếu góc nhìn theo cơ sở) |
| 46 | Tra cứu CFS | 43 (một phần) |
| 47 | Tra cứu giấy chứng nhận thực phẩm xuất khẩu | 43 (một phần) |
| 48 | Xem tin cảnh báo + Gửi cảnh báo từ dân | 46 + 49 |
| 49 | Tra cứu văn bản pháp luật | **Không có** (F-13) |
| — | (doc thêm) Tra cứu kết quả kiểm nghiệm | 44 — ngoài YCKT (F-15) |
| — | (doc thêm) Tra cứu kết quả thanh kiểm tra | 45 — ngoài YCKT (F-15) |
| — | (doc thêm) Tra cứu phân tích nguy cơ | 47 — suy ra từ STT 36 (công bố lên cổng), chấp nhận được |
| — | (doc thêm) Tra cứu tin tức | 48 — suy ra từ STT 30 (công bố cho dân), chấp nhận được |

---

## 8. Hành động đề xuất (ưu tiên giảm dần)

1. **F-02**: Xác nhận mô hình 2 cấp hay 3 cấp với Chi cục — chặn mọi thiết kế data scope.
2. **F-01**: Sửa doc 01 STT 5 về "Quản lý truy cập"; bổ sung tài liệu cho profile/avatar/đổi mật khẩu.
3. **F-13, F-11, F-12**: Bổ sung tra cứu văn bản công khai; xem/in/tải giấy chứng nhận công khai; góc nhìn cơ sở bị cảnh báo.
4. **F-05, F-06, F-07, F-08, F-09, F-10**: Bổ sung các chức năng thiếu vào doc 01 và backlog.
5. **F-15**: Trình chủ đầu tư quyết định giữ/bỏ các trang tra cứu công khai ngoài YCKT (đặc biệt kết quả thanh kiểm tra).
6. **F-17 → F-25**: Bổ sung doc 07 (hoặc tách tài liệu tuân thủ riêng) cho toàn bộ NFR còn thiếu; lập bảng truy vết YCKT ↔ docs phục vụ nghiệm thu theo NĐ 224/2026/NĐ-CP.
