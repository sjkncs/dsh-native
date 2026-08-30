/**
 * The dsh-reminder stylesheet: only the settings-section rows (the popup is
 * a native desktop notification now — no in-page cards). Injected once by
 * the plugin body; class names carry the dsh_reminder prefix.
 */

/** Stable <style> element id (idempotent injection across HMR re-runs). */
export const STYLE_ID = 'dsh-reminder-style'

/** The settings panel's injected stylesheet text. */
export const cssText = `
/* 设置面板（挂在 settings.section 槽位，沿用 DSH 暗色主题） */
.dsh_reminder_section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}
.dsh_reminder_sectionTitle {
  margin: 0;
  color: var(--dsw-alias-label-primary);
  font-size: 18px;
  line-height: 26px;
  font-weight: 600;
}
.dsh_reminder_sectionSubtitle {
  margin: 0;
  color: var(--dsw-alias-label-tertiary);
  font-size: 13px;
  line-height: 20px;
}
.dsh_reminder_row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  min-width: 0;
  padding: 14px 16px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 12px;
  background: var(--dsw-alias-bg-layer-1);
}
.dsh_reminder_row_disabled {
  opacity: 0.6;
}
.dsh_reminder_checkbox {
  flex: none;
  width: 18px;
  height: 18px;
  margin: 0;
  accent-color: var(--dsw-alias-brand-primary);
  cursor: pointer;
}
.dsh_reminder_rowText {
  display: flex;
  flex: 1 1 220px;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.dsh_reminder_rowTitle {
  color: var(--dsw-alias-label-primary);
  font-size: 14px;
  line-height: 22px;
}
.dsh_reminder_rowDesc {
  color: var(--dsw-alias-label-tertiary);
  font-size: 13px;
  line-height: 20px;
}
.dsh_reminder_rangeValue {
  flex: none;
  min-width: 44px;
  text-align: right;
  color: var(--dsw-alias-label-primary);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 13px;
  line-height: 20px;
}
.dsh_reminder_range {
  flex: 1 1 100%;
  width: 100%;
  min-width: 0;
  height: 20px;
  margin: 2px 0 0;
  accent-color: var(--dsw-alias-brand-primary);
  cursor: pointer;
}
.dsh_reminder_permissionButton {
  flex: none;
  height: 30px;
  padding: 0 14px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 15px;
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 13px;
  line-height: 20px;
  cursor: pointer;
}
.dsh_reminder_permissionButton:hover {
  background: var(--dsw-alias-interactive-bg-hover);
}
`

/**
 * Inject the stylesheet once (stable id; HMR-safe).
 */
export function adoptStyles(): void {
  if (document.getElementById(STYLE_ID) !== null) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = cssText
  document.head.appendChild(style)
}
