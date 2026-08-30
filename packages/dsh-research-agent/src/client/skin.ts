/**
 * 学界皮肤：墨青 + 冷白纸感 + 学术蓝点缀的 token 叠层。
 * 每个 token 必须给 {light, dark} 对（overrideTokens 的硬约束）；
 * 暗色是「深夜书房」——深墨青底、主色调亮、学术蓝降饱和上提。
 */
export const SKIN_SOURCE = 'dsh-research-agent'

export const SKIN_TOKENS: Record<string, { light: string; dark: string }> = {
  '--dsw-alias-bg-base': { light: '#f7fafb', dark: '#0f1a1e' },
  '--dsw-alias-bg-layer-1': { light: '#fdfeff', dark: '#14232a' },
  '--dsw-alias-bg-layer-2': { light: '#eef4f5', dark: '#1a2d35' },
  '--dsw-alias-brand-primary': { light: '#1a5276', dark: '#7fb3d5' },
  '--dsw-alias-brand-text': { light: '#1a5276', dark: '#8fc1e3' },
  '--dsw-alias-button-primary-fill': { light: '#1a5276', dark: '#2e6a8f' },
  '--dsw-alias-button-primary-hover': { light: '#21618c', dark: '#38789f' },
  '--dsw-alias-interactive-bg-hover-accent': { light: 'rgba(26, 82, 118, 0.10)', dark: 'rgba(127, 179, 213, 0.16)' },
  '--dsw-specific-sidebar-fill': { light: '#eff4f6', dark: '#0b151a' },
  '--dsw-specific-bubble': { light: '#f1f6f7', dark: '#16272f' },
  '--dsw-specific-input-major': { light: '#fdfeff', dark: '#14232a' },
}
