/**
 * 面板与设置行样式。全部取色自 --dsw-alias-* / --dsw-specific-* 语义 token，
 * 皮肤开关只改 token 值，这里无须感知明暗。
 */
export const PANEL_CSS = `
.rs-panel {
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 10px;
  background: var(--dsw-alias-bg-layer-1);
  padding: 14px 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.rs-panel-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
}
.rs-panel-title {
  font-family: "Songti SC", "STSong", SimSun, serif;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: .08em;
  color: var(--dsw-alias-brand-text);
}
.rs-panel-sub {
  font-size: 12px;
  color: var(--dsw-alias-label-tertiary);
}
.rs-panel-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}
@media (max-width: 720px) {
  .rs-panel-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
.rs-card {
  text-align: left;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 8px;
  background: var(--dsw-alias-bg-base);
  padding: 9px 11px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 3px;
  transition: border-color .15s ease, background .15s ease;
}
.rs-card:hover {
  border-color: var(--dsw-alias-brand-primary);
  background: var(--dsw-alias-interactive-bg-hover);
}
.rs-card:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary);
  outline-offset: 1px;
}
.rs-card-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--dsw-alias-label-primary);
}
.rs-card-title::before {
  content: "";
  display: inline-block;
  width: 3px;
  height: 11px;
  margin-right: 6px;
  border-radius: 1px;
  background: var(--dsw-alias-brand-primary);
  vertical-align: -1px;
}
.rs-card-hint {
  font-size: 11px;
  color: var(--dsw-alias-label-caption);
}
.rs-panel-note {
  font-size: 12px;
  color: var(--dsw-alias-label-secondary);
}
.rs-panel-note b { color: var(--dsw-alias-brand-text); font-weight: 600; }

/* ── 品牌替换（仅皮肤开启时，body[data-research-skin] 把关）───────────────
   选择器锚定 CSS Modules 的稳定 local 名（[hash]_[local]），dsh 升级改版式
   时可能失效——失效的表现是回到 DeepSeek 原品牌，无害降级。

   本机结构：_logoRow > _brand(button) > _brandIdentity
     > _brandMark（鲸鱼图标 svg） + _brandName（"DeepSeek" 字标 svg）。
   教训一：绝不用 [class*="_brand"] 子串挂 ::after——它会同时命中
   _brand/_brandIdentity/_brandMark/_brandName 四层，文案叠四份。
   教训二：绝不用固定负边距吞字标（不同宿主字标宽度不同，必翻车）——
   直接 _brandName { display:none }。 */
body[data-research-skin] [class*="_logoRow"] [class*="_brandName"] { display: none; }
/* 鲸鱼图标：原尺寸、学术蓝。 */
body[data-research-skin] [class*="_logoRow"] [class*="_brandMark"] svg {
  display: block;
  flex: none;
  color: #1a5276;
}
/* 字标文案只挂在 _brandIdentity 一处，全侧栏唯一一份。 */
body[data-research-skin] [class*="_logoRow"] [class*="_brandIdentity"]::after {
  content: "科研 · agent";
  font-family: "Songti SC", "STSong", SimSun, serif;
  font-size: 17px;
  font-weight: 700;
  letter-spacing: .14em;
  color: var(--dsw-alias-brand-text);
  white-space: nowrap;
}
/* 侧栏折叠态（根上出现 _collapsed）只留鲸鱼，收起字标文案。 */
body[data-research-skin] [class*="_collapsed"] [class*="_brandIdentity"]::after { content: none; }
/* 首屏鲸鱼：学术蓝 + 盖章式微倾。 */
body[data-research-skin] [class*="_fish"] {
  color: #1a5276;
  transform: rotate(-4deg);
}
/* 深色（深夜书房）下学术蓝上提一档保持可读。 */
body[data-research-skin][data-ds-dark-theme] [class*="_logoRow"] [class*="_brandMark"] svg,
body[data-research-skin][data-ds-dark-theme] [class*="_fish"] {
  color: #7fb3d5;
}
body[data-research-skin] [class*="_headlineText"] {
  font-size: 0;
  letter-spacing: 0;
}
body[data-research-skin] [class*="_headlineText"]::before {
  content: "学界之内，自有章法";
  font-family: "Songti SC", "STSong", SimSun, serif;
  font-size: 30px;
  font-weight: 700;
  letter-spacing: .1em;
  color: var(--dsw-alias-brand-text);
}

/* ── 科研工作台 ─────────────────────────────────────────────────────── */
.rs-wb-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 5px 9px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 8px;
  background: var(--dsw-alias-bg-layer-1);
  cursor: pointer;
  color: var(--dsw-alias-label-primary);
  transition: border-color .15s ease, background .15s ease;
}
.rs-wb-btn:hover, .rs-wb-btn[data-open="true"] { border-color: var(--dsw-alias-brand-primary); }
.rs-wb-btn:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 1px; }
.rs-wb-btn-seal {
  flex: none;
  width: 18px; height: 18px;
  border-radius: 4px;
  background: #1a5276;
  color: #f4f8fb;
  display: grid;
  place-items: center;
  font-family: "Songti SC", "STSong", SimSun, serif;
  font-size: 12px;
  font-weight: 700;
  transform: rotate(-3deg);
}
.rs-wb-btn-text { font-size: 12.5px; font-weight: 600; }
/* 右侧常驻工作区：占位排版由 body[data-research-wb] 对 #root 的右内边距
   完成，工作区栏本体固定右缘，与左侧栏呼应的冷白底 + 左侧细分隔线。 */
body[data-research-wb] #root {
  box-sizing: border-box;
  padding-right: 372px;
}
@media (max-width: 1080px) {
  body[data-research-wb] #root { padding-right: 0; }
  .rs-wb-drawer { box-shadow: -8px 0 28px var(--dsw-alias-bg-mask-1, rgba(0,0,0,.18)); }
}
.rs-wb-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 40;
  width: 372px;
  max-width: calc(100vw - 48px);
  pointer-events: auto;
  border-left: 1px solid var(--dsw-alias-border-l2);
  background: var(--dsw-specific-sidebar-fill, var(--dsw-alias-bg-base));
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.rs-wb-head {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px 8px;
}
.rs-wb-title {
  font-family: "Songti SC", "STSong", SimSun, serif;
  font-size: 15.5px;
  font-weight: 700;
  letter-spacing: .08em;
  color: var(--dsw-alias-brand-text);
}
.rs-wb-close {
  border: none;
  background: none;
  cursor: pointer;
  font-size: 17px;
  line-height: 1;
  padding: 2px 7px;
  border-radius: 6px;
  color: var(--dsw-alias-label-tertiary);
}
.rs-wb-close:hover { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }
.rs-wb-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 10px 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
/* ── 模块卡片 ── */
.rs-mod-card {
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 12px;
  background: var(--dsw-alias-bg-layer-1);
  box-shadow: 0 1px 4px var(--dsw-alias-bg-mask-1, rgba(0,0,0,.05));
  padding: 11px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: border-color .18s ease, box-shadow .18s ease;
}
.rs-mod-card:hover {
  border-color: var(--dsw-alias-brand-primary);
  box-shadow: 0 3px 12px var(--dsw-alias-bg-mask-1, rgba(0,0,0,.08));
}
.rs-mod-head {
  display: flex;
  align-items: center;
  gap: 9px;
}
.rs-mod-seal {
  flex: none;
  width: 30px;
  height: 30px;
  border-radius: 6px;
  background: #1a5276;
  color: #f4f8fb;
  display: grid;
  place-items: center;
  font-family: "Songti SC", "STSong", SimSun, serif;
  font-size: 15px;
  font-weight: 700;
  transform: rotate(-3deg);
  box-shadow: inset 0 0 0 1.2px rgba(244, 248, 251, .5);
  user-select: none;
}
.rs-mod-meta { display: flex; flex-direction: column; min-width: 0; flex: 1; }
.rs-mod-title {
  font-family: "Songti SC", "STSong", SimSun, serif;
  font-size: 14.5px;
  font-weight: 700;
  letter-spacing: .05em;
  color: var(--dsw-alias-label-primary);
  line-height: 1.25;
}
.rs-mod-hint {
  font-size: 10.5px;
  color: var(--dsw-alias-label-caption);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.rs-mod-count {
  flex: none;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: var(--dsw-alias-interactive-bg-hover-accent);
  color: var(--dsw-alias-brand-text);
  font-size: 11px;
  font-weight: 600;
  display: grid;
  place-items: center;
  font-variant-numeric: tabular-nums;
}
.rs-mod-add {
  flex: none;
  width: 24px;
  height: 24px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 7px;
  background: none;
  cursor: pointer;
  font-size: 15px;
  line-height: 1;
  color: var(--dsw-alias-label-secondary);
  display: grid;
  place-items: center;
  transition: border-color .15s ease, color .15s ease, background .15s ease;
}
.rs-mod-add:hover {
  border-color: var(--dsw-alias-brand-primary);
  color: var(--dsw-alias-brand-text);
  background: var(--dsw-alias-interactive-bg-hover);
}
.rs-wb-empty {
  padding: 4px 0 2px;
  font-size: 11.5px;
  color: var(--dsw-alias-label-dimmed, var(--dsw-alias-label-tertiary));
}
.rs-wb-entry {
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 9px;
  background: var(--dsw-alias-bg-base);
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.rs-wb-entry-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.rs-wb-entry-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--dsw-alias-label-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rs-wb-entry-title::before {
  content: "";
  display: inline-block;
  width: 3px; height: 10px;
  margin-right: 6px;
  border-radius: 1px;
  background: var(--dsw-alias-brand-primary);
}
.rs-wb-status {
  flex: none;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 999px;
  background: var(--dsw-alias-bg-layer-2);
  padding: 1px 9px;
  font-size: 11px;
  color: var(--dsw-alias-label-secondary);
  cursor: pointer;
  transition: border-color .15s ease, color .15s ease;
}
.rs-wb-status:hover { border-color: var(--dsw-alias-brand-primary); color: var(--dsw-alias-brand-text); }
.rs-wb-entry-line {
  display: flex;
  gap: 7px;
  font-size: 12px;
  line-height: 1.5;
}
.rs-wb-entry-key { flex: none; color: var(--dsw-alias-label-tertiary); }
.rs-wb-entry-value { color: var(--dsw-alias-label-secondary); white-space: pre-wrap; word-break: break-word; }
.rs-wb-entry-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 2px;
}
.rs-wb-mini {
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 6px;
  background: none;
  cursor: pointer;
  padding: 2px 9px;
  font-size: 11.5px;
  color: var(--dsw-alias-label-secondary);
  transition: border-color .15s ease, background .15s ease, color .15s ease;
}
.rs-wb-mini:hover { border-color: var(--dsw-alias-brand-primary); color: var(--dsw-alias-brand-text); }
.rs-wb-mini-primary {
  background: var(--dsw-alias-brand-primary);
  border-color: var(--dsw-alias-brand-primary);
  color: #fff;
}
.rs-wb-mini-primary:hover { color: #fff; opacity: .9; }
.rs-wb-mini-danger:hover { border-color: var(--dsw-alias-state-error, #c0392b); color: var(--dsw-alias-state-error, #c0392b); }
.rs-wb-form {
  border: 1px solid var(--dsw-alias-brand-primary);
  border-radius: 10px;
  padding: 10px 11px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--dsw-alias-bg-base);
}
.rs-wb-field { display: flex; flex-direction: column; gap: 3px; }
.rs-wb-field-label { font-size: 11.5px; color: var(--dsw-alias-label-tertiary); }
.rs-wb-input {
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 6px;
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary);
  font-size: 12.5px;
  padding: 5px 8px;
  font-family: inherit;
  resize: vertical;
}
.rs-wb-input:focus { outline: none; border-color: var(--dsw-alias-brand-primary); }
.rs-wb-form-actions { display: flex; gap: 6px; }
.rs-wb-foot {
  flex: none;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-top: 1px solid var(--dsw-alias-border-l1);
}
.rs-wb-foot-note {
  margin-left: auto;
  font-size: 10.5px;
  color: var(--dsw-alias-label-dimmed, var(--dsw-alias-label-tertiary));
}

.rs-settings-card {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  text-align: left;
  padding: 10px 14px;
  border: 1.5px solid var(--dsw-alias-border-l2);
  border-radius: 10px;
  background: var(--dsw-alias-bg-layer-1);
  cursor: pointer;
  transition: border-color .18s ease, background .18s ease, box-shadow .18s ease;
}
.rs-settings-card:hover { border-color: var(--dsw-alias-brand-primary); }
.rs-settings-card:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary);
  outline-offset: 2px;
}
.rs-settings-card[data-on="true"] {
  border-color: var(--dsw-alias-brand-primary);
  box-shadow: 0 0 0 3px var(--dsw-alias-interactive-bg-hover-accent);
}
.rs-seal {
  flex: none;
  width: 34px;
  height: 34px;
  border-radius: 6px;
  background: #1a5276;
  color: #f4f8fb;
  display: grid;
  place-items: center;
  font-family: "Songti SC", "STSong", SimSun, serif;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: .06em;
  line-height: 1.1;
  transform: rotate(-3deg);
  box-shadow: inset 0 0 0 1.5px rgba(244, 248, 251, .55);
  filter: grayscale(1) opacity(.45);
  transition: filter .18s ease, transform .18s ease;
  user-select: none;
}
.rs-settings-card[data-on="true"] .rs-seal,
.rs-settings-card:hover .rs-seal {
  filter: none;
  transform: rotate(-3deg) scale(1.04);
}
.rs-settings-meta { display: flex; flex-direction: column; gap: 3px; min-width: 0; flex: 1; }
.rs-settings-label {
  font-family: "Songti SC", "STSong", SimSun, serif;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: .05em;
  color: var(--dsw-alias-label-primary);
}
.rs-settings-label b {
  color: var(--dsw-alias-brand-text);
  font-weight: 700;
}
.rs-settings-desc {
  font-size: 12.5px;
  line-height: 1.55;
  color: var(--dsw-alias-label-secondary);
}
.rs-settings-state {
  flex: none;
  display: flex;
  align-items: center;
  gap: 10px;
}
.rs-settings-state-word {
  font-size: 12px;
  color: var(--dsw-alias-label-tertiary);
  transition: color .18s ease;
}
.rs-settings-card[data-on="true"] .rs-settings-state-word {
  color: var(--dsw-alias-brand-text);
  font-weight: 600;
}
.rs-switch {
  flex: none;
  width: 46px;
  height: 26px;
  border-radius: 13px;
  border: 1px solid var(--dsw-alias-border-l2);
  background: var(--dsw-alias-bg-layer-2);
  position: relative;
  pointer-events: none;
  transition: background .18s ease, border-color .18s ease;
}
.rs-switch::after {
  content: "";
  position: absolute;
  top: 2px; left: 2px;
  width: 20px; height: 20px;
  border-radius: 50%;
  background: var(--dsw-alias-label-tertiary);
  transition: transform .18s ease, background .18s ease;
}
.rs-switch[data-on="true"] {
  background: var(--dsw-alias-brand-primary);
  border-color: var(--dsw-alias-brand-primary);
}
.rs-switch[data-on="true"]::after {
  transform: translateX(20px);
  background: #fff;
}
`
