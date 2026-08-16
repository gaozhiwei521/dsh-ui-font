# 字体浏览器子窗口（Font Browser）实现计划

> 项目：dsh-ui-font（DSH 客户端插件，设置 → 字体 / Fonts）
> 日期：2026-08-16
> 状态：待执行

## Goal

在 dsh-ui-font 的"自定义字体"流程中，新增一个**字体浏览器子窗口**：用户点击自定义输入区旁的"浏览全部字体…"按钮后，弹出柔和圆角风格的模态子窗口，**以列表形式展示电脑上所有已安装字体，每一项都用该字体自身的外形渲染预览**（字体名 + 中英文示例 + 数字）；点击任意项即把该字体应用到正文字体/代码字体设置。整体设计拒绝尖锐棱角，全部使用 R 角（圆角）与柔和阴影。

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ lib/client.js（唯一改动文件，浏览器端 React 插件）              │
│                                                             │
│  FontPicker（自定义输入行）                                    │
│    └─ 新增按钮「浏览全部字体…」                                 │
│        └─ FontBrowser 模态子窗口（overlay + 面板，fixed 定位）   │
│            ├─ 搜索框（按字体名过滤）                            │
│            ├─ 字体网格：每卡片 fontFamily=该字体 + 示例文字       │
│            └─ 点击卡片 → 回填自定义输入并立即应用                │
│                                                             │
│  字体枚举层 enumerateSystemFonts()                            │
│    ├─ 主方案：window.queryLocalFonts()（Local Font Access API）│
│    └─ 降级：document.fonts.check() 探测内置候选名单             │
└─────────────────────────────────────────────────────────────┘
```

- 字体枚举与 UI 全部在浏览器端完成，**不触碰后端 / profile / bundle 机制**。
- 模态用 `position: fixed` overlay 自绘（不依赖 DSH 组件库），`z-index` 取超大值保证盖住所有界面。
- 配色全部使用 DSH 现有 CSS 变量（`--dsw-alias-*`），自动适配亮/暗主题，不写死颜色。

## Tech Stack

- 浏览器端 React（通过 `react` / `react/jsx-runtime` require，与现有代码一致）
- 原生 DOM + inline styles（沿用现有 `styles` 对象模式，无样式文件）
- CSS Font Loading API（`document.fonts.check`）+ Local Font Access API（`window.queryLocalFonts`）
- 构建：无构建步骤，直接编辑 `lib/client.js`，经 `sync-dsh-ui-font.ps1` 同步到安装副本

## Baseline / Authority Refs

- 现有代码：`E:\deepseekwork1\dsh-ui-font\lib\client.js`（721 行，已通读）
- 现有 README：`E:\deepseekwork1\dsh-ui-font\README.md`
- 同步脚本：`E:\deepseekwork1\_工具脚本\sync-dsh-ui-font.ps1`
- 运行环境：DSH rc.6（全局 npm 安装），WebView2 Runtime 151.0.4129.86，DevTools 被宿主禁用（`DSHApp.cs` 中 `AreDevToolsEnabled = false`）

### 关键环境事实（影响设计）

1. **DevTools 禁用** → 用户无法 F12 调试；插件所有异常仍走现有兜底（`window.__dshUiFontError` + console.error，不影响 UI）。
2. **WebView2 权限行为未知** → `queryLocalFonts()` 可能因宿主未处理 `PermissionRequested` 事件而被静默拒绝，因此必须有 `document.fonts.check` 探测名单作为降级路径，且 UI 需给出"已显示常见字体"提示。
3. `queryLocalFonts()` 需要**用户手势**（transient activation）→ 只能在按钮 onClick 中调用（天然满足），不能在初始化时调用。

## Compatibility Boundary

- 保持插件**纯客户端**：不新增 `inject` 服务、不声明 `runtime`、不修改 `cordis.patch.yml` / `package.json` 的 dsh 字段。
- 现有设置键（`dsh-ui-font:sans` / `dsh-ui-font:code` …）与 `localStorage` 前缀不变；已存的自定义字体栈兼容（仍可被 `sanitizeFontStack` 读取）。
- 旧的"手动输入 + 应用"路径**保留**（作为兜底），仅新增入口，不删除既有功能。
- 字体名经 `sanitizeFontStack` 校验后写入存储：字体名只含字母/数字/空格/连字符等，不触发 `[;{}()<>]` 过滤，无注入风险。

## Requirement Ready Check

- 需求来源：用户直接描述（子窗口展示所有已装字体、每项用自身字形预览、R 角柔和设计、点击自定义后弹出）。
- 验收标准：
  1. 自定义输入区出现"浏览全部字体…"入口；
  2. 点击弹出圆角模态子窗口（无尖角元素）；
  3. 窗口内列出已安装字体，每项以其字体渲染"字体名 + 中英文示例 + 数字"；
  4. 支持搜索过滤；
  5. 点击某项后：模态关闭，自定义输入框回填 `"字体名"`，界面立即应用该字体；
  6. 枚举失败时降级显示常见字体名单并提示；
  7. 亮/暗主题下均正常显示；
  8. 既有功能（预设、缩放、行高、平滑、连字、恢复默认、localStorage 持久化）无回归。
- 开放问题：无（枚举 API 权限风险已由双路径设计覆盖）。
- Decision: **ready**

## Change Necessity

- 用户可见需求：需要一个"所见即所得"的字体选择界面，替代纯文本输入猜测字体名。
- 非代码选项：无（插件 UI 必须改代码；字体枚举必须写浏览器代码）。
- 最小改动边界：仅 `E:\deepseekwork1\dsh-ui-font\lib\client.js` + README 文档；不涉及构建/后端/依赖。
- Decision: **code-change**（单文件）

## Existence Check

- 拟新增表面：`FontBrowser` 组件 + `enumerateSystemFonts()` + 内置候选名单常量，均收拢在既有 `client.js` 内，**不新增文件/owner**。
- 复用：现有 `styles` inline-style 模式、`sanitizeFontStack`、`write/read`、locale 注册机制。
- Decision: **reuse-existing**

## TDD Route

```text
TDD Route:
- Mode: off
- Decision: skipped
- Strict authority: not applicable（无显式严格 TDD 请求；插件无测试框架）
- Test posture: 语法门禁（node --check）+ 手动验收清单（浏览器实测）
- Reason: 纯浏览器 UI 插件，无单元测试基建；验证以"同步脚本语法+MD5 校验"与"DSH 界面手动清单"为准
- Verification: 见各 Task 的 Verification 与文末「最终验收清单」
```

## Plan Pressure Test

- Owner/contract/retirement：单文件改动，无新 owner；旧路径保留，无退役面。
- 架构完整性：枚举层独立函数 + UI 组件独立，职责清晰；不引入后端桥接等更高层路径。
- 验证范围：语法 + 手动清单即可覆盖。
- 任务可执行性：每步 2-5 分钟，代码完整给出。
- Pressure result: **proceed**

## Complexity Budget

- 目标文件：`lib/client.js`（现 721 行）。
- 预计新增：约 250-300 行（枚举层 + 模态组件 + 样式 + locale + 集成）。
- 现状压力：低（单文件插件，结构清晰）。
- 预算结果：**within-budget**（预计 ~1000 行，仍为单文件插件合理规模）。
- 规划治理：样式对象与现有 `styles` 合并；枚举函数独立 region；不抽取新文件（避免破坏 file: 复制安装与同步脚本）。

## Files

| 文件 | 动作 |
|---|---|
| `E:\deepseekwork1\dsh-ui-font\lib\client.js` | 修改（唯一代码文件） |
| `E:\deepseekwork1\dsh-ui-font\README.md` | 修改（功能/限制说明） |
| `E:\deepseekwork1\dsh-ui-font\docs\aegis\plans\2026-08-16-font-browser.md` | 本计划 |
| 安装副本（`%USERPROFILE%\.dsh\profiles\web\node_modules\dsh-ui-font\lib\client.js`） | 由同步脚本更新，不手改 |

---

## Tasks

### T0 — 备份与语法门禁

- **Files**：`E:\deepseekwork1\dsh-ui-font\lib\client.js`（复制为 `lib\client.js.bak-20260816`）
- **Why**：确保可回滚；确认改动前基线语法通过。
- **Verification**：
  ```powershell
  node --check E:\deepseekwork1\dsh-ui-font\lib\client.js
  ```
  期望：无输出，`$LASTEXITCODE -eq 0`。
- **Steps**：
  1. `Copy-Item E:\deepseekwork1\dsh-ui-font\lib\client.js E:\deepseekwork1\dsh-ui-font\lib\client.js.bak-20260816`
  2. 运行上方 `node --check` 确认基线通过。

### T1 — 字体枚举层（queryLocalFonts + 探测降级 + 候选名单）

- **Files**：`lib/client.js`
- **Why**：子窗口的数据来源；必须覆盖"权限被拒"的降级路径。
- **Impact/Compatibility**：新增 `#region dsh-ui-font: font enumeration`；不触碰现有函数；`fontCache` 模块级缓存避免重复枚举。
- **Verification**：`node --check` 通过；集成后手动验收清单第 3 项。
- **Steps**（在 `#endregion`（L205，guarded storage 之后）插入完整代码）：

```js
//#region dsh-ui-font: font enumeration
let fontCache = null;

/**
 * Curated candidate names for the probe fallback (document.fonts.check).
 * Covers Windows built-ins, Office/Web fonts and common Chinese fonts.
 */
const CANDIDATE_FONT_NAMES = [
	"Arial", "Arial Black", "Arial Narrow", "Bahnschrift", "Bahnschrift Condensed",
	"Bahnschrift Light", "Book Antiqua", "Bookman Old Style", "Bradley Hand ITC",
	"Calibri", "Calibri Light", "Cambria", "Cambria Math", "Candara", "Candara Light",
	"Cascadia Code", "Cascadia Code ExtraLight", "Cascadia Code Light", "Cascadia Code SemiBold",
	"Cascadia Code SemiLight", "Cascadia Mono", "Cascadia Mono ExtraLight", "Cascadia Mono Light",
	"Cascadia Mono SemiBold", "Cascadia Mono SemiLight", "Century", "Century Gothic",
	"Comic Sans MS", "Consolas", "Constantia", "Corbel", "Corbel Light", "Courier New",
	"DengXian", "DengXian Light", "DIN Next LT Pro", "DIN Next LT Pro Light", "DIN Next LT Pro Medium",
	"Dubai", "Dubai Light", "Dubai Medium", "Ebrima", "FangSong", "Franklin Gothic Medium",
	"Freestyle Script", "French Script MT", "FZCuHeiSongS-B-GB", "FZShuTi", "FZYaoTi",
	"Gabriola", "Gadugi", "Garamond", "Georgia", "HONOR Sans", "HONOR Sans CN", "HONOR Sans CN Light",
	"HONOR Sans CN Medium", "Impact", "Ink Free", "Javanese Text", "Juice ITC", "KaiTi",
	"Kristen ITC", "Leelawadee", "Leelawadee UI", "Leelawadee UI Semilight", "LiSu",
	"Lucida Console", "Lucida Handwriting", "Lucida Sans Unicode", "Malgun Gothic",
	"Malgun Gothic Semilight", "Marlett", "Microsoft Himalaya", "Microsoft JhengHei",
	"Microsoft JhengHei Light", "Microsoft JhengHei UI", "Microsoft New Tai Lue",
	"Microsoft PhagsPa", "Microsoft Sans Serif", "Microsoft Tai Le", "Microsoft Uighur",
	"Microsoft YaHei", "Microsoft YaHei Light", "Microsoft YaHei UI", "Microsoft YaHei UI Light",
	"Microsoft Yi Baiti", "MingLiU_HKSCS-ExtB", "MingLiU-ExtB", "Mistral", "Mongolian Baiti",
	"Monotype Corsiva", "MS Gothic", "MS PGothic", "MS Reference Sans Serif", "MS UI Gothic",
	"MV Boli", "Myanmar Text", "Nirmala UI", "Nirmala UI Semilight", "Noto Sans SC",
	"Noto Sans SC Black", "Noto Sans SC DemiLight", "Noto Sans SC Light", "Noto Sans SC Medium",
	"Noto Sans SC Thin", "Noto Serif SC", "Noto Serif SC Black", "Noto Serif SC ExtraLight",
	"Noto Serif SC Light", "Noto Serif SC Medium", "Noto Serif SC SemiBold", "NSimSun",
	"Palatino Linotype", "Papyrus", "PMingLiU-ExtB", "Pristina", "Segoe Print", "Segoe Script",
	"Segoe UI", "Segoe UI Black", "Segoe UI Emoji", "Segoe UI Historic", "Segoe UI Light",
	"Segoe UI Semibold", "Segoe UI Semilight", "Segoe UI Symbol", "Segoe UI Variable Display",
	"Segoe UI Variable Display Light", "Segoe UI Variable Text", "SimHei", "SimSun", "SimSun-ExtB",
	"SimSun-ExtG", "Sitka Banner", "Sitka Display", "Sitka Heading", "Sitka Small", "Sitka Subheading",
	"Sitka Text", "Source Han Serif SC Heavy", "STCaiyun", "STFangsong", "STHupo", "STKaiti",
	"STLiti", "STSong", "STXihei", "STXingkai", "STXinwei", "STZhongsong", "Sylfaen", "Symbol",
	"Tahoma", "Tempus Sans ITC", "Times New Roman", "Trebuchet MS", "Verdana", "Webdings",
	"Wingdings", "Wingdings 2", "Wingdings 3", "YouYuan", "Yu Gothic", "Yu Gothic Light",
	"Yu Gothic Medium", "Yu Gothic UI", "Yu Gothic UI Light", "Yu Gothic UI Semibold", "Yu Gothic UI Semilight"
];

/** Probe fallback: keep only names the engine can actually load. */
function probeFontList() {
	try {
		const out = [];
		for (let i = 0; i < CANDIDATE_FONT_NAMES.length; i++) {
			const name = CANDIDATE_FONT_NAMES[i];
			try {
				if (document.fonts.check('16px "' + name + '"')) out.push(name);
			} catch { /* one bad name must not abort the sweep */ }
		}
		out.sort((a, b) => a.localeCompare(b, "zh-Hans-CN"));
		fontCache = out;
		return out;
	} catch {
		return [];
	}
}

/**
 * Enumerate installed fonts. Primary path is the Local Font Access API
 * (queryLocalFonts, Chromium 103+); it needs a user gesture and may be
 * permission-denied in WebView2, in which case we fall back to probing a
 * curated candidate list via document.fonts.check (no permission needed).
 * Returns Promise<string[]> (sorted, de-duplicated family names).
 */
function enumerateSystemFonts() {
	if (fontCache !== null) return Promise.resolve(fontCache);
	if (typeof window.queryLocalFonts === "function") {
		try {
			return window.queryLocalFonts().then((data) => {
				const seen = new Set();
				const out = [];
				for (let i = 0; i < data.length; i++) {
					const name = String(data[i].family || "").trim();
					if (name.length === 0 || seen.has(name)) continue;
					seen.add(name);
					out.push(name);
				}
				out.sort((a, b) => a.localeCompare(b, "zh-Hans-CN"));
				fontCache = out;
				return out;
			}).catch(() => probeFontList());
		} catch {
			return Promise.resolve(probeFontList());
		}
	}
	return Promise.resolve(probeFontList());
}
//#endregion
```

### T2 — 模态子窗口 UI（柔和 R 角风格）

- **Files**：`lib/client.js`
- **Why**：用户要求的核心交互：圆角、柔和、所见即所得的字体列表。
- **Impact/Compatibility**：新增 `styles` 条目 + `FontBrowser` 组件；纯自绘 overlay，不依赖 DSH 组件库；所有颜色走 `--dsw-alias-*` 变量。
- **Verification**：`node --check`；手动验收清单 2-7 项。
- **Steps**（分两步落地）：

**2a. 在 `styles` 对象（L288-408）末尾追加模态样式**：

```js
		modalOverlay: {
			position: "fixed",
			inset: "0",
			zIndex: 2147483000,
			background: "rgba(0, 0, 0, 0.42)",
			backdropFilter: "blur(2px)",
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
			padding: "24px"
		},
		modalPanel: {
			background: "var(--dsw-alias-bg-layer-2)",
			border: "1px solid var(--dsw-alias-border-l2)",
			borderRadius: "18px",
			boxShadow: "0 12px 48px rgba(0, 0, 0, 0.28)",
			width: "min(860px, 92vw)",
			maxHeight: "78vh",
			display: "flex",
			flexDirection: "column",
			overflow: "hidden"
		},
		modalHeader: {
			display: "flex",
			alignItems: "center",
			gap: "10px",
			padding: "18px 20px 10px"
		},
		modalTitle: {
			color: "var(--dsw-alias-label-primary)",
			fontSize: "15px",
			fontWeight: 600,
			flex: 1
		},
		modalClose: {
			width: "30px",
			height: "30px",
			borderRadius: "50%",
			border: "none",
			background: "transparent",
			color: "var(--dsw-alias-label-secondary)",
			fontSize: "18px",
			lineHeight: "30px",
			textAlign: "center",
			cursor: "pointer"
		},
		modalCloseHover: {
			background: "var(--dsw-alias-bg-layer-3)"
		},
		modalSearch: {
			margin: "0 20px 12px",
			height: "36px",
			padding: "0 14px",
			borderRadius: "12px",
			border: "1px solid var(--dsw-alias-border-l2)",
			background: "var(--dsw-alias-bg-layer-1)",
			color: "var(--dsw-alias-label-primary)",
			font: "inherit",
			fontSize: "13px",
			boxSizing: "border-box",
			outline: "none"
		},
		modalBody: {
			flex: 1,
			overflowY: "auto",
			padding: "4px 20px 16px"
		},
		modalGrid: {
			display: "grid",
			gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
			gap: "10px"
		},
		modalCard: {
			border: "1px solid var(--dsw-alias-border-l2)",
			borderRadius: "14px",
			padding: "12px 14px",
			background: "var(--dsw-alias-bg-layer-1)",
			cursor: "pointer",
			display: "flex",
			flexDirection: "column",
			gap: "6px",
			transition: "border-color .15s ease, background .15s ease"
		},
		modalCardName: {
			color: "var(--dsw-alias-label-tertiary)",
			fontSize: "11px",
			whiteSpace: "nowrap",
			overflow: "hidden",
			textOverflow: "ellipsis"
		},
		modalCardSample: {
			color: "var(--dsw-alias-label-primary)",
			fontSize: "18px",
			lineHeight: 1.4,
			whiteSpace: "nowrap",
			overflow: "hidden",
			textOverflow: "ellipsis"
		},
		modalEmpty: {
			color: "var(--dsw-alias-label-tertiary)",
			fontSize: "13px",
			textAlign: "center",
			padding: "32px 0"
		},
		modalFallback: {
			color: "var(--dsw-alias-state-warning-primary, #b98a2f)",
			fontSize: "12px",
			padding: "0 20px 10px"
		}
```

**2b. 在 `FontPicker` 组件之后（L499 后）插入 `FontBrowser` 组件**：

```js
		/** Modal browser of every installed font; each card renders in its own typeface. */
		function FontBrowser({ open, onClose, onPick, t }) {
			const [fonts, setFonts] = (0, _react.useState)(null);
			const [fallback, setFallback] = (0, _react.useState)(false);
			const [query, setQuery] = (0, _react.useState)("");
			const [hovered, setHovered] = (0, _react.useState)(null);

			(0, _react.useEffect)(function () {
				if (!open) return;
				let alive = true;
				setFonts(null);
				setQuery("");
				enumerateSystemFonts().then(function (list) {
					if (!alive) return;
					setFonts(list);
					// probe path (not queryLocalFonts) ⇒ show the hint
					setFallback(typeof window.queryLocalFonts !== "function" || !list.length);
				});
				return function () { alive = false; };
			}, [open]);

			(0, _react.useEffect)(function () {
				if (!open) return;
				const onKey = (e) => { if (e.key === "Escape") onClose(); };
				window.addEventListener("keydown", onKey);
				return function () { window.removeEventListener("keydown", onKey); };
			}, [open, onClose]);

			if (!open) return null;
			const q = query.trim().toLowerCase();
			const shown = fonts === null ? [] : (q.length === 0 ? fonts : fonts.filter((f) => f.toLowerCase().indexOf(q) >= 0));

			return (0, react_jsx_runtime.jsx)("div", {
				style: styles.modalOverlay,
				onMouseDown: (e) => { if (e.target === e.currentTarget) onClose(); },
				children: (0, react_jsx_runtime.jsxs)("div", {
					style: styles.modalPanel,
					children: [
						(0, react_jsx_runtime.jsxs)("div", {
							style: styles.modalHeader,
							children: [
								(0, react_jsx_runtime.jsx)("div", { style: styles.modalTitle, children: t("font.browserTitle") }),
								(0, react_jsx_runtime.jsx)("button", {
									type: "button",
									style: hovered === "close" ? { ...styles.modalClose, ...styles.modalCloseHover } : styles.modalClose,
									onMouseEnter: () => setHovered("close"),
									onMouseLeave: () => setHovered(null),
									onClick: onClose,
									children: "×"
								})
							]
						}),
						(0, react_jsx_runtime.jsx)("input", {
							type: "text",
							value: query,
							placeholder: t("font.browserSearch"),
							style: styles.modalSearch,
							onChange: (e) => setQuery(e.target.value),
							autoFocus: true
						}),
						fallback ? (0, react_jsx_runtime.jsx)("div", { style: styles.modalFallback, children: t("font.browserFallback") }) : null,
						(0, react_jsx_runtime.jsx)("div", {
							style: styles.modalBody,
							children: fonts === null
								? (0, react_jsx_runtime.jsx)("div", { style: styles.modalEmpty, children: t("font.browserLoading") })
								: shown.length === 0
									? (0, react_jsx_runtime.jsx)("div", { style: styles.modalEmpty, children: t("font.browserEmpty") })
									: (0, react_jsx_runtime.jsx)("div", {
										style: styles.modalGrid,
										children: shown.map((name) => (0, react_jsx_runtime.jsx)("div", {
											style: hovered === name ? { ...styles.modalCard, borderColor: "var(--dsw-alias-brand-primary)" } : styles.modalCard,
											onMouseEnter: () => setHovered(name),
											onMouseLeave: () => setHovered(null),
											onClick: () => { onPick(name); onClose(); },
											title: name,
											children: [
												(0, react_jsx_runtime.jsx)("div", { style: styles.modalCardName, children: name }),
												(0, react_jsx_runtime.jsx)("div", { style: { ...styles.modalCardSample, fontFamily: '"' + name + '"' }, children: "中文字体 Aa 0123" })
											]
										}, name))
									})
						})
					]
				})
			});
		}
```

### T3 — FontPicker 集成（浏览按钮 + 选择回填）

- **Files**：`lib/client.js`
- **Why**：把子窗口接进"自定义字体"流程；选择后立即应用。
- **Impact/Compatibility**：自定义输入框由 uncontrolled 改为受控（`customText` state），保持 Enter/应用按钮行为不变；选择字体后 `selectedId` 保持 `"custom"` 并回填。
- **Verification**：`node --check`；手动验收清单第 2、5 项。
- **Steps**：

**3a. `FontPicker` 组件内新增 state 与受控输入**。将 L433-438 的 useState 块替换为：

```js
		function FontPicker({ label, hint, presets, value, onChange, t }) {
			const customInputRef = (0, _react.useRef)(null);
			const [selectedId, setSelectedId] = (0, _react.useState)(function () {
				const matched = presets.find((p) => p.id === value);
				if (matched !== undefined) return matched.id;
				if (typeof value === "string" && value !== FOLLOW_SYSTEM && value.length > 0) return "custom";
				return FOLLOW_SYSTEM;
			});
			const [browserOpen, setBrowserOpen] = (0, _react.useState)(false);
			const [customText, setCustomText] = (0, _react.useState)(function () {
				if (typeof value === "string" && value !== FOLLOW_SYSTEM && presets.find((p) => p.id === value) === undefined) return value;
				return "";
			});
```

**3b. `onApplyCustom` 改为使用受控值**（替换 L455-464）：

```js
			const onApplyCustom = () => {
				const raw = customText.trim();
				if (raw.length === 0) {
					onChange(FOLLOW_SYSTEM);
					return;
				}
				onChange(sanitizeFontStack(raw) || FOLLOW_SYSTEM);
			};
			const onBrowsePick = (name) => {
				const stack = '"' + name + '"';
				setCustomText(stack);
				onChange(stack);
			};
```

**3c. 自定义行内追加"浏览全部字体…"按钮并接入受控输入**（替换 L481-493 的 custom 分支）：

```js
							selectedId === "custom" ? (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, {
								children: [
									(0, react_jsx_runtime.jsx)("input", {
										ref: customInputRef,
										type: "text",
										placeholder: t("font.customPlaceholder"),
										style: styles.input,
										value: customText,
										onChange: (e) => setCustomText(e.target.value),
										onKeyDown: (event) => { if (event.key === "Enter") onApplyCustom(); }
									}),
									(0, react_jsx_runtime.jsx)("button", { type: "button", style: styles.button, onClick: onApplyCustom, children: t("font.apply") }),
									(0, react_jsx_runtime.jsx)("button", { type: "button", style: styles.button, onClick: () => setBrowserOpen(true), children: t("font.browse") }),
									(0, react_jsx_runtime.jsx)(FontBrowser, {
										open: browserOpen,
										onClose: () => setBrowserOpen(false),
										onPick: onBrowsePick,
										t
									})
								]
							}) : null
```

### T4 — locale 键（zh / en）

- **Files**：`lib/client.js`
- **Why**：新 UI 文案需要双语字典，否则设置面板报缺键。
- **Verification**：`node --check`；界面文案显示正确。
- **Steps**：在 `zh`（L81-105）与 `en`（L108-132）字典末尾各追加：

```js
			"font.browse": "浏览全部字体…",
			"font.browserTitle": "选择字体",
			"font.browserSearch": "搜索字体…",
			"font.browserLoading": "正在读取字体列表…",
			"font.browserEmpty": "没有匹配的字体",
			"font.browserFallback": "无法枚举全部字体，以下为常见字体列表；也可以直接输入字体名。"
```

```js
			"font.browse": "Browse all fonts…",
			"font.browserTitle": "Choose a font",
			"font.browserSearch": "Search fonts…",
			"font.browserLoading": "Loading fonts…",
			"font.browserEmpty": "No matching fonts",
			"font.browserFallback": "Full enumeration is unavailable; showing common fonts. You can still type a font name."
```

### T5 — 同步与手动验收

- **Files**：安装副本（由脚本更新）
- **Why**：让改动进入正在运行的 DSH。
- **Verification**：
  ```powershell
  node --check E:\deepseekwork1\dsh-ui-font\lib\client.js
  pwsh -ExecutionPolicy Bypass -File E:\deepseekwork1\_工具脚本\sync-dsh-ui-font.ps1
  ```
  期望：语法 OK；三个文件 MD5 一致。
- **Steps**：
  1. 运行上方两条命令；
  2. 在 DSH 窗口按 **Ctrl+F5** 强刷；
  3. 按下方「最终验收清单」逐项人工确认；
  4. 确认无误后删除 T0 的 `.bak-20260816` 备份（或保留一周）。

### T6 — README 更新

- **Files**：`E:\deepseekwork1\dsh-ui-font\README.md`
- **Why**：记录新功能与降级行为。
- **Steps**：在「功能」列表追加两行：

```markdown
- **字体浏览器**：自定义字体时可打开子窗口，以列表形式展示本机所有已安装字体（每项用自身字形预览），点击即应用；枚举失败时自动降级为常见字体名单
```

并在「已知限制」追加：

```markdown
- 字体枚举优先使用浏览器 Local Font Access API；若宿主拒绝权限则降级为内置常见字体名单探测，此时新安装的字体可能不出现，可直接手动输入字体名
```

---

## 最终验收清单（手动，DSH 窗口内）

1. 设置 → 字体 → 正文字体下拉选「自定义…」→ 出现「浏览全部字体…」按钮。
2. 点击按钮 → 弹出圆角模态子窗口（面板 18px 圆角、卡片 14px 圆角、柔和阴影、遮罩毛玻璃；无尖角元素）。
3. 窗口列出本机已装字体（正常情况应含微软雅黑/等线/思源/宋体等），每项以其自身字体渲染「中文字体 Aa 0123」。
4. 搜索框输入「yahei」→ 列表过滤到微软雅黑；清空恢复。
5. 点击「Microsoft YaHei」→ 窗口关闭，自定义输入框回填 `"Microsoft YaHei"`，聊天区正文立即变为微软雅黑。
6. 重新打开设置 → 自定义仍显示 `"Microsoft YaHei"`（localStorage 持久化）。
7. 代码字体重复 1-5 步骤（验证 `"Cascadia Code"` 等）。
8. 点「恢复默认」→ 全部还原，插件无报错。
9. 切换 DSH 亮/暗主题 → 子窗口配色正常。
10. 回归：预设下拉、显示比例、行高、平滑、连字均正常。

## Risks

| 风险 | 概率 | 缓解 |
|---|---|---|
| WebView2 拒绝 `queryLocalFonts` 权限 | 高 | `catch → probeFontList()` 降级；UI 提示"已显示常见字体" |
| `queryLocalFonts` 需用户手势 | 确定 | 只在按钮 onClick 调用，天然满足 transient activation |
| `document.fonts.check` 对个别字体误判 | 低 | 只影响降级路径的个别条目，不影响主流程 |
| fixed 定位受祖先 transform 影响错位 | 低 | DSH 设置面板无 transform 容器；若实测错位，改 `document.body.appendChild` 原生节点渲染 |
| 232 项全量渲染性能 | 低 | 一次渲染 + 搜索过滤，实测无卡顿 |
| 字体名含引号导致 CSS 注入 | 无 | `sanitizeFontStack` 过滤 `;{}()<>`；字体名本身不含这些字符 |

## Retirement

- 旧路径（纯文本输入 + 应用按钮）**保留**作为兜底，不删除。
- 不新增任何后端/宿主表面，无需要退役的旧代码。
- 回滚：若功能异常，用 T0 的 `client.js.bak-20260816` 覆盖源码并重新同步即可。

## Execution Readiness View

```text
Execution Readiness View:
- Intent Lock: 在 dsh-ui-font 自定义字体流程中新增"字体浏览器"圆角子窗口，所见即所得选择已安装字体
- Scope Fence: 仅改 lib/client.js + README；不动后端/bundle/依赖/设置键/既有功能
- Baseline Lock: 现有 client.js 721 行（已通读）、同步脚本、README 为准；T0 备份
- Approved Behavior: 枚举→列表→预览→点击应用→持久化；权限拒绝时降级名单并提示
- Owner / Contract Constraints: 纯客户端；inject 仅 ["slots","locale"]；不声明 runtime
- Compatibility Boundary: 设置键/localStorage 前缀不变；旧自定义输入保留
- Retirement Boundary: 无退役面；回滚 = 恢复 .bak
- Task Batches: T0→T1→T2→T3→T4→T5→T6（顺序执行，单文件）
- Test Obligations: node --check + sync 脚本 MD5 + 手动验收清单 10 项
- Review Gates: T5 手动验收通过后才算完成；T6 文档随行
- Drift / Rewind Rules: 超出单文件边界或需改 cordis.patch.yml/package.json dsh 字段时停止并回报
- Evidence Required Before Completion: node --check 通过、sync 脚本三文件 MD5 一致、验收清单 1-10 全部勾选
- Advisory Boundary: 方法包执行指引，非完成授权
```

```text
Execution Route:
- Decision: inline
- Evidence: 所有改动集中在单个文件 client.js，任务顺序强耦合（UI 依赖枚举层），无独立可并行任务；无需 subagent 协调
- Fallback: 若中途发现需改 package.json/cordis.patch.yml（不应发生），回到用户确认
- User confirmation required: no
```
