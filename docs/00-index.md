# FoodSafe — Tài liệu Phân tích Dự án

> Chi cục An toàn vệ sinh thực phẩm tỉnh Quảng Ninh  
> Phiên bản: 1.0 — Ngày tạo: 2026-07-25

---

## Danh sách Tài liệu

| File | Nội dung | Trạng thái |
|------|----------|-----------|
| [01-functional-requirements.md](01-functional-requirements.md) | 57 chức năng chi tiết theo nhóm A/B/C/E/F | ✅ Hoàn thành |
| [02-domain-model.md](02-domain-model.md) | Domain entities, Value Objects, Aggregates, Domain Events | ✅ Hoàn thành |
| [03-database-schema.sql](03-database-schema.sql) | PostgreSQL DDL — 43 bảng tùy chỉnh + ABP built-in | ✅ Hoàn thành |
| [04-state-machines.md](04-state-machines.md) | 9 workflow state machines + domain events | ✅ Hoàn thành |
| [05-permission-matrix.md](05-permission-matrix.md) | Ma trận phân quyền 7 vai trò × tất cả chức năng | ✅ Hoàn thành |
| [06-api-contracts.md](06-api-contracts.md) | API endpoints cho tất cả modules | ✅ Hoàn thành |
| [07-non-functional-requirements.md](07-non-functional-requirements.md) | Bảo mật, hiệu năng, UI/UX, deployment | ✅ Hoàn thành |

---

## Kiểm tra Phủ sóng Chức năng (Coverage Check)

### Nhóm A — Quản trị Hệ thống
- [x] STT 1 — Quản lý Vai trò (Roles)
- [x] STT 2 — Quản lý Người dùng (Users)
- [x] STT 3 — Nhật ký kiểm soát (Audit Log)
- [x] STT 4 — Cấu hình hệ thống (Settings)
- [x] STT 5 — Phân quyền (Access Management)

### Nhóm B — Danh mục
- [x] STT 6 — Đơn vị Tổ chức (Organizations)
- [x] STT 7 — Tài khoản Đơn vị (Unit Accounts)
- [x] STT 8 — Quốc gia (Countries)
- [x] STT 9 — Vùng/Miền (Regions)
- [x] STT 10 — Tỉnh/Thành phố (Provinces)
- [x] STT 11 — Huyện/Quận + Xã/Phường (Districts & Communes)
- [x] STT 12 — Phân loại Cơ sở (Business Classification)
- [x] STT 13 — Nhóm Sản phẩm (Product Groups)
- [x] STT 14 — Loại hình Cơ sở (Business Types)
- [x] STT 15 — Loại hình Quảng cáo (Ad Types)
- [x] STT 16 — Cơ sở Kiểm nghiệm (Testing Centers)
- [x] STT 17 — Dịch vụ Kiểm nghiệm (Testing Services)
- [x] STT 18 — Loại Văn bản (Document Types)

### Nhóm C — Quản lý ATTP
- [x] STT 19 — Cơ sở SXKD (Businesses + Map)
- [x] STT 20 — Sản phẩm (Products)
- [x] STT 21 — Tự công bố (Self Declarations)
- [x] STT 22 — Đăng ký Công bố SP (DKCB / Product Registrations)
- [x] STT 23 — Đăng ký QC (Ad Registrations)
- [x] STT 24 — Cơ sở Đủ điều kiện (DDK / Eligibility Certificates)
- [x] STT 25 — CFS Certificates
- [x] STT 26 — Export Food Certificates
- [x] STT 27 — Kế hoạch Thanh Kiểm tra (Inspection Plans)
- [x] STT 28 — Kết quả Thanh Kiểm tra (Inspection Results)
- [x] STT 29 — Cảnh báo VSATTP (Alerts)
- [x] STT 30 — Tin tức, Hoạt động (News)
- [x] STT 31 — Ca Ngộ độc nhỏ lẻ (Food Poisoning Cases)
- [x] STT 32 — Vụ Ngộ độc (Food Poisoning Incidents)
- [x] STT 33 — Báo cáo NĐTP hàng tháng
- [x] STT 34 — Báo cáo Công tác ATTP (6 tháng/năm)
- [x] STT 35 — Báo cáo Tháng Hành động ATTP
- [x] STT 36 — Phân tích Mối nguy cơ (Risk Analysis)
- [x] STT 37 — Kết quả Kiểm nghiệm (Testing Results)
- [x] STT 38 — Văn bản Chỉ đạo (Documents)
- [x] STT 39 — Dashboard
- [x] STT 40 — Thống kê

### Nhóm E — Cổng Thông tin Công khai
- [x] STT 41 — Tra cứu Cơ sở
- [x] STT 42 — Tra cứu Sản phẩm
- [x] STT 43 — Tra cứu Giấy phép
- [x] STT 44 — Tra cứu Kết quả Kiểm nghiệm
- [x] STT 45 — Tra cứu Kết quả Thanh Kiểm tra
- [x] STT 46 — Tra cứu Cảnh báo
- [x] STT 47 — Tra cứu Phân tích Nguy cơ
- [x] STT 48 — Tra cứu Tin tức
- [x] STT 49 — Gửi Phản ánh (Public Alert Submission)

### Nhóm F — Tích hợp Dữ liệu
- [x] STT 50 — Đặc tả API (API Specs)
- [x] STT 51 — Lịch sử Chia sẻ Cảnh báo
- [x] STT 52 — Lịch sử Chia sẻ Kết quả TKT
- [x] STT 53 — Lịch sử Chia sẻ Ngộ độc
- [x] STT 54 — Lịch sử Chia sẻ Giấy phép
- [x] STT 55 — Lịch sử Chia sẻ Sản phẩm
- [x] STT 56 — Lịch sử Chia sẻ Tin tức
- [x] STT 57 — Lịch sử Chia sẻ Cơ sở

**Tổng: 57/57 chức năng ✅ — Không bỏ sót**

---

## Tóm tắt Database Schema

| Module | Tables | Entities chính |
|--------|--------|---------------|
| Organizations | 2 | organizations, app_user_profiles |
| Catalogs | 9 | countries, regions, provinces, districts, communes, product_groups, business_types, business_classifications, ad_types, document_types, testing_centers, testing_services |
| BusinessManagement | 5 | businesses, business_product_groups, business_handlers, products, self_declarations |
| Licensing | 6 | product_registrations, advertisement_registrations, ad_reg_products, eligibility_certificates, cfs_certificates, export_food_certificates |
| Inspection | 3 | inspection_plans, inspection_plan_items, inspection_results, inspection_violations |
| FoodPoisoning | 4 | food_poisoning_cases, poisoning_case_error_reports, food_poisoning_incidents, poisoning_incident_error_reports |
| Reporting | 4 | ndtp_reports, ndtp_report_error_notifications, atp_work_reports, action_month_reports |
| AlertsAndTesting | 6 | atp_alerts, atp_news, news_linked_alerts, risk_analyses, testing_results, regulatory_documents, public_alert_submissions |
| CrossCutting | 3 | file_attachments, status_history, cached_dashboard_stats |
| DataIntegration | 2 | api_specs, data_sharing_histories |
| **Tổng** | **~44** | |

*+ ABP built-in: ~20 bảng (AbpUsers, AbpRoles, AbpAuditLogs, AbpPermissionGrants, AbpSettings...)*

---

## Phân tích Rủi ro Thiếu sót

### Đã xử lý:
1. ✅ File attachments — bảng generic polymorphic (file_attachments)
2. ✅ Status history tracking — bảng status_history
3. ✅ Dashboard cache — bảng cached_dashboard_stats  
4. ✅ Public submissions — bảng public_alert_submissions riêng
5. ✅ Error reports — bảng riêng cho từng loại entity
6. ✅ Bản đồ (Leaflet) — latitude/longitude trên businesses + poisoning
7. ✅ Workflow state machines — đủ trạng thái + transitions
8. ✅ DataIntegration — cả API spec + history
9. ✅ Multi-service testing — testing_service_ids trên testing_results

### Cân nhắc thêm (Phase 2+):
- **Notification system**: bảng `notifications` cho thông báo trong app
- **Report templates**: lưu template word/excel cho các mẫu báo cáo
- **Scheduled reports**: cấu hình lịch tự động gửi báo cáo
- **External system webhooks**: nhận data push từ Bộ Y tế
- **Full-text search**: tích hợp Meilisearch hoặc PostgreSQL FTS
- **Mobile app API**: nếu có nhu cầu app di động

---

## Bước Tiếp theo

1. **Tạo EF Core migrations** từ database schema đã thiết kế
2. **Phase 2**: Implement Organizations + Catalogs module (BE + FE)
3. **Phase 3**: Implement BusinessManagement module
4. **Phase 4**: Implement Licensing module
5. **Phase 5**: Implement Inspection module
6. **Phase 6**: Implement FoodPoisoning module
7. **Phase 7**: Implement Reporting module
8. **Phase 8**: Implement AlertsAndTesting module
9. **Phase 9**: Implement Dashboard + Statistics
10. **Phase 10**: Implement Public Portal
11. **Phase 11**: Implement DataIntegration module
12. **Phase 12**: Security hardening + /security-review
