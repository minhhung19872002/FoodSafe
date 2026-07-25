# State Machines — FoodSafe Workflows

> Tài liệu này mô tả chi tiết các state machine trong hệ thống.  
> Implement bằng: Domain Entity methods + Domain Events + ABP Background Jobs

---

## 1. Reporting Workflow (3 loại báo cáo)

*Áp dụng cho: NdtpReport, AtpWorkReport, ActionMonthReport*

```
                    ┌─────────────────────────────────────────────────────────┐
                    │                                                           │
              ┌─────▼──────┐                                                   │
   CREATE ──► │   Draft    │ ◄─────────────────────────────────────────────────┘
              └─────┬──────┘                         Returned → ReturnToDraft()
                    │ Submit()
                    ▼
              ┌────────────┐    Verify()    ┌──────────┐
              │ Submitted  │ ──────────────► │ Verified │
              └─────┬──────┘                └────┬─────┘
                    │                            │
                    │ Return()                   │ Return() (optional)
                    │                            │
                    ▼                            ▼
              ┌─────────┐               ┌─────────────┐
              │Returned │               │  Returned   │
              └────┬────┘               └──────┬──────┘
                   │                           │
                   └────────────┬──────────────┘
                                │ ReturnToDraft() — tự động hoặc thủ công
                                ▼
                           ┌──────────┐
                           │  Draft   │  (tiếp tục sửa và nộp lại)
                           └──────────┘

              ┌──────────┐ Complete()  ┌───────────┐
              │ Verified │ ──────────► │ Completed │ (trạng thái cuối)
              └──────────┘             └───────────┘
```

### Transition Rules:

| From | To | Method | Actor | Condition |
|------|----|--------|-------|-----------|
| Draft | Submitted | Submit() | Cán bộ đơn vị | |
| Submitted | Verified | Verify() | Cán bộ cấp trên | |
| Submitted | Returned | Return() | Cán bộ cấp trên | reason required |
| Verified | Returned | Return() | Cán bộ cấp cao hơn | reason required |
| Verified | Completed | Complete() | Cán bộ cấp trên | |
| Returned | Draft | ReturnToDraft() | System (auto) | After return notified |

### Business Rules:
- **Không cho sửa trực tiếp** sau khi Submit — phải Return về Draft
- `Submit()` inserts exactly one immutable typed submission snapshot for the
  current `submission_version`, including sender, recipient, actor/time,
  complete content JSON, and SHA-256. The transaction fails if the snapshot
  cannot be inserted.
- Attachments sealed with an official submission reference that submission
  snapshot's `document_owner`, not the mutable report header.
- **Phiếu thông báo sai sót** (ErrorNotification) chỉ tạo được khi report đang ở Verified
- Mỗi tổ hợp (org_id, period_year, period_month) chỉ có 1 báo cáo NĐTP active
- Cùng kỳ nếu muốn tạo lại: phải Completed cũ trước, hoặc báo cáo cũ đang Draft/Returned

### Domain Events:
- `ReportSubmittedEvent` → Background Job: gửi email thông báo cho cấp xác minh
- `ReportReturnedEvent` → Background Job: gửi email cho đơn vị báo lý do trả lại

---

## 2. Food Poisoning Case Workflow

```
              ┌─────────────────────────────────────────┐
              │                                           │
   CREATE ──► │   Draft   │ ◄─────────────── Khi sai sót được ghi nhận
              └─────┬─────┘                              │
                    │ Submit()                    ┌───────┴───────┐
                    ▼                             │  (Sai sót    │
              ┌──────────┐   Verify()   ┌──────► │  Pending)     │
              │ Reported │ ──────────── ► Verified│               │
              └──────────┘              └────────┴───────────────┘
                                             │
                                             │ AddErrorReport() — chỉ AFTER Verify
                                             ▼
                                        ┌────────────────────────┐
                                        │ PoisoningCaseErrorReport│
                                        │ Status: Pending         │
                                        │        Acknowledged     │
                                        │        Corrected        │
                                        └────────────────────────┘
```

### Transition Rules:

| From | To | Method | Actor | Condition |
|------|----|--------|-------|-----------|
| Draft | Reported | Submit() | Cán bộ | |
| Reported | Verified | Verify() | Cán bộ cấp trên | |

### Business Rules:
- Ca ngộ độc đã Verified **KHÔNG được sửa trực tiếp**
- Để sửa: tạo `PoisoningCaseErrorReport`, cơ quan nhận xử lý
- ErrorReport.status: Pending → Acknowledged → Corrected
- Mã ca ngộ độc (case_code) tự động sinh: `NDTP-{org_code}-{YYYY}-{sequence}`

---

## 3. Food Poisoning Incident Workflow

```
              ┌─────────────────────────────────────────────┐
              │                                               │
   CREATE ──► │   Draft   │                                   │
              └─────┬─────┘                                   │
                    │ Submit()                                │
                    ▼                                         │
              ┌──────────┐   Verify()   ┌──────────┐         │
              │ Reported │ ──────────── ► Verified  │         │
              └──────────┘              └─────┬────┘         │
                                              │               │
                                              │ Conclude()    │  AddErrorReport()
                                              ▼               │
                                       ┌────────────┐         │
                                       │ Concluded  │  ◄──────┘  (chỉ sau Verified)
                                       └────────────┘
                                        (trạng thái cuối)
```

### Transition Rules:

| From | To | Method | Actor | Condition |
|------|----|--------|-------|-----------|
| Draft | Reported | Submit() | Cán bộ | |
| Reported | Verified | Verify() | Cán bộ cấp trên | |
| Verified | Concluded | Conclude() | Cán bộ | Phải có nội dung kết luận |

---

## 4. ATTP Alert Workflow

```
   CREATE (Internal)  ──► ┌───────┐   Publish()   ┌──────────┐
   CREATE (From Public) ► │ Draft │ ──────────────► │Published │
                          └───────┘                └────┬─────┘
                                                        │ Recall()
                                                        ▼
                                                   ┌──────────┐
                                                   │ Recalled │ (trạng thái cuối)
                                                   └──────────┘
```

### Transition Rules:

| From | To | Method | Actor | Condition |
|------|----|--------|-------|-----------|
| Draft | Published | Publish() | Cán bộ có quyền | |
| Published | Recalled | Recall() | Cán bộ có quyền | recall_reason required |

### Business Rules:
- **Public submissions** (STT 49) tạo ra `PublicAlertSubmission`, không phải `AtpAlert` trực tiếp
- Cán bộ xét duyệt `PublicAlertSubmission` → Nếu hợp lệ → Tạo `AtpAlert` từ submission
- Khi Publish: `is_public = true` → hiển thị trên cổng công khai
- Khi Recall: xóa khỏi cổng công khai, ghi reason
- Domain Event `AlertPublishedEvent` → trigger DataIntegration module gửi alert cho Bộ Y tế

---

## 5. ATTP News Workflow

```
   CREATE ──► │ Draft │ ─── Publish() ──► │ Published │ ─── Recall() ──► │ Recalled │
```

*(Đơn giản hơn Alert — chỉ 3 trạng thái, không có pending)*

---

## 6. Inspection Plan Workflow

```
   CREATE ──► ┌───────┐ Submit() ┌───────────┐ Approve() ┌──────────┐
              │ Draft │ ──────── ► Submitted  │ ─────────► │ Approved │
              └───────┘          └─────┬─────┘            └────┬─────┘
                                       │                        │
                                       │ Reject()               │ (thanh tra bắt đầu)
                                       ▼                        ▼
                                  ┌──────────┐          ┌──────────────┐
                                  │  Draft   │          │  InProgress  │
                                  └──────────┘          └──────┬───────┘
                                                               │ Complete()
                                                               ▼
                                                        ┌────────────┐
                                                        │ Completed  │
                                                        └────────────┘
                         Cancel() từ bất kỳ trạng thái (trừ Completed) ──►
                                                        ┌────────────┐
                                                        │ Cancelled  │
                                                        └────────────┘
```

### Transition Rules:

| From | To | Method | Actor | Condition |
|------|----|--------|-------|-----------|
| Draft | Submitted | Submit() | Cán bộ | Items.Any() |
| Submitted | Approved | Approve() | Lãnh đạo | |
| Submitted | Draft | Reject() | Lãnh đạo | reason required |
| Approved | InProgress | (Auto/manual) | System | Khi có inspection result đầu tiên |
| InProgress | Completed | Complete() | Cán bộ | |
| Any(!Completed) | Cancelled | Cancel() | Cán bộ | |

### Business Rules:
- **Chỉ Draft** mới cho phép thêm/bỏ businesses
- Sau Approve: tạo được InspectionResult cho từng business trong plan
- Sau Complete: plan locked, không thay đổi được

---

## 7. Public Alert Submission Workflow (STT 49)

```
   PUBLIC SUBMIT ──► ┌─────────┐ Assign() ┌─────────────┐ ConvertToAlert()  ┌─────────────────┐
                     │ Pending │ ───────── ► UnderReview │ ────────────────── ► ConvertedToAlert │
                     └─────────┘           └──────┬──────┘                   └─────────────────┘
                                                  │ Dismiss()
                                                  ▼
                                          ┌───────────┐
                                          │ Dismissed │
                                          └───────────┘
```

### Business Rules:
- Tracking code sinh ngẫu nhiên 10 ký tự, unique — gửi lại cho người dân tra cứu
- CAPTCHA bắt buộc trước khi gửi
- Cán bộ xem danh sách Pending → Phân công xử lý → Xác minh → Quyết định
- Nếu Convert: tạo đúng một AtpAlert mới, điền sẵn thông tin từ submission.
  `atp_alerts.public_submission_id` là FK duy nhất/có UNIQUE và là quan hệ
  authoritative; không lưu reverse FK độc lập trên submission.

---

## 8. License Expiry Lifecycle (Background Job)

```
   Active ──► (Background Job hàng ngày) ──►
              
   Nếu expiry_date trong 90 ngày: gửi cảnh báo đầu tiên
   Nếu expiry_date trong 60 ngày: gửi cảnh báo thứ hai
   Nếu expiry_date trong 30 ngày: gửi cảnh báo nghiêm trọng
   Nếu expiry_date đã qua:        status → Expired (auto update)
```

*Áp dụng cho: ProductRegistration, AdvertisementRegistration, EligibilityCertificate, CfsCertificate, ExportFoodCertificate*

---

## 9. Report Error Notification Lifecycle

```
   (Sau khi Report ở Verified)
   
   FROM_ORG tạo ErrorNotification → Status: Pending
   TO_ORG (cơ quan nhận) xem xét → Status: Acknowledged
   Cơ quan nhận xử lý sửa lỗi → Tạo Report mới hoặc cập nhật → Status: Corrected
```

---

## Tổng hợp Domain Events và Handlers

| Event | Publisher | Handler (Background Job) |
|-------|-----------|--------------------------|
| `ReportSubmittedEvent` | Report.Submit() | SendEmailToVerifier |
| `ReportReturnedEvent` | Report.Return() | SendEmailToReporter |
| `ReportCompletedEvent` | Report.Complete() | UpdateDashboardCache |
| `AlertPublishedEvent` | Alert.Publish() | SyncAlertToPublicPortal, TriggerDataIntegration |
| `PoisoningCaseReportedEvent` | Case.Submit() | AggregateToNdtpReport |
| `PoisoningIncidentReportedEvent` | Incident.Submit() | AggregateToNdtpReport |
| `LicenseExpiringEvent` | ScheduledJob (daily) | SendExpiryWarningEmail |
| `LicenseExpiredEvent` | ScheduledJob (daily) | UpdateLicenseStatus |
| `InspectionPlanApprovedEvent` | Plan.Approve() | SendEmailToInspectors |
| `BusinessCreatedEvent` | Business.Create() | IncrementDashboardStats |

---

## Permission Matrix cho Transitions

| Transition | Cán bộ Xã | Cán bộ Huyện | Cán bộ Tỉnh | Admin |
|-----------|-----------|-------------|------------|-------|
| Report.Submit() | ✓ (báo cáo của đơn vị mình) | ✓ | ✓ | ✓ |
| Report.Verify() | ✗ | ✓ (verify của xã thuộc huyện) | ✓ (verify của huyện) | ✓ |
| Report.Return() | ✗ | ✓ | ✓ | ✓ |
| Report.Complete() | ✗ | ✓ | ✓ | ✓ |
| Alert.Publish() | ✗ | ✓ | ✓ | ✓ |
| Plan.Approve() | ✗ | ✓ (duyệt của huyện) | ✓ | ✓ |
| Case.Verify() | ✗ | ✓ | ✓ | ✓ |
