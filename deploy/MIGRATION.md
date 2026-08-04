# Chuyển FoodSafe sang máy chủ mới

Hướng dẫn chuyển toàn bộ hệ thống từ VM Google Cloud sang một VPS khác
(VNG / Viettel / FPT / Bizfly hoặc bất kỳ máy Ubuntu nào), **giữ nguyên tên miền
`attp.bluestar.com.vn` và toàn bộ dữ liệu**.

Lý do chuyển: project GCP `foodsafe-prod-7a3052` đã tắt billing nên pipeline
không đẩy được image lên Artifact Registry — deploy hỏng từ 02/08/2026. Sau khi
chuyển, hệ thống không còn phụ thuộc vào GCP: image chuyển sang **GitHub
Container Registry (GHCR)**, miễn phí và dùng luôn `GITHUB_TOKEN` của Actions.

## Trạng thái (04/08/2026)

Đã chuyển xong. `https://attp.bluestar.com.vn` phục vụ từ `45.119.83.83`, chứng
chỉ Let's Encrypt cấp lúc 07:27 UTC 04/08, hạn 02/11/2026.

| Bước | Trạng thái |
|---|---|
| 1–4 (dựng máy, nạp dữ liệu, kiểm thử bằng IP) | Xong |
| 5 (đổi DNS + bật HTTPS) | Xong |
| 6 (`VM_HOST` trỏ máy mới) | Xong |
| 7 (dọn GCP) | Chưa — giữ máy cũ làm phương án lùi |

> **Máy cũ vẫn đang chạy và vẫn phục vụ các client còn cache DNS cũ.** Ở trạng
> thái này hai máy cùng nhận ghi trên cùng một tên miền: dữ liệu nhập vào máy cũ
> sẽ không có trên máy mới. Nên dừng stack máy cũ (`docker compose stop`) ngay
> khi TTL cũ hết hạn — giữ nguyên VM và volume để còn đường lùi. Đối chiếu lúc
> cắt DNS: cả hai máy đều 10 cơ sở / 15 tài khoản / 11 tệp / 4 kết quả kiểm tra.

## Yêu cầu máy mới

| Hạng mục | Tối thiểu | Ghi chú |
|---|---|---|
| OS | Ubuntu 22.04 hoặc 24.04 | Script provision viết cho Ubuntu |
| vCPU / RAM | 2 vCPU / 4 GB | Stack chạy 7 container; ClamAV chiếm nhiều RAM nhất |
| Ổ đĩa | 40 GB | VM cũ đang dùng 17 GB |
| Cổng mở | 22, 80, 443 | 80/443 cho Caddy tự xin chứng chỉ Let's Encrypt |
| IP | IP tĩnh công khai | Cần cho bản ghi A của tên miền |

> Máy đang dùng chỉ có **1 vCPU / 1967 MB RAM**, thấp hơn mức khuyến nghị. Đo
> thật khi chạy đủ 7 container: dùng 1574 MB, còn trống 393 MB, đã chạm swap
> 515 MB (ClamAV một mình chiếm 740 MB). Hiện đáp ứng được tải kiểm thử nhưng
> không còn dư địa cho tăng trưởng dữ liệu hay quét virus nhiều tệp cùng lúc.
> **Không tắt ClamAV để lấy RAM**: `ClamAvFileMalwareScanner` fail-closed — mất
> ClamAV là toàn bộ chức năng tải tệp đính kèm ngừng hoạt động.

## Dữ liệu đã sao lưu

Thư mục `migration-backup/` trên máy local (đã đưa vào `.gitignore` vì chứa
secrets — **hãy sao lưu riêng, đừng commit**):

| File | Nội dung |
|---|---|
| `foodsafe-db.dump` | Toàn bộ PostgreSQL (định dạng custom, `pg_restore`) |
| `minio-data.tar.gz` | Toàn bộ tệp đính kèm trong MinIO |
| `data-protection-keys.tar.gz` | Khóa DataProtection — giữ phiên đăng nhập và token đặt lại mật khẩu còn hiệu lực |
| `vm.env` | File `.env` của VM cũ, gồm **mọi mật khẩu và passphrase** |

> **Quan trọng:** phải mang nguyên `STRING_ENCRYPTION_PASSPHRASE` trong `vm.env`
> sang máy mới. Thông tin xác thực của đối tác liên thông được mã hóa bằng
> passphrase này; đổi passphrase là không giải mã lại được.

## Các bước

### 1. Chuẩn bị máy mới

Trên máy mới, chạy với quyền root:

```bash
sudo bash provision-vps.sh 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAICQ8bQe63ztQwIaLFd39neIFMDKrhR6vQVOet4aEdyVO foodsafe-deploy'
```

Script này cài Docker, tạo user `deploy`, mở cổng 22/80/443 và tạo
`/opt/foodsafe`. Khóa công khai ở trên chính là khóa deploy hiện có
(`scripts/gcp/.secrets/deploy_key`), nên **không cần đổi secret
`VM_SSH_PRIVATE_KEY` trên GitHub**.

### 2. Đưa cấu hình và dữ liệu lên máy mới

```bash
KEY=scripts/gcp/.secrets/deploy_key
NEW_HOST=<IP máy mới>

scp -i $KEY deploy/docker-compose.cloud.yml deploy@$NEW_HOST:/opt/foodsafe/docker-compose.yml
scp -i $KEY deploy/Caddyfile                deploy@$NEW_HOST:/opt/foodsafe/Caddyfile
scp -i $KEY deploy/restore-from-backup.sh   deploy@$NEW_HOST:/home/deploy/
scp -i $KEY migration-backup/*              deploy@$NEW_HOST:/home/deploy/migration-backup/
scp -i $KEY migration-backup/vm.env         deploy@$NEW_HOST:/opt/foodsafe/.env
```

Sau đó sửa `/opt/foodsafe/.env` trên máy mới. Bản gốc trỏ tên miền được giữ tại
`/opt/foodsafe/.env.production-domain.bak` để khôi phục ở bước 5:

```bash
IMAGE_REPO=ghcr.io/minhhung19872002       # thay Artifact Registry của GCP
SITE_DOMAIN=:80                            # tạm chạy HTTP đến khi DNS trỏ xong
PUBLIC_BASE_URL=http://<IP mới>            # CORS + authority phải khớp URL đang gõ
REQUIRE_HTTPS_METADATA=false               # OpenIddict từ chối authority http://
CAPTCHA_EXPECTED_HOSTNAME=<IP mới>         # Turnstile đối chiếu hostname
```

Giữ `SITE_DOMAIN=:80` ở bước này là cố ý: Caddy chỉ xin được chứng chỉ khi bản
ghi A đã trỏ về IP mới, xin sớm sẽ bị Let's Encrypt tính lượt thất bại.

### 3. Kéo image và khôi phục dữ liệu

Không cần Personal Access Token: workflow `deploy.yml` tự `docker login ghcr.io`
bằng `GITHUB_TOKEN` của từng lần chạy, nên máy chủ không lưu thông tin đăng nhập
registry dài hạn.

Nạp dữ liệu trước, dùng image công khai (PostgreSQL + MinIO) nên không cần chờ
build xong:

```bash
ssh -i $KEY deploy@$NEW_HOST
cd /opt/foodsafe && docker compose up -d postgres minio
RESTORE_CONFIRM=yes bash ~/restore-from-backup.sh ~/migration-backup
```

Script sẽ dừng ứng dụng, nạp lại database, tệp đính kèm và khóa DataProtection,
rồi khởi động lại — migrator tự áp các migration mới. Bước `up -d` cuối sẽ báo
`denied` nếu image chưa được build lên GHCR lần nào; dữ liệu vẫn đã nạp xong,
lần deploy kế tiếp sẽ dựng nốt ứng dụng.

Nếu script báo `set: pipefail: invalid option name` thì file bị dính ký tự xuống
dòng kiểu Windows khi `scp` từ máy local: `sed -i 's/\r$//' ~/restore-from-backup.sh`.

### 4. Kiểm thử khi chưa đổi DNS

```bash
curl -I http://$NEW_HOST/health                       # phải trả 200
curl -s http://$NEW_HOST/api/v1/public/branding | head -c 200
```

Mở trình duyệt vào `http://<IP mới>` và đăng nhập bằng tài khoản quản trị cũ —
mật khẩu giữ nguyên vì database được bê nguyên sang.

### 5. Đổi DNS

Tại PA Việt Nam, sửa bản ghi A của `attp.bluestar.com.vn` từ `136.85.108.207`
sang IP mới. Nên hạ TTL xuống 300 giây **trước đó vài giờ** để đổi nhanh.

Khi `dig +short attp.bluestar.com.vn` đã trả IP mới, khôi phục cấu hình tên miền
(gồm cả `PUBLIC_BASE_URL`, `REQUIRE_HTTPS_METADATA`, `CAPTCHA_EXPECTED_HOSTNAME`)
và bật HTTPS:

```bash
ssh -i $KEY deploy@$NEW_HOST "cd /opt/foodsafe \
  && sed -i 's#^SITE_DOMAIN=.*#SITE_DOMAIN=attp.bluestar.com.vn#' .env \
  && sed -i 's#^PUBLIC_BASE_URL=.*#PUBLIC_BASE_URL=https://attp.bluestar.com.vn#' .env \
  && sed -i 's#^REQUIRE_HTTPS_METADATA=.*#REQUIRE_HTTPS_METADATA=true#' .env \
  && sed -i 's#^CAPTCHA_EXPECTED_HOSTNAME=.*#CAPTCHA_EXPECTED_HOSTNAME=attp.bluestar.com.vn#' .env \
  && docker compose up -d"
```

Sửa từng dòng chứ đừng chép đè `.env.production-domain.bak`: bản sao lưu đó còn
giữ `IMAGE_TAG` thời Artifact Registry, chép đè sẽ trỏ vào tag không tồn tại
trên GHCR.

Chỉ đổi `SITE_DOMAIN` là chưa đủ: để nguyên `PUBLIC_BASE_URL=http://<IP>` thì
đăng nhập qua tên miền sẽ hỏng vì CORS và authority không khớp.

Caddy tự xin chứng chỉ trong khoảng 30 giây. Kiểm tra:

```bash
curl -I https://attp.bluestar.com.vn/health
```

### 6. Trỏ CI/CD sang máy mới

Trên GitHub → Settings → Secrets and variables → Actions, sửa **một** secret:

| Secret | Giá trị mới |
|---|---|
| `VM_HOST` | IP máy mới |

Các secret GCP (`GCP_WIF_PROVIDER`, `GCP_DEPLOY_SA`, `GCP_PROJECT_ID`) không còn
được workflow nào dùng. **Chỉ xóa sau khi đã đổi DNS xong và máy mới chạy ổn
định** — còn giữ máy cũ làm phương án lùi thì giữ luôn secret.
`VM_SSH_PRIVATE_KEY` giữ nguyên: khóa deploy dùng chung cho cả hai máy.

Chạy thử: Actions → Deploy → **Run workflow**. Pipeline mới build image, đẩy lên
GHCR, ssh sang máy mới, `docker compose pull && up -d`, rồi kiểm tra `/health`.

### 7. Dọn dẹp GCP

Chỉ làm **sau khi** máy mới chạy ổn định vài ngày:

1. Tải thêm một bản sao lưu cuối từ VM cũ (phòng khi phát hiện thiếu dữ liệu).
2. Xóa VM `foodsafe-vm` và IP tĩnh trong project `foodsafe-prod-7a3052`.
3. Xóa project nếu không dùng cho việc gì khác.

## Ghi chú

- **Môi trường**: máy cũ chạy `ASPNETCORE_ENVIRONMENT=Staging`. Chuyển sang
  `Production` cần đủ 4 điều kiện: SMTP có TLS + khóa Turnstile thật + PostgreSQL
  bật SSL + chứng chỉ PFX cho DataProtection (xem `deploy/README.md`).
- **Dữ liệu demo**: `SEED_ENABLE_DEMO_DATA=true` đang bật. Trước khi bàn giao
  chính thức nên đặt `false` và xóa dữ liệu demo.
- **Sao lưu định kỳ**: máy mới chưa có lịch backup. Nên đặt cron chạy
  `pg_dump` + tar volume MinIO hằng ngày ra ổ lưu trữ ngoài máy.
