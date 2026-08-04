#!/usr/bin/env bash
# Bootstraps a fresh Ubuntu 22.04/24.04 VPS to host the FoodSafe stack.
#
# Run as root on the NEW server:
#   curl -fsSL <raw-url>/deploy/provision-vps.sh | bash -s -- "<deploy-public-key>"
# or, having copied the file across:
#   sudo bash provision-vps.sh "ssh-ed25519 AAAA... deploy@foodsafe"
#
# Idempotent: safe to re-run. It installs Docker, creates the unprivileged
# `deploy` user the CI pipeline logs in as, prepares /opt/foodsafe and opens
# only the ports the edge proxy needs.
set -euo pipefail

DEPLOY_USER="deploy"
APP_DIR="/opt/foodsafe"
PUBLIC_KEY="${1:-}"

if [[ $EUID -ne 0 ]]; then
  echo "Run this as root (sudo bash provision-vps.sh '<public-key>')." >&2
  exit 1
fi
if [[ -z "$PUBLIC_KEY" ]]; then
  echo "Usage: provision-vps.sh '<deploy ssh public key>'" >&2
  exit 1
fi

echo "==> Installing Docker Engine and the compose plugin"
if ! command -v docker >/dev/null 2>&1; then
  apt-get update -qq
  apt-get install -y -qq ca-certificates curl gnupg
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg |
    gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    >/etc/apt/sources.list.d/docker.list
  apt-get update -qq
  apt-get install -y -qq docker-ce docker-ce-cli containerd.io \
    docker-buildx-plugin docker-compose-plugin
fi
systemctl enable --now docker

echo "==> Creating the ${DEPLOY_USER} account"
if ! id -u "$DEPLOY_USER" >/dev/null 2>&1; then
  adduser --disabled-password --gecos "" "$DEPLOY_USER"
fi
usermod -aG docker "$DEPLOY_USER"

echo "==> Installing the deploy public key"
install -d -m 700 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "/home/${DEPLOY_USER}/.ssh"
touch "/home/${DEPLOY_USER}/.ssh/authorized_keys"
grep -qxF "$PUBLIC_KEY" "/home/${DEPLOY_USER}/.ssh/authorized_keys" ||
  echo "$PUBLIC_KEY" >>"/home/${DEPLOY_USER}/.ssh/authorized_keys"
chmod 600 "/home/${DEPLOY_USER}/.ssh/authorized_keys"
chown -R "${DEPLOY_USER}:${DEPLOY_USER}" "/home/${DEPLOY_USER}/.ssh"

echo "==> Preparing ${APP_DIR}"
install -d -m 750 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "$APP_DIR"

echo "==> Opening the edge ports"
if command -v ufw >/dev/null 2>&1; then
  ufw allow OpenSSH >/dev/null 2>&1 || ufw allow 22/tcp >/dev/null
  ufw allow 80/tcp >/dev/null
  ufw allow 443/tcp >/dev/null
  ufw --force enable >/dev/null
fi

# The database and object store must never be reachable from the internet;
# docker-compose.cloud.yml already binds them to the loopback interface only.
echo "==> Done. Next: copy .env, docker-compose.yml and Caddyfile into ${APP_DIR}."
docker --version
docker compose version
