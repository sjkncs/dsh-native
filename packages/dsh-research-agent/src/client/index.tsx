/**
 * dsh-research-agent 浏览器半边：
 * 1. 注入面板样式（<style>，卸载时移除）；
 * 2. 学界皮肤：localStorage 持久化开关 + ctx.theme.overrideTokens 调和；
 * 3. 开启瞬间自动进入「科研工作台」专用工作区（幂等创建 + connectWorkspace）；
 * 4. conversation.input.dock 注册情境入口面板；
 * 5. settings.general.item 注册模式开关行；
 * 6. sidebar.footer.action + shell.overlay 注册科研工作台。
 */
import { createSnapshotStore } from '@deepseek-ai/dsh-client-runtime/client'
import { PRESET_ID, RESEARCH_WORKSPACE_PATH, SITUATION_CARDS, isSituationCard, type SituationCard } from './cards.ts'
import { BrandPanel } from './panel.tsx'
import { ResearchModeRow } from './mode-row.tsx'
import { WorkbenchButton, WorkbenchDrawer, type WorkbenchData } from './workbench.tsx'
import { SKIN_SOURCE, SKIN_TOKENS } from './skin.ts'
import { PANEL_CSS } from './styles.ts'
import { makeLocale } from './locale.ts'
import type { InputActionsLike, ResearchCtx } from './types.ts'

export const name = 'dsh-research-agent'

export const inject = ['slots', 'theme', 'connection', 'sessions', 'workspaces', 'locale']

/** 浏览器插件入口。 */
export function apply(ctx: ResearchCtx): void {
  // ── 样式 ──────────────────────────────────────────────────────────────
  ctx.effect(() => {
    const tag = document.createElement('style')
    tag.dataset.plugin = name
    tag.textContent = PANEL_CSS
    document.head.appendChild(tag)
    return () => { tag.remove() }
  }, 'dsh-research-agent: panel styles')

  // ── 语言桥（宿主 Language 偏好驱动；缺席时中文兜底）──────────────────
  const locale = makeLocale(n => ctx.get(n))
  ctx.effect(() => locale.dispose, 'dsh-research-agent: locale dicts')

  // ── 皮肤 ──────────────────────────────────────────────────────────────
  // prevDefault 记录开启时被替换掉的默认预设，供关闭时恢复。
  interface SkinState { enabled: boolean; prevDefault?: string }
  const skinStore = createSnapshotStore<SkinState>(
    { enabled: false },
    { persist: { name: 'dsh-research-agent.skin' } },
  )
  let disposeSkin: (() => void) | undefined
  const reconcileSkin = (): void => {
    const { enabled } = skinStore.getSnapshot()
    // 品牌替换 CSS 以 body[data-research-skin] 为总闸，与 token 叠层同开同关。
    if (enabled) {
      document.body.dataset.researchSkin = ''
    } else {
      delete document.body.dataset.researchSkin
    }
    if (enabled && disposeSkin === undefined) {
      disposeSkin = ctx.theme.overrideTokens(SKIN_SOURCE, SKIN_TOKENS)
    } else if (!enabled && disposeSkin !== undefined) {
      disposeSkin()
      disposeSkin = undefined
    }
  }
  // 默认预设跟随开关：开 → 记住原默认并切「科研模式」；关 → 若默认仍是
  // 「科研模式」则恢复原默认（期间用户手动改过默认就不打扰）。串行队列
  // 防止快速拨动开关时的读写交错。
  let presetQueue: Promise<void> = Promise.resolve()
  const reconcileDefaultPreset = (): void => {
    presetQueue = presetQueue.then(async () => {
      const connection = ctx.get('connection')
      if (connection === undefined) return
      const { api } = connection
      const { enabled, prevDefault } = skinStore.getSnapshot()
      const list = await api.agentPresets.list({})
      if (!list.result.ok) return
      const rows = list.result.value.presets
      const currentDefault = rows.find(row => row.isDefault === true)?.id
      // 默认预设只影响「此后新建」的会话；正在展示的空白会话是之前建的，
      // 徽章不会自己变——这里把它也一并切过去（非空白会话不动，切换被锁）。
      const retargetBlankCurrent = async (target: string): Promise<void> => {
        const sessions = ctx.sessions.list.getSnapshot()
        const id = sessions.current
        if (id === undefined) return
        const row = sessions.byId[id]
        if (row === undefined || !row.blank || row.agentPreset === target) return
        const response = await api.agentPresets.select({ sessionId: id, agentPreset: target })
        if (response.result.ok) ctx.sessions.noteAgentPreset(id, response.result.value.agentPreset)
      }
      if (enabled) {
        const usable = rows.some(row => row.id === PRESET_ID && row.broken === undefined)
        if (!usable) return
        if (currentDefault !== PRESET_ID) {
          skinStore.update(draft => { draft.prevDefault = currentDefault })
          await api.settings.update({ ns: 'agent-presets', patch: { default: PRESET_ID } })
        }
        await retargetBlankCurrent(PRESET_ID)
      } else if (prevDefault !== undefined) {
        if (currentDefault === PRESET_ID) {
          await api.settings.update({ ns: 'agent-presets', patch: { default: prevDefault } })
        }
        await retargetBlankCurrent(prevDefault)
        skinStore.update(draft => { draft.prevDefault = undefined })
      }
    }).catch(error => {
      // 诊断日志：默认预设调和失败不致命（下次开关或刷新会重试），但必须可见。
      console.error('[dsh-research-agent] default-preset reconcile failed:', error)
    })
  }

  // ── 专用工作区：开启瞬间进入（关键差异点）────────────────────────────
  // create 幂等：目录已被注册过就直接返回现有工作区；随后 connectWorkspace
  // 打开它（自带空白会话）。只在「活的」off→on 拨动时触发——刷新后的首帧
  // 调和不动用户当前所在的工作区。失败不致命：皮肤与预设仍然生效。
  const enterResearchWorkspace = (): void => {
    void (async () => {
      try {
        const workspace = await ctx.workspaces.create({ path: RESEARCH_WORKSPACE_PATH })
        const sessionId = await ctx.workspaces.connectWorkspace(workspace.workspaceId)
        ctx.sessions.open(sessionId)
      } catch (error) {
        console.error('[dsh-research-agent] enter research workspace failed:', error)
      }
    })()
  }

  let lastEnabled = skinStore.getSnapshot().enabled
  ctx.effect(() => {
    const stop = skinStore.subscribe(() => {
      reconcileSkin()
      const { enabled } = skinStore.getSnapshot()
      if (enabled !== lastEnabled) {
        lastEnabled = enabled
        reconcileDefaultPreset()
        if (enabled) {
          // 排在默认预设调和之后：空白会话要等 default 写成「科研模式」再建，
          // 否则会话的预设选择器会落在旧预设上。快拨回关时再次校验开关。
          presetQueue = presetQueue.then(() => {
            if (skinStore.getSnapshot().enabled) enterResearchWorkspace()
          })
        }
      }
    })
    reconcileSkin()
    // 首帧调和一次：处理「上次开着但默认预设被外力改走」或反向的漂移。
    reconcileDefaultPreset()
    return () => {
      stop()
      delete document.body.dataset.researchSkin
      if (disposeSkin !== undefined) {
        disposeSkin()
        disposeSkin = undefined
      }
    }
  }, 'dsh-research-agent: skin reconcile')

  // ── preset 探测与卡片动作 ─────────────────────────────────────────────
  const connection = ctx.get('connection')
  if (connection === undefined) return
  const { api } = connection

  let probe: Promise<boolean> | undefined
  const probePreset = (): Promise<boolean> => {
    probe ??= api.agentPresets.list({})
      .then(response => response.result.ok
        && response.result.value.presets.some(row => row.id === PRESET_ID && row.broken === undefined))
      .catch(() => false)
    return probe
  }

  // 卡片跟着 preset 走：node 半边从 preset 目录的 YAML 供数，
  // 路由缺席（preset 未装 / 文件缺失）时回退到内置清单。
  const yamlProbe = (route: string, fallback: readonly SituationCard[]): () => Promise<readonly SituationCard[]> => {
    let cached: Promise<readonly SituationCard[]> | undefined
    return () => {
      cached ??= fetch(route)
        .then(response => (response.ok ? response.json() : { cards: [] }))
        .then((data: { cards?: unknown }) => {
          const rows = Array.isArray(data.cards) ? data.cards.filter(isSituationCard) : []
          return rows.length > 0 ? rows : fallback
        })
        .catch(() => fallback)
      return cached
    }
  }
  const probeCards = yamlProbe('/dsh-research-agent/cards', SITUATION_CARDS)

  const launch = async (
    sessionId: string,
    inputActions: InputActionsLike,
    template: string,
  ): Promise<void> => {
    const response = await api.agentPresets.select({ sessionId, agentPreset: PRESET_ID })
    if (response.result.ok) {
      ctx.sessions.noteAgentPreset(sessionId, response.result.value.agentPreset)
    }
    inputActions.setDraft(template)
  }

  // ── 科研工作台：root 作用域的启动链路 ────────────────────────────────
  // 当前是空白会话就直接用；不是就 startSession() 开新的，落地后再应用。
  // 科研模式下默认展开；用户收起/展开的选择持久化。
  const workbenchStore = createSnapshotStore(
    { open: true },
    { persist: { name: 'dsh-research-agent.workbench-open' } },
  )
  const workbenchData = createSnapshotStore<WorkbenchData>(
    { entries: [] },
    { persist: { name: 'dsh-research-agent.workbench-data' } },
  )
  // body[data-research-wb] 是排版占位的总闸（CSS 给 #root 预留右侧空间）。
  const reconcileWorkbenchAttr = (): void => {
    const docked = skinStore.getSnapshot().enabled && workbenchStore.getSnapshot().open
    if (docked) {
      document.body.dataset.researchWb = ''
    } else {
      delete document.body.dataset.researchWb
    }
  }
  ctx.effect(() => {
    const stopSkin = skinStore.subscribe(reconcileWorkbenchAttr)
    const stopWb = workbenchStore.subscribe(reconcileWorkbenchAttr)
    reconcileWorkbenchAttr()
    return () => {
      stopSkin()
      stopWb()
      delete document.body.dataset.researchWb
    }
  }, 'dsh-research-agent: workbench dock attr')
  const applyTemplate = async (sessionId: string, template: string): Promise<void> => {
    const row = ctx.sessions.list.getSnapshot().byId[sessionId]
    if (row !== undefined && row.agentPreset !== PRESET_ID) {
      const response = await api.agentPresets.select({ sessionId, agentPreset: PRESET_ID })
      if (response.result.ok) ctx.sessions.noteAgentPreset(sessionId, response.result.value.agentPreset)
    }
    const actx = ctx.sessions.scope(sessionId)
    const conversation = actx?.get('conversation')
    if (actx !== undefined && conversation !== undefined) {
      conversation.input.for(actx).setDraft(template)
    }
  }
  let pendingTemplate: string | undefined
  const launchFromRoot = (template: string): void => {
    const snapshot = ctx.sessions.list.getSnapshot()
    const current = snapshot.current !== undefined ? snapshot.byId[snapshot.current] : undefined
    if (current !== undefined && current.blank) {
      void applyTemplate(current.id, template).catch(() => {})
      return
    }
    pendingTemplate = template
    ctx.workspaces.startSession()
  }
  ctx.effect(() => ctx.sessions.list.subscribe(() => {
    if (pendingTemplate === undefined) return
    const snapshot = ctx.sessions.list.getSnapshot()
    const id = snapshot.current
    if (id === undefined) return
    const row = snapshot.byId[id]
    if (row === undefined || !row.blank) return
    const template = pendingTemplate
    pendingTemplate = undefined
    void applyTemplate(id, template).catch(() => {})
  }), 'dsh-research-agent: pending workbench launch')

  // ── slot 注册 ─────────────────────────────────────────────────────────
  ctx.slots.inject('conversation.input.dock', () => ctx.slots.register({
    name: 'conversation.input.dock',
    id: 'dsh-research-brand-panel',
    order: -10,
    inject: () => ({ probePreset, probeCards, launch, skin: skinStore, t: locale.t, localeFace: locale.face }),
  }, BrandPanel))

  ctx.slots.inject('settings.general.item', () => ctx.slots.register({
    name: 'settings.general.item',
    id: 'dsh-research-mode-row',
    order: 60,
    inject: () => ({ skin: skinStore, t: locale.t, localeFace: locale.face }),
  }, ResearchModeRow))

  ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({
    name: 'sidebar.footer.action',
    id: 'dsh-research-workbench',
    order: -5,
    inject: () => ({ skin: skinStore, workbench: workbenchStore, t: locale.t, localeFace: locale.face }),
  }, WorkbenchButton))

  ctx.slots.inject('shell.overlay', () => ctx.slots.register({
    name: 'shell.overlay',
    id: 'dsh-research-workbench-panel',
    inject: () => ({ skin: skinStore, workbench: workbenchStore, data: workbenchData, launch: launchFromRoot, t: locale.t, localeFace: locale.face }),
  }, WorkbenchDrawer))
}
