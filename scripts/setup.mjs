#!/usr/bin/env node
// dsh-native 一键安装：复现「DeepSeek Harness 正式版」全栈本地环境。
// 步骤：dsh CLI（版本锁定）→ web profile 依赖与 bundles 合并（4 个内置插件 file: + 3 个社区插件）
//      → npm install → 三个预设拷贝 → settings.yaml 模板（仅缺失时写入）。
// 用法：node scripts/setup.mjs [--skip-dsh]

import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DSH_VERSION = "0.1.1-rc.2";
const PACKAGES_DIR = join(ROOT, "packages");
const PROFILE_MANIFEST = join(ROOT, "profile", "package.json");
const SETTINGS_TEMPLATE = join(ROOT, "settings", "settings.template.yaml");
const DSH_HOME = process.env.DSH_HOME || join(homedir(), ".dsh");
const PROFILE_DIR = join(DSH_HOME, "profiles", "web");
const PRESETS_SRC = join(ROOT, "presets");
const PRESETS_TARGET = join(DSH_HOME, ".agent-presets");
const PRESET_NAMES = ["research", "model-code", "paper"];
const isWin = process.platform === "win32";

const skipDsh = process.argv.includes("--skip-dsh");

function step(msg) {
  console.log(`\n== ${msg}`);
}

function run(cmd, args, cwd) {
  const r = spawnSync(cmd, args, { cwd, stdio: "inherit", shell: isWin });
  if (r.status !== 0) {
    console.error(`命令失败: ${cmd} ${args.join(" ")}`);
    process.exit(r.status ?? 1);
  }
}

function dshInstalled() {
  try {
    execFileSync(isWin ? "dsh.cmd" : "dsh", ["--version"], { stdio: "pipe", shell: isWin });
    return true;
  } catch {
    return false;
  }
}

step(`1/6 dsh CLI @${DSH_VERSION}`);
if (skipDsh) {
  console.log("--skip-dsh：跳过 CLI 安装。");
} else if (dshInstalled()) {
  console.log("dsh 已安装，跳过（如需强制重装：npm i -g @deepseek-ai/dsh@" + DSH_VERSION + "）。");
} else {
  run("npm", ["install", "-g", `@deepseek-ai/dsh@${DSH_VERSION}`]);
}

step("2/6 web profile 检测");
if (!existsSync(PROFILE_DIR)) {
  console.error(`未找到 profile：${PROFILE_DIR}`);
  console.error("请先运行一次 `dsh web` 初始化 profile，然后重新执行本脚本。");
  process.exit(1);
}
const profilePkgPath = join(PROFILE_DIR, "package.json");
if (!existsSync(profilePkgPath)) {
  console.error(`profile 缺少 package.json：${profilePkgPath}`);
  process.exit(1);
}

step("3/6 合并插件依赖与 bundles");
const manifest = JSON.parse(readFileSync(PROFILE_MANIFEST, "utf8"));
// file: 依赖里的 PACKAGES 占位符替换为本仓库 packages 绝对路径
for (const [name, spec] of Object.entries(manifest.dependencies)) {
  if (typeof spec === "string" && spec.startsWith("file:PACKAGES/")) {
    manifest.dependencies[name] = `file:${join(PACKAGES_DIR, spec.slice("file:PACKAGES/".length))}`;
  }
}
const pkg = JSON.parse(readFileSync(profilePkgPath, "utf8"));
pkg.dependencies = pkg.dependencies || {};
Object.assign(pkg.dependencies, manifest.dependencies);
pkg.dsh = pkg.dsh || {};
pkg.dsh.profile = pkg.dsh.profile || {};
const bundles = pkg.dsh.profile.bundles || [];
for (const b of manifest.dsh.profile.bundles) {
  if (!bundles.includes(b)) bundles.push(b);
}
pkg.dsh.profile.bundles = bundles;
writeFileSync(profilePkgPath, JSON.stringify(pkg, null, 2) + "\n");
console.log(`依赖：${Object.keys(manifest.dependencies).join(", ")}`);
console.log(`bundles：${bundles.join(", ")}`);

step("4/6 安装依赖（profile 目录）");
run("npm", ["install", "--no-audit", "--no-fund"], PROFILE_DIR);

step("5/6 安装三个预设（research / model-code / paper）");
mkdirSync(PRESETS_TARGET, { recursive: true });
for (const name of PRESET_NAMES) {
  cpSync(join(PRESETS_SRC, name), join(PRESETS_TARGET, name), { recursive: true });
  console.log(`preset -> ${join(PRESETS_TARGET, name)}`);
}

step("6/6 settings.yaml");
const settingsPath = join(DSH_HOME, "settings.yaml");
if (existsSync(settingsPath)) {
  console.log("settings.yaml 已存在，保持不变（如需默认科研预设：agent-presets.default: research）。");
} else {
  writeFileSync(settingsPath, readFileSync(SETTINGS_TEMPLATE, "utf8"));
  console.log(`settings.yaml 不存在，已写入模板：${settingsPath}`);
}

console.log(`
安装完成。启动方式：
  dsh web          # 浏览器访问 http://127.0.0.1:3080
  # 或使用 desktop/ 桌面包装器（先在其目录 npm install）

重启生效：插件安装后必须重启 dsh web 进程。
内置科研版：设置面板「科研 · agent 模式」开关（默认预设 research）。`);
