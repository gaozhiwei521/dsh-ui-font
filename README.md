# dsh-ui-font — DSH 字体插件 | DSH Font Plugin

> **English**: A client plugin that restyles the whole DSH UI — UI/code fonts, display scale, line-height, font smoothing, code ligatures, and a font browser with CJK glyph marking (Settings → Fonts).

> **中文**: 修改整个 DSH 界面文字显示效果的客户端插件（设置 → 字体 / Fonts）。

## 功能

- **正文字体**：预设（微软雅黑 / 苹方 / 等线 / 思源黑体 / 更纱黑体 / 思源宋体 / 霞鹜文楷 / HarmonyOS Sans / MiSans）或自定义字体栈
- **代码字体**：预设（Cascadia Code / Consolas / JetBrains Mono / Fira Code / 更纱等宽 SC / Maple Mono / Maple Mono NF）或自定义
- **显示比例**：80–130% 等比缩放（`zoom`，默认 100% = 无变化）
- **聊天区行高**：1.3–2.0
- **字体平滑**：抗锯齿开关
- **代码连字**：`font-variant-ligatures`
- **字体浏览器**：自定义字体时可打开子窗口，以列表形式展示本机所有已安装字体（每项用自身字形预览），点击即应用；枚举失败时自动降级为常见字体名单
- **中文字形标记**：字体浏览器中无中文字形的字体带「英文」角标，选择时会提示，避免中文显示回退
- **应用反馈**：应用按钮显示「已应用 ✓ / 无效输入 / ⚠ 无中文字形」，不再静默失败
- **输入框字体跟随开关**：默认关闭（避免输入法组合时光标错位）；开启后输入框使用正文字体
- **markdown 全覆盖**：智能体回复的正文、标题、列表、表格、链接等全部跟随正文字体（代码块保持等宽字体）
- **实时预览 + 恢复默认**

所有设置存浏览器 `localStorage`（`dsh-ui-font:*`），刷新保持。

## 架构

- `lib/client.js` — 浏览器端：设置分类注册 + 样式注入（静态规则一次注入，之后仅更新 CSS 变量，避免高频重建）
- `lib/index.js` — 宿主端空实现（纯客户端插件）
- `cordis.patch.yml` — bundle patch：把插件注册进 loader（`insert`），供 dsh-client-modules 发现 client bundle
- `package.json` — `dsh.bundle.patch` + `dsh.client` 声明

### 关键约定（与 DSH rc.6 匹配）

- `exports.inject` 只用 `["slots", "locale"]`——**不要声明 `runtime`**（rc.6 已无该 cordis 服务，声明会导致 pending 卡界面）
- 设置分类 id：`dsh-ui-font`；槽位 `settings.dshUiFont.item`；localStorage 前缀 `dsh-ui-font:`
- 行组件 props 用**展开式**（`setSans/setCode/...` 直接作 props），不要用 `actions.xxx` 对象

## 安装

### 官方快捷安装（推荐）

使用 DSH 自带插件命令，从 GitHub 直接安装：

```powershell
dsh plugin add github:linshufan21/dsh-ui-font
```

然后编辑 profile 的 `package.json`（`%USERPROFILE%\.dsh\profiles\web\package.json`），在 `dsh.profile.bundles` 追加 `"dsh-ui-font"`，重启 DSH（关窗口重开）→ 设置出现"字体"。

### 本地开发安装

```powershell
cd $env:USERPROFILE\.dsh\profiles\web
pnpm add "file:E:\deepseekwork1\dsh-ui-font"
# 然后编辑 package.json 的 dsh.profile.bundles 追加 "dsh-ui-font"
# 重启 DSH（关窗口重开）→ 设置出现"字体"
```

> 提示：Git 托管的插件若含构建脚本，pnpm 默认阻止 `prepare`——需要在 profile 的 `pnpm-workspace.yaml` 的 `allowBuilds` 里放行对应包（本插件无构建脚本，无需处理）。

## 社区

- 官方仓库：[deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness)（Everything is a Plugin，可 Star / Issues / Discussions / PR）
- 插件聚合：[Oh-My-DSH](https://github.com/like-study1/Oh-My-DSH)（DSH 插件目录，可投稿）
- 插件市场与最佳实践：[dshfind](https://github.com/hikariming/dshfind)
- 资源列表：[awesome-deepseek-harness](https://github.com/fendouai/awesome-deepseek-harness) / [awesome-dsh-plugin](https://github.com/beancookie/awesome-dsh-plugin)

## 开发与同步

改动 `lib/client.js` 后，运行同步脚本把文件复制到已安装副本并校验：

```powershell
powershell -ExecutionPolicy Bypass -File E:\deepseekwork1\_工具脚本\sync-dsh-ui-font.ps1
```

然后 DSH 窗口 **Ctrl+F5 强刷**（bundle rev 动态计算，无需重启后端）。

## 已知限制

- 开启「输入框字体跟随」后，中文输入法组合阶段（拼音未确认）可能因 Chromium 内核限制出现光标错位——默认关闭即可避免，正文显示不受影响
- `zoom`（显示比例）仅在非 100% 时应用，默认不注入，不影响默认状态
- 代码区选择器依赖 hash 类名（`_codeBlock` 等），DSH 大版本升级后可能失效（正文仍生效）
- 字体枚举优先使用浏览器 Local Font Access API；若宿主拒绝权限则降级为内置常见字体名单探测，此时新安装的字体可能不出现，可直接手动输入字体名
- 自定义字体栈已做防注入过滤（拒绝 `; { } ( ) < >`、限长 300）

## 卸载

```powershell
cd $env:USERPROFILE\.dsh\profiles\web
pnpm remove dsh-ui-font   # 并手动从 package.json bundles 移除
```
