#!/usr/bin/env bash

set -Eeuo pipefail

REPO_URL="${REPO_URL:-https://github.com/oRE-o/unicon-vote-app.git}"
REPO_DIR="${REPO_DIR:-$HOME/unicon-vote-app}"
WRAPPER_DIR="${HOME}/.local/bin"
WRAPPER_PATH="${WRAPPER_DIR}/univote"
NODE_SOURCE_SETUP_URL="https://deb.nodesource.com/setup_20.x"
PNPM_VERSION="10.10.0"
DOCKER_GROUP_ADDED="false"
IS_ROOT="false"
SUDO_CMD="sudo"

section() {
  printf '\n== %s ==\n' "$1"
}

info() {
  printf '[INFO] %s\n' "$1"
}

warn() {
  printf '[WARN] %s\n' "$1"
}

fail() {
  printf '[ERROR] %s\n' "$1" >&2
  exit 1
}

prepare_privilege_mode() {
  if [[ "${EUID}" -eq 0 ]]; then
    IS_ROOT="true"
    SUDO_CMD=""
    warn "현재 root로 실행 중입니다. 계속 진행할 수는 있지만, 운영은 보통 일반 사용자 계정으로 하는 편을 권장합니다."
    warn "이 경우 저장소와 univote 명령도 root 기준 경로에 설치됩니다."
  elif ! command -v sudo >/dev/null 2>&1; then
    fail "sudo 명령이 필요합니다."
  fi

  if ! command -v apt-get >/dev/null 2>&1; then
    fail "현재 bootstrap 스크립트는 Ubuntu/Debian 계열 서버(apt-get) 기준으로만 지원합니다."
  fi
}

install_base_packages() {
  section "기본 패키지 설치"
  ${SUDO_CMD:+$SUDO_CMD }apt-get update -y

  local base_packages=()
  if ! command -v git >/dev/null 2>&1; then
    base_packages+=("git")
  fi
  if ! command -v curl >/dev/null 2>&1; then
    base_packages+=("curl")
  fi
  base_packages+=("ca-certificates")

  if [[ "${#base_packages[@]}" -gt 0 ]]; then
    ${SUDO_CMD:+$SUDO_CMD }apt-get install -y "${base_packages[@]}"
  fi

  success "git, curl, 기본 인증서 준비 완료"
}

ensure_docker_packages() {
  section "Docker 패키지 확인"

  if command -v docker >/dev/null 2>&1; then
    success "docker 명령이 이미 설치되어 있습니다."
  else
    info "docker 명령이 없어 Ubuntu 기본 패키지로 설치합니다."
    ${SUDO_CMD:+$SUDO_CMD }apt-get install -y docker.io
    success "docker 설치 완료"
  fi

  if docker compose version >/dev/null 2>&1; then
    success "docker compose 플러그인이 이미 설치되어 있습니다."
    return
  fi

  info "docker compose 플러그인을 설치합니다."
  ${SUDO_CMD:+$SUDO_CMD }apt-get install -y docker-compose-plugin
  success "docker compose 플러그인 설치 완료"
}

success() {
  printf '[OK] %s\n' "$1"
}

ensure_node() {
  local node_major=""

  if command -v node >/dev/null 2>&1; then
    node_major="$(node -p 'Number(process.versions.node.split(".")[0])' 2>/dev/null || true)"
  fi

  if [[ -n "${node_major}" ]] && [[ "${node_major}" -ge 18 ]]; then
    success "Node.js $(node --version) 확인"
    return
  fi

  section "Node.js 설치"
  info "Node.js 20 LTS를 설치합니다."
  curl -fsSL "${NODE_SOURCE_SETUP_URL}" | ${SUDO_CMD:+$SUDO_CMD -E }bash -
  ${SUDO_CMD:+$SUDO_CMD }apt-get install -y nodejs
  success "Node.js $(node --version) 설치 완료"
}

ensure_pnpm() {
  section "pnpm 준비"

  if ! command -v corepack >/dev/null 2>&1; then
    fail "corepack 명령을 찾지 못했습니다. Node.js 설치 상태를 확인해주세요."
  fi

  corepack enable
  corepack prepare "pnpm@${PNPM_VERSION}" --activate
  success "pnpm $(pnpm --version) 준비 완료"
}

ensure_docker_service() {
  section "Docker 서비스 준비"
  ${SUDO_CMD:+$SUDO_CMD }systemctl enable --now docker

  if [[ "${IS_ROOT}" == "true" ]]; then
    success "root 실행이므로 docker 그룹 추가 없이 계속 진행합니다."
    return
  fi

  if id -nG "${USER}" | grep -qw docker; then
    success "현재 사용자는 이미 docker 그룹에 포함되어 있습니다."
    return
  fi

  ${SUDO_CMD:+$SUDO_CMD }usermod -aG docker "${USER}"
  DOCKER_GROUP_ADDED="true"
  warn "현재 사용자를 docker 그룹에 추가했습니다. 이번 실행에서는 sg docker로 계속 진행합니다."
}

ensure_repo() {
  section "저장소 준비"

  if [[ -d "${REPO_DIR}/.git" ]]; then
    info "기존 저장소를 사용합니다: ${REPO_DIR}"

    if git -C "${REPO_DIR}" diff --quiet && git -C "${REPO_DIR}" diff --cached --quiet; then
      git -C "${REPO_DIR}" fetch origin main
      if git -C "${REPO_DIR}" show-ref --verify --quiet refs/heads/main; then
        git -C "${REPO_DIR}" checkout main
      fi
      git -C "${REPO_DIR}" pull --ff-only origin main || warn "자동 pull은 건너뛰었습니다. 필요하면 나중에 univote update를 실행해주세요."
    else
      warn "기존 저장소에 로컬 변경사항이 있어 자동 pull은 건너뛰었습니다."
    fi

    success "저장소 준비 완료"
    return
  fi

  if [[ -e "${REPO_DIR}" ]]; then
    fail "${REPO_DIR} 경로가 이미 존재하지만 git 저장소가 아닙니다. 경로를 비우거나 REPO_DIR 환경변수로 다른 설치 경로를 지정해주세요."
  fi

  git clone "${REPO_URL}" "${REPO_DIR}"
  success "저장소 clone 완료"
}

install_cli_dependencies() {
  section "CLI 설치"
  cd "${REPO_DIR}/univote-cli"
  pnpm install
  success "univote-cli 의존성 설치 완료"
}

install_univote_wrapper() {
  section "univote 명령 연결"
  mkdir -p "${WRAPPER_DIR}"

  cat > "${WRAPPER_PATH}" <<EOF
#!/usr/bin/env bash
set -Eeuo pipefail
REPO_DIR="${REPO_DIR}"
cd "\${REPO_DIR}"
exec node "\${REPO_DIR}/univote-cli/src/index.mjs" "\$@"
EOF

  chmod +x "${WRAPPER_PATH}"
  success "${WRAPPER_PATH} 생성 완료"
}

ensure_local_bin_on_path() {
  section "PATH 정리"

  local export_line='export PATH="$HOME/.local/bin:$PATH"'
  local rc_file=""

  for rc_file in "${HOME}/.profile" "${HOME}/.bashrc" "${HOME}/.zshrc"; do
    touch "${rc_file}"
    if ! grep -Fqx "${export_line}" "${rc_file}"; then
      printf '\n%s\n' "${export_line}" >> "${rc_file}"
    fi
  done

  export PATH="${HOME}/.local/bin:${PATH}"
  success "~/.local/bin 경로를 준비했습니다."
}

launch_univote() {
  section "univote 실행"

  if [[ "${DOCKER_GROUP_ADDED}" == "true" ]]; then
    if command -v sg >/dev/null 2>&1; then
      info "docker 그룹 권한을 현재 실행에 반영해 univote를 시작합니다."
      sg docker -c "\"${WRAPPER_PATH}\""
      return
    fi

    warn "현재 세션에 docker 그룹 권한을 즉시 반영할 수 없어 자동 실행을 건너뜁니다."
    warn "새로 로그인한 뒤 아래 명령을 실행해주세요."
    printf '\n%s\n' "univote"
    return
  fi

  "${WRAPPER_PATH}"
}

main() {
  prepare_privilege_mode

  if [[ "${IS_ROOT}" != "true" ]]; then
    sudo -v
  fi

  info "Ubuntu/Debian 서버 기준 bootstrap을 시작합니다."
  install_base_packages
  ensure_docker_packages
  ensure_node
  ensure_pnpm
  ensure_docker_service
  ensure_repo
  install_cli_dependencies
  install_univote_wrapper
  ensure_local_bin_on_path

  info "이제부터는 보통 아래 명령만 기억하면 됩니다."
  printf '\n%s\n' "  univote"
  printf '%s\n\n' "  univote update"

  launch_univote
}

main "$@"
