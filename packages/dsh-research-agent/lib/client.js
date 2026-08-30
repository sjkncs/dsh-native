window.__ModuleLoader__.load({ id: 'dsh-research-agent', factory: (require) => { var module = { exports: {} }; var exports = module.exports;
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.tsx
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  inject: () => inject,
  name: () => name
});
module.exports = __toCommonJS(index_exports);
var import_client = require("@deepseek-ai/dsh-client-runtime/client");

// src/client/cards.ts
var SITUATION_CARDS = [
  {
    key: "topic",
    title: "\u9009\u9898\u7ACB\u9879",
    hint: "\u65B9\u5411 \xB7 \u53EF\u884C\u6027 \xB7 \u521B\u65B0\u70B9",
    template: "\u6211\u5173\u6CE8\u7684\u7814\u7A76\u65B9\u5411\u662F\u300C\u2026\u2026\u300D\uFF0C\u624B\u5934\u6761\u4EF6\u662F\u2026\u2026\uFF0C\u5E2E\u6211\u8BC4\u4F30\u51E0\u4E2A\u5019\u9009\u9009\u9898\u7684\u53EF\u884C\u6027\u3001\u521B\u65B0\u70B9\u548C\u5DE5\u4F5C\u91CF\u3002"
  },
  {
    key: "literature",
    title: "\u6587\u732E\u7EFC\u8FF0",
    hint: "\u68C0\u7D22 \xB7 \u68B3\u7406 \xB7 \u627E\u7F3A\u53E3",
    template: "\u56F4\u7ED5\u300C\u2026\u2026\u300D\u5E2E\u6211\u68B3\u7406\u7814\u7A76\u73B0\u72B6\uFF1A\u4E3B\u6D41\u65B9\u6CD5\u6709\u54EA\u4E9B\u3001\u5404\u81EA\u7684\u5C40\u9650\u3001\u76EE\u524D\u8FD8\u6709\u54EA\u4E9B\u6CA1\u89E3\u51B3\u7684\u7F3A\u53E3\u3002"
  },
  {
    key: "experiment",
    title: "\u5B9E\u9A8C\u8BBE\u8BA1",
    hint: "\u6570\u636E \xB7 \u57FA\u7EBF \xB7 \u6D88\u878D",
    template: "\u6211\u60F3\u9A8C\u8BC1\u300C\u2026\u2026\u300D\u8FD9\u4E2A\u60F3\u6CD5\uFF0C\u5E2E\u6211\u8BBE\u8BA1\u5B9E\u9A8C\u65B9\u6848\uFF1A\u6570\u636E\u96C6\u600E\u4E48\u9009\u3001\u57FA\u7EBF\u9009\u8C01\u3001\u8BC4\u4EF7\u6307\u6807\u548C\u6D88\u878D\u600E\u4E48\u5B89\u6392\u3002"
  },
  {
    key: "writing",
    title: "\u8BBA\u6587\u5199\u4F5C",
    hint: "\u5927\u7EB2 \xB7 \u6210\u7A3F \xB7 \u56FE\u8868",
    template: "\u5E2E\u6211\u89C4\u5212\u4E00\u7BC7\u5173\u4E8E\u300C\u2026\u2026\u300D\u7684\u8BBA\u6587\uFF1A\u5148\u51FA\u8BC1\u636E\u5927\u7EB2\uFF0C\u6211\u786E\u8BA4\u540E\u518D\u9010\u8282\u5C55\u5F00\uFF0C\u56FE\u8868\u600E\u4E48\u914D\u4E5F\u4E00\u5E76\u60F3\u597D\u3002"
  },
  {
    key: "review",
    title: "\u5BA1\u7A3F\u56DE\u590D",
    hint: "\u610F\u89C1 \xB7 \u56DE\u5E94 \xB7 \u4FEE\u6539",
    template: "\u5BA1\u7A3F\u4EBA\u63D0\u4E86\u8FD9\u4E9B\u610F\u89C1\uFF1A\u2026\u2026\uFF0C\u5E2E\u6211\u9010\u6761\u62C6\u89E3\u4ED6\u4EEC\u7684\u771F\u5B9E\u5173\u5207\uFF0C\u8D77\u8349\u70B9\u5BF9\u70B9\u56DE\u590D\u548C\u4FEE\u6539\u65B9\u6848\u3002"
  },
  {
    key: "submission",
    title: "\u6295\u7A3F\u7B56\u7565",
    hint: "\u9009\u520A \xB7 cover letter \xB7 \u65F6\u673A",
    template: "\u8FD9\u7BC7\u5DE5\u4F5C\u7684\u5185\u5BB9\u662F\u2026\u2026\uFF0C\u60F3\u6295\u7A3F\u4F46\u62FF\u4E0D\u51C6\u53BB\u54EA\uFF0C\u5E2E\u6211\u5BF9\u6BD4\u5408\u9002\u7684\u671F\u520A/\u4F1A\u8BAE\uFF0C\u518D\u51C6\u5907\u6295\u7A3F\u6750\u6599\u3002"
  }
];
var PRESET_ID = "research";
var RESEARCH_WORKSPACE_PATH = "E:\\DeepSeek harness\\\u79D1\u7814\u5DE5\u4F5C\u53F0";
function isSituationCard(row) {
  if (typeof row !== "object" || row === null) return false;
  const record = row;
  return ["key", "title", "hint", "template"].every((field) => typeof record[field] === "string" && record[field] !== "");
}

// src/client/panel.tsx
var React = __toESM(require("react"), 1);

// src/client/locale.ts
var RESEARCH_NS = "dsh-research-agent";
var UI_STRINGS = {
  zh: {
    "panel.missing": "\u8FD8\u6CA1\u88C5\u300C\u79D1\u7814\u6A21\u5F0F\u300D\u9884\u8BBE \u2014\u2014 \u68C0\u67E5 ~/.dsh/.agent-presets/research \u76EE\u5F55\u662F\u5426\u5B8C\u6574\uFF08preset.yml + agent.cordis.yml + skills/\uFF09\uFF0C\u4FEE\u590D\u540E\u5237\u65B0\u9875\u9762\u3002",
    "panel.armed": "\u5DF2\u5207\u5230\u79D1\u7814\u6A21\u5F0F\u2014\u2014\u628A\u300C\u2026\u2026\u300D\u8865\u6210\u4F60\u7684\u5B9E\u9645\u60C5\u51B5\uFF0C\u53D1\u51FA\u53BB\u5C31\u5F00\u804A\u3002",
    "panel.unarmed": "\u70B9\u4E00\u5F20\u5361\uFF0C\u4F1A\u8BDD\u5207\u5230\u79D1\u7814\u6A21\u5F0F\u5E76\u9884\u586B\u5F00\u573A\uFF1B\u7EC6\u8282\u4F60\u6765\u8865\uFF0C\u4E3B\u52A8\u6743\u5728\u4F60\u3002",
    "card.topic.title": "\u9009\u9898\u7ACB\u9879",
    "card.topic.hint": "\u65B9\u5411 \xB7 \u53EF\u884C\u6027 \xB7 \u521B\u65B0\u70B9",
    "card.literature.title": "\u6587\u732E\u7EFC\u8FF0",
    "card.literature.hint": "\u68C0\u7D22 \xB7 \u68B3\u7406 \xB7 \u627E\u7F3A\u53E3",
    "card.experiment.title": "\u5B9E\u9A8C\u8BBE\u8BA1",
    "card.experiment.hint": "\u6570\u636E \xB7 \u57FA\u7EBF \xB7 \u6D88\u878D",
    "card.writing.title": "\u8BBA\u6587\u5199\u4F5C",
    "card.writing.hint": "\u5927\u7EB2 \xB7 \u6210\u7A3F \xB7 \u56FE\u8868",
    "card.review.title": "\u5BA1\u7A3F\u56DE\u590D",
    "card.review.hint": "\u610F\u89C1 \xB7 \u56DE\u5E94 \xB7 \u4FEE\u6539",
    "card.submission.title": "\u6295\u7A3F\u7B56\u7565",
    "card.submission.hint": "\u9009\u520A \xB7 cover letter \xB7 \u65F6\u673A",
    "mode.aria": "\u79D1\u7814 \xB7 agent \u6A21\u5F0F",
    "mode.title": "\u76AE\u80A4 + \u60C5\u5883\u9762\u677F + \u79D1\u7814\u5DE5\u4F5C\u53F0\u4E00\u952E\u540C\u5F00\u540C\u5173\uFF1B\u5F00\u542F\u65F6\u81EA\u52A8\u8FDB\u5165\u300C\u79D1\u7814\u5DE5\u4F5C\u53F0\u300D\u5DE5\u4F5C\u533A\uFF0C\u65B0\u4F1A\u8BDD\u9ED8\u8BA4\u300C\u79D1\u7814\u6A21\u5F0F\u300D\uFF0C\u5173\u95ED\u6062\u590D\u539F\u9ED8\u8BA4",
    "mode.strong": "\u79D1\u7814 \xB7 agent",
    "mode.rest": "\u6A21\u5F0F",
    "mode.desc": "\u5B66\u754C\u4E4B\u5185\uFF0C\u81EA\u6709\u7AE0\u6CD5\u2014\u2014\u5F00\u542F\u5373\u8FDB\u5165\u300C\u79D1\u7814\u5DE5\u4F5C\u53F0\u300D\u5DE5\u4F5C\u533A",
    "mode.on": "\u5DF2\u5F00\u542F",
    "mode.off": "\u672A\u5F00\u542F",
    "wb.btn.open": "\u6536\u8D77\u79D1\u7814\u5DE5\u4F5C\u53F0",
    "wb.btn.closed": "\u5C55\u5F00\u79D1\u7814\u5DE5\u4F5C\u53F0",
    "wb.btn.text": "\u5DE5\u4F5C\u53F0",
    "wb.drawer.aria": "\u79D1\u7814\u5DE5\u4F5C\u53F0",
    "wb.title": "\u79D1\u7814\u5DE5\u4F5C\u53F0",
    "wb.close.aria": "\u6536\u8D77",
    "wb.close.title": "\u6536\u8D77\uFF08\u4FA7\u680F\u300C\u7814\u300D\u6309\u94AE\u53EF\u518D\u5C55\u5F00\uFF09",
    "wb.save": "\u4FDD\u5B58",
    "wb.cancel": "\u53D6\u6D88",
    "wb.edit": "\u7F16\u8F91",
    "wb.delete": "\u5220\u9664",
    "wb.status.title": "\u70B9\u51FB\u5207\u6362\u72B6\u6001",
    "wb.add": "\u65B0\u589E",
    "wb.unfilled.open": "\uFF08\u672A\u586B",
    "wb.unfilled.close": "\uFF09",
    "wb.empty": "\u6682\u65E0\u6761\u76EE\uFF0C\u70B9\u53F3\u4E0A\u300C+\u300D\u8BB0\u4E00\u6761",
    "wb.export": "\u5BFC\u51FA JSON",
    "wb.import": "\u5BFC\u5165 JSON",
    "wb.footnote": "\u6570\u636E\u5B58\u4E8E\u672C\u6D4F\u89C8\u5668"
  },
  en: {
    "panel.missing": "Research preset not installed \u2014 check that ~/.dsh/.agent-presets/research is complete (preset.yml + agent.cordis.yml + skills/), fix it, then reload.",
    "panel.armed": 'Switched to Research mode \u2014 replace "\u2026\u2026" with your details, then send.',
    "panel.unarmed": "Click a card to switch the session to Research mode with a prefilled opener; you fill in the details, you stay in control.",
    "card.topic.title": "Topic Selection",
    "card.topic.hint": "Direction \xB7 feasibility \xB7 novelty",
    "card.literature.title": "Literature Survey",
    "card.literature.hint": "Search \xB7 map \xB7 find gaps",
    "card.experiment.title": "Experiment Design",
    "card.experiment.hint": "Data \xB7 baselines \xB7 ablations",
    "card.writing.title": "Paper Writing",
    "card.writing.hint": "Outline \xB7 drafting \xB7 figures",
    "card.review.title": "Peer Review Reply",
    "card.review.hint": "Comments \xB7 responses \xB7 revisions",
    "card.submission.title": "Submission Strategy",
    "card.submission.hint": "Venue \xB7 cover letter \xB7 timing",
    "mode.aria": "Research \xB7 agent mode",
    "mode.title": "Skin, context panel, and workbench toggle together; when on, enters the Research Workbench workspace and new sessions default to Research mode; off restores the previous default",
    "mode.strong": "Research \xB7 agent",
    "mode.rest": "mode",
    "mode.desc": "Within academia there are its own conventions \u2014 enabling enters the Research Workbench workspace",
    "mode.on": "On",
    "mode.off": "Off",
    "wb.btn.open": "Collapse research workbench",
    "wb.btn.closed": "Expand research workbench",
    "wb.btn.text": "Workbench",
    "wb.drawer.aria": "Research workbench",
    "wb.title": "Research Workbench",
    "wb.close.aria": "Collapse",
    "wb.close.title": "Collapse (reopen from the sidebar seal button)",
    "wb.save": "Save",
    "wb.cancel": "Cancel",
    "wb.edit": "Edit",
    "wb.delete": "Delete",
    "wb.status.title": "Click to cycle status",
    "wb.add": "New",
    "wb.unfilled.open": "(no",
    "wb.unfilled.close": ")",
    "wb.empty": "No entries yet \u2014 click + at the top right to add one",
    "wb.export": "Export JSON",
    "wb.import": "Import JSON",
    "wb.footnote": "Data stays in this browser"
  }
};
var KNOWN_CARD_KEYS = /* @__PURE__ */ new Set(["topic", "literature", "experiment", "writing", "review", "submission"]);
function moduleText(module2, lang) {
  if (lang === "zh") {
    return {
      title: module2.title,
      hint: module2.hint,
      statuses: module2.statuses,
      fieldLabels: Object.fromEntries(module2.fields.map((f) => [f.key, { label: f.label, placeholder: f.placeholder }])),
      actionLabels: Object.fromEntries(module2.actions.map((a) => [a.key, a.label]))
    };
  }
  return {
    title: module2.en.title,
    hint: module2.en.hint,
    statuses: module2.en.statuses,
    fieldLabels: Object.fromEntries(
      module2.fields.map((f, i) => [f.key, { label: module2.en.fields[i]?.label ?? f.label, placeholder: module2.en.fields[i]?.placeholder ?? f.placeholder }])
    ),
    actionLabels: Object.fromEntries(
      module2.actions.map((a, i) => [a.key, module2.en.actions[i]?.label ?? a.label])
    )
  };
}
function statusText(module2, stored, lang) {
  const index = module2.statuses.indexOf(stored);
  if (lang === "en" && index >= 0) return module2.en.statuses[index] ?? stored;
  return stored;
}
function makeLocale(getService) {
  const runtime = getService("locale");
  if (runtime === void 0 || typeof runtime.register !== "function" || typeof runtime.bind !== "function") {
    const face2 = {
      subscribe: () => () => {
      },
      getSnapshot: () => ({ active: "zh", revision: 0 })
    };
    return {
      t: (key) => UI_STRINGS.zh[key] ?? key,
      face: face2,
      dispose: () => {
      }
    };
  }
  const disposers = [
    runtime.register(RESEARCH_NS, "zh", UI_STRINGS.zh),
    runtime.register(RESEARCH_NS, "en", UI_STRINGS.en)
  ];
  const face = {
    subscribe: (fn) => runtime.subscribe(fn),
    getSnapshot: () => runtime.getSnapshot()
  };
  const translate = runtime.bind(RESEARCH_NS);
  return {
    t: (key) => translate(key),
    face,
    dispose: () => {
      for (const d of disposers) d();
    }
  };
}
function langOf(active) {
  return typeof active === "string" && active.toLowerCase().startsWith("zh") ? "zh" : "en";
}

// src/client/panel.tsx
var import_jsx_runtime = require("react/jsx-runtime");
function BrandPanel(props) {
  const skinOn = React.useSyncExternalStore(
    props.skin.subscribe,
    () => props.skin.getSnapshot().enabled
  );
  React.useSyncExternalStore(
    props.localeFace.subscribe,
    () => props.localeFace.getSnapshot().active
  );
  const blank = props.useSessions((state) => state.byId[props.sessionId]?.blank === true);
  const preset = props.useSessions((state) => state.byId[props.sessionId]?.agentPreset);
  const [ready, setReady] = React.useState(void 0);
  const [cards, setCards] = React.useState(SITUATION_CARDS);
  React.useEffect(() => {
    let live = true;
    void props.probePreset().then((value) => {
      if (live) setReady(value);
    });
    void props.probeCards().then((rows) => {
      if (live) setCards(rows);
    });
    return () => {
      live = false;
    };
  }, []);
  if (!skinOn || !blank) return null;
  const armed = preset === PRESET_ID;
  const t = props.t;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "rs-panel", children: ready === false ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "rs-panel-note", children: t("panel.missing") }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "rs-panel-grid", children: cards.map((card) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "button",
      {
        type: "button",
        className: "rs-card",
        onClick: () => {
          void props.launch(props.sessionId, props.inputActions, card.template);
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "rs-card-title", children: KNOWN_CARD_KEYS.has(card.key) ? t(`card.${card.key}.title`) : card.title }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "rs-card-hint", children: KNOWN_CARD_KEYS.has(card.key) ? t(`card.${card.key}.hint`) : card.hint })
        ]
      },
      card.key
    )) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "rs-panel-note", children: armed ? t("panel.armed") : t("panel.unarmed") })
  ] }) });
}

// src/client/mode-row.tsx
var React2 = __toESM(require("react"), 1);
var import_jsx_runtime2 = require("react/jsx-runtime");
function ResearchModeRow(props) {
  const enabled = React2.useSyncExternalStore(
    props.skin.subscribe,
    () => props.skin.getSnapshot().enabled
  );
  const active = React2.useSyncExternalStore(
    props.localeFace.subscribe,
    () => props.localeFace.getSnapshot().active
  );
  void active;
  const t = props.t;
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
    "button",
    {
      type: "button",
      className: "rs-settings-card",
      "data-on": enabled ? "true" : "false",
      role: "switch",
      "aria-checked": enabled,
      "aria-label": t("mode.aria"),
      title: t("mode.title"),
      onClick: () => props.skin.update((draft) => {
        draft.enabled = !enabled;
      }),
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "rs-seal", "aria-hidden": "true", children: "\u79D1\u7814" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "rs-settings-meta", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "rs-settings-label", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("b", { children: t("mode.strong") }),
            " ",
            t("mode.rest")
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "rs-settings-desc", children: t("mode.desc") })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "rs-settings-state", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "rs-settings-state-word", children: enabled ? t("mode.on") : t("mode.off") }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "rs-switch", "data-on": enabled ? "true" : "false" })
        ] })
      ]
    }
  );
}

// src/client/workbench.tsx
var React3 = __toESM(require("react"), 1);

// src/client/workbench-config.ts
var v = (fields, key) => {
  const value = (fields[key] ?? "").trim();
  return value === "" ? "\u2026\u2026" : value;
};
var WORKBENCH_MODULES = [
  {
    key: "idea",
    title: "\u60F3\u6CD5\u7D20\u6750\u5E93",
    icon: "\u60F3",
    hint: "\u7075\u611F\u968F\u624B\u8BB0 \xB7 \u6512\u591F\u518D\u7ACB\u9879",
    statuses: ["\u840C\u82BD", "\u5F85\u9A8C\u8BC1", "\u5DF2\u7ACB\u9879"],
    fields: [
      { key: "name", label: "\u60F3\u6CD5\u540D", placeholder: "\u5982\uFF1A\u5C0F\u6837\u672C\u4E0B\u7684\u68C0\u7D22\u589E\u5F3A\u5FAE\u8C03" },
      { key: "spark", label: "\u7075\u611F\u6765\u6E90", placeholder: "\u5982\uFF1A\u8BFB\u67D0\u7BC7\u8BBA\u6587\u65F6\u53D1\u73B0 / \u7EC4\u4F1A\u8BA8\u8BBA" },
      { key: "notes", label: "\u521D\u6B65\u60F3\u6CD5", placeholder: "\u6838\u5FC3\u5047\u8BBE\u3001\u53EF\u80FD\u96BE\u70B9\u3001\u548C\u73B0\u6709\u5DE5\u4F5C\u7684\u5173\u7CFB", multiline: true }
    ],
    actions: [
      {
        key: "assess",
        label: "\u9009\u9898\u8BBA\u8BC1",
        build: (f) => `\u6211\u6709\u4E2A\u7814\u7A76\u60F3\u6CD5\u60F3\u8BF7\u4F60\u628A\u5173\u3002\u60F3\u6CD5\u540D\uFF1A${v(f, "name")}\uFF1B\u7075\u611F\u6765\u6E90\uFF1A${v(f, "spark")}\uFF1B\u521D\u6B65\u60F3\u6CD5\uFF1A
${v(f, "notes")}
\u5E2E\u6211\u8BC4\u4F30\u53EF\u884C\u6027\u3001\u521B\u65B0\u70B9\u548C\u5DE5\u4F5C\u91CF\uFF0C\u6307\u51FA\u6700\u5BB9\u6613\u88AB\u8D28\u7591\u7684\u5730\u65B9\u3002`
      },
      {
        key: "proposal",
        label: "\u5F00\u9898\u8349\u7A3F",
        build: (f) => `\u5E2E\u6211\u628A\u8FD9\u4E2A\u60F3\u6CD5\u6574\u7406\u6210\u5F00\u9898\u62A5\u544A\u8349\u7A3F\u3002\u60F3\u6CD5\u540D\uFF1A${v(f, "name")}\uFF1B\u521D\u6B65\u60F3\u6CD5\uFF1A
${v(f, "notes")}
\u6309\u7814\u7A76\u80CC\u666F\u3001\u95EE\u9898\u5B9A\u4E49\u3001\u6280\u672F\u8DEF\u7EBF\u3001\u9884\u671F\u8D21\u732E\u3001\u98CE\u9669\u9884\u6848\u6765\u7EC4\u7EC7\u3002`
      }
    ],
    en: {
      title: "Idea Pool",
      hint: "Capture sparks \xB7 launch when ready",
      statuses: ["Sprout", "To validate", "Launched"],
      fields: [
        { label: "Idea name", placeholder: "e.g. few-shot retrieval-augmented fine-tuning" },
        { label: "Spark source", placeholder: "e.g. found while reading a paper / group meeting" },
        { label: "Initial idea", placeholder: "Core hypothesis, likely difficulties, relation to existing work" }
      ],
      actions: [{ label: "Topic review" }, { label: "Proposal draft" }]
    }
  },
  {
    key: "reading",
    title: "\u6587\u732E\u7814\u8BFB",
    icon: "\u8BFB",
    hint: "\u7B14\u8BB0 \xB7 \u5FC3\u5F97 \xB7 \u7ED3\u5408\u8BFE\u9898",
    statuses: ["\u5F85\u8BFB", "\u5DF2\u8BFB", "\u5DF2\u6574\u7406"],
    fields: [
      { key: "title", label: "\u7BC7\u540D", placeholder: "\u5982\uFF1A\u67D0\u65B9\u6CD5\u7684\u539F\u59CB\u8BBA\u6587" },
      { key: "source", label: "\u6765\u6E90", placeholder: "\u5982\uFF1ANeurIPS 2025 / arXiv:xxxx.xxxxx" },
      { key: "takeaways", label: "\u7814\u8BFB\u7B14\u8BB0", placeholder: "\u6838\u5FC3\u8D21\u732E\u3001\u548C\u6211\u8BFE\u9898\u7684\u5173\u7CFB\u3001\u5B58\u7591\u5904", multiline: true }
    ],
    actions: [
      {
        key: "note",
        label: "\u751F\u6210\u6587\u732E\u7B14\u8BB0",
        build: (f) => `\u5E2E\u6211\u6574\u7406\u4E00\u7BC7\u6587\u732E\u7B14\u8BB0\u3002\u7BC7\u540D\uFF1A${v(f, "title")}\uFF1B\u6765\u6E90\uFF1A${v(f, "source")}\uFF1B\u6211\u7684\u521D\u6B65\u7B14\u8BB0\uFF1A
${v(f, "takeaways")}
\u6309\u300C\u4E00\u53E5\u8BDD\u603B\u7ED3 / \u65B9\u6CD5\u8981\u70B9 / \u5C40\u9650 / \u5BF9\u6211\u8BFE\u9898\u7684\u542F\u53D1\u300D\u7EC4\u7EC7\u3002`
      },
      {
        key: "review",
        label: "\u7EB3\u5165\u7EFC\u8FF0",
        build: (f) => `\u628A\u8FD9\u7BC7\u6587\u732E\u653E\u8FDB\u6211\u7684\u7EFC\u8FF0\u6846\u67B6\u91CC\u3002\u7BC7\u540D\uFF1A${v(f, "title")}\uFF1B\u6765\u6E90\uFF1A${v(f, "source")}\uFF1B\u7B14\u8BB0\uFF1A
${v(f, "takeaways")}
\u5E2E\u6211\u5B9A\u4F4D\u5B83\u5C5E\u4E8E\u54EA\u6761\u6280\u672F\u8109\u7EDC\uFF0C\u548C\u54EA\u4E9B\u5DE5\u4F5C\u6784\u6210\u5BF9\u6BD4\u6216\u627F\u63A5\u3002`
      }
    ],
    en: {
      title: "Literature",
      hint: "Notes \xB7 insights \xB7 ties to your topic",
      statuses: ["Queued", "Read", "Organized"],
      fields: [
        { label: "Paper title", placeholder: "e.g. the original paper of a method" },
        { label: "Source", placeholder: "e.g. NeurIPS 2025 / arXiv:xxxx.xxxxx" },
        { label: "Reading notes", placeholder: "Core contribution, relation to my topic, doubts" }
      ],
      actions: [{ label: "Paper notes" }, { label: "Into survey" }]
    }
  },
  {
    key: "experiment-log",
    title: "\u5B9E\u9A8C\u8BB0\u5F55",
    icon: "\u9A8C",
    hint: "\u6570\u636E \xB7 \u53C2\u6570 \xB7 \u5F02\u5E38",
    statuses: ["\u8FDB\u884C\u4E2D", "\u5DF2\u5B8C\u6210", "\u5DF2\u5F52\u6863"],
    fields: [
      { key: "name", label: "\u5B9E\u9A8C\u540D", placeholder: "\u5982\uFF1A\u57FA\u7EBF\u590D\u73B0 / \u6D88\u878D A1" },
      { key: "setup", label: "\u8BBE\u7F6E", placeholder: "\u6570\u636E\u96C6\u3001\u8D85\u53C2\u3001\u73AF\u5883\u3001\u968F\u673A\u79CD\u5B50" },
      { key: "result", label: "\u7ED3\u679C\u4E0E\u5F02\u5E38", placeholder: "\u5173\u952E\u6307\u6807\u3001\u5F02\u5E38\u73B0\u8C61\u3001\u4E0B\u4E00\u6B65", multiline: true }
    ],
    actions: [
      {
        key: "record",
        label: "\u6574\u7406\u5B9E\u9A8C\u8BB0\u5F55",
        build: (f) => `\u5E2E\u6211\u6574\u7406\u8FD9\u6B21\u5B9E\u9A8C\u8BB0\u5F55\uFF0C\u8981\u80FD\u76F4\u63A5\u8D34\u8FDB\u8BBA\u6587\u9644\u5F55\u6216\u590D\u73B0\u6587\u6863\u3002\u5B9E\u9A8C\u540D\uFF1A${v(f, "name")}\uFF1B\u8BBE\u7F6E\uFF1A${v(f, "setup")}\uFF1B\u7ED3\u679C\u4E0E\u5F02\u5E38\uFF1A
${v(f, "result")}`
      },
      {
        key: "analyze",
        label: "\u7ED3\u679C\u5206\u6790",
        build: (f) => `\u5E2E\u6211\u5206\u6790\u8FD9\u7EC4\u5B9E\u9A8C\u7ED3\u679C\u3002\u5B9E\u9A8C\u540D\uFF1A${v(f, "name")}\uFF1B\u8BBE\u7F6E\uFF1A${v(f, "setup")}\uFF1B\u7ED3\u679C\uFF1A
${v(f, "result")}
\u5148\u770B\u7ED3\u679C\u662F\u5426\u652F\u6301\u539F\u5047\u8BBE\uFF0C\u518D\u7ED9\u4E0B\u4E00\u6B65\u5B9E\u9A8C\u5EFA\u8BAE\uFF0C\u6307\u51FA\u9700\u8981\u8865\u7684\u5BF9\u7167\u3002`
      }
    ],
    en: {
      title: "Experiments",
      hint: "Data \xB7 params \xB7 anomalies",
      statuses: ["Running", "Done", "Archived"],
      fields: [
        { label: "Experiment name", placeholder: "e.g. baseline reproduction / ablation A1" },
        { label: "Setup", placeholder: "Dataset, hyperparameters, environment, random seed" },
        { label: "Results & anomalies", placeholder: "Key metrics, anomalies, next steps" }
      ],
      actions: [{ label: "Format log" }, { label: "Result analysis" }]
    }
  },
  {
    key: "draft",
    title: "\u8BBA\u6587\u8349\u7A3F",
    icon: "\u8457",
    hint: "\u63D0\u7EB2 \xB7 \u7AE0\u8282 \xB7 \u56FE\u8868",
    statuses: ["\u63D0\u7EB2", "\u6210\u7A3F\u4E2D", "\u5DF2\u5B9A\u7A3F"],
    fields: [
      { key: "title", label: "\u9898\u76EE", placeholder: "\u5982\uFF1A\u9762\u5411\u2026\u2026\u7684\u2026\u2026\u65B9\u6CD5" },
      { key: "venue", label: "\u76EE\u6807\u53D1\u8868", placeholder: "\u5982\uFF1A\u67D0\u671F\u520A / \u67D0\u4F1A\u8BAE\uFF08\u542B\u622A\u7A3F\u65E5\uFF09" },
      { key: "progress", label: "\u5F53\u524D\u8FDB\u5EA6", placeholder: "\u5DF2\u5B8C\u6210\u7AE0\u8282\u3001\u5361\u4F4F\u7684\u5730\u65B9", multiline: true }
    ],
    actions: [
      {
        key: "polish",
        label: "\u6253\u78E8\u7AE0\u8282",
        build: (f) => `\u5E2E\u6211\u6253\u78E8\u8BBA\u6587\u7684\u67D0\u4E2A\u7AE0\u8282\u3002\u9898\u76EE\uFF1A${v(f, "title")}\uFF1B\u76EE\u6807\u53D1\u8868\uFF1A${v(f, "venue")}\uFF1B\u5F53\u524D\u8FDB\u5EA6\uFF1A
${v(f, "progress")}
\u6211\u628A\u7AE0\u8282\u8349\u7A3F\u8D34\u7ED9\u4F60\uFF0C\u5148\u6307\u51FA\u903B\u8F91\u548C\u8BC1\u636E\u95EE\u9898\uFF0C\u518D\u52A8\u8BED\u8A00\u3002`
      },
      {
        key: "selfcheck",
        label: "\u5168\u6587\u81EA\u67E5",
        build: (f) => `\u6295\u7A3F\u524D\u5E2E\u6211\u505A\u5168\u6587\u81EA\u67E5\u3002\u9898\u76EE\uFF1A${v(f, "title")}\uFF1B\u76EE\u6807\u53D1\u8868\uFF1A${v(f, "venue")}\u3002\u6309\u4E3B\u5F20-\u8BC1\u636E\u4E00\u81F4\u6027\u3001\u56FE\u8868\u6570\u636E\u4E00\u81F4\u3001\u5F15\u7528\u5B8C\u6574\u6027\u3001\u683C\u5F0F\u8981\u6C42\u56DB\u904D\u8FC7\uFF0C\u5217\u51FA\u95EE\u9898\u6E05\u5355\u3002`
      }
    ],
    en: {
      title: "Paper Draft",
      hint: "Outline \xB7 sections \xB7 figures",
      statuses: ["Outline", "Writing", "Finalized"],
      fields: [
        { label: "Title", placeholder: "e.g. A method for ... targeting ..." },
        { label: "Target venue", placeholder: "e.g. a journal / conference (with deadline)" },
        { label: "Progress", placeholder: "Sections done, blockers" }
      ],
      actions: [{ label: "Polish section" }, { label: "Full self-check" }]
    }
  },
  {
    key: "submission",
    title: "\u6295\u7A3F\u4E0E\u7B54\u8FA9",
    icon: "\u6295",
    hint: "cover letter \xB7 \u9010\u6761\u56DE\u590D",
    statuses: ["\u51C6\u5907\u4E2D", "\u5DF2\u6295", "\u5DF2\u63A5\u6536"],
    fields: [
      { key: "venue", label: "\u76EE\u6807\u671F\u520A/\u4F1A\u8BAE", placeholder: "\u5982\uFF1A\u67D0 SCI \u671F\u520A / \u67D0\u9876\u4F1A" },
      { key: "deadline", label: "\u622A\u7A3F/\u8282\u70B9", placeholder: "\u5982\uFF1A9 \u6708 15 \u65E5\u622A\u7A3F" },
      { key: "materials", label: "\u6750\u6599\u6E05\u5355", placeholder: "\u6295\u7A3F\u4FE1\u3001\u56DE\u590D\u51FD\u3001\u8865\u5145\u6750\u6599\u7B49", multiline: true }
    ],
    actions: [
      {
        key: "cover",
        label: "\u8D77\u8349\u6295\u7A3F\u4FE1",
        build: (f) => `\u5E2E\u6211\u8D77\u8349\u6295\u7A3F\u7528\u7684 cover letter\u3002\u76EE\u6807\uFF1A${v(f, "venue")}\uFF1B\u65F6\u95F4\u8282\u70B9\uFF1A${v(f, "deadline")}\uFF1B\u8BBA\u6587\u8981\u70B9\uFF1A
${v(f, "materials")}
\u7A81\u51FA\u8D21\u732E\u4E0E\u671F\u520A\u8303\u56F4\u7684\u5339\u914D\uFF0C\u7B80\u6D01\u4E0D\u5439\u5618\u3002`
      },
      {
        key: "rebuttal",
        label: "\u9010\u6761\u56DE\u590D",
        build: (f) => `\u6536\u5230\u5BA1\u7A3F\u610F\u89C1\u8981\u505A\u9010\u6761\u56DE\u590D\uFF08rebuttal\uFF09\u3002\u76EE\u6807\uFF1A${v(f, "venue")}\uFF1B\u76F8\u5173\u6750\u6599\uFF1A
${v(f, "materials")}
\u6211\u628A\u610F\u89C1\u539F\u6587\u8D34\u7ED9\u4F60\uFF0C\u5148\u62C6\u89E3\u6BCF\u6761\u7684\u771F\u5B9E\u5173\u5207\uFF0C\u518D\u8D77\u8349\u70B9\u5BF9\u70B9\u56DE\u590D\uFF0C\u8BED\u6C14\u514B\u5236\u3001\u6709\u636E\u53EF\u67E5\u3002`
      }
    ],
    en: {
      title: "Submission",
      hint: "Cover letter \xB7 point-by-point reply",
      statuses: ["Preparing", "Submitted", "Accepted"],
      fields: [
        { label: "Target venue", placeholder: "e.g. an SCI journal / a top conference" },
        { label: "Deadline", placeholder: "e.g. deadline on Sep 15" },
        { label: "Materials list", placeholder: "Cover letter, response letter, supplementary material" }
      ],
      actions: [{ label: "Draft cover letter" }, { label: "Rebuttal" }]
    }
  }
];

// src/client/workbench.tsx
var import_jsx_runtime3 = require("react/jsx-runtime");
function useEnabled(store) {
  return React3.useSyncExternalStore(store.subscribe, () => store.getSnapshot().enabled);
}
function useLang(face) {
  const active = React3.useSyncExternalStore(face.subscribe, () => face.getSnapshot().active);
  return langOf(active);
}
function WorkbenchButton(props) {
  const enabled = useEnabled(props.skin);
  const open = React3.useSyncExternalStore(props.workbench.subscribe, () => props.workbench.getSnapshot().open);
  useLang(props.localeFace);
  if (!enabled) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
    "button",
    {
      type: "button",
      className: "rs-wb-btn",
      "data-open": open ? "true" : "false",
      title: open ? props.t("wb.btn.open") : props.t("wb.btn.closed"),
      onClick: () => props.workbench.update((draft) => {
        draft.open = !open;
      }),
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "rs-wb-btn-seal", "aria-hidden": "true", children: "\u7814" }),
        props.wide === true ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "rs-wb-btn-text", children: props.t("wb.btn.text") }) : null
      ]
    }
  );
}
function EntryForm(props) {
  const [draft, setDraft] = React3.useState(props.initial);
  const text = moduleText(props.module, props.lang);
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "rs-wb-form", children: [
    props.module.fields.map((field) => {
      const view = text.fieldLabels[field.key] ?? { label: field.label, placeholder: field.placeholder };
      return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { className: "rs-wb-field", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "rs-wb-field-label", children: view.label }),
        field.multiline === true ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          "textarea",
          {
            className: "rs-wb-input",
            rows: 3,
            placeholder: view.placeholder,
            value: draft[field.key] ?? "",
            onChange: (event) => setDraft({ ...draft, [field.key]: event.target.value })
          }
        ) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          "input",
          {
            className: "rs-wb-input",
            placeholder: view.placeholder,
            value: draft[field.key] ?? "",
            onChange: (event) => setDraft({ ...draft, [field.key]: event.target.value })
          }
        )
      ] }, field.key);
    }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "rs-wb-form-actions", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: "rs-wb-mini rs-wb-mini-primary", onClick: () => props.onSave(draft), children: props.t("wb.save") }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: "rs-wb-mini", onClick: props.onCancel, children: props.t("wb.cancel") })
    ] })
  ] });
}
function ModuleCard(props) {
  const { module: module2, rows, lang, t } = props;
  const text = moduleText(module2, lang);
  const adding = props.editing === "new";
  const saveNew = (fields) => {
    props.data.update((draft) => {
      draft.entries.unshift({
        id: crypto.randomUUID(),
        module: module2.key,
        status: module2.statuses[0],
        fields,
        updatedAt: Date.now()
      });
    });
    props.onEdit(null);
  };
  const saveEdit = (id, fields) => {
    props.data.update((draft) => {
      const row = draft.entries.find((entry) => entry.id === id);
      if (row !== void 0) {
        row.fields = fields;
        row.updatedAt = Date.now();
      }
    });
    props.onEdit(null);
  };
  const cycleStatus = (id) => {
    props.data.update((draft) => {
      const row = draft.entries.find((entry) => entry.id === id);
      if (row === void 0) return;
      const index = module2.statuses.indexOf(row.status);
      row.status = module2.statuses[(index + 1) % module2.statuses.length];
      row.updatedAt = Date.now();
    });
  };
  const remove = (id) => {
    props.data.update((draft) => {
      draft.entries = draft.entries.filter((entry) => entry.id !== id);
    });
  };
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("section", { className: "rs-mod-card", children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("header", { className: "rs-mod-head", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "rs-mod-seal", "aria-hidden": "true", children: module2.icon }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: "rs-mod-meta", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "rs-mod-title", children: text.title }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "rs-mod-hint", children: text.hint })
      ] }),
      rows.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "rs-mod-count", children: rows.length }) : null,
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        "button",
        {
          type: "button",
          className: "rs-mod-add",
          title: t("wb.add") + " " + text.title,
          onClick: () => props.onEdit(adding ? null : "new"),
          children: adding ? "\xD7" : "+"
        }
      )
    ] }),
    adding ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(EntryForm, { module: module2, lang, t, initial: {}, onSave: saveNew, onCancel: () => props.onEdit(null) }) : null,
    rows.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "rs-wb-entry", children: props.editing === entry.id ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
      EntryForm,
      {
        module: module2,
        lang,
        t,
        initial: entry.fields,
        onSave: (fields) => saveEdit(entry.id, fields),
        onCancel: () => props.onEdit(null)
      }
    ) : /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "rs-wb-entry-head", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "rs-wb-entry-title", children: (entry.fields[module2.fields[0].key] ?? "").trim() || t("wb.unfilled.open") + " " + (text.fieldLabels[module2.fields[0].key]?.label ?? module2.fields[0].label) + " " + t("wb.unfilled.close") }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          "button",
          {
            type: "button",
            className: "rs-wb-status",
            title: t("wb.status.title"),
            onClick: () => cycleStatus(entry.id),
            children: statusText(module2, entry.status, lang)
          }
        )
      ] }),
      module2.fields.slice(1).map((field) => {
        const value = (entry.fields[field.key] ?? "").trim();
        return value === "" ? null : /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "rs-wb-entry-line", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "rs-wb-entry-key", children: text.fieldLabels[field.key]?.label ?? field.label }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "rs-wb-entry-value", children: value })
        ] }, field.key);
      }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "rs-wb-entry-actions", children: [
        module2.actions.map((action) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          "button",
          {
            type: "button",
            className: "rs-wb-mini rs-wb-mini-primary",
            onClick: () => props.launch(action.build(entry.fields)),
            children: text.actionLabels[action.key] ?? action.label
          },
          action.key
        )),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: "rs-wb-mini", onClick: () => props.onEdit(entry.id), children: t("wb.edit") }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: "rs-wb-mini rs-wb-mini-danger", onClick: () => remove(entry.id), children: t("wb.delete") })
      ] })
    ] }) }, entry.id)),
    rows.length === 0 && !adding ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "rs-wb-empty", children: t("wb.empty") }) : null
  ] });
}
function WorkbenchDrawer(props) {
  const enabled = useEnabled(props.skin);
  const open = React3.useSyncExternalStore(props.workbench.subscribe, () => props.workbench.getSnapshot().open);
  const entries = React3.useSyncExternalStore(props.data.subscribe, () => props.data.getSnapshot().entries);
  const lang = useLang(props.localeFace);
  const t = props.t;
  const [editing, setEditing] = React3.useState(null);
  const fileRef = React3.useRef(null);
  if (!enabled || !open) return null;
  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ entries }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `research-workbench-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  const importJson = (file) => {
    void file.text().then((text) => {
      const parsed = JSON.parse(text);
      const list = parsed.entries;
      if (!Array.isArray(list)) throw new Error("bad file");
      const valid = list.filter((row) => typeof row === "object" && row !== null && typeof row.id === "string" && typeof row.module === "string" && typeof row.status === "string" && typeof row.fields === "object");
      props.data.set({ entries: valid });
    }).catch(() => {
    });
  };
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("aside", { className: "rs-wb-drawer", "aria-label": t("wb.drawer.aria"), children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "rs-wb-head", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "rs-wb-title", children: t("wb.title") }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        "button",
        {
          type: "button",
          className: "rs-wb-close",
          "aria-label": t("wb.close.aria"),
          title: t("wb.close.title"),
          onClick: () => props.workbench.update((draft) => {
            draft.open = false;
          }),
          children: "\xD7"
        }
      )
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "rs-wb-body", children: WORKBENCH_MODULES.map((module2) => {
      const rows = entries.filter((entry) => entry.module === module2.key);
      const editingHere = editing === "new:" + module2.key ? "new" : rows.some((row) => row.id === editing) ? editing : null;
      return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        ModuleCard,
        {
          module: module2,
          lang,
          t,
          rows,
          editing: editingHere,
          onEdit: (value) => setEditing(value === "new" ? "new:" + module2.key : value),
          data: props.data,
          launch: props.launch
        },
        module2.key
      );
    }) }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "rs-wb-foot", children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: "rs-wb-mini", onClick: exportJson, children: t("wb.export") }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: "rs-wb-mini", onClick: () => fileRef.current?.click(), children: t("wb.import") }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        "input",
        {
          ref: fileRef,
          type: "file",
          accept: "application/json",
          style: { display: "none" },
          onChange: (event) => {
            const file = event.target.files?.[0];
            if (file !== void 0) importJson(file);
            event.target.value = "";
          }
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: "rs-wb-foot-note", children: t("wb.footnote") })
    ] })
  ] });
}

// src/client/skin.ts
var SKIN_SOURCE = "dsh-research-agent";
var SKIN_TOKENS = {
  "--dsw-alias-bg-base": { light: "#f7fafb", dark: "#0f1a1e" },
  "--dsw-alias-bg-layer-1": { light: "#fdfeff", dark: "#14232a" },
  "--dsw-alias-bg-layer-2": { light: "#eef4f5", dark: "#1a2d35" },
  "--dsw-alias-brand-primary": { light: "#1a5276", dark: "#7fb3d5" },
  "--dsw-alias-brand-text": { light: "#1a5276", dark: "#8fc1e3" },
  "--dsw-alias-button-primary-fill": { light: "#1a5276", dark: "#2e6a8f" },
  "--dsw-alias-button-primary-hover": { light: "#21618c", dark: "#38789f" },
  "--dsw-alias-interactive-bg-hover-accent": { light: "rgba(26, 82, 118, 0.10)", dark: "rgba(127, 179, 213, 0.16)" },
  "--dsw-specific-sidebar-fill": { light: "#eff4f6", dark: "#0b151a" },
  "--dsw-specific-bubble": { light: "#f1f6f7", dark: "#16272f" },
  "--dsw-specific-input-major": { light: "#fdfeff", dark: "#14232a" }
};

// src/client/styles.ts
var PANEL_CSS = `
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

/* \u2500\u2500 \u54C1\u724C\u66FF\u6362\uFF08\u4EC5\u76AE\u80A4\u5F00\u542F\u65F6\uFF0Cbody[data-research-skin] \u628A\u5173\uFF09\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
   \u9009\u62E9\u5668\u951A\u5B9A CSS Modules \u7684\u7A33\u5B9A local \u540D\uFF08[hash]_[local]\uFF09\uFF0Cdsh \u5347\u7EA7\u6539\u7248\u5F0F
   \u65F6\u53EF\u80FD\u5931\u6548\u2014\u2014\u5931\u6548\u7684\u8868\u73B0\u662F\u56DE\u5230 DeepSeek \u539F\u54C1\u724C\uFF0C\u65E0\u5BB3\u964D\u7EA7\u3002

   \u672C\u673A\u7ED3\u6784\uFF1A_logoRow > _brand(button) > _brandIdentity
     > _brandMark\uFF08\u9CB8\u9C7C\u56FE\u6807 svg\uFF09 + _brandName\uFF08"DeepSeek" \u5B57\u6807 svg\uFF09\u3002
   \u6559\u8BAD\u4E00\uFF1A\u7EDD\u4E0D\u7528 [class*="_brand"] \u5B50\u4E32\u6302 ::after\u2014\u2014\u5B83\u4F1A\u540C\u65F6\u547D\u4E2D
   _brand/_brandIdentity/_brandMark/_brandName \u56DB\u5C42\uFF0C\u6587\u6848\u53E0\u56DB\u4EFD\u3002
   \u6559\u8BAD\u4E8C\uFF1A\u7EDD\u4E0D\u7528\u56FA\u5B9A\u8D1F\u8FB9\u8DDD\u541E\u5B57\u6807\uFF08\u4E0D\u540C\u5BBF\u4E3B\u5B57\u6807\u5BBD\u5EA6\u4E0D\u540C\uFF0C\u5FC5\u7FFB\u8F66\uFF09\u2014\u2014
   \u76F4\u63A5 _brandName { display:none }\u3002 */
body[data-research-skin] [class*="_logoRow"] [class*="_brandName"] { display: none; }
/* \u9CB8\u9C7C\u56FE\u6807\uFF1A\u539F\u5C3A\u5BF8\u3001\u5B66\u672F\u84DD\u3002 */
body[data-research-skin] [class*="_logoRow"] [class*="_brandMark"] svg {
  display: block;
  flex: none;
  color: #1a5276;
}
/* \u5B57\u6807\u6587\u6848\u53EA\u6302\u5728 _brandIdentity \u4E00\u5904\uFF0C\u5168\u4FA7\u680F\u552F\u4E00\u4E00\u4EFD\u3002 */
body[data-research-skin] [class*="_logoRow"] [class*="_brandIdentity"]::after {
  content: "\u79D1\u7814 \xB7 agent";
  font-family: "Songti SC", "STSong", SimSun, serif;
  font-size: 17px;
  font-weight: 700;
  letter-spacing: .14em;
  color: var(--dsw-alias-brand-text);
  white-space: nowrap;
}
/* \u4FA7\u680F\u6298\u53E0\u6001\uFF08\u6839\u4E0A\u51FA\u73B0 _collapsed\uFF09\u53EA\u7559\u9CB8\u9C7C\uFF0C\u6536\u8D77\u5B57\u6807\u6587\u6848\u3002 */
body[data-research-skin] [class*="_collapsed"] [class*="_brandIdentity"]::after { content: none; }
/* \u9996\u5C4F\u9CB8\u9C7C\uFF1A\u5B66\u672F\u84DD + \u76D6\u7AE0\u5F0F\u5FAE\u503E\u3002 */
body[data-research-skin] [class*="_fish"] {
  color: #1a5276;
  transform: rotate(-4deg);
}
/* \u6DF1\u8272\uFF08\u6DF1\u591C\u4E66\u623F\uFF09\u4E0B\u5B66\u672F\u84DD\u4E0A\u63D0\u4E00\u6863\u4FDD\u6301\u53EF\u8BFB\u3002 */
body[data-research-skin][data-ds-dark-theme] [class*="_logoRow"] [class*="_brandMark"] svg,
body[data-research-skin][data-ds-dark-theme] [class*="_fish"] {
  color: #7fb3d5;
}
body[data-research-skin] [class*="_headlineText"] {
  font-size: 0;
  letter-spacing: 0;
}
body[data-research-skin] [class*="_headlineText"]::before {
  content: "\u5B66\u754C\u4E4B\u5185\uFF0C\u81EA\u6709\u7AE0\u6CD5";
  font-family: "Songti SC", "STSong", SimSun, serif;
  font-size: 30px;
  font-weight: 700;
  letter-spacing: .1em;
  color: var(--dsw-alias-brand-text);
}

/* \u2500\u2500 \u79D1\u7814\u5DE5\u4F5C\u53F0 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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
/* \u53F3\u4FA7\u5E38\u9A7B\u5DE5\u4F5C\u533A\uFF1A\u5360\u4F4D\u6392\u7248\u7531 body[data-research-wb] \u5BF9 #root \u7684\u53F3\u5185\u8FB9\u8DDD
   \u5B8C\u6210\uFF0C\u5DE5\u4F5C\u533A\u680F\u672C\u4F53\u56FA\u5B9A\u53F3\u7F18\uFF0C\u4E0E\u5DE6\u4FA7\u680F\u547C\u5E94\u7684\u51B7\u767D\u5E95 + \u5DE6\u4FA7\u7EC6\u5206\u9694\u7EBF\u3002 */
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
/* \u2500\u2500 \u6A21\u5757\u5361\u7247 \u2500\u2500 */
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
`;

// src/client/index.tsx
var name = "dsh-research-agent";
var inject = ["slots", "theme", "connection", "sessions", "workspaces", "locale"];
function apply(ctx) {
  ctx.effect(() => {
    const tag = document.createElement("style");
    tag.dataset.plugin = name;
    tag.textContent = PANEL_CSS;
    document.head.appendChild(tag);
    return () => {
      tag.remove();
    };
  }, "dsh-research-agent: panel styles");
  const locale = makeLocale((n) => ctx.get(n));
  ctx.effect(() => locale.dispose, "dsh-research-agent: locale dicts");
  const skinStore = (0, import_client.createSnapshotStore)(
    { enabled: false },
    { persist: { name: "dsh-research-agent.skin" } }
  );
  let disposeSkin;
  const reconcileSkin = () => {
    const { enabled } = skinStore.getSnapshot();
    if (enabled) {
      document.body.dataset.researchSkin = "";
    } else {
      delete document.body.dataset.researchSkin;
    }
    if (enabled && disposeSkin === void 0) {
      disposeSkin = ctx.theme.overrideTokens(SKIN_SOURCE, SKIN_TOKENS);
    } else if (!enabled && disposeSkin !== void 0) {
      disposeSkin();
      disposeSkin = void 0;
    }
  };
  let presetQueue = Promise.resolve();
  const reconcileDefaultPreset = () => {
    presetQueue = presetQueue.then(async () => {
      const connection2 = ctx.get("connection");
      if (connection2 === void 0) return;
      const { api: api2 } = connection2;
      const { enabled, prevDefault } = skinStore.getSnapshot();
      const list = await api2.agentPresets.list({});
      if (!list.result.ok) return;
      const rows = list.result.value.presets;
      const currentDefault = rows.find((row) => row.isDefault === true)?.id;
      const retargetBlankCurrent = async (target) => {
        const sessions = ctx.sessions.list.getSnapshot();
        const id = sessions.current;
        if (id === void 0) return;
        const row = sessions.byId[id];
        if (row === void 0 || !row.blank || row.agentPreset === target) return;
        const response = await api2.agentPresets.select({ sessionId: id, agentPreset: target });
        if (response.result.ok) ctx.sessions.noteAgentPreset(id, response.result.value.agentPreset);
      };
      if (enabled) {
        const usable = rows.some((row) => row.id === PRESET_ID && row.broken === void 0);
        if (!usable) return;
        if (currentDefault !== PRESET_ID) {
          skinStore.update((draft) => {
            draft.prevDefault = currentDefault;
          });
          await api2.settings.update({ ns: "agent-presets", patch: { default: PRESET_ID } });
        }
        await retargetBlankCurrent(PRESET_ID);
      } else if (prevDefault !== void 0) {
        if (currentDefault === PRESET_ID) {
          await api2.settings.update({ ns: "agent-presets", patch: { default: prevDefault } });
        }
        await retargetBlankCurrent(prevDefault);
        skinStore.update((draft) => {
          draft.prevDefault = void 0;
        });
      }
    }).catch((error) => {
      console.error("[dsh-research-agent] default-preset reconcile failed:", error);
    });
  };
  const enterResearchWorkspace = () => {
    void (async () => {
      try {
        const workspace = await ctx.workspaces.create({ path: RESEARCH_WORKSPACE_PATH });
        const sessionId = await ctx.workspaces.connectWorkspace(workspace.workspaceId);
        ctx.sessions.open(sessionId);
      } catch (error) {
        console.error("[dsh-research-agent] enter research workspace failed:", error);
      }
    })();
  };
  let lastEnabled = skinStore.getSnapshot().enabled;
  ctx.effect(() => {
    const stop = skinStore.subscribe(() => {
      reconcileSkin();
      const { enabled } = skinStore.getSnapshot();
      if (enabled !== lastEnabled) {
        lastEnabled = enabled;
        reconcileDefaultPreset();
        if (enabled) {
          presetQueue = presetQueue.then(() => {
            if (skinStore.getSnapshot().enabled) enterResearchWorkspace();
          });
        }
      }
    });
    reconcileSkin();
    reconcileDefaultPreset();
    return () => {
      stop();
      delete document.body.dataset.researchSkin;
      if (disposeSkin !== void 0) {
        disposeSkin();
        disposeSkin = void 0;
      }
    };
  }, "dsh-research-agent: skin reconcile");
  const connection = ctx.get("connection");
  if (connection === void 0) return;
  const { api } = connection;
  let probe;
  const probePreset = () => {
    probe ??= api.agentPresets.list({}).then((response) => response.result.ok && response.result.value.presets.some((row) => row.id === PRESET_ID && row.broken === void 0)).catch(() => false);
    return probe;
  };
  const yamlProbe = (route, fallback) => {
    let cached;
    return () => {
      cached ??= fetch(route).then((response) => response.ok ? response.json() : { cards: [] }).then((data) => {
        const rows = Array.isArray(data.cards) ? data.cards.filter(isSituationCard) : [];
        return rows.length > 0 ? rows : fallback;
      }).catch(() => fallback);
      return cached;
    };
  };
  const probeCards = yamlProbe("/dsh-research-agent/cards", SITUATION_CARDS);
  const launch = async (sessionId, inputActions, template) => {
    const response = await api.agentPresets.select({ sessionId, agentPreset: PRESET_ID });
    if (response.result.ok) {
      ctx.sessions.noteAgentPreset(sessionId, response.result.value.agentPreset);
    }
    inputActions.setDraft(template);
  };
  const workbenchStore = (0, import_client.createSnapshotStore)(
    { open: true },
    { persist: { name: "dsh-research-agent.workbench-open" } }
  );
  const workbenchData = (0, import_client.createSnapshotStore)(
    { entries: [] },
    { persist: { name: "dsh-research-agent.workbench-data" } }
  );
  const reconcileWorkbenchAttr = () => {
    const docked = skinStore.getSnapshot().enabled && workbenchStore.getSnapshot().open;
    if (docked) {
      document.body.dataset.researchWb = "";
    } else {
      delete document.body.dataset.researchWb;
    }
  };
  ctx.effect(() => {
    const stopSkin = skinStore.subscribe(reconcileWorkbenchAttr);
    const stopWb = workbenchStore.subscribe(reconcileWorkbenchAttr);
    reconcileWorkbenchAttr();
    return () => {
      stopSkin();
      stopWb();
      delete document.body.dataset.researchWb;
    };
  }, "dsh-research-agent: workbench dock attr");
  const applyTemplate = async (sessionId, template) => {
    const row = ctx.sessions.list.getSnapshot().byId[sessionId];
    if (row !== void 0 && row.agentPreset !== PRESET_ID) {
      const response = await api.agentPresets.select({ sessionId, agentPreset: PRESET_ID });
      if (response.result.ok) ctx.sessions.noteAgentPreset(sessionId, response.result.value.agentPreset);
    }
    const actx = ctx.sessions.scope(sessionId);
    const conversation = actx?.get("conversation");
    if (actx !== void 0 && conversation !== void 0) {
      conversation.input.for(actx).setDraft(template);
    }
  };
  let pendingTemplate;
  const launchFromRoot = (template) => {
    const snapshot = ctx.sessions.list.getSnapshot();
    const current = snapshot.current !== void 0 ? snapshot.byId[snapshot.current] : void 0;
    if (current !== void 0 && current.blank) {
      void applyTemplate(current.id, template).catch(() => {
      });
      return;
    }
    pendingTemplate = template;
    ctx.workspaces.startSession();
  };
  ctx.effect(() => ctx.sessions.list.subscribe(() => {
    if (pendingTemplate === void 0) return;
    const snapshot = ctx.sessions.list.getSnapshot();
    const id = snapshot.current;
    if (id === void 0) return;
    const row = snapshot.byId[id];
    if (row === void 0 || !row.blank) return;
    const template = pendingTemplate;
    pendingTemplate = void 0;
    void applyTemplate(id, template).catch(() => {
    });
  }), "dsh-research-agent: pending workbench launch");
  ctx.slots.inject("conversation.input.dock", () => ctx.slots.register({
    name: "conversation.input.dock",
    id: "dsh-research-brand-panel",
    order: -10,
    inject: () => ({ probePreset, probeCards, launch, skin: skinStore, t: locale.t, localeFace: locale.face })
  }, BrandPanel));
  ctx.slots.inject("settings.general.item", () => ctx.slots.register({
    name: "settings.general.item",
    id: "dsh-research-mode-row",
    order: 60,
    inject: () => ({ skin: skinStore, t: locale.t, localeFace: locale.face })
  }, ResearchModeRow));
  ctx.slots.inject("sidebar.footer.action", () => ctx.slots.register({
    name: "sidebar.footer.action",
    id: "dsh-research-workbench",
    order: -5,
    inject: () => ({ skin: skinStore, workbench: workbenchStore, t: locale.t, localeFace: locale.face })
  }, WorkbenchButton));
  ctx.slots.inject("shell.overlay", () => ctx.slots.register({
    name: "shell.overlay",
    id: "dsh-research-workbench-panel",
    inject: () => ({ skin: skinStore, workbench: workbenchStore, data: workbenchData, launch: launchFromRoot, t: locale.t, localeFace: locale.face })
  }, WorkbenchDrawer));
}
return module.exports; } });
//# sourceMappingURL=client.js.map
