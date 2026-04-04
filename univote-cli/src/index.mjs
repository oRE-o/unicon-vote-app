#!/usr/bin/env node

import { confirm, input, password, select } from "@inquirer/prompts";
import { randomBytes, randomUUID } from "crypto";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { isIP } from "net";
import os from "os";
import path from "path";
import process from "process";
import { spawn } from "child_process";
import dotenv from "dotenv";
import qrcode from "qrcode-terminal";

const QUICKSTART_COMPOSE_FILE = "docker-compose.quickstart.yml";
const CLI_VERSION = "0.1.0";
const GENERATED_NGINX_CONFIG_RELATIVE =
  "./unicon-vote-frontend/nginx.quickstart.generated.conf";
const REQUIRED_MARKERS = [
  QUICKSTART_COMPOSE_FILE,
  path.join("unicon-vote-backend", "package.json"),
  path.join("unicon-vote-frontend", "package.json"),
];

const colors = {
  bold: (text) => `\u001b[1m${text}\u001b[0m`,
  cyan: (text) => `\u001b[36m${text}\u001b[0m`,
  green: (text) => `\u001b[32m${text}\u001b[0m`,
  yellow: (text) => `\u001b[33m${text}\u001b[0m`,
  red: (text) => `\u001b[31m${text}\u001b[0m`,
  magenta: (text) => `\u001b[35m${text}\u001b[0m`,
  dim: (text) => `\u001b[2m${text}\u001b[0m`,
  brightCyan: (text) => `\u001b[96m${text}\u001b[0m`,
};

const HELP_TEXT = `Usage: univote [command]

Commands
  configure   Interactive quickstart wizard
  experimental Start local test lab without DNS
  experimental-down Stop and clean local test lab
  update      Pull the latest repository changes and rebuild services
  start       docker compose up -d --build
  stop        Stop containers without removing data
  down        docker compose down (keeps Mongo volume)
  restart     Restart quickstart services
  status      Show compose status and run connection checks
  logs        Follow backend/frontend logs
  qr          Print the admin login QR in the terminal
  doctor      Check Docker, boot persistence, and app health
  help        Show this message

Flags
  -h, --help      Show help
  -v, --version   Show CLI version
`;

const MENU_CHOICES = [
  {
    name: "[SETUP] 빠른 설정 + 시작",
    value: "configure",
    description: ".env를 만들고 바로 행사 서버를 올립니다.",
  },
  {
    name: "[LAB] 실험 모드로 바로 실행",
    value: "experimental",
    description: "DNS 없이 로컬 시험장(mock 데이터 포함)을 바로 띄웁니다.",
  },
  {
    name: "[LAB] 실험 모드 정리",
    value: "experimental-down",
    description: "로컬 시험장 컨테이너와 mock DB를 정리합니다.",
  },
  {
    name: "[OPS] 업데이트 가져오기",
    value: "update",
    description: "최신 코드를 받아 재빌드하고 다시 띄웁니다.",
  },
  {
    name: "[OPS] 상태 확인",
    value: "status",
    description: "컨테이너 상태와 앱 연결 상태를 점검합니다.",
  },
  {
    name: "[OPS] 로그 보기",
    value: "logs",
    description: "프론트/백 로그를 따라가며 문제를 봅니다.",
  },
  {
    name: "[OPS] 재시작",
    value: "restart",
    description: "현재 quickstart 서비스를 다시 시작합니다.",
  },
  {
    name: "[OPS] 중지",
    value: "stop",
    description: "데이터는 유지한 채 컨테이너만 멈춥니다.",
  },
  {
    name: "[OPS] compose down",
    value: "down",
    description: "컨테이너를 내리되 Mongo 볼륨은 유지합니다.",
  },
  {
    name: "[ADMIN] 관리자 QR 보기",
    value: "qr",
    description: "관리자 로그인 URL과 QR을 다시 출력합니다.",
  },
  {
    name: "[DIAG] 진단 실행",
    value: "doctor",
    description: "Docker, 자동 시작, 앱 health를 한 번에 확인합니다.",
  },
  {
    name: "[EXIT] 종료",
    value: "exit",
    description: "아무 작업도 하지 않고 종료합니다.",
  },
];

function clearScreen() {
  if (process.stdout.isTTY) {
    process.stdout.write("\x1Bc");
  }
}

function hr(color = colors.dim) {
  console.log(color("─".repeat(64)));
}

function printBanner(title, subtitle) {
  console.log("");
  hr(colors.magenta);
  console.log(colors.bold(colors.magenta(`  ${title}`)));
  if (subtitle) {
    console.log(colors.dim(`  ${subtitle}`));
  }
  hr(colors.magenta);
}

function printHeroBlock(title, subtitle) {
  const width = Math.min(process.stdout.columns || 96, 104);
  const innerWidth = Math.max(40, width - 4);
  const top = `╭${"─".repeat(innerWidth + 2)}╮`;
  const bottom = `╰${"─".repeat(innerWidth + 2)}╯`;
  const padLine = (text = "") => {
    const visibleText = text.length > innerWidth ? `${text.slice(0, innerWidth - 1)}…` : text;
    return `│ ${visibleText.padEnd(innerWidth, " ")} │`;
  };

  console.log(colors.magenta(top));
  console.log(colors.magenta(padLine(colors.bold(title))));
  if (subtitle) {
    console.log(colors.magenta(padLine(colors.dim(subtitle))));
  }
  console.log(colors.magenta(bottom));
}

function renderControlCenter(repoRoot) {
  clearScreen();
  printHeroBlock(
    "UNIVOTE Control Center",
    "↑ ↓ 로 이동하고 Enter 로 실행합니다. 선택된 항목 설명은 아래에서 바로 볼 수 있습니다."
  );
  printPanel("현재 작업 위치", [repoRoot]);
  printPanel("빠른 진입 가이드", [
    "처음 운영 서버를 띄울 때: [SETUP] 빠른 설정 + 시작",
    "DNS 없이 바로 시험할 때: [LAB] 실험 모드로 바로 실행",
    "평소 운영 점검: [OPS] 상태 확인 / 로그 보기 / 업데이트 가져오기",
  ]);
}

function getMenuPageSize() {
  const terminalRows = process.stdout.rows || 24;
  return Math.max(8, Math.min(MENU_CHOICES.length, terminalRows - 10));
}

function printPanel(title, lines = []) {
  console.log(colors.bold(colors.cyan(`\n▶ ${title}`)));
  lines.forEach((line) => {
    console.log(`${colors.dim("  │")} ${line}`);
  });
}

function summaryLine(label, value) {
  const paddedLabel = `${label}`.padEnd(16, " ");
  return `${colors.dim(paddedLabel)} ${value}`;
}

function section(title) {
  console.log(`\n${colors.bold(colors.cyan(`◆ ${title}`))}`);
}

function info(message) {
  console.log(`${colors.cyan("•")} ${message}`);
}

function success(message) {
  console.log(`${colors.green("✓")} ${message}`);
}

function warn(message) {
  console.log(`${colors.yellow("!")} ${message}`);
}

function fail(message) {
  console.error(`${colors.red("x")} ${message}`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function timestampForFileName() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");

  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    "-",
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
  ].join("");
}

function findRepoRoot(startDir) {
  let currentDir = path.resolve(startDir);

  while (true) {
    const hasAllMarkers = REQUIRED_MARKERS.every((marker) =>
      existsSync(path.join(currentDir, marker))
    );

    if (hasAllMarkers) {
      return currentDir;
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      return null;
    }
    currentDir = parentDir;
  }
}

function getEnvPath(repoRoot) {
  return path.join(repoRoot, ".env");
}

function loadExistingEnv(repoRoot) {
  const envPath = getEnvPath(repoRoot);

  if (!existsSync(envPath)) {
    return {};
  }

  return dotenv.parse(readFileSync(envPath, "utf8"));
}

function backupExistingEnv(repoRoot) {
  const envPath = getEnvPath(repoRoot);

  if (!existsSync(envPath)) {
    return null;
  }

  const backupPath = path.join(repoRoot, `.env.backup.${timestampForFileName()}`);
  writeFileSync(backupPath, readFileSync(envPath, "utf8"), "utf8");
  return backupPath;
}

function writeEnvFile(repoRoot, envValues) {
  const lines = [
    "# Generated by univote-cli",
    "",
    "# Quickstart",
    `JWT_SECRET=${envValues.JWT_SECRET}`,
    `ADMIN_UUID=${envValues.ADMIN_UUID}`,
    `ADMIN_PASSWORD=${envValues.ADMIN_PASSWORD}`,
    `MONGO_ROOT_USER=${envValues.MONGO_ROOT_USER}`,
    `MONGO_ROOT_PASSWORD=${envValues.MONGO_ROOT_PASSWORD}`,
    `CORS_ORIGIN=${envValues.CORS_ORIGIN}`,
    `ENABLE_HTTPS=${envValues.ENABLE_HTTPS}`,
    `LETSENCRYPT_EMAIL=${envValues.LETSENCRYPT_EMAIL || ""}`,
    `FRONTEND_NGINX_CONFIG=${envValues.FRONTEND_NGINX_CONFIG}`,
    `SEED_SAMPLE_DATA=${envValues.SEED_SAMPLE_DATA}`,
    "",
    "# Optional: existing production compose / CI/CD",
    `DOCKERHUB_USERNAME=${envValues.DOCKERHUB_USERNAME || ""}`,
    `SERVER_DOMAIN=${envValues.SERVER_DOMAIN || ""}`,
    `SERVER_HOST=${envValues.SERVER_HOST || ""}`,
    "",
    "# Optional: game thumbnail upload (S3-compatible storage)",
    `S3_REGION=${envValues.S3_REGION || ""}`,
    `S3_BUCKET=${envValues.S3_BUCKET || ""}`,
    `S3_ACCESS_KEY_ID=${envValues.S3_ACCESS_KEY_ID || ""}`,
    `S3_SECRET_ACCESS_KEY=${envValues.S3_SECRET_ACCESS_KEY || ""}`,
    `S3_ENDPOINT=${envValues.S3_ENDPOINT || ""}`,
    `S3_PUBLIC_BASE_URL=${envValues.S3_PUBLIC_BASE_URL || ""}`,
    `S3_FORCE_PATH_STYLE=${envValues.S3_FORCE_PATH_STYLE || "false"}`,
    "",
  ];

  writeFileSync(getEnvPath(repoRoot), lines.join("\n"), "utf8");
}

function generateSecret(length = 32) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = randomBytes(length);
  let result = "";

  for (let index = 0; index < length; index += 1) {
    result += chars[bytes[index] % chars.length];
  }

  return result;
}

function sanitizePublicUrl(value) {
  return value.trim().replace(/\/+$/, "");
}

function validateEmail(value) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "이메일을 입력해주세요.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedValue)) {
    return "유효한 이메일 주소를 입력해주세요.";
  }

  return true;
}

function validateDomain(value) {
  const trimmedValue = value.trim().toLowerCase();

  if (!trimmedValue) {
    return "도메인을 입력해주세요.";
  }

  if (/^https?:\/\//.test(trimmedValue)) {
    return "도메인만 입력해주세요. 예: vote.example.com";
  }

  if (isIP(trimmedValue)) {
    return "HTTPS quickstart는 IP가 아니라 도메인이 필요합니다.";
  }

  if (!/^[a-z0-9.-]+$/.test(trimmedValue) || !trimmedValue.includes(".")) {
    return "유효한 도메인 형식이 아닙니다.";
  }

  return true;
}

function parseOrigins(value) {
  return value
    .split(",")
    .map((origin) => sanitizePublicUrl(origin))
    .filter(Boolean);
}

function validateUrlList(value, allowBlank = false) {
  if (allowBlank && !value.trim()) {
    return true;
  }

  const urls = parseOrigins(value);
  if (urls.length === 0) {
    return "하나 이상의 URL을 입력해주세요.";
  }

  for (const url of urls) {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return "http:// 또는 https:// 로 시작해야 합니다.";
      }
    } catch (_error) {
      return `유효한 URL 형식이 아닙니다: ${url}`;
    }
  }

  return true;
}

function validateEnvToken(value, label) {
  if (!value.trim()) {
    return `${label} 값을 입력해주세요.`;
  }

  if (/\s/.test(value)) {
    return `${label}에는 공백을 넣지 않는 것을 권장합니다.`;
  }

  if (value.includes("#")) {
    return `${label}에는 # 문자를 넣지 않는 것을 권장합니다.`;
  }

  return true;
}

function getPreferredPublicUrl(existingEnv) {
  const currentOrigins = parseOrigins(existingEnv.CORS_ORIGIN || "");
  if (currentOrigins.length > 0) {
    return currentOrigins[0];
  }

  const networkInterfaces = os.networkInterfaces();
  for (const addresses of Object.values(networkInterfaces)) {
    for (const address of addresses || []) {
      if (address.family === "IPv4" && !address.internal) {
        return `http://${address.address}`;
      }
    }
  }

  return "http://localhost";
}

function getAdditionalOrigins(existingEnv) {
  const currentOrigins = parseOrigins(existingEnv.CORS_ORIGIN || "");
  return currentOrigins.slice(1).join(", ");
}

function getHostFromOrigin(origin) {
  try {
    return new URL(origin).hostname;
  } catch (_error) {
    return "";
  }
}

function getPrimaryOrigin(envValues) {
  const configuredOrigin = parseOrigins(envValues.CORS_ORIGIN || "")[0];

  if (configuredOrigin) {
    return configuredOrigin;
  }

  if (envValues.SERVER_DOMAIN) {
    return `${isHttpsEnabled(envValues) ? "https" : "http"}://${envValues.SERVER_DOMAIN}`;
  }

  return "http://localhost";
}

function getDisplayLoginUrl(envValues) {
  const baseUrl = getPrimaryOrigin(envValues);
  return `${baseUrl}/login?uuid=${envValues.ADMIN_UUID}`;
}

function isHttpsEnabled(envValues) {
  return envValues?.ENABLE_HTTPS === "true";
}

function getGeneratedNginxConfigPath(repoRoot) {
  return path.join(repoRoot, "unicon-vote-frontend", "nginx.quickstart.generated.conf");
}

function buildQuickstartHttpConfig(serverName) {
  return `server {
    listen 80;
    server_name ${serverName};

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location /api/ {
        proxy_pass http://backend:5001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
`;
}

function buildQuickstartHttpsConfig(serverDomain) {
  return `server {
    listen 80;
    server_name ${serverDomain};

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name ${serverDomain};

    ssl_certificate /etc/letsencrypt/live/${serverDomain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${serverDomain}/privkey.pem;

    location /api/ {
        proxy_pass http://backend:5001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
`;
}

function renderQuickstartNginxConfig(repoRoot, envValues, mode = "http") {
  const primaryOrigin = getPrimaryOrigin(envValues);
  const serverName = envValues.SERVER_DOMAIN?.trim() || getHostFromOrigin(primaryOrigin) || "_";
  const configContent =
    mode === "https"
      ? buildQuickstartHttpsConfig(serverName)
      : buildQuickstartHttpConfig(serverName);

  writeFileSync(getGeneratedNginxConfigPath(repoRoot), configContent, "utf8");
}

function maskValue(value, visible = 4) {
  if (!value) {
    return "(비어 있음)";
  }

  if (value.length <= visible * 2) {
    return "*".repeat(value.length);
  }

  return `${value.slice(0, visible)}...${value.slice(-visible)}`;
}

function getDockerComposeArgs(extraArgs = [], options = {}) {
  const profileArgs = (options.profiles || []).flatMap((profile) => [
    "--profile",
    profile,
  ]);

  return ["compose", ...profileArgs, "-f", QUICKSTART_COMPOSE_FILE, ...extraArgs];
}

function runCommand(command, args, options = {}) {
  const { cwd, stdio = "pipe" } = options;

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio,
      env: process.env,
    });

    let stdout = "";
    let stderr = "";

    if (stdio === "pipe") {
      child.stdout.on("data", (chunk) => {
        stdout += chunk.toString();
      });
      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });
    }

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr, code });
      } else {
        const error = new Error(
          stderr.trim() || stdout.trim() || `${command} ${args.join(" ")} failed`
        );
        error.code = code;
        reject(error);
      }
    });
  });
}

async function commandExists(command) {
  try {
    await runCommand(command, ["--version"]);
    return true;
  } catch (_error) {
    return false;
  }
}

async function printComposeStatus(repoRoot) {
  await runCommand("docker", getDockerComposeArgs(["ps"]), {
    cwd: repoRoot,
    stdio: "inherit",
  });
}

async function checkGitBasics() {
  section("Git 확인");
  await runCommand("git", ["--version"]);
  success("git 명령을 찾았습니다.");
}

async function ensureGitOnMainBranch(repoRoot) {
  const { stdout } = await runCommand("git", ["branch", "--show-current"], {
    cwd: repoRoot,
  });
  const branchName = stdout.trim();

  if (branchName !== "main") {
    throw new Error(
      `자동 업데이트는 main 브랜치에서만 지원합니다. 현재 브랜치: ${branchName || "detached HEAD"}`
    );
  }
}

async function ensureGitWorkingTreeClean(repoRoot) {
  const { stdout } = await runCommand("git", ["status", "--porcelain"], {
    cwd: repoRoot,
  });

  if (stdout.trim()) {
    throw new Error(
      "로컬 변경사항이 있어서 자동 업데이트를 중단했습니다. 먼저 커밋하거나 백업한 뒤 다시 시도해주세요."
    );
  }
}

async function pullLatestChanges(repoRoot) {
  section("업데이트 확인");

  await runCommand("git", ["fetch", "origin", "main"], {
    cwd: repoRoot,
    stdio: "inherit",
  });

  const { stdout: countStdout } = await runCommand(
    "git",
    ["rev-list", "--count", "HEAD..origin/main"],
    {
      cwd: repoRoot,
    }
  );
  const pendingCommitCount = Number.parseInt(countStdout.trim() || "0", 10);

  if (!Number.isFinite(pendingCommitCount) || pendingCommitCount <= 0) {
    success("이미 최신 커밋 상태입니다.");
    return false;
  }

  info(`가져올 새 커밋 ${pendingCommitCount}개를 확인했습니다.`);

  await runCommand("git", ["pull", "--ff-only", "origin", "main"], {
    cwd: repoRoot,
    stdio: "inherit",
  });

  success("최신 코드를 가져왔습니다.");
  return true;
}

async function syncUnivoteCliDependencies(repoRoot) {
  section("CLI 의존성 확인");
  try {
    await runCommand("pnpm", ["install"], {
      cwd: path.join(repoRoot, "univote-cli"),
      stdio: "inherit",
    });
  } catch (error) {
    if (error?.code === "ENOENT") {
      throw new Error(
        "pnpm 명령을 찾지 못했습니다. 먼저 Node.js 와 pnpm(corepack enable / corepack prepare pnpm@10.10.0 --activate)을 설치해주세요."
      );
    }
    throw error;
  }
  success("univote-cli 의존성을 동기화했습니다.");
}

async function hasHttpsCertificate(repoRoot, envValues) {
  if (!isHttpsEnabled(envValues) || !envValues.SERVER_DOMAIN?.trim()) {
    return false;
  }

  try {
    await runCommand(
      "docker",
      getDockerComposeArgs([
        "run",
        "--rm",
        "--entrypoint",
        "sh",
        "certbot",
        "-c",
        `test -f /etc/letsencrypt/live/${envValues.SERVER_DOMAIN}/fullchain.pem && test -f /etc/letsencrypt/live/${envValues.SERVER_DOMAIN}/privkey.pem`,
      ], {
        profiles: ["tls"],
      }),
      {
        cwd: repoRoot,
      }
    );

    return true;
  } catch (_error) {
    return false;
  }
}

async function ensureHttpsCertificate(repoRoot, envValues) {
  if (!isHttpsEnabled(envValues)) {
    return;
  }

  if (!envValues.SERVER_DOMAIN?.trim() || !envValues.LETSENCRYPT_EMAIL?.trim()) {
    throw new Error("HTTPS를 쓰려면 SERVER_DOMAIN 과 LETSENCRYPT_EMAIL 이 모두 필요합니다.");
  }

  section("HTTPS 인증서");
  info("도메인이 현재 서버 IP를 가리키고, 80/443 포트가 열려 있어야 합니다.");

  await runCommand(
    "docker",
    getDockerComposeArgs([
      "run",
      "--rm",
      "certbot",
      "certonly",
      "--webroot",
      "-w",
      "/var/www/certbot",
      "-d",
      envValues.SERVER_DOMAIN,
      "--email",
      envValues.LETSENCRYPT_EMAIL,
      "--agree-tos",
      "--no-eff-email",
      "--keep-until-expiring",
    ], {
      profiles: ["tls"],
    }),
    {
      cwd: repoRoot,
      stdio: "inherit",
    }
  );

  success("Let's Encrypt 인증서를 확인하거나 발급했습니다.");
}

async function ensureEnvExists(repoRoot) {
  const envPath = getEnvPath(repoRoot);

  if (!existsSync(envPath)) {
    throw new Error(
      `.env 파일이 없습니다. 먼저 ${colors.bold("univote configure")} 를 실행해주세요.`
    );
  }
}

async function checkDockerBasics() {
  section("Docker 확인");

  await runCommand("docker", ["--version"]);
  success("docker 명령을 찾았습니다.");

  await runCommand("docker", ["compose", "version"]);
  success("docker compose 플러그인을 찾았습니다.");

  await runCommand("docker", ["info"]);
  success("Docker 데몬이 실행 중입니다.");
}

async function checkDockerAutostart() {
  if (process.platform !== "linux") {
    info("이 시스템은 Linux가 아니어서 Docker 부팅 자동 시작 점검을 건너뜁니다.");
    return { supported: false, enabled: false };
  }

  if (!(await commandExists("systemctl"))) {
    info("systemctl 이 없어 Docker 부팅 자동 시작 점검을 건너뜁니다.");
    return { supported: false, enabled: false };
  }

  try {
    await runCommand("systemctl", ["is-enabled", "docker"]);
    success("Docker 서비스가 부팅 시 자동 시작되도록 설정되어 있습니다.");
    return { supported: true, enabled: true };
  } catch (_error) {
    warn("Docker 서비스 자동 시작이 아직 활성화되지 않았습니다.");
    return { supported: true, enabled: false };
  }
}

async function maybeEnableDockerAutostart() {
  const status = await checkDockerAutostart();
  if (!status.supported || status.enabled) {
    return;
  }

  const shouldEnable = await confirm({
    message: "리붓 후에도 자동으로 올라오게 Docker 서비스를 부팅 시 시작할까요?",
    default: true,
  });

  if (!shouldEnable) {
    warn("Docker 자동 시작은 건너뛰었습니다. 필요하면 나중에 직접 활성화해주세요.");
    return;
  }

  const command = typeof process.getuid === "function" && process.getuid() === 0
    ? "systemctl"
    : "sudo";
  const args =
    command === "systemctl"
      ? ["enable", "--now", "docker"]
      : ["systemctl", "enable", "--now", "docker"];

  section("Docker 자동 시작 활성화");
  await runCommand(command, args, { stdio: "inherit" });
  success("Docker 서비스를 부팅 시 자동 시작하도록 설정했습니다.");
}

async function waitForHttpOk(url, timeoutMs = 90000) {
  const startedAt = Date.now();
  let lastError = null;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return response;
      }
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }

    await sleep(2000);
  }

  throw lastError || new Error(`Timed out waiting for ${url}`);
}

async function verifyQuickstart(repoRoot, envValues) {
  section("실행 확인");
  await printComposeStatus(repoRoot);

  const localHealthUrl = "http://127.0.0.1:5001/api/health";
  const localAdminStatusUrl = `http://127.0.0.1:5001/api/auth/status/${envValues.ADMIN_UUID}`;

  const [healthResponse, adminStatusResponse] = await Promise.all([
    waitForHttpOk(localHealthUrl),
    waitForHttpOk(localAdminStatusUrl),
  ]);

  const healthPayload = await healthResponse.json();
  const adminPayload = await adminStatusResponse.json();

  if (isHttpsEnabled(envValues) && envValues.SERVER_DOMAIN?.trim()) {
    const httpsUrl = `https://${envValues.SERVER_DOMAIN}`;
    await waitForHttpOk(httpsUrl, 120000);
    success(`프론트엔드가 ${httpsUrl} 에서 HTTPS로 응답합니다.`);
  } else {
    const httpUrl = getPrimaryOrigin(envValues).startsWith("http://")
      ? getPrimaryOrigin(envValues)
      : "http://127.0.0.1";
    await waitForHttpOk(httpUrl);
    success(`프론트엔드가 ${httpUrl} 에서 응답합니다.`);
  }

  success(`백엔드 health 체크 성공: ${healthPayload.status} / Mongo ${healthPayload.mongo}`);
  success(`관리자 계정 확인 성공: ${adminPayload.name} (${adminPayload.uuid})`);
}

async function startQuickstart(repoRoot, envValues, options = {}) {
  const { build = true } = options;
  const httpsRequested = isHttpsEnabled(envValues);
  const hadCertificate = httpsRequested
    ? await hasHttpsCertificate(repoRoot, envValues)
    : false;

  renderQuickstartNginxConfig(repoRoot, envValues, hadCertificate ? "https" : "http");

  section("서비스 시작");
  await runCommand(
    "docker",
    getDockerComposeArgs(
      build
        ? ["up", "-d", "--build", "backend", "frontend", "mongo"]
        : ["up", "-d", "backend", "frontend", "mongo"]
    ),
    {
      cwd: repoRoot,
      stdio: "inherit",
    }
  );
  success("quickstart 컨테이너를 시작했습니다.");

  if (httpsRequested) {
    await ensureHttpsCertificate(repoRoot, envValues);
    renderQuickstartNginxConfig(repoRoot, envValues, "https");
    await runCommand("docker", getDockerComposeArgs(["restart", "frontend"]), {
      cwd: repoRoot,
      stdio: "inherit",
    });
    success("frontend를 HTTPS 설정으로 다시 불러왔습니다.");
  }

  await verifyQuickstart(repoRoot, envValues);
}

async function stopQuickstart(repoRoot) {
  section("서비스 중지");
  await runCommand("docker", getDockerComposeArgs(["stop"]), {
    cwd: repoRoot,
    stdio: "inherit",
  });
  success("컨테이너를 중지했습니다. 데이터는 유지됩니다.");
}

async function downQuickstart(repoRoot) {
  section("compose down");
  await runCommand("docker", getDockerComposeArgs(["down"]), {
    cwd: repoRoot,
    stdio: "inherit",
  });
  success("컨테이너를 내렸습니다. Mongo 볼륨은 유지됩니다.");
}

async function restartQuickstart(repoRoot, envValues) {
  section("서비스 재시작");
  await startQuickstart(repoRoot, envValues, { build: false });
}

async function showLogs(repoRoot) {
  section("로그");
  await runCommand("docker", getDockerComposeArgs(["logs", "-f", "backend", "frontend"]), {
    cwd: repoRoot,
    stdio: "inherit",
  });
}

function printAdminAccess(envValues) {
  const adminLoginUrl = getDisplayLoginUrl(envValues);
  const publicUrl = parseOrigins(envValues.CORS_ORIGIN || "")[0] || "http://localhost";

  printBanner("Setup Complete", "이제 브라우저와 QR로 바로 접속 테스트를 할 수 있습니다.");
  printPanel("접속 정보", [
    summaryLine("메인 주소", publicUrl),
    summaryLine("관리자 로그인", adminLoginUrl),
    summaryLine("관리자 비밀번호", maskValue(envValues.ADMIN_PASSWORD)),
  ]);
  printPanel("다음 권장 작업", [
    "브라우저에서 메인 주소와 관리자 로그인 URL을 각각 열어보기",
    "관리자 화면에서 게임/썸네일과 계정 준비 상태를 점검하기",
  ]);
  console.log("");
  qrcode.generate(adminLoginUrl, { small: true });
}

function printAccessSummary(envValues) {
  const adminLoginUrl = getDisplayLoginUrl(envValues);
  const publicUrl = parseOrigins(envValues.CORS_ORIGIN || "")[0] || "http://localhost";

  printPanel("접속 요약", [
    summaryLine("메인 주소", publicUrl),
    summaryLine("관리자 로그인", adminLoginUrl),
    summaryLine("관리자 비밀번호", maskValue(envValues.ADMIN_PASSWORD)),
  ]);
}

async function printQr(repoRoot) {
  await ensureEnvExists(repoRoot);
  const envValues = loadExistingEnv(repoRoot);
  printAdminAccess(envValues);
}

async function updateQuickstart(repoRoot) {
  await ensureEnvExists(repoRoot);
  await checkGitBasics();
  await ensureGitOnMainBranch(repoRoot);
  await ensureGitWorkingTreeClean(repoRoot);

  const hasUpdates = await pullLatestChanges(repoRoot);
  if (!hasUpdates) {
    const envValues = loadExistingEnv(repoRoot);
    await verifyQuickstart(repoRoot, envValues);
    printAccessSummary(envValues);
    return;
  }

  await syncUnivoteCliDependencies(repoRoot);

  const envValues = loadExistingEnv(repoRoot);
  await checkDockerBasics();
  await startQuickstart(repoRoot, envValues, { build: true });
  printAccessSummary(envValues);
}

async function runDoctor(repoRoot) {
  await checkDockerBasics();
  await checkDockerAutostart();

  if (!existsSync(getEnvPath(repoRoot))) {
    warn(".env 파일이 아직 없어서 앱 health 체크는 건너뜁니다.");
    return;
  }

  const envValues = loadExistingEnv(repoRoot);
  try {
    await verifyQuickstart(repoRoot, envValues);
  } catch (error) {
    warn("앱 health 체크는 아직 통과하지 못했습니다.");
    warn(error.message);
  }
}

async function collectConfig(repoRoot) {
  const existingEnv = loadExistingEnv(repoRoot);
  const recommendedValues = {
    publicUrl: getPreferredPublicUrl(existingEnv),
    additionalOrigins: getAdditionalOrigins(existingEnv),
    enableHttps:
      existingEnv.ENABLE_HTTPS === "true" ||
      parseOrigins(existingEnv.CORS_ORIGIN || "")[0]?.startsWith("https://"),
    serverDomain:
      existingEnv.SERVER_DOMAIN ||
      getHostFromOrigin(parseOrigins(existingEnv.CORS_ORIGIN || "")[0] || ""),
    letsencryptEmail: existingEnv.LETSENCRYPT_EMAIL || "",
    jwtSecret: existingEnv.JWT_SECRET || generateSecret(48),
    adminUuid: existingEnv.ADMIN_UUID || randomUUID(),
    adminPassword: existingEnv.ADMIN_PASSWORD || generateSecret(16),
    mongoUser: existingEnv.MONGO_ROOT_USER || "unicon",
    mongoPassword: existingEnv.MONGO_ROOT_PASSWORD || generateSecret(20),
    seedSampleData: existingEnv.SEED_SAMPLE_DATA === "true",
  };

  printBanner(
    "UNIVOTE Quickstart Wizard",
    "처음 여는 사람도 따라가기 쉬운 행사 서버 설정 흐름"
  );
  printPanel("현재 작업 위치", [repoRoot]);
  printPanel("이번에 하는 일", [
    ".env 생성 또는 갱신",
    "quickstart compose 실행",
    "마지막에 관리자 접속 정보와 QR 출력",
  ]);

  section("1/4 접속 방식");

  const deploymentMode = await select({
    message: "접속 방식을 고르세요.",
    default: recommendedValues.enableHttps ? "https" : "http",
    choices: [
      {
        name: "HTTPS (추천, 실제 행사 운영용 / 도메인 필요)",
        value: "https",
        description: "실제 행사 운영 환경. 80/443 포트와 도메인 연결이 필요합니다.",
      },
      {
        name: "HTTP (테스트용 또는 도메인 준비 전)",
        value: "http",
        description: "로컬 테스트나 임시 점검에 적합합니다.",
      },
    ],
  });

  let publicUrl = recommendedValues.publicUrl;
  let serverDomain = existingEnv.SERVER_DOMAIN || recommendedValues.serverDomain;
  let letsencryptEmail = existingEnv.LETSENCRYPT_EMAIL || recommendedValues.letsencryptEmail;

  if (deploymentMode === "https") {
    info("HTTPS를 쓰려면 도메인이 이 서버 IP를 가리키고 80/443 포트가 열려 있어야 합니다.");
    serverDomain = (
      await input({
        message: "실제 접속 도메인",
        default: serverDomain,
        validate: validateDomain,
      })
    )
      .trim()
      .toLowerCase();

    letsencryptEmail = (
      await input({
        message: "Let's Encrypt 알림 이메일",
        default: letsencryptEmail,
        validate: validateEmail,
      })
    ).trim();

    publicUrl = `https://${serverDomain}`;
  } else {
    publicUrl = sanitizePublicUrl(
      await input({
        message: "사용자가 접속할 기본 주소를 입력하세요.",
        default: recommendedValues.publicUrl.startsWith("https://")
          ? `http://${recommendedValues.serverDomain || "localhost"}`
          : recommendedValues.publicUrl,
        validate: (value) => validateUrlList(value),
      })
    );
  }

  const additionalOrigins = await input({
    message: "추가로 허용할 CORS_ORIGIN 이 있으면 쉼표로 입력하세요. 없으면 Enter.",
    default: recommendedValues.additionalOrigins,
    validate: (value) => validateUrlList(value, true),
  });

  section("2/4 보안값");
  info("추천값을 그대로 쓰면 빠르게 시작할 수 있고, 원하면 직접 입력할 수도 있습니다.");

  const useRecommendedSecrets = await confirm({
    message: "관리자 UUID, 관리자 비밀번호, JWT, Mongo 비밀번호는 추천값을 그대로 사용할까요?",
    default: true,
  });

  let adminUuid = recommendedValues.adminUuid;
  let adminPassword = recommendedValues.adminPassword;
  let jwtSecret = recommendedValues.jwtSecret;
  let mongoUser = recommendedValues.mongoUser;
  let mongoPassword = recommendedValues.mongoPassword;

  if (!useRecommendedSecrets) {
    adminUuid = await input({
      message: "관리자 UUID",
      default: recommendedValues.adminUuid,
      validate: (value) => validateEnvToken(value, "관리자 UUID"),
    });
    adminPassword = await password({
      message: "관리자 비밀번호",
      mask: "*",
      validate: (value) => validateEnvToken(value, "관리자 비밀번호"),
    });
    jwtSecret = await password({
      message: "JWT 시크릿",
      mask: "*",
      validate: (value) => validateEnvToken(value, "JWT 시크릿"),
    });
    mongoUser = await input({
      message: "Mongo 루트 사용자",
      default: recommendedValues.mongoUser,
      validate: (value) => validateEnvToken(value, "Mongo 루트 사용자"),
    });
    mongoPassword = await password({
      message: "Mongo 루트 비밀번호",
      mask: "*",
      validate: (value) => validateEnvToken(value, "Mongo 루트 비밀번호"),
    });
  }

  const seedSampleData = await confirm({
    message: "실서버에 샘플 사용자/샘플 게임을 넣을까요?",
    default: recommendedValues.seedSampleData,
  });

  section("3/4 스토리지 옵션");

  const configureStorage = await confirm({
    message: "관리자 화면에서 게임 썸네일 업로드를 쓰기 위해 S3 호환 스토리지를 지금 설정할까요?",
    default: Boolean(existingEnv.S3_BUCKET),
  });

  let s3Region = existingEnv.S3_REGION || "ap-northeast-2";
  let s3Bucket = existingEnv.S3_BUCKET || "";
  let s3AccessKeyId = existingEnv.S3_ACCESS_KEY_ID || "";
  let s3SecretAccessKey = existingEnv.S3_SECRET_ACCESS_KEY || "";
  let s3Endpoint = existingEnv.S3_ENDPOINT || "";
  let s3PublicBaseUrl = existingEnv.S3_PUBLIC_BASE_URL || "";
  let s3ForcePathStyle = existingEnv.S3_FORCE_PATH_STYLE || "false";

  if (configureStorage) {
    s3Region = await input({
      message: "S3_REGION",
      default: s3Region,
      validate: (value) => validateEnvToken(value, "S3_REGION"),
    });
    s3Bucket = await input({
      message: "S3_BUCKET",
      default: s3Bucket,
      validate: (value) => validateEnvToken(value, "S3_BUCKET"),
    });
    s3AccessKeyId = await input({
      message: "S3_ACCESS_KEY_ID",
      default: s3AccessKeyId,
      validate: (value) => validateEnvToken(value, "S3_ACCESS_KEY_ID"),
    });
    s3SecretAccessKey = await password({
      message: "S3_SECRET_ACCESS_KEY",
      mask: "*",
      validate: (value) => validateEnvToken(value, "S3_SECRET_ACCESS_KEY"),
    });
    s3Endpoint = await input({
      message: "S3_ENDPOINT (AWS S3면 비워도 됩니다)",
      default: s3Endpoint,
      validate: (value) => validateUrlList(value, true),
    });
    s3PublicBaseUrl = await input({
      message: "S3_PUBLIC_BASE_URL (예: https://cdn.example.com)",
      default: s3PublicBaseUrl,
      validate: (value) => validateUrlList(value),
    });
    s3ForcePathStyle = (await confirm({
      message: "S3_FORCE_PATH_STYLE=true 가 필요한 스토리지인가요?",
      default: s3ForcePathStyle === "true",
    }))
      ? "true"
      : "false";
  } else {
    s3Region = existingEnv.S3_REGION || "ap-northeast-2";
    s3Bucket = "";
    s3AccessKeyId = "";
    s3SecretAccessKey = "";
    s3Endpoint = "";
    s3PublicBaseUrl = "";
    s3ForcePathStyle = "false";
  }

  const envValues = {
    JWT_SECRET: jwtSecret,
    ADMIN_UUID: adminUuid,
    ADMIN_PASSWORD: adminPassword,
    MONGO_ROOT_USER: mongoUser,
    MONGO_ROOT_PASSWORD: mongoPassword,
    CORS_ORIGIN: [publicUrl, ...parseOrigins(additionalOrigins)].join(","),
    ENABLE_HTTPS: deploymentMode === "https" ? "true" : "false",
    LETSENCRYPT_EMAIL: deploymentMode === "https" ? letsencryptEmail : "",
    FRONTEND_NGINX_CONFIG: GENERATED_NGINX_CONFIG_RELATIVE,
    SEED_SAMPLE_DATA: seedSampleData ? "true" : "false",
    DOCKERHUB_USERNAME: existingEnv.DOCKERHUB_USERNAME || "",
    SERVER_DOMAIN: deploymentMode === "https" ? serverDomain : existingEnv.SERVER_DOMAIN || "",
    SERVER_HOST: existingEnv.SERVER_HOST || "",
    S3_REGION: s3Region,
    S3_BUCKET: s3Bucket,
    S3_ACCESS_KEY_ID: s3AccessKeyId,
    S3_SECRET_ACCESS_KEY: s3SecretAccessKey,
    S3_ENDPOINT: sanitizePublicUrl(s3Endpoint),
    S3_PUBLIC_BASE_URL: sanitizePublicUrl(s3PublicBaseUrl),
    S3_FORCE_PATH_STYLE: s3ForcePathStyle,
  };

  section("4/4 적용 예정 값");
  printPanel("설정 미리보기", [
    summaryLine("기본 접속 주소", publicUrl),
    summaryLine("관리자 로그인", getDisplayLoginUrl(envValues)),
    summaryLine("관리자 비밀번호", envValues.ADMIN_PASSWORD),
    summaryLine(
      "HTTPS",
      envValues.ENABLE_HTTPS === "true"
        ? `사용 (${envValues.SERVER_DOMAIN})`
        : "사용 안 함"
    ),
    summaryLine("JWT 시크릿", maskValue(envValues.JWT_SECRET)),
    summaryLine("Mongo 사용자", envValues.MONGO_ROOT_USER),
    summaryLine("Mongo 비밀번호", maskValue(envValues.MONGO_ROOT_PASSWORD)),
    summaryLine("샘플 데이터", envValues.SEED_SAMPLE_DATA),
    summaryLine(
      "썸네일 업로드",
      envValues.S3_BUCKET
        ? `사용 (${envValues.S3_PUBLIC_BASE_URL || envValues.S3_BUCKET})`
        : "미사용 (URL 직접 입력만)"
    ),
  ]);

  const shouldWrite = await confirm({
    message: ".env를 쓰고 quickstart를 시작할까요?",
    default: true,
  });

  if (!shouldWrite) {
    throw new Error("사용자가 설정 저장을 취소했습니다.");
  }

  const backupPath = backupExistingEnv(repoRoot);
  if (backupPath) {
    info(`기존 .env는 ${backupPath} 로 백업했습니다.`);
  }

  writeEnvFile(repoRoot, envValues);
  success(".env 파일을 갱신했습니다.");

  return envValues;
}

async function runConfigure(repoRoot) {
  const envValues = await collectConfig(repoRoot);
  printPanel("이제 실제 실행을 시작합니다", [
    "Docker 기본 상태 확인",
    "필요하면 Docker 자동 시작 점검",
    "quickstart compose 실행",
  ]);
  await checkDockerBasics();
  await maybeEnableDockerAutostart();
  await startQuickstart(repoRoot, envValues);
  printAdminAccess(envValues);
  info("다음부터는 `univote status`, `univote logs`, `univote qr` 로 바로 관리할 수 있습니다.");
}

async function runExperimental(repoRoot) {
  printBanner(
    "UNIVOTE Experimental Mode",
    "DNS 없이 로컬 시험장을 바로 띄우는 가장 빠른 확인 경로"
  );
  printPanel("이 모드의 특징", [
    "Docker 기반 로컬 시험장을 실행합니다.",
    "샘플 사용자 / 샘플 게임 / 관리자 계정이 자동으로 준비됩니다.",
    "실운영 quickstart와는 분리된 mock 환경입니다.",
  ]);
  await runCommand("sh", [path.join(repoRoot, "scripts", "local-lab-up.sh")], {
    cwd: repoRoot,
    stdio: "inherit",
  });
  info("실운영 서버를 준비할 때는 `univote configure` 로 돌아가 DNS/HTTPS 설정을 진행하면 됩니다.");
}

async function runExperimentalDown(repoRoot) {
  printBanner(
    "UNIVOTE Experimental Cleanup",
    "로컬 시험장 컨테이너와 mock DB를 깨끗하게 정리합니다."
  );
  await runCommand("sh", [path.join(repoRoot, "scripts", "local-lab-down.sh")], {
    cwd: repoRoot,
    stdio: "inherit",
  });
}

async function runInteractiveMenu(repoRoot) {
  renderControlCenter(repoRoot);

  const choice = await select({
    message: colors.bold("실행할 작업을 선택하세요"),
    pageSize: getMenuPageSize(),
    theme: {
      icon: {
        cursor: colors.brightCyan(colors.bold("❯")),
      },
      indexMode: "number",
      style: {
        highlight: (text) => colors.brightCyan(colors.bold(text)),
        description: (text) => colors.dim(text),
        keysHelpTip: () => colors.dim("↑↓ move • enter select"),
      },
    },
    choices: MENU_CHOICES,
  }, {
    clearPromptOnDone: true,
  });

  return choice;
}

async function runCommandFromName(commandName, repoRoot) {
  const envValues = existsSync(getEnvPath(repoRoot)) ? loadExistingEnv(repoRoot) : null;

  switch (commandName) {
    case "configure":
      await runConfigure(repoRoot);
      return;
    case "experimental":
      await runExperimental(repoRoot);
      return;
    case "experimental-down":
      await runExperimentalDown(repoRoot);
      return;
    case "update":
      await updateQuickstart(repoRoot);
      return;
    case "start":
      await ensureEnvExists(repoRoot);
      await checkDockerBasics();
      await maybeEnableDockerAutostart();
      await startQuickstart(repoRoot, envValues);
      printAccessSummary(envValues);
      return;
    case "stop":
      await ensureEnvExists(repoRoot);
      await stopQuickstart(repoRoot);
      return;
    case "down":
      await ensureEnvExists(repoRoot);
      await downQuickstart(repoRoot);
      return;
    case "restart":
      await ensureEnvExists(repoRoot);
      await restartQuickstart(repoRoot, envValues);
      printAccessSummary(envValues);
      return;
    case "status":
      await ensureEnvExists(repoRoot);
      await verifyQuickstart(repoRoot, envValues);
      printAccessSummary(envValues);
      return;
    case "logs":
      await ensureEnvExists(repoRoot);
      await showLogs(repoRoot);
      return;
    case "qr":
      await printQr(repoRoot);
      return;
    case "doctor":
      await runDoctor(repoRoot);
      return;
    case "help":
      console.log(HELP_TEXT);
      return;
    case "version":
      console.log(`univote-cli v${CLI_VERSION}`);
      return;
    default:
      throw new Error(`알 수 없는 명령입니다: ${commandName}`);
  }
}

function normalizeCommandName(commandName) {
  if (commandName === "-h" || commandName === "--help") {
    return "help";
  }

  if (commandName === "-v" || commandName === "--version") {
    return "version";
  }

  return commandName;
}

async function main() {
  const repoRoot = findRepoRoot(process.cwd());
  if (!repoRoot) {
    throw new Error(
      "UNICON Vote App 저장소 루트에서 실행해주세요. docker-compose.quickstart.yml 을 찾지 못했습니다."
    );
  }

  const rawCommandName = process.argv[2];
  const commandName = rawCommandName ? normalizeCommandName(rawCommandName) : rawCommandName;

  if (!commandName) {
    if (!process.stdin.isTTY) {
      console.log(HELP_TEXT);
      return;
    }

    const choice = await runInteractiveMenu(repoRoot);
    if (choice === "exit") {
      return;
    }

    await runCommandFromName(choice, repoRoot);
    return;
  }

  await runCommandFromName(commandName, repoRoot);
}

main().catch((error) => {
  fail(error.message || "알 수 없는 오류가 발생했습니다.");
  process.exitCode = 1;
});
