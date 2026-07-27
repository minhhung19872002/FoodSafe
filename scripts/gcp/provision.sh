#!/usr/bin/env bash
# Provision Google Cloud infrastructure for FoodSafe single-VM deployment.
#
# Idempotent — safe to re-run. Run from repo root in Git Bash:
#   bash scripts/gcp/provision.sh
#
# Prerequisites:
#   - gcloud authenticated as the deploy account (gcloud auth login)
#   - an OPEN billing account on that account
#   - gh CLI authenticated against the GitHub repo (for setting Actions secrets)
#   - openssl + ssh-keygen available (Git Bash has both)
#
# Creates:
#   - GCP project (linked to first open billing account)
#   - Artifact Registry docker repo
#   - Static external IP + firewall rules (80/443)
#   - Ubuntu 22.04 VM (e2-standard-2) with docker preinstalled via startup script
#   - Workload Identity Federation pool/provider + deploy service account
#     for keyless GitHub Actions authentication
#   - SSH deploy key (metadata-based) for the `deploy` user
#   - /opt/foodsafe on the VM with docker-compose.yml + generated .env
#   - GitHub Actions secrets (GCP_*, VM_*)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
STATE_DIR="$SCRIPT_DIR/.secrets"
STATE_FILE="$STATE_DIR/state.env"
mkdir -p "$STATE_DIR"

# Load persisted state (PROJECT_ID from a previous run) before defaults.
[ -f "$STATE_FILE" ] && source "$STATE_FILE"

GCP_ACCOUNT="${GCP_ACCOUNT:-minhhung19872003@gmail.com}"
PROJECT_ID="${PROJECT_ID:-foodsafe-prod-$(openssl rand -hex 3)}"
REGION="${REGION:-asia-southeast1}"
ZONE="${ZONE:-asia-southeast1-b}"
VM_NAME="${VM_NAME:-foodsafe-vm}"
VM_MACHINE_TYPE="${VM_MACHINE_TYPE:-e2-standard-2}"
VM_DISK_GB="${VM_DISK_GB:-40}"
AR_REPO="${AR_REPO:-foodsafe}"
ADDRESS_NAME="${ADDRESS_NAME:-foodsafe-ip}"
GITHUB_REPO="${GITHUB_REPO:-minhhung19872002/FoodSafe}"
WIF_POOL="${WIF_POOL:-github}"
WIF_PROVIDER="${WIF_PROVIDER:-github-oidc}"
DEPLOY_SA_NAME="${DEPLOY_SA_NAME:-github-deploy}"
SSH_KEY_FILE="$STATE_DIR/deploy_key"
VM_ENV_FILE="$STATE_DIR/foodsafe.env"

log() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }

# ---------------------------------------------------------------- account
log "Checking gcloud account"
ACTIVE_ACCOUNT="$(gcloud auth list --filter=status:ACTIVE --format='value(account)')"
if [ "$ACTIVE_ACCOUNT" != "$GCP_ACCOUNT" ]; then
  echo "Active gcloud account is '$ACTIVE_ACCOUNT', expected '$GCP_ACCOUNT'."
  echo "Run: gcloud config set account $GCP_ACCOUNT   (or gcloud auth login $GCP_ACCOUNT)"
  exit 1
fi

# ---------------------------------------------------------------- project
log "Ensuring project $PROJECT_ID"
if ! gcloud projects describe "$PROJECT_ID" >/dev/null 2>&1; then
  gcloud projects create "$PROJECT_ID" --name="FoodSafe Production"
fi
gcloud config set project "$PROJECT_ID" --quiet

# Persist state immediately so re-runs reuse the same project id.
cat > "$STATE_FILE" <<EOF
PROJECT_ID=$PROJECT_ID
REGION=$REGION
ZONE=$ZONE
VM_NAME=$VM_NAME
EOF

log "Linking billing"
BILLING_LINKED="$(gcloud billing projects describe "$PROJECT_ID" --format='value(billingEnabled)' 2>/dev/null || echo False)"
if [ "$BILLING_LINKED" != "True" ]; then
  BILLING_ACCOUNT="$(gcloud billing accounts list --filter=open=true --format='value(name)' | head -1)"
  if [ -z "$BILLING_ACCOUNT" ]; then
    echo "No open billing account found on $GCP_ACCOUNT."
    echo "Activate billing (free trial) at https://console.cloud.google.com/billing then re-run."
    exit 1
  fi
  gcloud billing projects link "$PROJECT_ID" --billing-account="$BILLING_ACCOUNT"
fi

log "Enabling APIs"
gcloud services enable \
  compute.googleapis.com \
  artifactregistry.googleapis.com \
  iam.googleapis.com \
  iamcredentials.googleapis.com \
  sts.googleapis.com

PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"

# ---------------------------------------------------------------- registry
log "Ensuring Artifact Registry repo $AR_REPO ($REGION)"
if ! gcloud artifacts repositories describe "$AR_REPO" --location="$REGION" >/dev/null 2>&1; then
  gcloud artifacts repositories create "$AR_REPO" \
    --repository-format=docker --location="$REGION" \
    --description="FoodSafe container images"
fi
IMAGE_REPO="$REGION-docker.pkg.dev/$PROJECT_ID/$AR_REPO"

# ---------------------------------------------------------------- network
log "Ensuring static IP + firewall"
if ! gcloud compute addresses describe "$ADDRESS_NAME" --region="$REGION" >/dev/null 2>&1; then
  gcloud compute addresses create "$ADDRESS_NAME" --region="$REGION"
fi
STATIC_IP="$(gcloud compute addresses describe "$ADDRESS_NAME" --region="$REGION" --format='value(address)')"

if ! gcloud compute firewall-rules describe foodsafe-allow-web >/dev/null 2>&1; then
  gcloud compute firewall-rules create foodsafe-allow-web \
    --allow=tcp:80,tcp:443 --target-tags=foodsafe-web \
    --description="FoodSafe public web"
fi

# ---------------------------------------------------------------- ssh key
log "Ensuring SSH deploy key"
if [ ! -f "$SSH_KEY_FILE" ]; then
  ssh-keygen -t ed25519 -f "$SSH_KEY_FILE" -N "" -C "foodsafe-deploy"
fi
SSH_PUB="$(cat "$SSH_KEY_FILE.pub")"

# ---------------------------------------------------------------- vm
log "Ensuring VM $VM_NAME"
STARTUP_SCRIPT="$STATE_DIR/startup.sh"
cat > "$STARTUP_SCRIPT" <<'EOS'
#!/bin/bash
set -e
if ! command -v docker >/dev/null 2>&1; then
  apt-get update
  apt-get install -y ca-certificates curl gnupg
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi
id deploy >/dev/null 2>&1 || useradd -m -s /bin/bash deploy
usermod -aG docker deploy
mkdir -p /opt/foodsafe/secrets
chown -R deploy:deploy /opt/foodsafe
EOS

if ! gcloud compute instances describe "$VM_NAME" --zone="$ZONE" >/dev/null 2>&1; then
  gcloud compute instances create "$VM_NAME" \
    --zone="$ZONE" \
    --machine-type="$VM_MACHINE_TYPE" \
    --image-family=ubuntu-2204-lts \
    --image-project=ubuntu-os-cloud \
    --boot-disk-size="${VM_DISK_GB}GB" \
    --boot-disk-type=pd-balanced \
    --address="$STATIC_IP" \
    --tags=foodsafe-web \
    --metadata-from-file=startup-script="$STARTUP_SCRIPT" \
    --metadata=ssh-keys="deploy:$SSH_PUB"
else
  gcloud compute instances add-metadata "$VM_NAME" --zone="$ZONE" \
    --metadata=ssh-keys="deploy:$SSH_PUB" \
    --metadata-from-file=startup-script="$STARTUP_SCRIPT"
fi

# ---------------------------------------------------------------- wif + sa
log "Ensuring Workload Identity Federation for GitHub Actions"
DEPLOY_SA="$DEPLOY_SA_NAME@$PROJECT_ID.iam.gserviceaccount.com"
if ! gcloud iam service-accounts describe "$DEPLOY_SA" >/dev/null 2>&1; then
  gcloud iam service-accounts create "$DEPLOY_SA_NAME" --display-name="GitHub Actions deploy"
fi
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$DEPLOY_SA" \
  --role=roles/artifactregistry.writer --quiet >/dev/null

if ! gcloud iam workload-identity-pools describe "$WIF_POOL" --location=global >/dev/null 2>&1; then
  gcloud iam workload-identity-pools create "$WIF_POOL" \
    --location=global --display-name="GitHub Actions"
fi
if ! gcloud iam workload-identity-pools providers describe "$WIF_PROVIDER" \
  --location=global --workload-identity-pool="$WIF_POOL" >/dev/null 2>&1; then
  gcloud iam workload-identity-pools providers create-oidc "$WIF_PROVIDER" \
    --location=global --workload-identity-pool="$WIF_POOL" \
    --display-name="GitHub OIDC" \
    --issuer-uri="https://token.actions.githubusercontent.com" \
    --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
    --attribute-condition="assertion.repository=='$GITHUB_REPO'"
fi
gcloud iam service-accounts add-iam-policy-binding "$DEPLOY_SA" \
  --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/$WIF_POOL/attribute.repository/$GITHUB_REPO" \
  --quiet >/dev/null
WIF_PROVIDER_NAME="projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/$WIF_POOL/providers/$WIF_PROVIDER"

# ---------------------------------------------------------------- vm env
log "Generating VM .env (secrets persisted in $VM_ENV_FILE)"
if [ ! -f "$VM_ENV_FILE" ]; then
  gen() { openssl rand -base64 24 | tr -d '/+=' ; }
  SEED_ADMIN_PASSWORD="Adm!$(gen)"
  cat > "$VM_ENV_FILE" <<EOF
IMAGE_REPO=$IMAGE_REPO
IMAGE_TAG=latest
PUBLIC_BASE_URL=http://$STATIC_IP
WEB_HTTP_PORT=80
ASPNETCORE_ENVIRONMENT=Staging
REQUIRE_HTTPS_METADATA=false
POSTGRES_SSL_MODE=Disable
POSTGRES_DB=FoodSafe
POSTGRES_USER=foodsafe
POSTGRES_PASSWORD=$(gen)
REDIS_PASSWORD=$(gen)
MINIO_ROOT_USER=foodsafe-minio
MINIO_ROOT_PASSWORD=$(gen)
STRING_ENCRYPTION_PASSPHRASE=$(gen)
SEED_ADMIN_EMAIL=admin@foodsafe.local
SEED_ADMIN_PASSWORD=$SEED_ADMIN_PASSWORD
CAPTCHA_SITE_KEY=1x00000000000000000000AA
CAPTCHA_SECRET_KEY=1x0000000000000000000000000000000AA
CAPTCHA_EXPECTED_HOSTNAME=localhost
EOF
fi

# ---------------------------------------------------------------- upload
log "Waiting for VM SSH and uploading compose + .env"
SSH_OPTS=(-i "$SSH_KEY_FILE" -o StrictHostKeyChecking=accept-new -o ConnectTimeout=10)
for i in $(seq 1 30); do
  if ssh "${SSH_OPTS[@]}" "deploy@$STATIC_IP" 'command -v docker >/dev/null 2>&1 && [ -d /opt/foodsafe ]' 2>/dev/null; then
    READY=1; break
  fi
  echo "  waiting for VM startup script... ($i/30)"; sleep 20
done
if [ "${READY:-0}" != "1" ]; then
  echo "VM not ready after 10 minutes — check startup script logs:"
  echo "  gcloud compute ssh $VM_NAME --zone=$ZONE -- sudo journalctl -u google-startup-scripts"
  exit 1
fi
scp "${SSH_OPTS[@]}" "$REPO_ROOT/deploy/docker-compose.cloud.yml" "deploy@$STATIC_IP:/opt/foodsafe/docker-compose.yml"
scp "${SSH_OPTS[@]}" "$VM_ENV_FILE" "deploy@$STATIC_IP:/opt/foodsafe/.env"
ssh "${SSH_OPTS[@]}" "deploy@$STATIC_IP" 'chmod 600 /opt/foodsafe/.env'

# ---------------------------------------------------------------- gh secrets
log "Setting GitHub Actions secrets on $GITHUB_REPO"
gh secret set GCP_PROJECT_ID --repo "$GITHUB_REPO" --body "$PROJECT_ID"
gh secret set GCP_WIF_PROVIDER --repo "$GITHUB_REPO" --body "$WIF_PROVIDER_NAME"
gh secret set GCP_DEPLOY_SA --repo "$GITHUB_REPO" --body "$DEPLOY_SA"
gh secret set VM_HOST --repo "$GITHUB_REPO" --body "$STATIC_IP"
gh secret set VM_SSH_PRIVATE_KEY --repo "$GITHUB_REPO" < "$SSH_KEY_FILE"

# ---------------------------------------------------------------- summary
log "Provisioning complete"
cat <<EOF
Project:        $PROJECT_ID (number $PROJECT_NUMBER)
Artifact repo:  $IMAGE_REPO
VM:             $VM_NAME ($ZONE, $VM_MACHINE_TYPE)
Static IP:      $STATIC_IP
Site URL:       http://$STATIC_IP
WIF provider:   $WIF_PROVIDER_NAME
Deploy SA:      $DEPLOY_SA
Admin login:    admin@foodsafe.local / (see SEED_ADMIN_PASSWORD in $VM_ENV_FILE)

Next: push .github/workflows/deploy.yml to main (or run it via workflow_dispatch)
to build images and start the stack.
EOF
