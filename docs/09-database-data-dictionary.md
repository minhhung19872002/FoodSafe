# Database Data Dictionary — FoodSafe

> Hệ thống quản lý an toàn thực phẩm — Chi cục ATVSTP tỉnh Quảng Ninh  
> PostgreSQL 15 | Schema: `public` | ABP Framework 9 naming convention (snake_case)

---

## Conventions

| Convention | Value |
|-----------|-------|
| Primary key | `id UUID NOT NULL DEFAULT uuid_generate_v4()` |
| Soft delete | `is_deleted BOOL`, `deletion_time TIMESTAMPTZ`, `deleter_id UUID` |
| Full ABP audit | creation_time, creator_id, last_modification_time, last_modifier_id, is_deleted, deletion_time, deleter_id, extra_properties, concurrency_stamp |
| Partial audit | creation_time + creator_id only |
| Security levels | Public (cổng công khai) / Internal (nội bộ) / Confidential (hạn chế) / Sensitive (rất nhạy cảm) |
| Soft delete filter | Queries always include `WHERE is_deleted = FALSE` unless stated |

**Abbreviation:** VO = Value Object (embedded trong bảng cha).

---

## ORGANIZATIONS MODULE

---

### Table: `organizations`

**Business name:** Đơn vị tổ chức  
**Business purpose:** Lưu cây 3 cấp đơn vị hành chính quản lý ATTP: Chi cục Tỉnh → Trung tâm Y tế Huyện → Trạm Y tế Xã.  
**Owning bounded context:** Organizations  
**Security classification:** Internal  
**Estimated growth:** Low (<50 rows tổng — cố định theo đơn vị hành chính)  
**Soft delete:** Yes  
**Audit fields:** Full ABP  
**Retention:** Vô thời hạn — đây là master data cốt lõi

| Column | Business Meaning | Type | Req | Default | PK | FK | UQ | Check | Sensitive |
|--------|-----------------|------|-----|---------|----|----|-----|-------|-----------|
| id | Khóa chính | UUID | Y | uuid_generate_v4() | Y | | | | |
| parent_id | Đơn vị cha (NULL cho cấp tỉnh) | UUID | N | NULL | | → organizations.id | | | |
| code | Mã đơn vị (duy nhất toàn hệ thống) | VARCHAR(50) | Y | | | | Y | | |
| name | Tên đầy đủ đơn vị | VARCHAR(200) | Y | | | | | | |
| level | Cấp tổ chức | SMALLINT | Y | | | | | IN (1,2,3) | |
| address | Địa chỉ văn phòng | TEXT | N | | | | | | |
| phone | Số điện thoại | VARCHAR(50) | N | | | | | | |
| fax | Số fax | VARCHAR(50) | N | | | | | | |
| email | Email công vụ | VARCHAR(200) | N | | | | | | |
| province_id | Tỉnh (catalog — dùng cho hiển thị) | UUID | N | | | → cat_provinces | | | |
| district_id | Huyện (catalog — dùng cho hiển thị) | UUID | N | | | → cat_districts | | | |
| is_active | Đang hoạt động | BOOL | Y | TRUE | | | | | |

**Notes:** `level=1` chỉ có 1 record (Chi cục tỉnh Quảng Ninh). Self-referencing FK tạo cây tổ chức. Không dùng ABP `OrganizationUnits`.

---

### Table: `app_user_profiles`

**Business name:** Hồ sơ người dùng mở rộng  
**Business purpose:** Mở rộng `AbpUsers` với thông tin tổ chức và chính sách mật khẩu. Quan hệ 1-1 với `AbpUsers`.  
**Owning bounded context:** Organizations  
**Security classification:** Confidential  
**Estimated growth:** Low (<500 users)  
**Soft delete:** No (theo vòng đời AbpUsers)  
**Audit fields:** Partial (creation_time, last_modification_time)  
**Retention:** Theo vòng đời tài khoản

| Column | Business Meaning | Type | Req | Default | PK | FK | UQ | Check | Sensitive |
|--------|-----------------|------|-----|---------|----|----|-----|-------|-----------|
| id | Khóa chính | UUID | Y | uuid_generate_v4() | Y | | | | |
| user_id | = AbpUsers.Id | UUID | Y | | | (AbpUsers) | Y | | |
| organization_id | Đơn vị trực thuộc | UUID | Y | | | → organizations | | | |
| full_name | Họ và tên đầy đủ | VARCHAR(200) | Y | | | | | | |
| position | Chức danh/Chức vụ | VARCHAR(200) | N | | | | | | |
| department | Phòng/Ban | VARCHAR(200) | N | | | | | | |
| password_expires_at | Thời điểm mật khẩu hết hạn | TIMESTAMPTZ | N | | | | | | Y |
| must_change_password | Bắt buộc đổi mật khẩu lần tiếp theo | BOOL | Y | FALSE | | | | | |
| last_login_at | Thời điểm đăng nhập cuối | TIMESTAMPTZ | N | | | | | | |

---

## CATALOGS MODULE

*Tất cả catalog tables: Soft delete = Yes, Audit = Partial, Security = Internal, Growth = Low.*

---

### Table: `cat_countries`

**Business name:** Danh mục Quốc gia  
**Business purpose:** Xuất xứ sản phẩm, quốc gia đích cho CFS và Export Certificates.  
**Retention:** Vô thời hạn

| Column | Business Meaning | Type | Req | UQ | Notes |
|--------|-----------------|------|-----|----|-------|
| id | Khóa chính | UUID | Y | | |
| code_alpha2 | Mã ISO 3166-1 alpha-2 (VN, US, CN...) | VARCHAR(2) | Y | Y | |
| code_alpha3 | Mã ISO 3166-1 alpha-3 | VARCHAR(3) | N | | |
| name_vi | Tên tiếng Việt | VARCHAR(200) | Y | | |
| name_en | Tên tiếng Anh | VARCHAR(200) | N | | |
| is_active | Đang sử dụng | BOOL | Y | | DEFAULT TRUE |
| sort_order | Thứ tự hiển thị | INT | Y | | DEFAULT 0 |

---

### Table: `cat_regions`

**Business name:** Danh mục Vùng/Miền  
**Business purpose:** 8 vùng kinh tế-xã hội theo Nghị quyết, dùng cho phân tích địa lý.

| Column | Business Meaning | Type | Req | UQ |
|--------|-----------------|------|-----|-----|
| code | Mã vùng | VARCHAR(20) | Y | Y |
| name | Tên vùng (Đồng bằng sông Hồng, Trung du Bắc Bộ...) | VARCHAR(200) | Y | |
| description | Mô tả các tỉnh thuộc vùng | TEXT | N | |

---

### Table: `cat_provinces`

**Business name:** Danh mục Tỉnh/Thành phố  
**Business purpose:** 63 tỉnh thành Việt Nam. Dùng cho địa chỉ cơ sở, filter dữ liệu.

| Column | Business Meaning | Type | Req | FK | UQ |
|--------|-----------------|------|-----|----|----|
| region_id | Vùng miền | UUID | N | → cat_regions | |
| code | Mã VNDIVISION | VARCHAR(10) | Y | | Y |
| name | Tên đầy đủ (Tỉnh/TP Quảng Ninh) | VARCHAR(200) | Y | | |
| name_short | Tên viết tắt (Quảng Ninh) | VARCHAR(100) | N | | |

---

### Table: `cat_districts`

**Business name:** Danh mục Huyện/Quận  
**Business purpose:** Huyện/quận/thị xã/thành phố trực thuộc tỉnh. Liên kết địa chỉ cơ sở.

| Column | Business Meaning | Type | Req | FK | UQ | Check |
|--------|-----------------|------|-----|----|----|-------|
| province_id | Tỉnh cha | UUID | Y | → cat_provinces | | |
| code | Mã hành chính | VARCHAR(10) | Y | | Y | |
| name | Tên huyện/quận | VARCHAR(200) | Y | | | |
| type | Loại đơn vị | SMALLINT | Y | | | IN (1=Huyện, 2=Quận, 3=Thị xã, 4=TP) |

---

### Table: `cat_communes`

**Business name:** Danh mục Xã/Phường/Thị trấn  
**Business purpose:** Cấp xã — granularity địa chỉ thấp nhất trong hệ thống (~300 xã phường Quảng Ninh).

| Column | Business Meaning | Type | Req | FK | UQ | Check |
|--------|-----------------|------|-----|----|----|-------|
| district_id | Huyện cha | UUID | Y | → cat_districts | | |
| code | Mã hành chính | VARCHAR(10) | Y | | Y | |
| name | Tên xã/phường | VARCHAR(200) | Y | | | |
| type | Loại | SMALLINT | Y | | | IN (1=Xã, 2=Phường, 3=Thị trấn) |

---

### Table: `cat_product_groups`

**Business name:** Danh mục Nhóm Sản phẩm  
**Business purpose:** Phân nhóm thực phẩm 2 cấp theo Thông tư Bộ Y tế (Thịt, Thủy sản, Rau củ...).

| Column | Business Meaning | Type | Req | FK | UQ |
|--------|-----------------|------|-----|----|----|
| parent_id | Nhóm cha (NULL cho nhóm chính) | UUID | N | → self | |
| code | Mã nhóm | VARCHAR(50) | Y | | Y |
| name | Tên nhóm | VARCHAR(200) | Y | | |
| level | Cấp (1=Nhóm chính, 2=Nhóm phụ) | SMALLINT | Y | | |

---

### Table: `cat_business_types`

**Business name:** Danh mục Loại hình Cơ sở  
**Business purpose:** Phân loại hoạt động (Sản xuất, Kinh doanh, Dịch vụ ăn uống, Nhập khẩu...).

| Column | Business Meaning | Type | Req | UQ |
|--------|-----------------|------|-----|-----|
| code | Mã loại hình | VARCHAR(50) | Y | Y |
| name | Tên loại hình | VARCHAR(200) | Y | |
| description | Mô tả tiêu chí | TEXT | N | |

---

### Table: `cat_business_classifications`

**Business name:** Danh mục Phân loại Nguy cơ  
**Business purpose:** Xếp loại cơ sở theo mức độ nguy cơ ATTP (Cao/Vừa/Thấp).

| Column | Business Meaning | Type | Req | UQ | Check |
|--------|-----------------|------|-----|-----|-------|
| code | Mã phân loại | VARCHAR(50) | Y | Y | |
| name | Tên (Nguy cơ cao/vừa/thấp) | VARCHAR(200) | Y | | |
| criteria | Tiêu chí phân loại chi tiết | TEXT | N | | |
| risk_level | Mức độ nguy cơ | SMALLINT | Y | | IN (1=Cao, 2=Vừa, 3=Thấp) |

---

### Table: `cat_advertisement_types`

**Business name:** Danh mục Loại hình Quảng cáo  
**Business purpose:** Phương tiện quảng cáo thực phẩm (TV, Báo, Mạng xã hội...).

---

### Table: `cat_document_types`

**Business name:** Danh mục Loại Văn bản  
**Business purpose:** Loại văn bản hành chính (Thông tư, Nghị định, Quyết định, Công văn...).

---

### Table: `cat_testing_centers`

**Business name:** Danh mục Cơ sở Kiểm nghiệm  
**Business purpose:** Cơ sở kiểm nghiệm được chỉ định — dùng khi nhập kết quả kiểm nghiệm.  
**Soft delete:** Yes | **Audit fields:** Full ABP

| Column | Business Meaning | Type | Req | UQ | Sensitive |
|--------|-----------------|------|-----|----|-----------|
| code | Mã cơ sở kiểm nghiệm | VARCHAR(50) | Y | Y | |
| name | Tên đầy đủ | VARCHAR(300) | Y | | |
| address_street | Địa chỉ (VO) | TEXT | N | | |
| address_commune_id | Xã/Phường (VO) | UUID | N | | |
| phone | Điện thoại | VARCHAR(50) | N | | |
| email | Email | VARCHAR(200) | N | | |
| accreditation_number | Số chứng chỉ công nhận (ISO 17025) | VARCHAR(100) | N | | |
| accreditation_scope | Phạm vi kiểm nghiệm | TEXT | N | | |
| accreditation_expiry | Ngày hết hạn chứng nhận | DATE | N | | |

---

### Table: `cat_testing_services`

**Business name:** Danh mục Dịch vụ Kiểm nghiệm  
**Business purpose:** Dịch vụ cụ thể của từng cơ sở (Kim loại nặng, Vi sinh, Thuốc BVTV...).

| Column | Business Meaning | Type | Req | FK | Notes |
|--------|-----------------|------|-----|----|----|
| testing_center_id | Cơ sở kiểm nghiệm | UUID | Y | → cat_testing_centers | |
| code | Mã dịch vụ | VARCHAR(50) | Y | | |
| name | Tên dịch vụ | VARCHAR(300) | Y | | |
| unit | Đơn vị kiểm nghiệm (mg/kg, CFU/g...) | VARCHAR(50) | N | | |
| method | Phương pháp (TCVN 7788:2017...) | VARCHAR(200) | N | | |
| unit_price | Đơn giá (VND) | NUMERIC(18,2) | N | | |
| turnaround_days | Số ngày trả kết quả | INT | N | | |

---

## BUSINESS MANAGEMENT MODULE

---

### Table: `businesses`

**Business name:** Cơ sở Sản xuất Kinh doanh Thực phẩm  
**Business purpose:** Master data cơ sở SXKD — entity trung tâm của hệ thống, liên kết với giấy phép, thanh kiểm tra, kiểm nghiệm.  
**Owning bounded context:** BusinessManagement  
**Security classification:** Internal  
**Estimated growth:** Medium (vài trăm đến vài nghìn cơ sở Quảng Ninh)  
**Soft delete:** Yes | **Audit fields:** Full ABP  
**Retention:** Vô thời hạn (lịch sử cơ sở đã đóng cửa cần giữ lại)

| Column | Business Meaning | Type | Req | FK | UQ | Check | Sensitive |
|--------|-----------------|------|-----|----|----|-------|-----------|
| organization_id | Đơn vị quản lý | UUID | Y | → organizations | | | |
| code | Mã cơ sở (tự sinh) | VARCHAR(50) | N | | Y (partial) | | |
| name | Tên cơ sở | VARCHAR(500) | Y | | | | |
| business_type_id | Loại hình kinh doanh | UUID | N | → cat_business_types | | | |
| business_classification_id | Phân loại nguy cơ | UUID | N | → cat_business_classifications | | | |
| tax_code | Mã số thuế | VARCHAR(50) | N | | Y (partial, NEW) | | |
| representative_name | Chủ cơ sở/Người đại diện | VARCHAR(200) | N | | | | Y |
| representative_id_card | CMND/CCCD chủ cơ sở | VARCHAR(50) | N | | | | Y |
| contact_name | Người liên hệ | VARCHAR(200) | N | | | | |
| contact_phone | SĐT liên hệ | VARCHAR(50) | N | | | | |
| contact_email | Email liên hệ | VARCHAR(200) | N | | | | |
| address_street | Địa chỉ cụ thể (VO) | TEXT | N | | | | |
| address_commune_id | Xã/Phường (VO) | UUID | N | → cat_communes | | | |
| address_district_id | Huyện (VO) | UUID | N | → cat_districts | | | |
| address_province_id | Tỉnh (VO) | UUID | N | → cat_provinces | | | |
| address_latitude | Vĩ độ GPS | FLOAT8 | N | | | | |
| address_longitude | Kinh độ GPS | FLOAT8 | N | | | | |
| status | Trạng thái hoạt động | SMALLINT | Y | | | IN (1=Active,2=Inactive,3=Suspended) | |
| suspension_reason | Lý do đình chỉ | TEXT | N | | | | |
| has_eligibility_certificate | Có giấy DDK hiệu lực | BOOL | Y | | | | |
| established_date | Ngày thành lập | DATE | N | | | | |
| employee_count | Số nhân viên | INT | N | | | | |

**New columns (audit fixes):**
- `tax_code` thêm `UNIQUE INDEX uq_businesses_tax_code ... WHERE tax_code IS NOT NULL AND is_deleted = FALSE`

---

### Table: `business_product_groups`

**Business name:** Nhóm sản phẩm của Cơ sở (M2M)  
**Business purpose:** Gán nhóm sản phẩm đang kinh doanh cho cơ sở.  
**Soft delete:** No (CASCADE từ businesses)  
**Audit fields:** None

| Column | Type | Req | PK | FK |
|--------|------|-----|----|----|
| business_id | UUID | Y | Y | → businesses CASCADE |
| product_group_id | UUID | Y | Y | → cat_product_groups |

---

### Table: `business_handlers`

**Business name:** Người Trực tiếp Kinh doanh  
**Business purpose:** Người trực tiếp kinh doanh — có giấy tập huấn ATTP và khám sức khỏe.  
**Security classification:** Confidential  
**Soft delete:** Yes | **Audit fields:** Partial

| Column | Business Meaning | Type | Req | Sensitive |
|--------|-----------------|------|-----|-----------|
| business_id | Cơ sở | UUID | Y | |
| full_name | Họ tên | VARCHAR(200) | Y | Y |
| id_card_number | CMND/CCCD | VARCHAR(50) | N | Y |
| training_certificate_number | Số chứng nhận tập huấn ATTP | VARCHAR(100) | N | |
| training_date | Ngày tập huấn | DATE | N | |
| training_expiry_date | Hạn chứng nhận tập huấn | DATE | N | |
| health_certificate_number | Số giấy khám sức khỏe | VARCHAR(100) | N | |
| health_check_date | Ngày khám | DATE | N | |
| health_check_expiry_date | Hạn giấy khám sức khỏe | DATE | N | |

---

### Table: `products`

**Business name:** Sản phẩm Thực phẩm  
**Business purpose:** Sản phẩm do cơ sở sản xuất/kinh doanh — liên kết với tự công bố, DKCB, kiểm nghiệm.  
**Soft delete:** Yes | **Audit fields:** Full ABP | **Growth:** Medium

| Column | Business Meaning | Type | Req | FK |
|--------|-----------------|------|-----|-----|
| business_id | Cơ sở sở hữu | UUID | Y | → businesses |
| organization_id | Đơn vị quản lý (data scope) | UUID | Y | → organizations |
| code | Mã sản phẩm | VARCHAR(50) | N | |
| name | Tên sản phẩm | VARCHAR(500) | Y | |
| product_group_id | Nhóm sản phẩm | UUID | N | → cat_product_groups |
| brand_name | Tên thương hiệu | VARCHAR(200) | N | |
| manufacturer | Nhà sản xuất | VARCHAR(300) | N | |
| manufacturing_country_id | Xuất xứ | UUID | N | → cat_countries |
| ingredients | Thành phần nguyên liệu | TEXT | N | |
| expiry_period_months | Hạn sử dụng (tháng) | INT | N | |
| status | Trạng thái | SMALLINT | Y | |

---

### Table: `self_declarations`

**Business name:** Tự công bố Sản phẩm  
**Business purpose:** Giấy tự công bố theo Nghị định 15/2018 — cơ sở tự công bố chất lượng.  
**Security classification:** Internal | **Growth:** Medium  
**Soft delete:** Yes | **Audit fields:** Full ABP

| Column | Business Meaning | Type | Req | FK | UQ | Check |
|--------|-----------------|------|-----|----|----|-------|
| business_id | Cơ sở | UUID | Y | → businesses | | |
| product_id | Sản phẩm (nếu có) | UUID | N | → products | | |
| organization_id | Đơn vị quản lý | UUID | Y | → organizations | | |
| declaration_number | Số giấy tự công bố | VARCHAR(100) | Y | | Y (partial, NEW) | |
| declaration_date | Ngày công bố | DATE | Y | | | |
| product_name | Tên sản phẩm công bố | VARCHAR(500) | Y | | | |
| expiry_date | Ngày hết hạn | DATE | N | | | |
| status | Trạng thái | SMALLINT | Y | | | IN (1=Active,2=Expired,3=Revoked) |

---

## LICENSING MODULE

---

### Table: `product_registrations`

**Business name:** Đăng ký Công bố Sản phẩm — DKCB  
**Business purpose:** Giấy đăng ký công bố cho sản phẩm nhập khẩu, phụ gia. Cần số duy nhất.  
**Soft delete:** Yes | **Audit fields:** Full ABP | **Growth:** Medium

| Column | Business Meaning | Type | Req | UQ |
|--------|-----------------|------|-----|----|
| registration_number | Số đăng ký | VARCHAR(100) | Y | Y (partial, NEW) |
| receipt_number | Số tiếp nhận hồ sơ | VARCHAR(100) | N | |
| registration_date | Ngày đăng ký | DATE | Y | |
| expiry_date | Ngày hết hạn | DATE | N | |
| product_name | Tên sản phẩm | VARCHAR(500) | Y | |
| certifying_authority | Cơ quan cấp | VARCHAR(200) | N | |
| status | Trạng thái | SMALLINT | Y | |

---

### Table: `advertisement_registrations`

**Business name:** Đăng ký Nội dung Quảng cáo — DDK Quảng cáo  
**Business purpose:** Xác nhận nội dung quảng cáo thực phẩm theo Luật Quảng cáo.  
**Soft delete:** Yes | **Audit fields:** Full ABP

| Column | Business Meaning | Type |
|--------|-----------------|------|
| advertisement_type_id | Loại hình quảng cáo | UUID → cat_advertisement_types |
| registration_number | Số đăng ký | VARCHAR(100) |
| content_description | Mô tả nội dung | TEXT |
| medium | Phương tiện quảng cáo | VARCHAR(200) |

---

### Table: `advertisement_registration_products`

**Business name:** Sản phẩm trong Đăng ký Quảng cáo (M2M)  
**Business purpose:** Sản phẩm được quảng cáo trong giấy đăng ký.  
**Soft delete:** No (CASCADE) | **Audit:** None

| Column | Type | PK | FK |
|--------|------|----|----|
| advertisement_registration_id | UUID | Y | → advertisement_registrations CASCADE |
| product_id | UUID | Y | → products |

---

### Table: `eligibility_certificates`

**Business name:** Giấy Xác nhận Đủ Điều kiện ATTP — DDK  
**Business purpose:** Chứng nhận cơ sở đủ điều kiện VSATTP theo quy định.  
**Soft delete:** Yes | **Audit:** Full ABP

| Column | Business Meaning | Type | UQ |
|--------|-----------------|------|----|
| certificate_number | Số giấy chứng nhận | VARCHAR(100) | Y (partial, NEW) |
| issue_date | Ngày cấp | DATE | |
| expiry_date | Ngày hết hạn | DATE | |
| certifying_authority | Cơ quan cấp | VARCHAR(200) | |
| certification_scope | Phạm vi chứng nhận | TEXT | |

---

### Table: `cfs_certificates`

**Business name:** Giấy Chứng nhận Lưu hành Tự do — CFS  
**Business purpose:** Certificate of Free Sale — cho sản phẩm xuất khẩu ra nước ngoài.  
**Soft delete:** Yes | **Audit:** Full ABP

| Column | Business Meaning | Type | FK | UQ |
|--------|-----------------|------|----|----|
| certificate_number | Số CFS | VARCHAR(100) | | Y (partial, NEW) |
| destination_country_id | Quốc gia đích | UUID | → cat_countries | |

---

### Table: `export_food_certificates`

**Business name:** Giấy Chứng nhận Thực phẩm Xuất khẩu  
**Business purpose:** Chứng nhận lô hàng thực phẩm xuất khẩu cụ thể.  
**Soft delete:** Yes | **Audit:** Full ABP

| Column | Business Meaning | Type | UQ |
|--------|-----------------|------|----|
| certificate_number | Số giấy chứng nhận | VARCHAR(100) | Y (partial, NEW) |
| lot_number | Số lô hàng | VARCHAR(100) | |
| quantity | Số lượng | NUMERIC(18,3) | |
| quantity_unit | Đơn vị (tấn, kg, hộp) | VARCHAR(50) | |

---

## INSPECTION MODULE

---

### Table: `inspection_plans`

**Business name:** Kế hoạch Thanh Kiểm tra  
**Business purpose:** Kế hoạch thanh tra định kỳ/đột xuất — quản lý danh sách cơ sở và tiến độ.  
**Soft delete:** Yes | **Audit:** Full ABP | **Growth:** Low (vài chục kế hoạch/năm/đơn vị)

| Column | Business Meaning | Type | Req | FK | UQ | Check |
|--------|-----------------|------|-----|----|----|-------|
| organization_id | Đơn vị lập kế hoạch | UUID | Y | → organizations | | |
| plan_code | Mã kế hoạch | VARCHAR(50) | Y | | Y (plan_code, org) | |
| title | Tiêu đề kế hoạch | VARCHAR(500) | Y | | | |
| plan_type | Loại hình | SMALLINT | Y | | | IN (1=Annual,2=Periodic,3=Irregular,4=FollowUp) |
| year | Năm kế hoạch | INT | Y | | | |
| start_date | Ngày bắt đầu | DATE | N | | | |
| end_date | Ngày kết thúc | DATE | N | | | |
| status | Trạng thái workflow | SMALLINT | Y | | | IN (1–6) |
| approved_by_id | Người phê duyệt | UUID | N | (AbpUsers) | | |
| approved_at | Thời điểm phê duyệt | TIMESTAMPTZ | N | | | |
| rejected_reason | Lý do từ chối (NEW) | TEXT | N | | | |
| rejected_at | Thời điểm từ chối (NEW) | TIMESTAMPTZ | N | | | |
| rejected_by_id | Người từ chối (NEW) | UUID | N | | | |

**Workflow:** Draft(1) → Submitted(2) → Approved(3) → InProgress(4) → Completed(5) | Cancelled(6)

---

### Table: `inspection_plan_items`

**Business name:** Hạng mục Kế hoạch Thanh tra  
**Business purpose:** Từng cơ sở trong kế hoạch — phân công, lịch, trạng thái.  
**Soft delete:** No (CASCADE) | **Audit:** None

| Column | Business Meaning | Type | Req | FK | UQ |
|--------|-----------------|------|-----|----|----|
| plan_id | Kế hoạch | UUID | Y | → inspection_plans CASCADE | |
| business_id | Cơ sở cần thanh tra | UUID | Y | → businesses | |
| planned_date | Ngày dự kiến | DATE | N | | |
| assigned_inspector_id | Cán bộ phụ trách | UUID | N | (AbpUsers) | |
| status | Trạng thái | SMALLINT | Y | | |
| (combined) | (plan_id, business_id) | | | | Y (NEW) |

**Note:** UNIQUE `(plan_id, business_id)` thêm mới — ngăn cơ sở trùng trong cùng kế hoạch.

---

### Table: `inspection_results`

**Business name:** Kết quả Thanh Kiểm tra  
**Business purpose:** Ghi nhận kết quả thanh tra từng cơ sở — có thể độc lập hoặc gắn kế hoạch.  
**Soft delete:** Yes | **Audit:** Full ABP | **Growth:** Medium (vài nghìn biên bản/năm)

| Column | Business Meaning | Type | Req | FK | Notes |
|--------|-----------------|------|-----|-----|-------|
| plan_id | Kế hoạch (nullable) | UUID | N | → inspection_plans | NULL = thanh tra đột xuất |
| plan_item_id | Hạng mục kế hoạch | UUID | N | → inspection_plan_items | |
| business_id | Cơ sở | UUID | Y | → businesses | |
| inspection_date | Ngày thanh tra | DATE | Y | | |
| inspection_type | Loại hình | SMALLINT | Y | | |
| team_leader | Trưởng đoàn | VARCHAR(200) | N | | |
| team_members_text | Thành viên đoàn (text) | TEXT | N | | Dự phòng |
| overall_result | Kết quả tổng thể | SMALLINT | Y | | 1=Pass,2=Fail,3=Conditional |
| has_violation | Có vi phạm | BOOL | Y | | |
| fine_amount | Tiền phạt (VND) | NUMERIC(18,2) | N | | |
| admin_decision_number | Số quyết định xử phạt | VARCHAR(100) | N | | |
| follow_up_required | Cần thanh tra tiếp | BOOL | Y | | |

**CRITICAL change:** Cột `inspector_ids UUID[]` đã xóa — thay bằng `inspection_result_inspectors`.

---

### Table: `inspection_violations`

**Business name:** Vi phạm Thanh Kiểm tra  
**Business purpose:** Chi tiết từng vi phạm phát hiện trong buổi thanh tra.  
**Soft delete:** No | **Audit:** None

| Column | Business Meaning | Type | Req |
|--------|-----------------|------|-----|
| inspection_result_id | Kết quả thanh tra | UUID | Y |
| violation_code | Mã vi phạm | VARCHAR(50) | N |
| description | Mô tả vi phạm | TEXT | Y |
| regulation_reference | Điều khoản vi phạm | TEXT | N |
| fine_amount | Tiền phạt vi phạm này | NUMERIC(18,2) | N |
| remedy_required | Yêu cầu khắc phục | TEXT | N |
| remedy_deadline | Hạn khắc phục | DATE | N |
| is_remedied | Đã khắc phục | BOOL | Y |

---

### Table: `inspection_result_inspectors` (NEW)

**Business name:** Thành viên Đoàn Thanh tra  
**Business purpose:** Thay thế `inspector_ids UUID[]` — đảm bảo FK integrity, truy vấn được.  
**Owning bounded context:** Inspection  
**Soft delete:** No | **Audit:** None | **Growth:** Medium

| Column | Business Meaning | Type | Req | PK | FK |
|--------|-----------------|------|-----|----|----|
| inspection_result_id | Kết quả thanh tra | UUID | Y | Y | → inspection_results CASCADE |
| user_id | Cán bộ thanh tra | UUID | Y | Y | (AbpUsers) |
| role_in_team | Vai trò (Trưởng đoàn/Thành viên/Thư ký) | VARCHAR(100) | N | | |

---

## FOOD POISONING MODULE

---

### Table: `food_poisoning_cases`

**Business name:** Ca Ngộ độc Thực phẩm Nhỏ lẻ  
**Business purpose:** Ghi nhận ca ngộ độc riêng lẻ — có thể thuộc vụ ngộ độc lớn.  
**Security classification:** Confidential (thông tin nạn nhân)  
**Soft delete:** Yes | **Audit:** Full ABP | **Growth:** Low-Medium

| Column | Business Meaning | Type | Sensitive |
|--------|-----------------|------|-----------|
| incident_id | Vụ ngộ độc (nếu có) — NEW | UUID → food_poisoning_incidents | |
| case_code | Mã ca (unique/org) | VARCHAR(50) | |
| victim_name | Họ tên nạn nhân | VARCHAR(200) | Y |
| victim_age | Tuổi | INT | Y |
| victim_gender | Giới tính | SMALLINT | Y |
| victim_phone | SĐT | VARCHAR(50) | Y |
| victim_address | Địa chỉ nạn nhân | TEXT | Y |
| suspected_food | Thực phẩm nghi ngờ | TEXT | |
| symptoms | Triệu chứng | TEXT | |
| treatment_result | Kết quả điều trị | SMALLINT | |
| status | Trạng thái | SMALLINT | |

**Workflow:** Draft(1) → Reported(2) → Verified(3).

---

### Table: `poisoning_case_error_reports`

**Business name:** Phiếu Sai sót Ca Ngộ độc  
**Business purpose:** Thông báo sai sót sau khi ca đã Verified — không cho sửa trực tiếp.  
**Soft delete:** No | **Audit:** Partial

| Column | Business Meaning | Type |
|--------|-----------------|------|
| case_id | Ca ngộ độc | UUID → food_poisoning_cases |
| from_organization_id | Đơn vị phát hiện sai sót | UUID → organizations |
| error_description | Mô tả sai sót | TEXT |
| correction_request | Nội dung yêu cầu sửa | TEXT |
| status | Trạng thái xử lý | SMALLINT (1=Pending,2=Acknowledged,3=Corrected) |

---

### Table: `food_poisoning_incidents`

**Business name:** Vụ Ngộ độc Thực phẩm  
**Business purpose:** Vụ ngộ độc nhiều người (≥2 người cùng nguồn) — thống kê báo cáo NĐTP.  
**Soft delete:** Yes | **Audit:** Full ABP

| Column | Business Meaning | Type |
|--------|-----------------|------|
| incident_code | Mã vụ (unique/org) | VARCHAR(50) |
| exposed_count | Số người phơi nhiễm | INT |
| affected_count | Số mắc | INT |
| hospitalized_count | Số nhập viện | INT |
| death_count | Số tử vong | INT |
| causative_agent | Tác nhân gây bệnh | VARCHAR(200) |
| pathogen | Mầm bệnh cụ thể | VARCHAR(200) |
| conclusion | Kết luận điều tra | TEXT |
| status | Trạng thái | SMALLINT (1=Draft,2=Reported,3=Verified,4=Concluded) |

---

### Table: `poisoning_incident_error_reports`

**Business name:** Phiếu Sai sót Vụ Ngộ độc  
**Business purpose:** Tương tự `poisoning_case_error_reports` nhưng cho vụ ngộ độc.  
**Soft delete:** No | **Audit:** Partial

---

## REPORTING MODULE

---

### Table: `ndtp_reports`

**Business name:** Báo cáo Ngộ độc Thực phẩm Hàng tháng  
**Business purpose:** Báo cáo NĐTP hàng tháng — tổng hợp từ ca/vụ ngộ độc, gửi lên cấp trên.  
**Security classification:** Internal | **Growth:** Medium (13 huyện × 12 tháng/năm)  
**Soft delete:** Yes | **Audit:** Full ABP  
**UNIQUE:** `(organization_id, period_year, period_month)` — 1 báo cáo/tháng/đơn vị

| Column | Business Meaning | Type |
|--------|-----------------|------|
| period_year | Năm | INT |
| period_month | Tháng (1-12) | INT |
| case_count | Số ca ngộ độc | INT |
| case_affected | Số người mắc (ca lẻ) | INT |
| incident_count | Số vụ ngộ độc | INT |
| incident_deaths | Số tử vong (vụ) | INT |
| prevention_activities | Biện pháp phòng chống đã triển khai | TEXT |
| risk_factors | Yếu tố nguy cơ | TEXT |
| status | Trạng thái workflow | SMALLINT (1=Draft,2=Submitted,3=Verified,4=Returned,5=Completed) |
| return_reason | Lý do trả lại | TEXT |

---

### Table: `ndtp_report_error_notifications`

**Business name:** Phiếu Thông báo Sai sót Báo cáo NĐTP  
**Business purpose:** Thông báo sai sót từ cấp trên — sau khi báo cáo Submitted.  
**Soft delete:** No | **Audit:** Partial

---

### Table: `atp_work_reports`

**Business name:** Báo cáo Công tác ATTP (6 tháng / Năm)  
**Business purpose:** Báo cáo tổng kết công tác ATTP 6 tháng đầu năm và cả năm.  
**Soft delete:** Yes | **Audit:** Full ABP  
**UNIQUE:** Partial index cho halfyear và fullyear riêng biệt

| Column | Business Meaning | Type |
|--------|-----------------|------|
| period_type | Loại kỳ | SMALLINT (1=HalfYear, 2=FullYear) |
| period_half | Nửa năm (1 hoặc 2) | SMALLINT NULL |
| total_businesses | Tổng số cơ sở | INT |
| businesses_inspected | Số cơ sở được thanh tra | INT |
| fine_total_amount | Tổng tiền phạt (VND) | NUMERIC(18,2) |
| training_sessions | Số buổi tập huấn | INT |
| training_participants | Số lượt người tập huấn | INT |

---

### Table: `atp_work_report_error_notifications` (NEW)

**Business name:** Phiếu Sai sót Báo cáo Công tác ATTP  
**Business purpose:** Thông báo sai sót cho `atp_work_reports` — cùng cấu trúc với NĐTP error notifications.  
**Soft delete:** No | **Audit:** Partial

| Column | Type | FK |
|--------|------|----|
| report_id | UUID | → atp_work_reports |
| from_organization_id | UUID | → organizations |
| error_fields | TEXT | |
| correction_details | TEXT | |
| status | SMALLINT | |

---

### Table: `action_month_reports`

**Business name:** Báo cáo Tháng Hành động ATTP  
**Business purpose:** Báo cáo kết quả Tháng hành động ATTP (tháng 4-5 hàng năm).  
**UNIQUE:** `(organization_id, period_year)` | **Soft delete:** Yes | **Audit:** Full ABP

| Column | Business Meaning | Type |
|--------|-----------------|------|
| action_month_theme | Chủ đề tháng hành động | TEXT |
| media_articles | Số bài báo/phóng sự | INT |
| propaganda_sessions | Số buổi tuyên truyền | INT |
| participants | Tổng số người tham gia | INT |
| achievements | Kết quả đạt được | TEXT |
| lessons_learned | Bài học kinh nghiệm | TEXT |

---

### Table: `action_month_report_error_notifications` (NEW)

**Business name:** Phiếu Sai sót Báo cáo Tháng Hành động  
**Business purpose:** Thông báo sai sót cho `action_month_reports`.  
**Soft delete:** No | **Audit:** Partial  
**Structure:** Giống `atp_work_report_error_notifications`, thay `report_id` FK → `action_month_reports`.

---

## ALERTS AND TESTING MODULE

---

### Table: `atp_alerts`

**Business name:** Cảnh báo VSATTP  
**Business purpose:** Cảnh báo an toàn thực phẩm — từ nội bộ, từ dân, hoặc từ hệ thống ngoài. Được đăng lên cổng công khai.  
**Security classification:** Internal (Draft) / Public (Published)  
**Soft delete:** Yes | **Audit:** Full ABP | **Growth:** Low-Medium

| Column | Business Meaning | Type | Notes |
|--------|-----------------|------|-------|
| alert_number | Số hiệu cảnh báo | VARCHAR(50) | |
| title | Tiêu đề | VARCHAR(500) | |
| category | Danh mục | SMALLINT | 1=ATTP,2=Nhiễm,3=Hóa học,4=Sinh học,5=Vật lý,6=Khác |
| severity | Mức độ | SMALLINT | 1=Low,2=Medium,3=High,4=Critical |
| source | Nguồn | SMALLINT | 1=Internal,2=PublicReport,3=ExternalSystem |
| public_submission_id | Phản ánh từ dân (NEW) | UUID → public_alert_submissions | Liên kết ngược |
| is_public | Hiển thị công khai | BOOL | |
| status | Trạng thái | SMALLINT | 1=Draft,2=Published,3=Recalled |

---

### Table: `atp_news`

**Business name:** Tin tức Hoạt động ATTP  
**Business purpose:** Tin tức đăng lên cổng công khai — rich text, có ảnh, có thống kê lượt xem.  
**Soft delete:** Yes | **Audit:** Full ABP | **Growth:** Medium

| Column | Business Meaning | Type |
|--------|-----------------|------|
| title | Tiêu đề tin | VARCHAR(500) |
| summary | Tóm tắt | TEXT |
| content | Nội dung (rich text HTML đã sanitize) | TEXT |
| thumbnail_storage_path | Ảnh thumbnail (MinIO path) | VARCHAR(1000) |
| tags | Thẻ tag | TEXT[] |
| view_count | Lượt xem | INT |
| is_featured | Bài nổi bật | BOOL |

---

### Table: `news_linked_alerts`

**Business name:** Liên kết Tin tức — Cảnh báo (M2M)  
**Soft delete:** No | **Audit:** None

| Column | Type | PK | FK |
|--------|------|----|----|
| news_id | UUID | Y | → atp_news CASCADE |
| alert_id | UUID | Y | → atp_alerts |

---

### Table: `risk_analyses`

**Business name:** Phân tích Mối nguy cơ ATTP  
**Business purpose:** Tài liệu phân tích nguy cơ — được đăng công khai cho nhận thức cộng đồng.  
**Soft delete:** Yes | **Audit:** Full ABP

| Column | Business Meaning | Type |
|--------|-----------------|------|
| title | Tiêu đề phân tích | VARCHAR(500) |
| category | Chuyên mục | VARCHAR(200) |
| risk_level | Mức độ nguy cơ | SMALLINT (1=Low→4=Critical) |
| evidence_summary | Tóm tắt bằng chứng | TEXT |
| recommendations | Khuyến nghị | TEXT |
| is_public | Công khai | BOOL |

---

### Table: `testing_results`

**Business name:** Kết quả Kiểm nghiệm  
**Business purpose:** Kết quả kiểm nghiệm mẫu thực phẩm — liên kết cơ sở, sản phẩm, và dịch vụ.  
**Soft delete:** Yes | **Audit:** Full ABP | **Growth:** Medium

| Column | Business Meaning | Type | Notes |
|--------|-----------------|------|-------|
| business_id | Cơ sở lấy mẫu | UUID → businesses | Nullable |
| product_id | Sản phẩm kiểm nghiệm | UUID → products | Nullable |
| testing_center_id | Cơ sở kiểm nghiệm | UUID → cat_testing_centers | Required |
| sample_code | Mã mẫu | VARCHAR(100) | |
| sample_name | Tên mẫu | VARCHAR(500) | |
| overall_result | Kết quả tổng thể | SMALLINT | 1=Pass,2=Fail,3=Conditional; NULL=Pending |
| failed_parameters | Chỉ tiêu không đạt | TEXT | |
| certificate_number | Số phiếu kiểm nghiệm | VARCHAR(100) | |
| inspection_result_id | Liên kết TKT (nếu có) | UUID → inspection_results | |

---

### Table: `testing_result_services` (NEW)

**Business name:** Dịch vụ được áp dụng trong Kiểm nghiệm  
**Business purpose:** Liên kết kết quả kiểm nghiệm với dịch vụ cụ thể — thay thế việc chỉ lưu `testing_center_id`. Đáp ứng STT 37.  
**Owning bounded context:** AlertsAndTesting  
**Soft delete:** No | **Audit:** None

| Column | Business Meaning | Type | Req | PK | FK |
|--------|-----------------|------|-----|----|----|
| testing_result_id | Kết quả kiểm nghiệm | UUID | Y | Y | → testing_results CASCADE |
| testing_service_id | Dịch vụ kiểm nghiệm | UUID | Y | Y | → cat_testing_services |
| result_value | Giá trị kết quả | VARCHAR(200) | N | | |
| result_unit | Đơn vị kết quả | VARCHAR(50) | N | | |
| passed | Đạt chỉ tiêu | BOOL | N | | |
| notes | Ghi chú chỉ tiêu này | TEXT | N | | |

---

### Table: `regulatory_documents`

**Business name:** Văn bản Quy phạm Pháp luật  
**Business purpose:** Quản lý văn bản chỉ đạo ATTP — có full-text search, đăng công khai.  
**Soft delete:** Yes | **Audit:** Full ABP | **Growth:** Low-Medium

| Column | Business Meaning | Type | Notes |
|--------|-----------------|------|-------|
| document_type_id | Loại văn bản | UUID → cat_document_types | |
| document_number | Số văn bản | VARCHAR(100) | |
| title | Tiêu đề | VARCHAR(500) | |
| issuing_authority | Cơ quan ban hành | VARCHAR(200) | |
| issue_date | Ngày ban hành | DATE | |
| effective_date | Ngày có hiệu lực | DATE | |
| expiry_date | Ngày hết hiệu lực | DATE | |
| content_storage_path | File PDF (MinIO) | VARCHAR(1000) | |
| replaced_by_id | Thay thế bởi | UUID → self | |
| fts_vector | Vector full-text search (NEW) | TSVECTOR | GENERATED ALWAYS AS (to_tsvector('simple', title \|\| ' ' \|\| COALESCE(summary,''))) STORED |
| is_public | Công khai | BOOL | |

---

### Table: `public_alert_submissions`

**Business name:** Phản ánh Cảnh báo từ Người dân  
**Business purpose:** Tiếp nhận phản ánh qua cổng công khai (STT 49) — không yêu cầu đăng nhập.  
**Security classification:** Confidential (thông tin người gửi)  
**Soft delete:** Yes | **Audit:** ABP standard | **Growth:** Low

| Column | Business Meaning | Type | Sensitive |
|--------|-----------------|------|-----------|
| submitter_name | Tên người gửi (tùy chọn) | VARCHAR(200) | Y |
| submitter_phone | SĐT | VARCHAR(50) | Y |
| submitter_email | Email | VARCHAR(200) | Y |
| description | Mô tả vấn đề | TEXT | |
| tracking_code | Mã tra cứu (random, unique) | VARCHAR(20) | |
| captcha_verified | Đã xác minh CAPTCHA | BOOL | |
| status | Trạng thái xử lý | SMALLINT | |
| assigned_organization_id | Đơn vị xử lý | UUID → organizations | |

Conversion is derived from the unique authoritative
`atp_alerts.public_submission_id`; no reverse FK is stored here.

---

## CROSS-CUTTING

---

### Table: `document_owners`

**Business purpose:** Shared-primary-key supertype proving attachment owner
existence and organization equality.

| Column | Business Meaning | Type | Req |
|---|---|---|---|
| id | Same ID as the typed aggregate/submission | UUID | Y |
| organization_id | Inherited data scope; NULL only for anonymous/system owner | UUID | N |
| owner_type | Allowed typed aggregate name | VARCHAR(100) | Y |

### Table: `file_attachments`

**Business name:** File Đính kèm  
**Business purpose:** Metadata file lưu trên MinIO — áp dụng cho mọi entity trong hệ thống.  
**Security classification:** Internal  
**Soft delete:** Yes (soft delete, file MinIO giữ riêng) | **Audit:** Minimal | **Growth:** High

| Column | Business Meaning | Type | Req | Notes |
|--------|-----------------|------|-----|-------|
| document_owner_id | Owner có FK thật | UUID | Y | References document_owners |
| file_name | Tên file lưu (UUID-based) | VARCHAR(500) | Y | |
| original_name | Tên file gốc người dùng upload | VARCHAR(500) | Y | |
| storage_path | MinIO bucket/object path | VARCHAR(1000) | Y | |
| file_size | Kích thước (bytes) | BIGINT | Y | |
| mime_type | MIME type | VARCHAR(100) | N | |
| checksum | SHA-256 hash (NEW) | VARCHAR(64) | N | Verify integrity |
| virus_scan_status | Trạng thái quét virus (NEW) | SMALLINT | N | 1=Pending,2=Clean,3=Infected,4=Error |
| retention_status | Trạng thái retention | SMALLINT | Y | Active/Archived/PendingDeletion |
| retention_expires_at | Thời điểm hết retention | TIMESTAMPTZ | N | |
| is_public | Người dùng ẩn danh được download | BOOL | Y | DEFAULT FALSE |
| uploaded_by_id | AbpUsers.Id | UUID | N | |

---

### Table: `status_history`

**Business name:** Lịch sử Trạng thái Workflow  
**Business purpose:** Ghi lại mọi thay đổi trạng thái — ai thay đổi, khi nào, lý do. Bổ sung cho ABP audit log.  
**Soft delete:** No (immutable) | **Audit:** None | **Growth:** Medium

| Column | Business Meaning | Type | Req |
|--------|-----------------|------|-----|
| entity_type | Loại entity | VARCHAR(100) | Y |
| entity_id | ID entity | UUID | Y |
| from_status | Trạng thái trước | SMALLINT | N |
| to_status | Trạng thái sau | SMALLINT | Y |
| comment | Ghi chú / lý do | TEXT | N |
| changed_by_id | Người thay đổi | UUID | N |
| changed_at | Thời điểm | TIMESTAMPTZ | Y |

---

### Table: `cached_dashboard_stats`

**Business name:** Cache Thống kê Dashboard  
**Business purpose:** Pre-computed aggregates cho dashboard — refresh daily bởi background job.  
**Soft delete:** No | **Audit:** None | **Growth:** Low (1 row/ngày/đơn vị)

| Column | Business Meaning | Type |
|--------|-----------------|------|
| organization_id | Đơn vị | UUID |
| stats_date | Ngày tính | DATE |
| total_businesses | Tổng cơ sở | INT |
| active_alerts | Cảnh báo đang hiệu lực | INT |
| critical_alerts | Cảnh báo nghiêm trọng | INT |
| reports_pending_verification | Báo cáo chờ xác minh | INT |
| computed_at | Thời điểm tính | TIMESTAMPTZ |

**UNIQUE:** `(organization_id, stats_date)`.

---

### Table: `password_history` (NEW)

**Business name:** Lịch sử Mật khẩu  
**Business purpose:** Lưu 5 hash mật khẩu gần nhất — ngăn người dùng tái sử dụng.  
**Owning bounded context:** Organizations / Security  
**Security classification:** Sensitive  
**Soft delete:** No | **Audit:** Partial | **Growth:** Low  
**Retention:** Xóa tự động khi > 5 entries/user (trigger hoặc application logic)

| Column | Business Meaning | Type | Req | Notes |
|--------|-----------------|------|-----|-------|
| id | Khóa chính | UUID | Y | |
| user_id | AbpUsers.Id | UUID | Y | Index + CASCADE |
| password_hash | Hash mật khẩu (BCrypt) | VARCHAR(200) | Y | Không bao giờ expose |
| created_at | Thời điểm đặt mật khẩu | TIMESTAMPTZ | Y | DEFAULT NOW() |

**Sensitive:** `password_hash` — không bao giờ được SELECT ra ngoài application layer.

---

## DATA INTEGRATION MODULE

---

### Table: `api_specs`

**Business name:** Đặc tả API Tích hợp  
**Business purpose:** Cấu hình API với hệ thống ngoài (Bộ Y tế, Sở NN, Sở CT).  
**Security classification:** Confidential  
**Soft delete:** Yes | **Audit:** Full ABP | **Growth:** Low (<50 API specs)

| Column | Business Meaning | Type | Sensitive |
|--------|-----------------|------|-----------|
| api_code | Mã API | VARCHAR(50) | |
| partner_system | Hệ thống đối tác | VARCHAR(200) | |
| base_url | URL gốc | VARCHAR(500) | |
| data_type | Loại dữ liệu | SMALLINT | |
| direction | Hướng | SMALLINT | 1=Outbound,2=Inbound,3=Both |
| auth_type | Loại xác thực | SMALLINT | |
| auth_config_encrypted | Credentials (AES-256 encrypted JSON) | TEXT | Y |
| spec_document_path | File OpenAPI spec (MinIO) | VARCHAR(1000) | |

---

### Table: `data_sharing_histories`

**Business name:** Lịch sử Chia sẻ Dữ liệu  
**Business purpose:** Ghi lại mọi API call đi/đến — audit trail, retry logic, tuân thủ TT 31/2026.  
**Security classification:** Confidential  
**Soft delete:** No (immutable log) | **Audit:** None | **Growth:** High (mỗi API call = 1 row)  
**Retention:** 2 năm (cùng policy với audit log)

| Column | Business Meaning | Type | Notes |
|--------|-----------------|------|-------|
| organization_id | Đơn vị | UUID | |
| api_spec_id | Đặc tả API | UUID → api_specs | |
| direction | Hướng (Gửi/Nhận) | SMALLINT | |
| data_type | Loại dữ liệu | SMALLINT | |
| entity_type | Loại entity chia sẻ | VARCHAR(100) | |
| entity_id | ID entity | UUID | |
| idempotency_key | Khóa idempotency (NEW) | VARCHAR(100) | UNIQUE — tránh duplicate |
| request_payload | Payload gửi đi | TEXT | |
| response_status_code | HTTP status | INT | |
| response_payload | Response nhận về | TEXT | |
| payload_checksum | SHA-256 của payload (NEW) | VARCHAR(64) | Verify integrity |
| status | Kết quả | SMALLINT | 1=Success,2=Failed,3=Pending,4=Retrying |
| retry_count | Số lần thử lại | INT | |
| next_retry_at | Thời điểm retry tiếp (NEW) | TIMESTAMPTZ | NULL = không retry |
| error_message | Lỗi | TEXT | |
| duration_ms | Thời gian thực thi (ms) | INT | |
| initiated_at | Thời điểm khởi tạo | TIMESTAMPTZ | |
| completed_at | Thời điểm hoàn thành | TIMESTAMPTZ | |
## v2.3 added/changed structures

| Structure | Purpose |
|---|---|
| `management_scope_assignments` | Effective-dated focal-point jurisdiction by geography, business, business type, or product group, with operation flags |
| `document_owners` | Enforceable shared-primary-key attachment owner and organization scope |
| `ndtp_report_submissions` | Immutable NDTP report content per official submission |
| `atp_work_report_submissions` | Immutable ATTP work report content per official submission |
| `action_month_report_submissions` | Immutable action-month report content per official submission |
| `data_sharing_attempts` | Immutable details for the initial integration call and every retry |

`file_attachments` now uses `document_owner_id`; the former polymorphic
`entity_type`, `entity_id`, and `entity_version` fields are removed. Report
attachments bind to a submission owner. Product/licence/inspection/testing
relationships use composite owner FKs, and report headers now persist
`submitted_to_organization_id`.
