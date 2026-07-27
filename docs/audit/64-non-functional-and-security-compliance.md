# 64 — Non-Functional and Security Compliance Audit

**Audit date**: 2026-07-27
**Branch**: `codex/production-readiness`
**Standard**: NĐ 85/2016/NĐ-CP Level-2 Information Security System

---

## 1. Application Security (SEC-01..25)

| ID | Requirement | Status | Score | Evidence |
|---|---|---|---|---|
| SEC-01 | Unique username, alphanumeric+underscore | IMPLEMENTED | 0.85 | ABP Identity `UserName` unique constraint |
| SEC-02 | Password min 8 chars | IMPLEMENTED | 0.85 | `RequiredLength = 8` in `FoodSafeHttpApiHostModule.cs:448` |
| SEC-03 | Password complexity (letters+digits+special) | IMPLEMENTED | 0.85 | `RequireDigit/Lowercase/Uppercase/NonAlphanumeric = true` |
| SEC-04 | Password expiry 90 days, no reuse of current | IMPLEMENTED | 0.85 | `PasswordValidity = 90 days` + `PasswordHistoryPolicy` (5 previous) |
| SEC-05 | Reset link single-use or expires ≤8 hours | PARTIAL | 0.50 | Token provider uses ASP.NET default 24h; should be 8h |
| SEC-06 | Random password via email follows strong policy | PARTIAL | 0.50 | Link-based reset used; no literal random-password generation |
| SEC-07 | Password hash+salt (SHA-256/512 recommended) | IMPLEMENTED | 0.85 | ASP.NET Core Identity PBKDF2/HMAC-SHA256 (100K iterations in .NET 9) |
| SEC-08 | CAPTCHA on login + important functions | IMPLEMENTED | 0.85 | Cloudflare Turnstile on login, password change, citizen alert |
| SEC-09 | Sensitive data via POST only | IMPLEMENTED | 0.85 | `LoginCaptchaMiddleware` checks `HttpMethods.IsPost()` |
| SEC-10 | Session timeout | IMPLEMENTED | 0.85 | 30-min sliding cookie + 15-min access token |
| SEC-11 | New session on login; destroy on logout | IMPLEMENTED | 0.85 | OpenIddict token lifecycle |
| SEC-12 | HttpOnly + Secure cookies | IMPLEMENTED | 0.85 | `HttpOnly = true`, `CookieSecurePolicy.Always` in production |
| SEC-13 | CSRF token on all POST/PUT/DELETE | IMPLEMENTED | 0.85 | ABP AntiForgery `AutoValidate = true` + `SameSite.Strict` |
| SEC-14 | UI shows only authorized elements | IMPLEMENTED | 0.85 | `usePermissions()` hook hides unauthorized UI elements entirely |
| SEC-15 | Server checks function authorization | IMPLEMENTED | 0.85 | Every AppService method has `[Authorize]` attribute |
| SEC-16 | Server checks data scope | IMPLEMENTED | 0.85 | `CurrentDataScopeProvider` + `EnsureOrganizationAccessAsync()` |
| SEC-17 | Authorization from server-stored values | IMPLEMENTED | 0.85 | Permissions resolved from DB via ABP, not from client tokens |
| SEC-18 | Server-side input validation | IMPLEMENTED | 0.85 | DataAnnotations + ABP `Check.*` in Domain + entity validation |
| SEC-19 | XSS prevention (HTML encode output) | IMPLEMENTED | 0.85 | CSP `object-src 'none'`, React JSX auto-escape, no `dangerouslySetInnerHTML` |
| SEC-20 | Filter CRLF in response headers | PARTIAL | 0.50 | No explicit CRLF filter middleware; mitigated by ASP.NET Core built-in protections |
| SEC-21 | No sensitive data in cookies | IMPLEMENTED | 0.85 | `__Host-` prefix, session reference only, no data payload |
| SEC-22 | Whitelist redirects | PARTIAL | 0.50 | CORS configured; no explicit redirect whitelist middleware found |
| SEC-23 | Safe XML processing (no XXE) | IMPLEMENTED | 0.85 | No XML processing in codebase; all data exchange is JSON |
| SEC-24 | Generic error messages | IMPLEMENTED | 0.85 | `FoodSafeDomainErrorCodes.*` localized to generic messages |
| SEC-25 | Error logs outside webroot | PARTIAL | 0.70 | Relative path `Logs/logs.txt` (safe in Docker, risky in bare-metal) |

**SEC score: 19.85/25 = 79.4%**

---

## 2. Database Security (DBS-01..10)

| ID | Requirement | Status | Score | Evidence |
|---|---|---|---|---|
| DBS-01 | Secure DBMS installation, latest patches | PARTIAL | 0.70 | PostgreSQL 15-alpine (2024); not latest 16 |
| DBS-02 | Remove unused components/accounts | PARTIAL | 0.50 | Docker image; default postgres user exists alongside foodsafe |
| DBS-03 | DB password policy (≥8, complexity, 3-month change) | PARTIAL | 0.50 | Strong password via env vars; no automated rotation |
| DBS-04 | Least-privilege DB account | PARTIAL | 0.50 | App uses dedicated `foodsafe` user; privileges not explicitly restricted |
| DBS-05 | DB service not running as OS admin | IMPLEMENTED | 0.85 | Docker container runs as `postgres` user, not root |
| DBS-06 | DB credentials encrypted in config | PARTIAL | 0.50 | Env vars at runtime; not encrypted in file |
| DBS-07 | DB audit logging (3 months, critical 6 months) | PARTIAL | 0.40 | ABP AuditLog at app level; no PostgreSQL `pg_audit` or DB-level logging |
| DBS-08 | IP restrictions on DB connections | IMPLEMENTED | 0.85 | `127.0.0.1` binding default; Docker network isolation |
| DBS-09 | Encryption at rest + in transit | NOT_IMPLEMENTED | 0.20 | No `SslMode=Require` in connection string; no pgcrypto/TDE configured |
| DBS-10 | Third-party DAM/Firewall | NOT_IMPLEMENTED | 0.00 | No database activity monitoring tool |

**DBS score: 5.00/10 = 50.0%**

---

## 3. Performance (NFR-01..06)

| ID | Requirement | Status | Score | Evidence |
|---|---|---|---|---|
| NFR-01 | Average response < 10s | CANNOT_VERIFY | 0.50 | No load test results; architecture supports it |
| NFR-02 | Max response < 30s | CANNOT_VERIFY | 0.50 | No load test results |
| NFR-03 | Data server CPU ≤ 75% | CANNOT_VERIFY | 0.50 | Infrastructure concern |
| NFR-04 | App server CPU ≤ 75% | CANNOT_VERIFY | 0.50 | Infrastructure concern |
| NFR-05 | ≥ 30 concurrent connections | CANNOT_VERIFY | 0.50 | Kestrel defaults support this; no load test |
| NFR-06 | ≥ 5 active users simultaneously | CANNOT_VERIFY | 0.50 | Architecture supports this |

**NFR score: 3.00/6 = 50.0%** (cannot verify without load testing)

---

## 4. IPv6/TLS/DNSSEC (IPV-01..06)

| ID | Requirement | Status | Score | Evidence |
|---|---|---|---|---|
| IPV-01 | Software supports IPv6 | PARTIAL | 0.50 | .NET/nginx support IPv6; not configured |
| IPV-02 | Webserver ISP provides IPv6 | CANNOT_VERIFY | 0.25 | Infrastructure |
| IPV-03 | Webserver listens on IPv6 | NOT_IMPLEMENTED | 0.00 | `listen 8080;` only — no `listen [::]:8080;` |
| IPV-04 | AAAA DNS record | CANNOT_VERIFY | 0.25 | Infrastructure |
| IPV-05 | DNS hosting + DNSSEC ready | CANNOT_VERIFY | 0.25 | Infrastructure |
| IPV-06 | HTTPS with TLS ≥ 1.2 | PARTIAL | 0.50 | .NET 9 defaults TLS 1.2+; nginx terminates HTTP only (external TLS needed) |

**IPV score: 1.75/6 = 29.2%**

---

## 5. Integration (INT-01..05)

| ID | Requirement | Status | Score | Evidence |
|---|---|---|---|---|
| INT-01 | MoH connectivity | NOT_IMPLEMENTED | 0.00 | No integration engine |
| INT-02 | TT 31/2026 + NĐ 37/2026 compliance | NOT_IMPLEMENTED | 0.00 | Not addressed |
| INT-03 | Partner API accounts | NOT_IMPLEMENTED | 0.00 | No partner auth/token issuance |
| INT-04 | Machine-readable API spec | PARTIAL | 0.50 | Endpoint CRUD metadata; no OpenAPI partner spec |
| INT-05 | Call history logging | PARTIAL | 0.30 | Table + viewer exist; nothing writes records |

**INT score: 0.80/5 = 16.0%**

---

## 6. UI/UX (UI-01..10)

| ID | Requirement | Status | Score | Evidence |
|---|---|---|---|---|
| UI-01 | Intuitive web-based UI | IMPLEMENTED | 0.85 | Ant Design 5 dashboard + public portal |
| UI-02 | Web-based access | IMPLEMENTED | 0.85 | SPA served via nginx |
| UI-03 | ≤ 3 clicks to any function | IMPLEMENTED | 0.85 | Sidebar nav + direct routes |
| UI-04 | Keyboard support (Tab order) | PARTIAL | 0.70 | Ant Design provides base; no explicit Tab order testing |
| UI-05 | Consistent design | IMPLEMENTED | 0.85 | Uniform Ant Design theme |
| UI-06 | Unicode Vietnamese | IMPLEMENTED | 0.85 | Full Vietnamese localization |
| UI-07 | Friendly error messages | IMPLEMENTED | 0.85 | Localized error codes + notification toasts |
| UI-08 | Loading indicators | IMPLEMENTED | 0.85 | Ant Design Spin on all data-fetching components |
| UI-09 | TT 39/2017 compliance | PARTIAL | 0.50 | Partial; no formal compliance audit done |
| UI-10 | Multi-browser support | IMPLEMENTED | 0.85 | Vite build targets Chrome/Edge/Firefox |

**UI score: 8.00/10 = 80.0%**

---

## 7. Data Tolerance (DT-01..12)

| ID | Requirement | Status | Score | Evidence |
|---|---|---|---|---|
| DT-01 | Date format dd/mm/yyyy | IMPLEMENTED | 0.85 | `dayjs` locale vi throughout |
| DT-02 | VND 15+2 decimal | PARTIAL | 0.50 | No financial fields found; format ready via Ant Design |
| DT-03 | Instant validation | IMPLEMENTED | 0.85 | Zod schemas + React Hook Form real-time validation |
| DT-04 | Referential integrity | IMPLEMENTED | 0.85 | FK constraints on all catalog references |
| DT-05 | Import validation | IMPLEMENTED | 0.85 | Excel import with row-level validation + preview |
| DT-06 | Required field markers (*) | IMPLEMENTED | 0.85 | Ant Design Form.Item `required` prop |
| DT-07 | Specialized inputs | IMPLEMENTED | 0.85 | DatePicker, Select, Cascader used appropriately |
| DT-08 | Tab order | PARTIAL | 0.70 | Ant Design default; no explicit testing |
| DT-09 | Dropdowns for catalogs | IMPLEMENTED | 0.85 | All catalog fields use Select/Cascader |
| DT-10 | Lint/format compliance | IMPLEMENTED | 0.85 | ESLint + Prettier configured; 0 warnings |
| DT-11 | File format compliance | IMPLEMENTED | 0.85 | Magic-byte + MIME + extension validation |
| DT-12 | Import file validation | IMPLEMENTED | 0.85 | Pre-insert validation with error list |

**DT score: 9.60/12 = 80.0%**

---

## 8. Technology (TECH-01..05)

| ID | Requirement | Status | Score | Evidence |
|---|---|---|---|---|
| TECH-01 | Stable server OS | IMPLEMENTED | 0.85 | Docker Alpine Linux |
| TECH-02 | Popular DBMS | IMPLEMENTED | 0.85 | PostgreSQL 15 |
| TECH-03 | Supported language/platform | IMPLEMENTED | 0.85 | .NET 9, React 19, TypeScript |
| TECH-04 | Open architecture | IMPLEMENTED | 0.85 | REST API, Docker, standard protocols |
| TECH-05 | Multi-browser | IMPLEMENTED | 0.85 | Vite build, tested on Chrome/Edge/Firefox |

**TECH score: 4.25/5 = 85.0%**

---

## 9. Level-2 InfoSec (L2-01)

| ID | Requirement | Status | Score | Evidence |
|---|---|---|---|---|
| L2-01 | Complete level-2 security dossier | PARTIAL | 0.40 | Most technical controls implemented; formal dossier not assembled |

---

## 10. Notable Security Strengths

1. **File upload security**: Extension allowlist + MIME match + magic bytes + ClamAV malware scan + SHA-256 checksum verification on download
2. **Session management**: `__Host-` cookie prefix + HttpOnly + Secure + SameSite=Strict + SecurityStamp validated every request
3. **CAPTCHA**: Cloudflare Turnstile with production key validation at startup — test keys cannot deploy
4. **Rate limiting**: Per-endpoint tiered limits (login 10/5min, reset 5/15min, public 60/min, authenticated 300/min)
5. **Secret management**: All secrets via required env vars; startup fails fast if missing; no secrets in git history
6. **Data scoping**: Organization isolation enforced at query layer, mutation layer, and database layer (composite FKs)
7. **Self-registration disabled**: Both configuration AND middleware enforce no self-registration

---

## 11. Critical Gaps Requiring Action

| Priority | Gap | SEC/DBS ID | Fix Effort |
|---|---|---|---|
| HIGH | Swagger UI exposed unconditionally | SEC-24 adjacent | 5 minutes — gate to `IsDevelopment()` |
| HIGH | PostgreSQL SSL not enforced | DBS-09 | 30 minutes — add `SslMode=Require` + certs |
| MEDIUM | Password reset token 24h (should be 8h) | SEC-05 | 5 minutes — configure `DataProtectionTokenProviderOptions` |
| MEDIUM | IPv6 not configured | IPV-03 | 10 minutes — add `listen [::]:8080;` to nginx |
| MEDIUM | HSTS not in nginx | IPV-06 adjacent | 5 minutes — add `add_header Strict-Transport-Security` |
| LOW | No DB-level audit logging | DBS-07 | 2 hours — install/configure `pgaudit` extension |
| LOW | No database activity monitoring | DBS-10 | Days — requires third-party tool deployment |
| LOW | No load testing evidence | NFR-01..06 | Hours — requires k6/Artillery test suite |

---

## 12. Overall Non-Functional Scores

| Category | Score | Items | % |
|---|---|---|---|
| SEC (application security) | 19.85 | 25 | 79.4% |
| DBS (database security) | 5.00 | 10 | 50.0% |
| NFR (performance) | 3.00 | 6 | 50.0% |
| IPV (IPv6/TLS/DNSSEC) | 1.75 | 6 | 29.2% |
| INT (integration) | 0.80 | 5 | 16.0% |
| UI (UI/UX) | 8.00 | 10 | 80.0% |
| DT (data tolerance) | 9.60 | 12 | 80.0% |
| TECH (technology) | 4.25 | 5 | 85.0% |
| L2 (InfoSec level 2) | 0.40 | 1 | 40.0% |
| **Non-FR total** | **52.65** | **80** | **65.8%** |
