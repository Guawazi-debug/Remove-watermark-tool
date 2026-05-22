# 视频解析工具 - 微信小程序

一款基于微信小程序的视频解析下载工具，支持主流短视频平台，粘贴分享链接即可在线播放和下载视频。

## 功能特性

- **智能链接提取**：自动从分享文本中识别和提取视频链接
- **一键粘贴解析**：读取剪贴板内容，自动填入并解析
- **在线视频播放**：解析后直接在小程序内播放视频，支持全屏、进度拖拽、暂停/播放
- **保存到相册**：支持将视频直接保存到手机相册
- **智能降级**：保存失败时自动复制链接到剪贴板，引导浏览器下载
- **使用引导**：内置三步操作指引，用户上手无门槛

## 技术栈

- 微信小程序原生开发
- WXML + WXSS + JavaScript
- 自定义导航栏组件（navigation-bar）

## 项目结构

```
├── app.js                          # 小程序入口
├── app.json                        # 全局配置
├── app.wxss                        # 全局样式
├── project.config.json             # 项目配置
├── sitemap.json                    # 站点地图
├── components/
│   └── navigation-bar/             # 自定义导航栏组件
│       ├── navigation-bar.js
│       ├── navigation-bar.json
│       ├── navigation-bar.wxml
│       └── navigation-bar.wxss
└── pages/
    └── index/                      # 主页面（视频解析）
        ├── index.js                # 页面逻辑
        ├── index.json              # 页面配置
        ├── index.wxml              # 页面模板
        └── index.wxss              # 页面样式
```

## 使用方法

### 前置条件

- 微信开发者工具
- 微信小程序 AppID

### 本地运行

1. 克隆项目
   ```bash
   git clone git@github.com:Guawazi-debug/Remove-watermark-tool.git
   ```

2. 在微信开发者工具中导入项目目录

3. 开始开发和调试

### 接口配置

项目使用外部视频解析接口，默认地址为 `https://qsy.awenz.cn/api.php`。如需更换，在 `pages/index/index.js` 中修改 `PARSE_API` 常量。

接口调用方式：
```
GET https://qsy.awenz.cn/api.php?url=视频链接
```

接口返回格式：
```json
{
  "code": 200,
  "msg": "解析成功",
  "data": {
    "title": "视频标题",
    "cover": "封面图URL",
    "video": "视频下载URL",
    "type": "video"
  }
}
```

### 发布上线

1. 在微信公众平台后台配置服务器域名（request 合法域名）
2. 在微信开发者工具中点击「上传」
3. 在微信公众平台提交审核并发布

## 注意事项

- 视频下载功能受微信小程序域名白名单限制，第三方视频源可能无法直接下载，会自动降级为复制链接方案
- 真机调试时需在开发者工具中勾选「不校验合法域名」
- 发布前需在微信公众平台配置合法域名

## 版本记录

### v1.0.0

- 初始版本发布
- 视频链接解析功能
- 在线视频播放
- 保存到相册（含降级方案）
- 智能链接提取
- 自定义导航栏
- 使用引导提示

## 许可证

MIT License
