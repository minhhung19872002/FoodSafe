# 60 — Customer Requirement Baseline

**Source document**: `docs/Mẫu số 03. YCKT (1).pdf` (42 pages)
**Extraction date**: 2026-07-27
**Audit date**: 2026-07-27
**Auditor**: Principal Software Auditor (automated)

---

## Summary

| Category | Type | Count |
|---|---|---|
| FR (STT 1–57 + LIC cross-cutting) | Functional | 372 |
| INT (integration) | Non-functional | 5 |
| NFR (performance) | Non-functional | 6 |
| IPV (IPv6/TLS/DNSSEC) | Non-functional | 6 |
| SEC (application security) | Non-functional | 25 |
| DBS (database security) | Non-functional | 10 |
| UI (UI/UX) | Non-functional | 10 |
| DT (data tolerance) | Non-functional | 12 |
| TECH (technology) | Non-functional | 5 |
| L2 (InfoSec level 2) | Mixed | 1 |
| SUP (support) | Non-software | 4 |
| TRN (training) | Non-software | 1 |
| OWN (ownership) | Non-software | 4 |
| HND (handover) | Non-software | 2 |
| ACC (acceptance) | Non-software | 6 |
| **TOTAL** | | **469** |

**Software-assessable**: 452 (FR 372 + non-FR software 80)
**Non-software deliverables**: 17

---

## Functional Requirement Groups (STT 1–57)

### Group A — Quản trị hệ thống (STT 1–5, 33 items)

| STT | Name | Items | PDF Pages |
|---|---|---|---|
| 1 | Quản lý vai trò người dùng | 6 | 15 |
| 2 | Quản lý người dùng | 13 | 15 |
| 3 | Nhật ký hệ thống | 3 | 15–16 |
| 4 | Cài đặt hệ thống | 6 | 16 |
| 5 | Quản lý truy cập (self-service) | 5 | 17 |

### Group B — Quản lý danh mục (STT 6–18, 57 items)

| STT | Name | Items | PDF Pages |
|---|---|---|---|
| 6 | Quản lý đơn vị | 6 | 17 |
| 7 | Quản lý tài khoản đơn vị | 6 | 17 |
| 8 | Danh mục Quốc gia | 4 | 18 |
| 9 | Danh mục Vùng miền | 4 | 18 |
| 10 | Danh mục Tỉnh/Thành phố | 4 | 18 |
| 11 | Danh mục Xã/Phường | 4 | 18 |
| 12 | Danh mục Phân loại cơ sở | 4 | 18 |
| 13 | Danh mục Nhóm sản phẩm | 4 | 18 |
| 14 | Danh mục Loại hình cơ sở | 4 | 19 |
| 15 | Danh mục Loại hình quảng cáo | 4 | 19 |
| 16 | Danh mục Cơ sở kiểm nghiệm | 4 | 19 |
| 17 | Danh mục Dịch vụ kiểm nghiệm | 5 | 19 |
| 18 | Danh mục Loại văn bản | 4 | 20 |

### Group C — Quản lý về ATTP (STT 19–40, 216 items)

| STT | Name | Items | PDF Pages |
|---|---|---|---|
| 19 | Quản lý cơ sở SXKD ATTP | 18 | 20–21 |
| 20 | Quản lý sản phẩm cơ sở | 8 | 21–22 |
| 21 | Tự công bố sản phẩm | 9 | 22 |
| 22 | Đăng ký công bố sản phẩm | 9 | 23 |
| 23 | Đăng ký quảng cáo | 11 | 23–24 |
| 24 | Đăng ký cơ sở đủ điều kiện | 10 | 24–25 |
| 25 | GCN lưu hành tự do (CFS) | 11 | 25–26 |
| 26 | GCN thực phẩm xuất khẩu | 11 | 26 |
| LIC | Cross-cutting licensing | 2 | 22–26 |
| 27 | Kế hoạch thanh kiểm tra | 11 | 27 |
| 28 | Kết quả thanh kiểm tra | 7 | 28 |
| 29 | Cảnh báo VSATTP | 9 | 29 |
| 30 | Tin tức ATTP | 9 | 29 |
| 31 | Ca ngộ độc nhỏ lẻ | 11 | 30 |
| 32 | Vụ ngộ độc | 10 | 30–31 |
| 33 | Báo cáo NĐTP (monthly) | 11 | 31 |
| 34 | Báo cáo công tác ATTP (6M/1Y) | 11 | 32 |
| 35 | Báo cáo Tháng hành động (yearly) | 10 | 33 |
| 36 | Phân tích mối nguy cơ | 8 | 33–34 |
| 37 | Kết quả kiểm nghiệm | 6 | 34 |
| 38 | Văn bản chỉ đạo | 7 | 34–35 |
| 39 | Dashboard thống kê | 9 | 35 |
| 40 | Báo cáo thống kê | 8 | 36 |

### Group E — Cổng thông tin công dân (STT 41–49, 32 items)

| STT | Name | Items | PDF Pages |
|---|---|---|---|
| 41 | Tra cứu thông tin chung | 4 | 36–37 |
| 42 | Tra cứu GCN đủ điều kiện | 4 | 37 |
| 43 | Tra cứu tự công bố | 4 | 37 |
| 44 | Tra cứu ĐKCB | 4 | 37 |
| 45 | Tra cứu cơ sở bị cảnh báo | 3 | 38 |
| 46 | Tra cứu CFS | 4 | 38 |
| 47 | Tra cứu GCN xuất khẩu | 4 | 38 |
| 48 | Cảnh báo VSATTP (citizen) | 3 | 38 |
| 49 | Tra cứu văn bản pháp luật | 2 | 38 |

### Group F — Tích hợp dữ liệu (STT 50–57, 34 items)

| STT | Name | Items | PDF Pages |
|---|---|---|---|
| 50 | Quản lý đặc tả API | 6 | 39 |
| 51 | Lịch sử chia sẻ cảnh báo | 4 | 39 |
| 52 | Lịch sử chia sẻ thanh kiểm tra | 4 | 39–40 |
| 53 | Lịch sử chia sẻ ngộ độc | 4 | 40 |
| 54 | Lịch sử chia sẻ giấy phép | 4 | 40 |
| 55 | Lịch sử chia sẻ sản phẩm | 4 | 40 |
| 56 | Lịch sử chia sẻ tin tức | 4 | 40–41 |
| 57 | Lịch sử chia sẻ cơ sở SXKD | 4 | 41 |

---

## Non-Functional Requirements

### Performance (NFR-01..06, §2.5)
- NFR-01: Average response < 10s (main workflows, excluding reports)
- NFR-02: Max response < 30s (all operations)
- NFR-03: Data server CPU ≤ 75%
- NFR-04: App server CPU ≤ 75%
- NFR-05: ≥ 30 concurrent connections
- NFR-06: ≥ 1/6 × concurrent = ≥ 5 active users simultaneously

### IPv6/TLS/DNSSEC (IPV-01..06, §2.6)
- IPV-01: Software supports IPv6
- IPV-02: Webserver ISP provides IPv6
- IPV-03: Webserver listens on IPv6
- IPV-04: AAAA DNS record for domain
- IPV-05: DNS hosting supports IPv6 + DNSSEC ready
- IPV-06: HTTPS with TLS ≥ 1.2, secure ciphers

### Application Security (SEC-01..25, §3.1)
- SEC-01: Unique username (alphanumeric + underscore only)
- SEC-02: Password min 8 characters
- SEC-03: Password complexity (letters + digits + special)
- SEC-04: Password expiry 90 days, no reuse of current
- SEC-05: Reset link single-use or expires in 8 hours
- SEC-06: Random password via email follows strong policy
- SEC-07: Password stored as hash+salt (recommended SHA-256/512)
- SEC-08: CAPTCHA on login + important functions
- SEC-09: Sensitive data via POST only
- SEC-10: Session timeout
- SEC-11: New session on login; destroy on logout
- SEC-12: HttpOnly + Secure cookies
- SEC-13: CSRF token on all POST/PUT/DELETE
- SEC-14: UI shows only authorized elements (no CSS/JS hiding)
- SEC-15: Server checks function authorization every request
- SEC-16: Server checks data scope every request
- SEC-17: Authorization from server-stored values, not client
- SEC-18: Server-side input validation (type, range, length, format, whitelist)
- SEC-19: HTML-encode against XSS/HTML injection
- SEC-20: Filter \n\r in response headers (response splitting)
- SEC-21: No sensitive data in cookies; if needed, encrypt with server key
- SEC-22: Whitelist redirects
- SEC-23: Safe XML processing (no XXE)
- SEC-24: Generic error messages (no sensitive info leak)
- SEC-25: Error logging outside webroot, no sensitive data in logs

### Database Security (DBS-01..10, §3.2)
- DBS-01: Secure DBMS installation, latest security patches
- DBS-02: Remove unused components/accounts/databases
- DBS-03: DB account password policy (≥8 chars, letters+digits+special, change ≤3 months, no reuse of last 5)
- DBS-04: App uses least-privilege DB account, not admin
- DBS-05: DB service not running as OS admin
- DBS-06: DB credentials encrypted in config file
- DBS-07: DB login audit logging (3 months, critical 6 months)
- DBS-08: IP restrictions on DB connections
- DBS-09: Encryption at rest + in transit; data masking; privileged user controls
- DBS-10: Third-party Database Activity Monitoring/Firewall

### UI/UX (UI-01..10, §3.4)
- UI-01 through UI-10: Intuitive UI, web-based, ≤3 clicks, keyboard support, consistent design, Unicode Vietnamese, friendly errors, loading indicators, TT 39/2017 compliance

### Data Tolerance (DT-01..12, §3.5)
- DT-01 through DT-12: Date format dd/mm/yyyy, VND 15+2, instant validation, referential integrity, import validation, required field markers, specialized inputs, tab order, dropdowns, lint/format, file format compliance

### Technology (TECH-01..05, §2.2)
- TECH-01 through TECH-05: Stable server OS, popular DBMS, supported language/platform, open architecture, multi-browser compatibility

### Level-2 InfoSec (L2-01, §3.7)
- L2-01: Complete level-2 security dossier per NĐ 85/2016

---

## Non-Software Deliverables

### Support (SUP-01..04): 48h incident recovery, continuity during repair, ≥2 support channels, 24/7
### Training (TRN-01): 1 class, 1 day, 120 attendees
### Ownership (OWN-01..04): Data belongs to customer, full handover, confidentiality, Vietnamese entity control
### Handover (HND-01..02): Full data export on termination, confidentiality commitment
### Acceptance (ACC-01..06): Function testing, integration testing, stability/performance/security testing, user+admin manuals, formal acceptance records

---

## Key Discrepancies Between PDF and docs/01-functional-requirements.md

1. **STT 5 misinterpreted**: docs/01 maps it to "Access Management / permission tree" but PDF defines it as user self-service (login, logout, change password, edit profile, avatar)
2. **Organization hierarchy**: PDF uses 2-tier (Tỉnh ↔ Xã), implementation uses 3-tier (Tỉnh → Huyện → Xã)
3. **Missing from docs/01**: FR-04-02 (login screen customization), FR-04-06 (homepage config), FR-19-16/17 (eligibility/commitment confirmation), FR-30-07 (citizen news moderation), FR-32-07 (province-only closing report), FR-39-03/04/09 (dashboard report tracking + download), FR-42..47-03/04 (certificate view/print on portal), FR-45 (warned businesses), FR-49 (document lookup)
4. **In docs/01 but NOT in PDF**: Public lookup of testing results, inspection results, advertisement registrations

*This baseline document serves as the single source of truth for all subsequent audit phases.*
