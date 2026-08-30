# Changelog

本项目版本以 git tag 标记，工作区始终为最新版。

## v0.1.0（2026-08-16）— 首次公开发布

- 跨窗口提醒：任务完成 / 需要审批 → 右下角系统通知（Notification API），任何窗口状态都弹，点击回 DSH 并打开会话，3-5 秒自动消失
- 事件检测：conversation 快照 turn/end（含耗时）+ 会话列表 pendingInteraction（审批）+ 后台会话 running→idle 兜底通道（时间窗去重）
- 设置通道：插件自有 Typert Remote（reminder/getSettings·updateSettings，zod 严格 codec）——Web 设置 API 命名空间白名单限制下的标准方案
- 体验：SVG 图标（完成绿勾 / 审批琥珀感叹 / 测试青铃）、Web Audio 双音提示（D4→A4 + 低八度垫音，手势解锁）、设置页一键「开启并测试通知」、失败提醒预留项
- 质量：21 项测试（判定 13 + 冒烟 2 + 接线 6）、host 真实 cordis 启动冒烟、隔离实例 + 真实网关端到端验证、npm 打包预检
- 文档：中英双语 README（顶部切换）+ 双通知预览图 + PRD/CHANGELOG/LICENSE
- 历史备注：开发期曾经历「页面内卡片」方案（后被跨窗口通知取代）与多项实测修复（Chrome actions 限制、音频手势解锁、多会话补弹等）

## 开发历程（内部）

- 2026-08-15：工作区骨架 + PRD + 社区调研归档（M0）
- 2026-08-16：host 插件 + 页面内卡片方案（M1-M2 初版）→ 用户实测后重定义为跨窗口通知 → 本机验收 AC 全数确认 → 首次公开
