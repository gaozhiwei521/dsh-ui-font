// dsh-ui-font — browser half (client plugin bundle).
//
// Loaded by dsh-client-modules at /plugins/dsh-ui-font/client.js and executed
// through the vendored cordis Loader's lazy-CJS module table
// (window.__ModuleLoader__.load). The factory body is plain CJS with
// require() resolved against the shell's module table.
//
// Safety contract (no-crash guarantee):
//  - apply() is wrapped in try/catch: any startup failure logs to the console
//    and exposes window.__dshUiFontError instead of breaking the UI.
//  - Every localStorage read is guarded and clamped to sane ranges.
//  - User-supplied font stacks pass sanitizeFontStack() (rejects CSS
//    injection: ; { } ( ) < > and length > 300).
//  - Style injection is idempotent and fully removable ("恢复默认" removes
//    every injected rule and the html attribute).
//  - Defaults are a no-op: at default settings the injected CSS reproduces
//    the stock appearance, so enabling the plugin alone changes nothing.

window.__ModuleLoader__.load({
	id: "dsh-ui-font",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react_jsx_runtime = require("react/jsx-runtime");
		let _react = require("react");
		let _runtime_client = require("@deepseek-ai/dsh-client-runtime/client");

		//#region dsh-ui-font: constants & presets
		/** The settings row's locale namespace. */
		const SETTINGS_NS = "settings.dshUiFont";
		/** localStorage key prefix for every setting. */
		const PREFIX = "dsh-ui-font:";
		/** Sentinel meaning "follow the built-in appearance". */
		const FOLLOW_SYSTEM = "default";

		/** Curated sans-serif presets (each with a Chinese fallback stack). */
		const SANS_PRESETS = [
			{ id: "default", label: "跟随系统", value: "" },
			{ id: "yahei", label: "微软雅黑", value: '"Microsoft YaHei", "PingFang SC", "Segoe UI", system-ui, sans-serif' },
			{ id: "pingfang", label: "苹方", value: '"PingFang SC", "Microsoft YaHei", "Segoe UI", system-ui, sans-serif' },
			{ id: "dengxian", label: "等线", value: '"DengXian", "Microsoft YaHei", "PingFang SC", sans-serif' },
			{ id: "noto", label: "思源黑体", value: '"Noto Sans SC", "Source Han Sans SC", "Microsoft YaHei", sans-serif' },
			{ id: "sarasa", label: "更纱黑体", value: '"Sarasa Gothic SC", "Microsoft YaHei", sans-serif' },
			{ id: "serif", label: "思源宋体", value: '"Source Han Serif SC", "Noto Serif SC", "Songti SC", serif' },
			{ id: "wenkai", label: "霞鹜文楷", value: '"LXGW WenKai", "LXGW WenKai Screen", "KaiTi", serif' },
			{ id: "harmonyos", label: "HarmonyOS Sans", value: '"HarmonyOS Sans SC", "Microsoft YaHei", sans-serif' },
			{ id: "misans", label: "MiSans", value: '"MiSans", "Microsoft YaHei", sans-serif' }
		];

		/** Curated monospace presets (Sarasa Mono SC keeps Chinese monospace). */
		const MONO_PRESETS = [
			{ id: "default", label: "跟随系统", value: "" },
			{ id: "cascadia", label: "Cascadia Code", value: '"Cascadia Code", Consolas, ui-monospace, monospace' },
			{ id: "consolas", label: "Consolas", value: 'Consolas, "Cascadia Mono", ui-monospace, monospace' },
			{ id: "jetbrains", label: "JetBrains Mono", value: '"JetBrains Mono", Consolas, ui-monospace, monospace' },
			{ id: "fira", label: "Fira Code", value: '"Fira Code", Consolas, ui-monospace, monospace' },
			{ id: "sarasa-mono", label: "更纱等宽 SC", value: '"Sarasa Mono SC", "Sarasa Fixed SC", Consolas, monospace' },
			{ id: "maple", label: "Maple Mono", value: '"Maple Mono", Consolas, ui-monospace, monospace' },
			{ id: "maple-nf", label: "Maple Mono NF", value: '"Maple Mono NF", "Maple Mono", Consolas, monospace' }
		];

		/** Defaults — deliberately a visual no-op. */
		const DEFAULTS = {
			sans: FOLLOW_SYSTEM,
			code: FOLLOW_SYSTEM,
			zoom: 100,
			lineHeight: 1.6,
			smoothing: true,
			ligatures: true,
			// Default OFF: applying a custom font to the composer textarea is known
			// to misplace the caret during IME composition (unconfirmed pinyin).
			// The UI font still applies everywhere else; users can re-enable it.
			followInput: false
		};
		const ZOOM_MIN = 80;
		const ZOOM_MAX = 130;
		const LH_MIN = 1.3;
		const LH_MAX = 2.0;
		/** Fallback stacks (used when a preset is FOLLOW_SYSTEM). */
		const FALLBACK_SANS = '"Segoe UI", "Microsoft YaHei", system-ui, sans-serif';
		const FALLBACK_CODE = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

		/** Simplified Chinese dictionary. */
		const zh = {
			"font.title": "字体",
			"font.sans": "正文字体",
			"font.sansHint": "聊天、侧边栏、设置等全部正文的字体",
			"font.code": "代码字体",
			"font.codeHint": "代码块、行内代码、终端等区域的等宽字体（中文注释建议用更纱等宽）",
			"font.custom": "自定义…",
			"font.customPlaceholder": "如 \"MyFont\", \"Microsoft YaHei\"",
			"font.apply": "应用",
			"font.applied": "已应用 ✓",
			"font.invalid": "无效输入",
			"font.noCjk": "⚠ 无中文字形",
			"font.noCjkTag": "英文",
			"font.zoom": "显示比例",
			"font.zoomHint": "等比缩放整个界面的文字与排版（80–130%）",
			"font.lineHeight": "聊天区行高",
			"font.lineHeightHint": "仅作用于聊天消息阅读区",
			"font.smoothing": "字体平滑",
			"font.smoothingHint": "开启抗锯齿，文字更柔和",
			"font.ligatures": "代码连字",
			"font.ligaturesHint": "Cascadia Code / Fira Code 等字体的编程连字效果",
			"font.followInput": "输入框字体跟随",
			"font.followInputHint": "输入框使用正文字体；若出现输入光标偏移可关闭此项",
			"font.preview": "预览",
			"font.reset": "恢复默认",
			"font.resetHint": "一键还原为 DSH 原始文字效果",
			"font.previewBody": "江畔何人初见月，江月何年初照人。The quick brown fox jumps over the lazy dog 0123456789",
			"font.previewCode": "const greet = (name) => `你好，${name}!`;  // ->= !== <=>",
			"font.sectionTitle": "字体 / Font",
			"font.desc": "修改整个 DSH 界面的文字显示效果，所有设置实时生效并保存在当前浏览器。",
			"font.browse": "浏览全部字体…",
			"font.browserTitle": "选择字体",
			"font.browserSearch": "搜索字体…",
			"font.browserLoading": "正在读取字体列表…",
			"font.browserEmpty": "没有匹配的字体",
			"font.browserFallback": "无法枚举全部字体，以下为常见字体列表；也可以直接输入字体名。"
		};

		/** English dictionary, checked complete against the zh key set. */
		const en = {
			"font.title": "Fonts",
			"font.sans": "UI font",
			"font.sansHint": "Font for all UI text: chat, sidebar, settings",
			"font.code": "Code font",
			"font.codeHint": "Monospace font for code blocks / inline code (use Sarasa Mono SC for Chinese comments)",
			"font.custom": "Custom…",
			"font.customPlaceholder": "e.g. \"MyFont\", \"Microsoft YaHei\"",
			"font.apply": "Apply",
			"font.applied": "Applied ✓",
			"font.invalid": "Invalid input",
			"font.noCjk": "⚠ No CJK glyphs",
			"font.noCjkTag": "Latin",
			"font.zoom": "Display scale",
			"font.zoomHint": "Uniformly scale text and layout (80–130%)",
			"font.lineHeight": "Chat line height",
			"font.lineHeightHint": "Applies to the chat reading area only",
			"font.smoothing": "Font smoothing",
			"font.smoothingHint": "Antialiased text rendering",
			"font.ligatures": "Code ligatures",
			"font.ligaturesHint": "Programming ligatures for Cascadia Code / Fira Code",
			"font.followInput": "Input font follows UI font",
			"font.followInputHint": "Apply the UI font to inputs; turn off if the caret misaligns",
			"font.preview": "Preview",
			"font.reset": "Reset to default",
			"font.resetHint": "Restore the stock DSH text appearance",
			"font.previewBody": "江畔何人初见月，江月何年初照人。The quick brown fox jumps over the lazy dog 0123456789",
			"font.previewCode": "const greet = (name) => `Hello, ${name}!`;  // ->= !== <=>",
			"font.sectionTitle": "Fonts",
			"font.desc": "Adjust the text appearance of the whole DSH UI. Changes apply live and are saved in this browser.",
			"font.browse": "Browse all fonts…",
			"font.browserTitle": "Choose a font",
			"font.browserSearch": "Search fonts…",
			"font.browserLoading": "Loading fonts…",
			"font.browserEmpty": "No matching fonts",
			"font.browserFallback": "Full enumeration is unavailable; showing common fonts. You can still type a font name."
		};
		//#endregion

		//#region dsh-ui-font: guarded storage
		/** Read a localStorage string (null on absence or error). */
		function read(key) {
			try {
				const value = window.localStorage.getItem(PREFIX + key);
				return typeof value === "string" ? value : null;
			} catch {
				return null;
			}
		}

		/** Write (or remove with null) a localStorage value. */
		function write(key, value) {
			try {
				if (value === null) window.localStorage.removeItem(PREFIX + key);
				else window.localStorage.setItem(PREFIX + key, String(value));
			} catch {
				// storage unavailable — the preference stays process-local
			}
		}

		/** Read a clamped number (fallback on absence/NaN). */
		function readNum(key, fallback, min, max) {
			const raw = read(key);
			if (raw === null) return fallback;
			const value = Number(raw);
			return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
		}

		/** Read a boolean with a strict whitelist. */
		function readBool(key, fallback) {
			const raw = read(key);
			if (raw === null) return fallback;
			return raw === "true";
		}

		/** Read the current config (all keys, all guarded). */
		function readConfig() {
			return {
				sans: read("sans", DEFAULTS.sans),
				code: read("code", DEFAULTS.code),
				zoom: readNum("zoom", DEFAULTS.zoom, ZOOM_MIN, ZOOM_MAX),
				lineHeight: readNum("lineHeight", DEFAULTS.lineHeight, LH_MIN, LH_MAX),
				smoothing: readBool("smoothing", DEFAULTS.smoothing),
				ligatures: readBool("ligatures", DEFAULTS.ligatures),
				followInput: readBool("followInput", DEFAULTS.followInput)
			};
		}

		/**
		 * Reject anything that could smuggle CSS out of a font-family value:
		 * separators, parens, braces and angle brackets are all banned.
		 */
		function sanitizeFontStack(value) {
			if (typeof value !== "string") return "";
			const trimmed = value.trim();
			if (trimmed.length === 0 || trimmed.length > 300) return "";
			if (/[;{}()<>]/.test(trimmed)) return "";
			return trimmed;
		}

		/** Resolve the final CSS font stack for one setting (preset or custom). */
		function resolveStack(kind, stored, fallback) {
			if (typeof stored !== "string" || stored === FOLLOW_SYSTEM || stored.length === 0) return fallback;
			const presets = kind === "code" ? MONO_PRESETS : SANS_PRESETS;
			for (let i = 0; i < presets.length; i++) {
				if (presets[i].id === stored) return presets[i].value;
			}
			const custom = sanitizeFontStack(stored);
			return custom.length > 0 ? custom : fallback;
		}
		//#endregion

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

		/**
		 * Known CJK-capable families. Browsers do not expose per-glyph coverage,
		 * so we use a curated whitelist to warn when a chosen font lacks Chinese
		 * glyphs (which silently fall back to the system font).
		 */
		const KNOWN_CJK = [
			"Microsoft YaHei", "Microsoft YaHei Light", "Microsoft YaHei UI", "Microsoft YaHei UI Light",
			"SimSun", "SimSun-ExtB", "SimSun-ExtG", "NSimSun", "SimHei", "KaiTi", "FangSong", "LiSu", "YouYuan",
			"DengXian", "DengXian Light", "Noto Sans SC", "Noto Sans SC Black", "Noto Sans SC DemiLight",
			"Noto Sans SC Light", "Noto Sans SC Medium", "Noto Sans SC Thin", "Noto Serif SC", "Noto Serif SC Black",
			"Noto Serif SC ExtraLight", "Noto Serif SC Light", "Noto Serif SC Medium", "Noto Serif SC SemiBold",
			"Source Han Sans SC", "Source Han Serif SC", "Source Han Serif SC Heavy", "PingFang SC", "Hiragino Sans GB",
			"Sarasa Gothic SC", "Sarasa Mono SC", "Sarasa Fixed SC", "LXGW WenKai", "LXGW WenKai Screen",
			"HarmonyOS Sans SC", "MiSans", "HONOR Sans CN", "HONOR Sans CN Light", "HONOR Sans CN Medium",
			"Microsoft JhengHei", "Microsoft JhengHei Light", "Microsoft JhengHei UI", "Microsoft JhengHei UI Light",
			"MingLiU-ExtB", "MingLiU_HKSCS-ExtB", "PMingLiU-ExtB", "Yu Gothic", "Yu Gothic Light", "Yu Gothic Medium",
			"Yu Gothic UI", "MS Gothic", "MS PGothic", "MS UI Gothic", "Malgun Gothic", "Malgun Gothic Semilight",
			"STCaiyun", "STFangsong", "STHupo", "STKaiti", "STLiti", "STSong", "STXihei", "STXingkai", "STXinwei", "STZhongsong",
			"FZShuTi", "FZYaoTi", "FZCuHeiSongS-B-GB"
		];

		/** True when the family is known to carry Chinese glyphs. */
		function isKnownCjk(name) {
			for (let i = 0; i < KNOWN_CJK.length; i++) {
				if (KNOWN_CJK[i] === name) return true;
			}
			return false;
		}

		/** Probe fallback: keep only names the engine can actually load. */
		function probeFontList() {			try {
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

		//#region dsh-ui-font: style injection (static rules once, variables only after)
		let styleEl = null;
		/** The CSS variables the plugin owns (cleared on teardown). */
		const FONT_VARS = [
			"--dsh-font-sans",
			"--dsh-font-code",
			"--dsh-font-zoom",
			"--dsh-font-lh",
			"--dsh-font-smooth",
			"--dsh-font-lig"
		];

		/** Inject the static rulesheet once (it only references CSS variables). */
		function ensureStyle() {
			if (styleEl !== null && document.head.contains(styleEl)) return;
			styleEl = document.createElement("style");
			styleEl.setAttribute("data-plugin", "dsh-ui-font");
			styleEl.textContent =
				"html[data-dsh-ui-font]{--ds-font-family-code:var(--dsh-font-code)!important;--dsw-font-family:var(--dsh-font-sans)!important;" +
				"--dsw-font-markdown-base-font-family:var(--dsh-font-sans)!important;--dsw-font-markdown-base-strong-font-family:var(--dsh-font-sans)!important;" +
				"--dsw-font-markdown-base-italic-font-family:var(--dsh-font-sans)!important;--dsw-font-markdown-base-strong-italic-font-family:var(--dsh-font-sans)!important;" +
				"--dsw-font-markdown-h1-font-family:var(--dsh-font-sans)!important;--dsw-font-markdown-h2-font-family:var(--dsh-font-sans)!important;" +
				"--dsw-font-markdown-h3-font-family:var(--dsh-font-sans)!important;--dsw-font-markdown-h4-font-family:var(--dsh-font-sans)!important;" +
				"--dsw-font-markdown-small-font-family:var(--dsh-font-sans)!important;--dsw-font-markdown-small-strong-font-family:var(--dsh-font-sans)!important;" +
				"--dsw-font-markdown-small-italic-font-family:var(--dsh-font-sans)!important;--dsw-font-markdown-small-strong-italic-font-family:var(--dsh-font-sans)!important;" +
				"--dsw-font-markdown-table-font-family:var(--dsh-font-sans)!important;--dsw-font-markdown-table-head-font-family:var(--dsh-font-sans)!important;" +
				"--dsw-font-markdown-code-font-family:var(--dsh-font-code)!important;--dsw-font-markdown-code-block-font-family:var(--dsh-font-code)!important;" +
				"--dsw-font-markdown-code-block-small-font-family:var(--dsh-font-code)!important;}" +
				"html[data-dsh-ui-font] body{font-family:var(--dsh-font-sans);-webkit-font-smoothing:var(--dsh-font-smooth);}" +
				"html[data-dsh-ui-font][data-dsh-input-follow] input,html[data-dsh-ui-font][data-dsh-input-follow] textarea{font-family:var(--dsh-font-sans);}" +
				"html[data-dsh-ui-font] [data-chat-flow]{line-height:var(--dsh-font-lh);}" +
				"html[data-dsh-ui-font] [class*=\"Sxvs8a_root\"],html[data-dsh-ui-font] [class*=\"Sxvs8a_root\"] p," +
				"html[data-dsh-ui-font] [class*=\"Sxvs8a_root\"] strong,html[data-dsh-ui-font] [class*=\"Sxvs8a_root\"] em," +
				"html[data-dsh-ui-font] [class*=\"Sxvs8a_root\"] h1,html[data-dsh-ui-font] [class*=\"Sxvs8a_root\"] h2," +
				"html[data-dsh-ui-font] [class*=\"Sxvs8a_root\"] h3,html[data-dsh-ui-font] [class*=\"Sxvs8a_root\"] h4," +
				"html[data-dsh-ui-font] [class*=\"Sxvs8a_root\"] li,html[data-dsh-ui-font] [class*=\"Sxvs8a_root\"] blockquote," +
				"html[data-dsh-ui-font] [class*=\"Sxvs8a_root\"] td,html[data-dsh-ui-font] [class*=\"Sxvs8a_root\"] th," +
				"html[data-dsh-ui-font] [class*=\"Sxvs8a_root\"] a,html[data-dsh-ui-font] [class*=\"Sxvs8a_root\"] span," +
				"html[data-dsh-ui-font] [class*=\"Sxvs8a_root\"] ul,html[data-dsh-ui-font] [class*=\"Sxvs8a_root\"] ol{font-family:var(--dsh-font-sans);}" +
				"html[data-dsh-ui-font] code,html[data-dsh-ui-font] pre,html[data-dsh-ui-font] [class*=\"_codeBlock\"],html[data-dsh-ui-font] [class*=\"_inlineCode\"]{font-family:var(--dsh-font-code);font-variant-ligatures:var(--dsh-font-lig);}";
			document.head.appendChild(styleEl);
			document.documentElement.setAttribute("data-dsh-ui-font", "");
		}

		/** Apply the config by updating CSS variables only (no stylesheet rebuild). */
		function applyStyles(config) {
			ensureStyle();
			const root = document.documentElement;
			root.style.setProperty("--dsh-font-sans", resolveStack("sans", config.sans, FALLBACK_SANS));
			root.style.setProperty("--dsh-font-code", resolveStack("code", config.code, FALLBACK_CODE));
			root.style.setProperty("--dsh-font-lh", String(config.lineHeight));
			root.style.setProperty("--dsh-font-smooth", config.smoothing ? "antialiased" : "auto");
			root.style.setProperty("--dsh-font-lig", config.ligatures ? "normal" : "none");
			// zoom is applied via body.style only when it deviates from 100%:
			// at the default 100% the body carries NO zoom at all, ruling out any
			// zoom-related textarea caret/layout artifacts at the default value.
			if (config.zoom === DEFAULTS.zoom) document.body.style.zoom = "";
			else document.body.style.zoom = (config.zoom / 100).toFixed(3);
			// input font follow switch: when on, textareas/inputs pick up the sans font.
			// Forcing a font-family round-trip makes the engine recompute the caret
			// metrics against the applied font (avoids a caret that lags behind the
			// rendered glyphs, which grows worse toward the end of the input).
			if (config.followInput) root.setAttribute("data-dsh-input-follow", "");
			else root.removeAttribute("data-dsh-input-follow");
			try {
				document.querySelectorAll("textarea, input").forEach((el) => {
					const prev = el.style.fontFamily;
					el.style.fontFamily = "inherit";
					void el.offsetWidth;
					el.style.fontFamily = prev;
				});
			} catch { /* best-effort caret refresh */ }
		}

		/** Remove every injected rule, the html marker and the inline variables. */
		function removeStyles() {
			if (styleEl !== null) {
				styleEl.remove();
				styleEl = null;
			}
			const root = document.documentElement;
			root.removeAttribute("data-dsh-ui-font");
			for (let i = 0; i < FONT_VARS.length; i++) root.style.removeProperty(FONT_VARS[i]);
			document.body.style.zoom = "";
		}
		//#endregion

		//#region dsh-ui-font: settings row store
		/** Row slot store mirroring the current config (single writer: apply). */
		function createFontStore() {
			return (0, _runtime_client.defineStore)({
				init: () => ({
					sans: DEFAULTS.sans,
					code: DEFAULTS.code,
					zoom: DEFAULTS.zoom,
					lineHeight: DEFAULTS.lineHeight,
					smoothing: DEFAULTS.smoothing,
					ligatures: DEFAULTS.ligatures,
					followInput: DEFAULTS.followInput,
					revision: -1
				}),
				actions: {
					sync: (d, cfg) => {
						if (cfg.revision <= d.revision) return;
						d.sans = cfg.sans;
						d.code = cfg.code;
						d.zoom = cfg.zoom;
						d.lineHeight = cfg.lineHeight;
						d.smoothing = cfg.smoothing;
						d.ligatures = cfg.ligatures;
						d.followInput = cfg.followInput;
						d.revision = cfg.revision;
					}
				}
			});
		}
		//#endregion

		//#region dsh-ui-font: settings rows UI
		/** Inline styles for the rows (dependency-free, mirrors dream-skin). */
		const styles = {
			group: {
				borderBottom: "1px solid var(--dsw-alias-border-l2)",
				display: "flex",
				flexDirection: "column",
				gap: "10px",
				padding: "16px 0"
			},
			title: {
				color: "var(--dsw-alias-label-primary)",
				fontSize: "14px",
				fontWeight: 400,
				lineHeight: "22px"
			},
			hint: {
				color: "var(--dsw-alias-label-tertiary)",
				fontSize: "12px",
				lineHeight: "18px"
			},
			row: {
				display: "flex",
				alignItems: "center",
				gap: "10px",
				flexWrap: "wrap"
			},
			select: {
				flex: 1,
				minWidth: "180px",
				height: "32px",
				padding: "0 10px",
				borderRadius: "8px",
				border: "1px solid var(--dsw-alias-border-l2)",
				background: "var(--dsw-alias-bg-layer-1)",
				color: "var(--dsw-alias-label-primary)",
				font: "inherit",
				fontSize: "13px",
				boxSizing: "border-box"
			},
			input: {
				flex: 1,
				minWidth: "160px",
				height: "32px",
				padding: "0 10px",
				borderRadius: "8px",
				border: "1px solid var(--dsw-alias-border-l2)",
				background: "var(--dsw-alias-bg-layer-1)",
				color: "var(--dsw-alias-label-primary)",
				font: "inherit",
				fontSize: "13px",
				boxSizing: "border-box"
			},
			button: {
				height: "32px",
				padding: "0 14px",
				borderRadius: "8px",
				border: "1px solid var(--dsw-alias-border-l2)",
				background: "var(--dsw-alias-button-elevated-fill)",
				color: "var(--dsw-alias-label-primary)",
				cursor: "pointer",
				fontSize: "13px",
				font: "inherit",
				boxSizing: "border-box"
			},
			buttonDanger: {
				color: "var(--dsw-alias-state-error-primary)"
			},
			sliderRow: {
				display: "flex",
				alignItems: "center",
				gap: "10px",
				minWidth: "240px"
			},
			sliderLabel: {
				color: "var(--dsw-alias-label-secondary)",
				fontSize: "13px",
				whiteSpace: "nowrap",
				width: "92px"
			},
			slider: {
				flex: 1,
				accentColor: "var(--dsw-alias-brand-primary)"
			},
			sliderValue: {
				color: "var(--dsw-alias-label-secondary)",
				fontSize: "12px",
				whiteSpace: "nowrap",
				width: "52px",
				textAlign: "right"
			},
			checkboxRow: {
				display: "flex",
				alignItems: "center",
				gap: "8px"
			},
			checkbox: {
				accentColor: "var(--dsw-alias-brand-primary)",
				width: "16px",
				height: "16px"
			},
			preview: {
				border: "1px solid var(--dsw-alias-border-l2)",
				borderRadius: "10px",
				padding: "12px 14px",
				display: "flex",
				flexDirection: "column",
				gap: "8px",
				background: "var(--dsw-alias-bg-layer-1)"
			},
			previewBody: {
				fontSize: "14px",
				lineHeight: "1.7",
				color: "var(--dsw-alias-label-primary)"
			},
			previewCode: {
				fontSize: "12px",
				lineHeight: "1.6",
				color: "var(--dsw-alias-label-secondary)",
				whiteSpace: "pre-wrap",
				wordBreak: "break-all"
			},
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
				textOverflow: "ellipsis",
				display: "flex",
				alignItems: "center",
				gap: "6px"
			},
			cardNoCjk: {
				flex: "none",
				fontSize: "10px",
				lineHeight: "14px",
				color: "var(--dsw-alias-state-warning-primary, #b98a2f)",
				border: "1px solid var(--dsw-alias-state-warning-primary, #b98a2f)",
				borderRadius: "6px",
				padding: "0 5px"
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
		};

		/** One labeled slider. */
		function Slider({ label, value, min, max, step, format, onChange }) {
			return (0, react_jsx_runtime.jsxs)("div", {
				style: styles.sliderRow,
				children: [
					(0, react_jsx_runtime.jsx)("span", { style: styles.sliderLabel, children: label }),
					(0, react_jsx_runtime.jsx)("input", {
						type: "range",
						min: min,
						max: max,
						step: step,
						value: value,
						style: styles.slider,
						onChange: (event) => onChange(Number(event.target.value))
					}),
					(0, react_jsx_runtime.jsx)("span", { style: styles.sliderValue, children: format(value) })
				]
			});
		}

		/** Font-family picker: preset dropdown + custom input. */
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
			/** "idle" | "applied" | "invalid" — visible feedback for the Apply button. */
			const [applyState, setApplyState] = (0, _react.useState)("idle");
			const flashApply = (state) => {
				setApplyState(state);
				setTimeout(function () { setApplyState("idle"); }, 1600);
			};
			// Keep the picker in sync when the stored value changes externally (e.g. reset).
			(0, _react.useEffect)(function () {
				const matched = presets.find((p) => p.id === value);
				if (matched !== undefined) setSelectedId(matched.id);
				else if (typeof value === "string" && value !== FOLLOW_SYSTEM && value.length > 0) setSelectedId("custom");
				else setSelectedId(FOLLOW_SYSTEM);
			}, [value]);
			const onSelect = (event) => {
				const id = event.target.value;
				setSelectedId(id);
				if (id === "custom") {
					customInputRef.current?.focus();
					return;
				}
				onChange(id);
			};
			const onApplyCustom = () => {
				const raw = customText.trim();
				if (raw.length === 0) {
					onChange(FOLLOW_SYSTEM);
					flashApply("applied");
					return;
				}
				const cleaned = sanitizeFontStack(raw);
				if (cleaned.length === 0) {
					// visible rejection instead of silently falling back
					flashApply("invalid");
					return;
				}
				onChange(cleaned);
				flashApply("applied");
			};
			const onBrowsePick = (name) => {
				const stack = '"' + name + '"';
				setCustomText(stack);
				onChange(stack);
				if (!isKnownCjk(name)) flashApply("noCjk");
			};
			return (0, react_jsx_runtime.jsxs)("div", {
				style: { ...styles.group, borderBottom: "none", padding: "4px 0", gap: "6px" },
				children: [
					(0, react_jsx_runtime.jsx)("div", { style: styles.title, children: label }),
					(0, react_jsx_runtime.jsxs)("div", {
						style: styles.row,
						children: [
							(0, react_jsx_runtime.jsx)("select", {
								style: styles.select,
								value: selectedId,
								onChange: onSelect,
								children: [
									presets.map((p) => (0, react_jsx_runtime.jsx)("option", { value: p.id, children: p.label }, p.id)),
									(0, react_jsx_runtime.jsx)("option", { value: "custom", children: t("font.custom") })
								]
							}),
							selectedId === "custom" ? (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, {
								children: [
									(0, react_jsx_runtime.jsx)("input", {
										ref: customInputRef,
										type: "text",
										placeholder: t("font.customPlaceholder"),
										style: applyState === "invalid" ? { ...styles.input, borderColor: "var(--dsw-alias-state-error-primary)" } : styles.input,
										value: customText,
										onChange: (e) => setCustomText(e.target.value),
										onKeyDown: (event) => { if (event.key === "Enter") onApplyCustom(); }
									}),
									(0, react_jsx_runtime.jsx)("button", {
										type: "button",
										style: applyState === "applied"
											? { ...styles.button, color: "var(--dsw-alias-state-success-primary, #2e9e5b)" }
											: applyState === "invalid"
												? { ...styles.button, color: "var(--dsw-alias-state-error-primary)" }
												: applyState === "noCjk"
													? { ...styles.button, color: "var(--dsw-alias-state-warning-primary, #b98a2f)" }
													: styles.button,
										onClick: onApplyCustom,
										children: applyState === "applied" ? t("font.applied") : applyState === "invalid" ? t("font.invalid") : applyState === "noCjk" ? t("font.noCjk") : t("font.apply")
									}),
									(0, react_jsx_runtime.jsx)("button", { type: "button", style: styles.button, onClick: () => setBrowserOpen(true), children: t("font.browse") }),
									(0, react_jsx_runtime.jsx)(FontBrowser, {
										open: browserOpen,
										onClose: () => setBrowserOpen(false),
										onPick: onBrowsePick,
										t
									})
								]
							}) : null
						]
					}),
					(0, react_jsx_runtime.jsx)("div", { style: styles.hint, children: hint })
				]
			});
		}

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
												(0, react_jsx_runtime.jsx)("div", {
													style: styles.modalCardName,
													children: [
														(0, react_jsx_runtime.jsx)("span", { style: { overflow: "hidden", textOverflow: "ellipsis" }, children: name }),
														isKnownCjk(name) ? null : (0, react_jsx_runtime.jsx)("span", { style: styles.cardNoCjk, children: t("font.noCjkTag") })
													]
												}),
												(0, react_jsx_runtime.jsx)("div", { style: { ...styles.modalCardSample, fontFamily: '"' + name + '"' }, children: name + " — 你好世界 Hello 0123" })
											]
										}, name))
									})
						})
					]
				})
			});
		}

		/** The full "Fonts" settings row. */
		function FontRow({ t, setSans, setCode, setZoom, setLineHeight, setSmoothing, setLigatures, setFollowInput, resetAll, useStore }) {
			const sans = useStore((s) => s.sans);
			const code = useStore((s) => s.code);
			const zoom = useStore((s) => s.zoom);
			const lineHeight = useStore((s) => s.lineHeight);
			const smoothing = useStore((s) => s.smoothing);
			const ligatures = useStore((s) => s.ligatures);
			const followInput = useStore((s) => s.followInput);
			const previewSans = resolveStack("sans", sans, FALLBACK_SANS);
			const previewCode = resolveStack("code", code, FALLBACK_CODE);
			const previewZoom = (zoom / 100).toFixed(3);
			return (0, react_jsx_runtime.jsxs)("div", {
				style: styles.group,
				children: [
					(0, react_jsx_runtime.jsx)("div", { style: styles.title, children: t("font.title") }),
					(0, react_jsx_runtime.jsx)("div", { style: styles.hint, children: t("font.desc") }),
					(0, react_jsx_runtime.jsx)(FontPicker, {
						label: t("font.sans"),
						hint: t("font.sansHint"),
						presets: SANS_PRESETS,
						value: sans,
						onChange: (v) => setSans(v),
						t
					}),
					(0, react_jsx_runtime.jsx)(FontPicker, {
						label: t("font.code"),
						hint: t("font.codeHint"),
						presets: MONO_PRESETS,
						value: code,
						onChange: (v) => setCode(v),
						t
					}),
					(0, react_jsx_runtime.jsx)(Slider, {
						label: t("font.zoom"),
						value: zoom,
						min: ZOOM_MIN,
						max: ZOOM_MAX,
						step: 1,
						format: (v) => v + "%",
						onChange: (v) => setZoom(v)
					}),
					(0, react_jsx_runtime.jsx)("div", { style: styles.hint, children: t("font.zoomHint") }),
					(0, react_jsx_runtime.jsx)(Slider, {
						label: t("font.lineHeight"),
						value: lineHeight,
						min: LH_MIN,
						max: LH_MAX,
						step: 0.05,
						format: (v) => v.toFixed(2),
						onChange: (v) => setLineHeight(v)
					}),
					(0, react_jsx_runtime.jsx)("div", { style: styles.hint, children: t("font.lineHeightHint") }),
					(0, react_jsx_runtime.jsxs)("div", {
						style: styles.checkboxRow,
						children: [
							(0, react_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: smoothing,
								style: styles.checkbox,
								onChange: (event) => setSmoothing(event.target.checked)
							}),
							(0, react_jsx_runtime.jsx)("span", { style: { color: "var(--dsw-alias-label-secondary)", fontSize: "13px" }, children: t("font.smoothing") }),
							(0, react_jsx_runtime.jsx)("span", { style: styles.hint, children: t("font.smoothingHint") })
						]
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						style: styles.checkboxRow,
						children: [
							(0, react_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: ligatures,
								style: styles.checkbox,
								onChange: (event) => setLigatures(event.target.checked)
							}),
							(0, react_jsx_runtime.jsx)("span", { style: { color: "var(--dsw-alias-label-secondary)", fontSize: "13px" }, children: t("font.ligatures") }),
							(0, react_jsx_runtime.jsx)("span", { style: styles.hint, children: t("font.ligaturesHint") })
						]
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						style: styles.checkboxRow,
						children: [
							(0, react_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: followInput,
								style: styles.checkbox,
								onChange: (event) => setFollowInput(event.target.checked)
							}),
							(0, react_jsx_runtime.jsx)("span", { style: { color: "var(--dsw-alias-label-secondary)", fontSize: "13px" }, children: t("font.followInput") }),
							(0, react_jsx_runtime.jsx)("span", { style: styles.hint, children: t("font.followInputHint") })
						]
					}),
					(0, react_jsx_runtime.jsx)("div", { style: styles.title, children: t("font.preview") }),
					(0, react_jsx_runtime.jsx)("div", {
						style: styles.preview,
						children: [
							(0, react_jsx_runtime.jsx)("div", { style: { ...styles.previewBody, fontFamily: previewSans, zoom: previewZoom }, children: t("font.previewBody") }),
							(0, react_jsx_runtime.jsx)("div", { style: { ...styles.previewCode, fontFamily: previewCode, fontVariantLigatures: ligatures ? "normal" : "none" }, children: t("font.previewCode") })
						]
					}),
					(0, react_jsx_runtime.jsx)("button", {
						type: "button",
						style: { ...styles.button, ...styles.buttonDanger },
						onClick: () => resetAll(),
						children: t("font.reset")
					}),
					(0, react_jsx_runtime.jsx)("div", { style: styles.hint, children: t("font.resetHint") })
				]
			});
		}

		/** The settings section wrapper hosting the row (left-nav category). */
		function FontSection({ renderSlot }) {
			return (0, react_jsx_runtime.jsx)("div", {
				style: { display: "flex", flexDirection: "column", width: "100%" },
				children: renderSlot("settings.dshUiFont.item", {})
			});
		}
		//#endregion

		//#region dsh-ui-font: client plugin body
		/** Required services: slots (settings surfaces) + locale.
		 * NOTE: "runtime" was removed — DSH rc.6 no longer provides a cordis
		 * service named "runtime" (dsh-client-runtime was refactored to provide
		 * slots/conversationEvents/conversationViews). The apply() body never
		 * used ctx.runtime, so dropping the declaration is safe. */
		const inject = [
			"slots",
			"locale"
		];

		/**
		 * Client plugin body. Registers the "字体 / Fonts" settings section and
		 * wires config → style injection. Top-level try/catch guarantees the
		 * plugin can never break the UI, even on unforeseen errors.
		 * @param ctx - client cordis context.
		 */
		function apply(ctx) {
			try {
				const store = createFontStore();
				let bound = null;
				let revision = 0;

				/** Re-apply styles from storage and push the new state into the store. */
				const applyConfig = () => {
					const config = readConfig();
					applyStyles(config);
					bound?.sync({ ...config, revision: ++revision });
				};

				applyConfig();
				ctx.effect(() => () => {
					removeStyles();
				}, "dsh-ui-font: style cleanup");

				ctx.effect(() => ctx.locale.register(SETTINGS_NS, {
					zh,
					en
				}), "dsh-ui-font: settings row dictionaries");

				// Register the "字体 / Fonts" section in the settings left nav.
				ctx.slots.inject("settings.section", () => ctx.slots.register({
					name: "settings.section",
					id: "dsh-ui-font",
					order: 20,
					label: "字体 / Font",
					locale: SETTINGS_NS,
					children: { "settings.dshUiFont.item": {
						kind: "list",
						scope: "root"
					} }
				}, FontSection));

				// Register the settings row with all actions.
				const fontInjected = (actions) => {
					bound = actions;
					applyConfig();
					return {
						setSans: (value) => {
							write("sans", value === FOLLOW_SYSTEM ? null : value);
							applyConfig();
						},
						setCode: (value) => {
							write("code", value === FOLLOW_SYSTEM ? null : value);
							applyConfig();
						},
						setZoom: (value) => {
							write("zoom", String(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(value)))));
							applyConfig();
						},
						setLineHeight: (value) => {
							write("lineHeight", String(Math.min(LH_MAX, Math.max(LH_MIN, value))));
							applyConfig();
						},
						setSmoothing: (on) => {
							write("smoothing", on ? "true" : "false");
							applyConfig();
						},
						setLigatures: (on) => {
							write("ligatures", on ? "true" : "false");
							applyConfig();
						},
						setFollowInput: (on) => {
							write("followInput", on ? "true" : "false");
							applyConfig();
						},
						resetAll: () => {
							for (const key of Object.keys(DEFAULTS)) write(key, null);
							applyConfig();
						}
					};
				};
				ctx.slots.inject("settings.dshUiFont.item", () => ctx.slots.register({
					name: "settings.dshUiFont.item",
					id: "dsh-ui-font-row",
					order: 10,
					store: store,
					locale: SETTINGS_NS,
					inject: fontInjected
				}, FontRow));
			} catch (err) {
				try {
					// eslint-disable-next-line no-console
					console.error("[dsh-ui-font] failed to start:", err);
					window.__dshUiFontError = String(err && err.message ? err.message : err);
				} catch {
					// nothing else we can do — the UI stays intact
				}
			}
		}
		//#endregion

		exports.SETTINGS_NS = SETTINGS_NS;
		exports.DEFAULTS = DEFAULTS;
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
