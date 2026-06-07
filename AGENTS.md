# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## 项目概述

微信小程序项目，使用 Skyline 渲染引擎 + glass-easel 组件框架，自定义导航栏（navigationStyle: "custom"）。

## 开发工具

- **微信开发者工具**：本项目无法通过命令行构建/运行，必须使用[微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)导入项目进行开发和调试
- **AppID**：在 project.config.json 中配置（需自行填入，不要提交到公开仓库）
- **ESLint**：已配置 .eslintrc.js，规则较宽松，主要声明了 wx/App/Page/Component 等小程序全局变量

## 项目结构

```
app.js / app.json / app.wxss    — 小程序入口和全局配置
pages/index/                     — 首页（当前唯一页面）
components/navigation-bar/       — 自定义导航栏组件（支持返回/首页按钮、loading状态、安全区适配）
```

## 关键技术点

- **渲染引擎**：Skyline（非默认 WebView），配置在 app.json 的 renderer 字段
- **组件框架**：glass-easel，通过 componentFramework 字段指定
- **自定义导航栏**：navigationStyle 设为 "custom"，需自行处理状态栏高度和胶囊按钮位置对齐（见 navigation-bar.js 中 getMenuButtonBoundingClientRect 逻辑）
- **样式隔离**：navigation-bar 组件使用 `styleIsolation: "apply-shared"`
- **懒加载**：app.json 中启用了 `lazyCodeLoading: "requiredComponents"`

## 四文件规范

每个页面/组件由四个文件组成：
- `.js` — 逻辑（Page/Component 构造器）
- `.wxml` — 模板（类似 HTML，支持 wx:if/wx:for 等指令）
- `.wxss` — 样式（类似 CSS，支持 rpx 响应式单位）
- `.json` — 配置（页面/组件级配置，如 usingComponents）

## 注意事项

- 新增页面需在 app.json 的 pages 数组中注册
- 新增组件需在页面 json 的 usingComponents 中声明
- Skyline 渲染引擎对部分 WebView API 有限制，使用前查阅微信文档确认兼容性
- 样式使用 rpx 单位以适配不同屏幕尺寸
