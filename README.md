# 言寺日程

言寺日程是一个本地优先的中文日程管理应用，采用温暖纸张质感的日历界面，支持周视图、月视图、模板、配色、数据导入导出，以及 Tauri 2 桌面端和 Android 移动端封装。

## 功能特点

- 周视图：课程表式日程布局，支持按时间段查看安排。
- 月视图：整月日历网格，单日安排过多时可在单元格内滚动查看。
- 日程管理：新增、编辑、删除日程，支持标题、日期、开始/结束时间、颜色和备注。
- 时间冲突检测：同一天重叠时间段会被阻止保存。
- 模板管理：可保存常用日程模板，快速复用。
- 自定义配色：支持预设颜色和自定义 HEX 颜色。
- 本地存储：数据保存在浏览器本地存储中，刷新后保留。
- 数据管理：支持导入、导出和清空本地数据。
- 移动端适配：小屏幕使用紧凑顶部栏、底部快捷操作和居中管理浮窗。
- 沉浸式状态栏：Android 端预留顶部安全区，避免内容和状态栏重叠。

## 技术栈

- Vue 3
- Vite
- Pinia
- Vue Router
- Day.js
- Tailwind CSS
- Tauri 2

## 开发环境

建议使用 Node.js 20 或更高版本。

桌面端打包还需要安装 Rust 与 Tauri 2 所需的 Windows 构建环境。Windows 推荐安装 Microsoft Visual Studio Build Tools，并勾选 C++ 桌面开发工具链。

Android 打包需要 Android SDK、NDK、JDK 和 Rust Android target。当前 Windows 环境中如果命令行未继承用户环境变量，可以在同一个 PowerShell 会话中临时加载：

```powershell
$env:ANDROID_HOME=[Environment]::GetEnvironmentVariable('ANDROID_HOME','User')
$env:NDK_HOME=[Environment]::GetEnvironmentVariable('NDK_HOME','User')
```

安装依赖：

```bash
npm install
```

启动开发服务器：

```bash
npm run dev
```

构建生产版本：

```bash
npm run build
```

本地预览构建产物：

```bash
npm run preview
```

启动 Tauri 桌面开发模式：

```bash
npm run tauri:dev
```

启动 Tauri Android 开发模式：

```bash
npm run tauri:android:dev
```

构建桌面端安装包：

```bash
npm run tauri:build
```

构建 Android 安装包：

```bash
npm run tauri:android:build
```

调试构建可使用：

```bash
npx tauri build --debug
```

常用发版产物位置：

```text
src-tauri/target/release/言寺日程.exe
src-tauri/target/release/bundle/msi/言寺日程_0.1.0_x64_en-US.msi
src-tauri/target/release/bundle/nsis/言寺日程_0.1.0_x64-setup.exe
src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release.apk
src-tauri/gen/android/app/build/outputs/bundle/universalRelease/app-universal-release.aab
```

Tauri 2 支持移动端封装。当前仓库已配置 Android Gradle 工程，并保留 Windows 桌面端构建流程。

## 项目结构

```text
src/
  components/
    calendar/      # 周视图、月视图、工具栏
    schedule/      # 日程编辑与批量创建弹窗
  stores/          # Pinia 状态管理
  styles/          # 全局样式
  utils/           # 日期、日历布局、存储工具
  views/           # 页面视图
public/            # Chrome 扩展清单与后台脚本
src-tauri/          # Tauri 桌面端和 Android 端封装配置
```

## 使用说明

1. 在顶部工具栏切换周视图或月视图。
2. 单击日期可选中当天，并查看当天日程列表。
3. 双击月视图日期或点击周视图空白时间段可创建日程。
4. 点击已有日程可打开编辑弹窗。
5. 桌面端可在侧栏管理模板、配色和本地数据。
6. 移动端点击顶部 `⋯ 管理` 打开居中管理浮窗，进入色签、模板和数据管理。

## 数据说明

应用以本地优先方式运行，日程、模板和配色数据保存在浏览器本地存储中。导出数据后可在其他浏览器或设备中导入恢复。

在 Chrome 扩展环境中，日程接口优先使用 `chrome.storage.local`。在 Tauri 或普通 WebView 环境中，会自动回退到 `localStorage`。

## 仓库

```text
git@github.com:2656172491/Yansi-schedule.git
```
