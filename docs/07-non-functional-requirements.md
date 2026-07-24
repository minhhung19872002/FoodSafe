# Yêu cầu Phi Chức năng — FoodSafe

> Hệ thống thông tin cấp độ 2 theo Nghị định 85/2016/NĐ-CP

---

## 1. Hiệu năng (Performance)

| Chỉ tiêu | Yêu cầu | Ghi chú |
|----------|---------|---------|
| Response time (luồng chính) | < 10 giây (trung bình) | API thông thường |
| Response time (chậm nhất) | < 30 giây | Export PDF, báo cáo phức tạp |
| Concurrent users | ≥ 30 | Đồng thời |
| CPU server | ≤ 75% trung bình | Trên production |
| Database query | < 2 giây | P95 |

### Kỹ thuật đảm bảo:
- **Redis caching**: Danh sách danh mục, session, cached dashboard stats
- **Pagination**: Mọi danh sách đều phân trang (default 20 records)
- **Database indexes**: Đã thiết kế đầy đủ trong schema
- **Background jobs (Hangfire)**: Export lớn, email notifications, data sync
- **Response compression**: Brotli + Gzip (đã config trong HttpApiHostModule)
- **EF Core**: `AsNoTracking()` cho read-only queries
- **Avoid N+1**: Dùng `Include()` hoặc custom SQL cho related data

---

## 2. Bảo mật (Security — ATTT Cấp độ 2)

### 2.1 Xác thực & Phân quyền

| Yêu cầu | Giải pháp |
|---------|-----------|
| Xác thực | OpenIddict (OAuth 2.0 / OpenID Connect) |
| Token | JWT, access token 8h, refresh token 90d |
| Password policy | Min 8 ký tự, chữ + số + ký tự đặc biệt |
| Hết hạn mật khẩu | 90 ngày |
| Lịch sử mật khẩu | Không trùng 5 mật khẩu gần nhất |
| Khóa tài khoản | 5 lần sai → khóa 30 phút |
| RBAC | ABP Permission system |
| Data scoping | OrganizationId filter ở AppService layer |

### 2.2 Session & Cookie

| Yêu cầu | Cấu hình |
|---------|---------|
| HTTP-Only Cookie | Bật cho refresh token |
| Secure flag | Bật khi HTTPS |
| Session timeout | 30 phút không hoạt động |
| CSRF protection | CSRF token cho POST/PUT/DELETE |

### 2.3 Input Validation

- **Server-side validation**: Bắt buộc — FE validate chỉ để UX
- **SQL injection**: EF Core parameterized queries
- **XSS**: HTML encode output, KHÔNG render raw HTML từ user input
  - Exception: `AtpNews.Content` — sanitize với DOMPurify trước khi lưu
- **File upload validation**:
  - Whitelist MIME type: PDF, JPG, PNG, XLSX
  - Max file size: cấu hình trong Settings (default 10MB)
  - Scan tên file (path traversal prevention)
- **CAPTCHA**: Bắt buộc trên trang đăng nhập và gửi phản ánh công khai (STT 49)

### 2.4 Cryptography

| Dữ liệu nhạy cảm | Giải pháp |
|------------------|-----------|
| Mật khẩu | bcrypt via ASP.NET Core Identity |
| API credentials (DataIntegration) | AES-256 encryption, key từ appsettings (không commit) |
| Signing key (JWT) | RSA key file (production), auto-generated (dev) |
| Audit log | Immutable — không cho sửa/xóa |

### 2.5 Network Security

| Yêu cầu | Cấu hình |
|---------|---------|
| HTTPS | Bắt buộc trên production |
| TLS | Tối thiểu TLS 1.2 |
| DNSSEC | Cấu hình DNS server |
| IPv6 | Server lắng nghe IPv6 |
| CORS | Whitelist domain cụ thể (không dùng `*`) |
| ForwardedHeaders | Cấu hình đúng khi qua nginx reverse proxy |

### 2.6 Audit & Monitoring

- **ABP AuditLogging**: Tự động ghi tất cả API calls
- **AuditLog giữ**: Tối thiểu 2 năm
- **Serilog**: Structured logging → file + (optional) Seq/ELK
- **Sensitive data masking**: Không log mật khẩu, token, credentials

---

## 3. Giao diện người dùng (UI/UX)

| Yêu cầu | Giải pháp |
|---------|-----------|
| Ngôn ngữ | Tiếng Việt 100%, Unicode |
| Font | Arial, Times New Roman (đã config trong theme) |
| Số click đến dịch vụ | ≤ 3 click |
| Loading indicator | Ant Design `Spin` — thống nhất toàn hệ thống |
| Thông báo lỗi | Tiếng Việt, phân biệt lỗi user vs lỗi hệ thống |
| Required fields | Dấu `*` đỏ rõ ràng |
| Tab order | Đúng logic (top-left → bottom-right) |
| Responsive | Tương thích Chrome, Edge, Firefox |
| Định dạng ngày | dd/MM/yyyy |
| Định dạng tiền | VND, 15 chữ số nguyên + 2 chữ số thập phân |

### Thông báo lỗi (Error Classification):

```tsx
// Lỗi user (4xx) — thông báo bằng notification
notification.warning({ message: 'Vui lòng kiểm tra lại thông tin đã nhập' })

// Lỗi hệ thống (5xx) — thông báo riêng, không hiển thị chi tiết kỹ thuật
notification.error({ message: 'Hệ thống gặp sự cố. Vui lòng thử lại sau hoặc liên hệ quản trị.' })
```

---

## 4. File & Tài liệu

| Loại | Định dạng chấp nhận | Công cụ |
|------|--------------------|---------| 
| Upload file | PDF, JPG, PNG, XLSX, DOC, DOCX | MinIO (self-hosted S3) |
| Export danh sách | Excel (.xlsx) | MiniExcel + ClosedXML |
| Export chứng nhận, giấy phép | PDF | QuestPDF |
| Export báo cáo | Excel + PDF | ClosedXML + QuestPDF |
| Import dữ liệu | Excel (.xlsx) | MiniExcel |

### Import Excel Rules:
1. Template có thể download (mẫu chuẩn)
2. Validate từng dòng trước khi insert
3. Báo lỗi chi tiết (số dòng + trường lỗi + lý do)
4. Preview kết quả validate trước khi confirm insert
5. Transaction: tất cả thành công hoặc không insert dòng nào (all-or-nothing mode) hoặc insert dòng hợp lệ (partial mode — user chọn)

---

## 5. Tích hợp Ngoài (External Integration)

| Đối tác | Dữ liệu trao đổi | Chuẩn |
|---------|-----------------|-------|
| Bộ Y tế | Cảnh báo, Ngộ độc, Giấy phép | REST API + JSON |
| Sở Nông nghiệp | Sản phẩm, Cơ sở | REST API + JSON |
| Sở Công thương | Cơ sở, Giấy phép | REST API + JSON |

- Tuân thủ **Thông tư 31/2026/TT-BCT** về chia sẻ dữ liệu
- Lưu lịch sử **mọi API call** (nhận + gửi) trong `data_sharing_histories`
- Retry tự động khi thất bại (Hangfire background job)
- API credentials lưu encrypted (AES-256)

---

## 6. Triển khai (Deployment)

### Local Development (Docker Compose):
```yaml
Services:
  - PostgreSQL 15-alpine
  - Redis 7-alpine  
  - MinIO (self-hosted S3)
  - Backend (dotnet run)
  - Frontend (vite dev server)
```

### Production:
```
nginx (reverse proxy, SSL termination)
  ├── FoodSafe.HttpApi.Host (ASP.NET Core, port 5000)
  └── FoodSafe.FE (static files, nginx)

Databases:
  ├── PostgreSQL 15 (primary)
  └── Redis 7 (cache, sessions)

File Storage:
  └── MinIO (dedicated server)
```

### Secrets management:
- `.env` file hoặc Azure Key Vault / HashiCorp Vault (production)
- KHÔNG commit `appsettings.Production.json` với secrets
- Connection string từ environment variables

---

## 7. Testing Requirements

### Backend:
| Loại | Tool | Yêu cầu |
|------|------|---------|
| Unit test | xUnit + NSubstitute + Shouldly | Cover domain logic |
| Integration test | xUnit + real DB (Sqlite in-memory) | Cover AppService methods |
| Không mock DB | — | Rule cứng |

### Frontend:
| Loại | Tool | Yêu cầu |
|------|------|---------|
| Unit test | Vitest + Testing Library | Cover components, hooks |
| API mock | MSW v2 | Mock API calls trong tests |
| E2E | Playwright | Happy path + edge cases |
| Coverage | Vitest coverage | Logic phức tạp, workflow |

---

## 8. Logging Strategy

```
Serilog outputs:
  - Console (stdout) — dev
  - File (rolling daily, 30 ngày giữ) — prod
  - (Optional) Seq / ELK stack — prod

Log levels:
  - Debug: chỉ trong development
  - Information: API calls, auth events, state transitions
  - Warning: validation errors, soft failures
  - Error: exceptions, integration failures
  - Critical: system down events

Masking:
  - Password fields → "***"
  - Authorization headers → "Bearer ***"
  - Connection strings → hide credentials
  - API credentials → "***"
```

---

## 9. Backup & Recovery

| Yêu cầu | Cấu hình đề xuất |
|---------|-----------------|
| PostgreSQL backup | Daily full backup, 30 ngày giữ |
| MinIO backup | Replication hoặc daily sync |
| Redis | Không cần backup (cache) |
| RTO (Recovery Time Objective) | < 4 giờ |
| RPO (Recovery Point Objective) | < 24 giờ |
