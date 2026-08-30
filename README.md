# dsh-native

<!-- 红线：阶段只写「正式版」，其余阶段称谓一律禁用；全仓禁 emoji，图标一律 SVG。 -->

<p align="center">
  <b>DeepSeek Harness 正式版 · 全栈发行</b><br />
  官方宿主 + 七个插件 + 三个预设 + 内置科研版，一条命令复现整条栈
</p>

<p align="center">
  <a href="https://sjkncs.github.io/dsh-native/">展示站</a> ·
  <a href="https://sjkncs.github.io/dsh-research/">科研版专站</a> ·
  <a href="https://github.com/sjkncs/dsh-research">dsh-research</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/阶段-正式版-18b26b" alt="正式版" />
  <img src="https://img.shields.io/badge/dsh-0.1.1--rc.2-6c8cff" alt="dsh 0.1.1-rc.2" />
  <img src="https://img.shields.io/badge/Node.js-18%2B-35c98e" alt="Node.js 18+" />
  <img src="https://img.shields.io/badge/License-MIT-9a6cff" alt="MIT" />
</p>

---

## 这是什么

`dsh-native` 是一台「提升过的 DeepSeek Harness」的完整发行仓库：

- **官方宿主**：`@deepseek-ai/dsh@0.1.1-rc.2`，版本锁定，不改内核；
- **四个内置插件随库分发**：源码与构建产物都在仓库里，可审计、可重建；
- **三个社区插件按上游引用**：装哪一版由 `profile/package.json` 清单决定；
- **三个内置预设**：科研（默认）/ 建模编程 / 论文，persona、工具面、技能全部声明式；
- **内置科研版**：科研版整建制内置（预设 + `dsh-research-agent` + 学术检索），开箱即用；
- **一条命令**：`scripts/setup.mjs` 复现全栈，跨 Windows / macOS / Linux。

本仓库是发行层：官方内核与社区上游保持原位引用，本仓库只对随库分发的部分负责。

## 插件栈

| 名称 | 版本 | 来源 | 职责 |
|---|---|---|---|
| `@deepseek-ai/dsh` | 0.1.1-rc.2 | 官方 | 宿主运行时：CLI、profile 管理、web 服务 |
| `dsh-worktable` | 0.2.2 | 内置 | 工作台：多窗格布局、SVG 图标、挂载轮询兜底、数据速览窗 |
| `dsh-research-agent` | 0.1.0 | 内置 | 科研版：模式开关、学界皮肤、情境卡、科研工作台抽屉 |
| `dsh-reminder` | 0.1.0 | 内置 | 跨窗口提醒：审批琥珀卡、完成绿卡，只提醒不代劳 |
| `dsh-free-academic-search` | 0.1.0 | 内置 | 免费学术检索与下载：多源聚合，无需 API key |
| `@sanqi-normal/dsh-webui-market-plugin` | 0.5.5 | 社区 | 插件市场 |
| `@nanmicoder/dsh-agent-teams` | 0.1.14 | 社区 | 多智能体团队编排 |
| `dsh-usage` | 0.2.0 | 社区 | 侧边栏用量与缓存命中监测 |

内置插件的补丁说明：

- **dsh-worktable**：在上游 0.2.2 基础上打三组补丁——图标全面 SVG 化（旧数据里的历史存储键经别名映射兼容）、项目挂载轮询兜底（补绑定事件丢失的缺口）、数据速览窗（项目文件夹内 CSV/TSV/JSON 直接表格化 + 统计 + 内联图表）。
- **dsh-reminder**：上游 tarball 不含构建产物，本仓库为本地构建副本，并做了界面本地化。
- **dsh-free-academic-search**：附共享核心库 `free-academic-core`，依赖由 workspace 协议改为随库相对引用，npm 环境可直接安装。

## 三个内置预设

| 预设 | 显示名 | 定位 |
|---|---|---|
| `presets/research` | Research Mode | 科研老前辈：六张情境卡、五模块工作台、学术诚信红线 + 最小工具面（默认预设） |
| `presets/model-code` | Modeling & Coding Agent | 建模 + 编程席位：建模设计、Python/MATLAB 实现、Gitee 分目录协作 |
| `presets/paper` | Paper Agent | 论文席位：Word/LaTeX 起草、证据核查、自审门禁、定稿提交 |

宿主不翻译用户预设名，显示名统一英文。科研预设的高权限能力（子代理、工作流、计划模式等）已裁剪，红线由仓库测试强制。

## 仓库结构

```
dsh-native/
  packages/               四个内置插件 + 共享核心库（源码 + 构建产物 + cordis patch）
    dsh-research-agent/   科研版插件（模式开关 / 学界皮肤 / 情境卡 / 工作台）
    dsh-worktable/        工作台（0.2.2 补丁版）
    dsh-reminder/         跨窗口提醒（本地构建副本）
    dsh-free-academic-search/  免费学术检索
    free-academic-core/   检索共享核心库
  presets/                三个预设（research 默认 / model-code / paper），随带技能
  profile/                web profile 清单模板（依赖 + bundles）
  settings/               设置模板（已脱敏，不含任何密钥）
  desktop/                Electron 桌面包装器（自启动、就绪轮询、进程树清理）
  scripts/                跨平台一键安装（setup.mjs + sh/ps1 入口）
  site/                   静态展示站（GitHub Pages）
  tests/                  仓库级测试（红线 / 预设 / 插件 / 清单 / 站点）
```

## 快速开始

前置条件：Node.js 18+ 与 npm。

```bash
# 1. 克隆仓库
git clone https://github.com/sjkncs/dsh-native.git
cd dsh-native

# 2. 一键安装（装锁版本的 dsh、写入插件与 bundle、拷贝预设、按需写入设置模板）
node scripts/setup.mjs          # 已装过 dsh 可加 --skip-dsh

# 3. 启动（默认预设已是科研模式）
dsh web                          # 浏览器访问 http://127.0.0.1:3080
```

### 安装脚本做了什么

1. 安装或确认 `@deepseek-ai/dsh@0.1.1-rc.2`（`--skip-dsh` 跳过）；
2. 检测 `~/.dsh/profiles/web`（需先运行过一次 `dsh web` 初始化）；
3. 把 `profile/package.json` 的依赖与 bundle 组合合并进本机 profile：四个内置插件以 `file:` 指向本仓库 `packages/`，三个社区插件按上游来源引用；
4. 在 profile 目录执行 `npm install`；
5. 拷贝三个预设到 `~/.dsh/.agent-presets/`；
6. 仅当 `~/.dsh/settings.yaml` 不存在时写入模板（默认预设 research）；已有设置绝不覆盖。

安装后**必须重启 `dsh web` 进程**，插件才生效。

## 内置科研版

科研版整建制内置：`Research Mode` 预设 + `dsh-research-agent` 插件 + `dsh-free-academic-search`。设置面板一枚「科研 · agent 模式」开关接管默认预设、工作台与学界皮肤；关闭即恢复原预设。科研版细节见 [科研版专站](https://sjkncs.github.io/dsh-research/)。

## 安全合规

发行级红线由 `tests/policy.test.mjs` 全仓扫描强制：

- 措辞：面向用户产物只写「正式版」，其余阶段称谓一律禁用；
- 图标：禁 emoji，一律 SVG；
- 密钥：凭据与 API key 绝不入库（`settings/` 模板已脱敏，密钥走 `~/.dsh/.credentials.yaml`）；
- 科研预设运行时叠加：学术诚信三条红线 + 最小工具面（高权限能力缺席由 `tests/preset.test.mjs` 验证）。

## 测试与 CI

```bash
npm install        # 仅装测试依赖（yaml）
npm test           # node --test tests/*.test.mjs
```

CI 在 ubuntu / windows / macos 三系统跑全部测试与入口脚本语法检查；`site/` 由独立 Pages 工作流部署。

## 展示站

<https://sjkncs.github.io/dsh-native/> —— 双语（中 / EN）、深浅主题、滚动叙事；数据集中在 `site/data/snapshot.json`，双语键对齐由测试保证。

## 路线图

- [x] 全栈仓库装配与一键安装脚本
- [x] 内置科研版（随 dsh-research v1.0.0 正式版）
- [x] 三操作系统 CI 与 Pages 展示站
- [ ] 依赖安全扫描与安装自检（doctor）
- [ ] 工作台数据导出 / 导入
- [ ] Playwright 端到端测试
- [ ] 桌面包装器签名与自动更新

## 参与贡献

随库分发的插件改动请附重建步骤与测试；社区插件的升级只改 `profile/package.json` 清单，不 vendor 上游源码。红线类改动（措辞 / 图标 / 密钥）以 `tests/` 为准。

## 数据与隐私

科研工作台的条目数据保存在浏览器 localStorage，不上传任何服务器；仓库不含任何会话、凭据、个人数据。

## 免责声明

本仓库为社区发行版，非 DeepSeek 官方产品；DeepSeek Harness 是深度求索的官方开源项目。内置插件的 MIT 许可与上游署名见各 `packages/` 目录。

## 致谢

- DeepSeek 团队：[DeepSeek Harness](https://www.npmjs.com/package/@deepseek-ai/dsh) 宿主
- [Aisland-SJL](https://github.com/Aisland-SJL)：dsh-worktable / dsh-reminder / dsh-usage 上游
- [sanqi-normal](https://github.com/sanqi-normal)：dsh-webui-market-plugin
- [nanmicoder](https://github.com/nanmicoder)：dsh-agent-teams
- [zoujialin1997](https://github.com/zoujialin1997)：free-academic-search
