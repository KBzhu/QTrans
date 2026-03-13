# TransWebService 项目架构分析

## 一、项目概述

这是大型微服务项目中的**文件传输Web服务**，基于华为内部的 Jalor5 框架（Spring Boot 二开）开发。项目采用**前后端不分离**的架构，前端页面嵌入在 Spring Boot 服务中。

**基础信息：**
- 应用名称: etrans
- 子应用ID: TransWebService
- 上下文路径: `/transWeb`
- 默认端口: HTTP 5110 / HTTPS 8110

---

## 二、整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    TransWebService 服务                       │
│  上下文路径: /transWeb  端口: HTTP 5110 / HTTPS 8110         │
├─────────────────────────────────────────────────────────────┤
│  前端层                        │  后端层                      │
│  ┌─────────────────────┐      │  ┌─────────────────────┐    │
│  │ FreeMarker模板引擎   │      │  │ Controller层        │    │
│  │ views/*.html        │◄─────┤  │ - ValidPage         │    │
│  │ web/js/*.js         │      │  │ - UploadPage        │    │
│  │ web/css/*.css       │      │  │ - DownloadPage      │    │
│  │ (Vue + Element UI)  │      │  │ - UploadPageRest    │    │
│  └─────────────────────┘      │  └─────────────────────┘    │
│                               │                             │
│                               │  ┌─────────────────────┐    │
│                               │  │ Domain/Service层    │    │
│                               │  │ - ValidHelper       │    │
│                               │  │ - UploadUtils       │    │
│                               │  └─────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## 三、目录结构

```
d:/VibeCoding/TransWebService/
├── src/main/java/com/awei.it.etrans.transwebservice/
│   ├── TransWebServiceApplication.java          # 启动类
│   ├── interfaces/contrller/                    # 控制器层
│   │   ├── ValidPageController.java             # 验证入口控制器
│   │   ├── UploadPageController.java            # 上传页面控制器
│   │   ├── DownloadPageController               # 下载页面控制器
│   │   ├── UploadPageRestController.java        # 上传REST API控制器
│   │   └── ErrorPageController.java             # 错误页面控制器
│   ├── application.service/                     # 应用服务层
│   ├── domain/                                  # 领域层
│   │   ├── common/                              # 公共组件
│   │   └── uploadAndDownload/                   # 上传下载领域
│   │       └── validator/ValidHelper            # 核心验证工具类
│   └── infrastructure/                          # 基础设施层
│       ├── config/                              # 配置类
│       ├── exception/                           # 自定义异常
│       └── filter/                              # 过滤器
│
└── src/main/resources/
    ├── application.properties                   # 主配置文件
    ├── application-dev.properties               # 开发环境配置
    ├── i18n/                                    # 国际化资源
    ├── views/                                   # HTML视图模板
    │   ├── UploadPage.html                      # 上传页面
    │   └── CommonPages.html                     # 公共页面
    └── web/                                     # 静态资源
        ├── css/                                 # 样式文件
        ├── images/                              # 图片资源
        └── js/                                  # JavaScript文件
            ├── UploadPage.js                    # 上传页面逻辑
            ├── DownloadPage.js                  # 下载页面逻辑
            ├── fine-uploader.js                 # 文件上传组件
            ├── crypto-js.js                     # 加密库
            └── ssopopup.js                      # SSO弹窗
```

---

## 四、控制器层详细分析

### 1. 页面控制器（返回HTML视图）

| 控制器 | 路由 | 功能 | 返回值 |
|--------|------|------|--------|
| `ValidPageController` | `GET /valid?params=xxx&lang=xxx` | 入口验证，解密params后重定向 | `redirect:/UploadPage` 或 `redirect:/DownloadPage` |
| `UploadPageController` | `GET /UploadPage?params=xxx&lang=xxx` | 上传页面渲染 | `UploadPage.html` (FreeMarker模板) |
| `DownloadPageController` | `GET /DownloadPage?params=xxx&lang=xxx` | 下载页面渲染 | 下载页面模板 |
| `ErrorPageController` | `/error` | 错误页面 | 错误页面模板 |

### 2. REST控制器（返回JSON）

| 控制器 | 路由 | 功能 | 操作类型 |
|--------|------|------|----------|
| `UploadPageRestController` | `POST /Handler/UploadHandler` | 文件上传处理 | ADD/CANCEL/DELETE/PAUSE/CONTINUE/HASH/COMPLETE |
| 同上 | `POST /agreedPrivacyStatement` | 隐私声明确认 | - |

### 3. 上传接口支持的操作类型

```
POST /Handler/UploadHandler

操作类型（通过 act 参数指定）:
- ADD      - 上传文件
- CANCEL   - 取消上传
- DELETE   - 删除已上传文件
- PAUSE    - 暂停上传
- CONTINUE - 继续上传
- HASH     - 哈希计算
- COMPLETE - 上传确认
```

---

## 五、前端页面数据注入机制

后端通过 **FreeMarker 模板变量** 注入数据到前端页面：

```html
<!-- 隐藏域存储后端注入的数据 -->
<input type="hidden" id="hfToken" value="${token}"/>
<input type="hidden" name="hfMaxSize" id="hfMaxSize" value="${applicationSize}"/>
<input type="hidden" id="blackList" value="${blackList}"/>
<input type="hidden" id="hfHashType" value="${hashType}"/>

<!-- Vue 实例中直接使用模板变量 -->
appInfo: {
    applicationId: ${applicationId},
    w3Account: '${applicantW3Id}'
}
```

**关键数据字段：**

| 字段名 | 说明 |
|--------|------|
| `token` | JWT认证令牌 |
| `applicationId` | 申请单号 |
| `applicantW3Id` | 申请人W3账号 |
| `applicationSize` | 最大存储空间 |
| `blackList` | 文件名黑名单字符 |
| `hashType` | 哈希类型 |
| `privatePolicyUrl` | 隐私政策链接 |
| 多语言文本字段 | `${lblUpload}`, `${lblConfirm}` 等 |

---

## 六、前后端交互流程

```
┌──────────┐     1. 访问 /valid?params=xxx      ┌──────────┐
│  外部系统  │ ───────────────────────────────► │ ValidPage│
│ (Vue工程) │                                    │Controller│
└──────────┘                                    └────┬─────┘
                                                     │
                         2. 解密params，判断transType
                           重定向到 /UploadPage 或 /DownloadPage
                                                     ▼
                                            ┌──────────────┐
                                            │UploadPage    │
                                            │Controller    │
                                            └──────┬───────┘
                                                   │
                     3. 准备页面数据（UploadPageHandler），渲染模板
                                                   ▼
                                            ┌──────────────┐
                                            │ UploadPage   │
                                            │ .html (Vue)  │
                                            └──────┬───────┘
                                                   │
                     4. 前端发起AJAX请求，携带 Authorization: token
                                                   ▼
                                            ┌──────────────┐
                                            │UploadPageRest│
                                            │Controller    │
                                            └──────────────┘
```

---

## 七、认证机制

项目支持两种认证方式：

### 1. SSO 单点登录
- 配置项: `sso.needRedirectPage=*/valid,*/transweb/uploadpage,*/transweb/downloadpage`
- 需要SSO认证的页面会自动重定向到登录页

### 2. JWT Token 认证
- 用于REST API调用
- 前端通过 `Authorization` Header 传递Token
- Token由后端生成，包含用户信息、申请单号等

---

## 八、改造为纯后端服务的可行性分析

### ✅ 已有的REST接口

| 接口 | 用途 |
|------|------|
| `POST /Handler/UploadHandler` | 文件上传核心接口 |
| `POST /agreedPrivacyStatement` | 隐私声明确认 |

### 📝 建议新增的REST接口

| 原页面控制器功能 | 建议新增的REST接口 | 用途 |
|------------------|-------------------|------|
| `/valid` 验证重定向 | `GET /api/valid?params=xxx` | 返回JSON，包含目标页面类型和参数 |
| `/UploadPage` 页面渲染 | `GET /api/upload/init?params=xxx` | 返回页面初始化数据 |
| `/DownloadPage` 页面渲染 | `GET /api/download/init?params=xxx` | 返回页面初始化数据 |
| 文件列表刷新 | `GET /api/files?relativeDir=xxx` | 获取已上传文件列表 |
| 文件删除 | `DELETE /api/files` | 删除已上传文件 |

### ⚠️ 需要注意的问题

1. **SSO认证依赖**
   - 配置中 `sso.needRedirectPage` 指定了需要SSO登入的页面
   - 分离后需要确保Vue工程能正确处理SSO认证流程

2. **模板变量注入**
   - 当前多语言文本（如 `${lblUpload}`）是后端注入的
   - 需要在Vue工程中实现多语言国际化

3. **WebSocket客户端**
   - 前端代码中有 `ws://localhost:9800` WebSocket 连接
   - 这是用于本地客户端上传的，需要确认是否需要保留

---

## 九、建议的改造架构

```
┌────────────────────────────────────────────────────────────┐
│                     改造后的架构                            │
├────────────────────────────────────────────────────────────┤
│  Vue工程 (前端)                  │  TransWebService (后端)  │
│  ┌─────────────────────┐        │  ┌─────────────────────┐│
│  │ 上传/下载页面组件    │        │  │ REST API Controller ││
│  │ - UploadPage.vue    │◄───────┤  │ - /api/upload/*     ││
│  │ - DownloadPage.vue  │  JSON  │  │ - /api/download/*   ││
│  │ - 文件上传组件       │        │  │ - /Handler/*        ││
│  └─────────────────────┘        │  └─────────────────────┘│
│                                 │                         │
│  ┌─────────────────────┐        │  删除/废弃:             │
│  │ 多语言国际化         │        │  - views/*.html        ││
│  │ - i18n 配置         │        │  - web/js/*.js         ││
│  └─────────────────────┘        │  - web/css/*.css       ││
│                                 │  - 页面Controller       ││
└────────────────────────────────────────────────────────────┘
```

---

## 十、待补充信息

以下信息需要进一步确认以完善改造方案：

1. **`UploadPageHandler` 和 `DownloadPageHandler` 类** - 页面数据准备的完整实现
2. **其他页面相关接口** - 文件列表查询、文件删除等Controller
3. **客户端上传逻辑** - WebSocket相关的客户端上传功能是否保留
4. **多语言配置文件** - `i18n/messages*.properties` 用于迁移国际化

---

## 十一、关键配置项

| 配置项 | 值 | 说明 |
|--------|-----|------|
| `server.servlet.context-path` | `/transWeb` | 上下文路径 |
| `server.http.port` | `5110` | HTTP端口 |
| `server.port` | `8110` | HTTPS端口 |
| `etrans.upload.tempDir` | `/data01/uploadsTemp` | 上传临时目录 |
| `etrans.download.relativeDownUrl` | `/DownloadPage` | 下载页面URL |
| `etrans.upload.relativeUploadUrl` | `/UploadPage` | 上传页面URL |

---

## 十二、需求确认与方案总结

### 1. 业务场景确认

**需要支持的功能：**
- ✅ 文件列表查询
- ✅ 文件删除
- ✅ 断点续传状态查询
- ✅ 哈希校验
- ✅ 所有现有功能

**改造原则：**
- 后端代码几乎不需要改（老代码和逻辑不动）
- 只封装给页面的接口

### 2. 调用方式确认

**当前架构：**
- 传输系统除上传下载外，还有创单、审批等功能
- 其他功能页面都是Vue项目

**目标架构：**
- 上传下载页面迁移到Vue项目中
- 通过HTTP API调用TransWebService

**可选方案：**
- 如果直接适配困难，考虑增加一层 **BFF（Backend For Frontend）** 作为适配层

### 3. 认证机制确认

| 场景 | 认证方式 | Vue工程兼容性 |
|------|----------|---------------|
| **内网** | SSO单点登录 | 需要处理SSO登入流程 |
| **外网** | 不认证，直接通过URL访问 | ⚠️ **关键问题**：外网不能访问Vue工程，但需要兼容不认证场景 |

**外网场景的挑战：**
- 原方案：外网用户直接访问 `/valid?params=xxx` URL，无需登录
- 新方案：外网用户无法访问Vue工程，需要考虑替代方案

### 4. 核心类分析（已补充）

#### UploadUtils 核心功能

```java
// 文件操作
uploadFile()           // 分片上传文件
pauseUploadFile()      // 暂停上传
resumeUploadFile()     // 继续上传
cancelUploadFile()     // 取消上传
deleteCheckedFile()    // 删除选中的文件

// 校验相关
hashCodeCalc()         // 哈希值计算
uploadConfirm()        // 确认上传完毕
```

**关键发现：**
- 支持分片上传（通过 `qqpartindex`、`qqtotalparts` 参数）
- 临时文件扩展名：`.mstp`（上传中）、`.hash`（哈希计算）
- 文件路径校验使用 `FileConfig.filePathIsValid()` 防止路径穿越攻击

#### RequestInfoModule 核心功能

```java
// 传输单信息管理
getRequestInformation(transferId, transType, isInit)  // 获取请求信息
removeRequestInformation(transferId, reason)          // 移除缓存

// 文件列表管理
updateFileList(transferId, fileEntity)    // 更新/添加文件信息
removeFileList(transferId, fileName, dir) // 移除文件
getFileEntityFromList(transferId, fileName, dir) // 获取文件信息

// 缓存管理
clearExpiredCaches()  // 清理过期缓存（超过2天）
```

**关键发现：**
- 传输单信息存储在内存 `HashMap<Integer, RequestInfo>` 中
- 自动清理超过2天的缓存
- 文件上传状态通过内存缓存管理

---

## 十三、待解决问题清单

### 高优先级

| 问题 | 状态 | 说明 |
|------|------|------|
| UploadPage.js 和 DownloadPage.js | ⏳ 待补充 | 下一轮提供，用于理解前端调用逻辑 |
| 外网无认证场景兼容 | ⚠️ 待解决 | 外网不能访问Vue工程，如何处理上传下载？ |
| BFF层设计 | 📋 待评估 | 是否需要增加BFF层来适配？ |

### 中优先级

| 问题 | 状态 | 说明 |
|------|------|------|
| PageHelper 类 | ⏳ 待补充 | 页面辅助工具类 |
| BlacklistCharHandler 类 | ⏳ 待补充 | 黑名单字符处理 |
| i18n 配置文件 | ⏳ 待补充 | 多语言国际化迁移 |
| interfaces/dto 目录 | ⏳ 待补充 | DTO类定义 |

### 低优先级

| 问题 | 状态 | 说明 |
|------|------|------|
| WebSocket客户端上传 | 📋 待确认 | 是否需要保留本地客户端上传功能 |
| fine-uploader.js | 📋 待评估 | 是否沿用或替换上传组件 |

---

## 十四、前端JS文件详细分析（UploadPage.js & DownloadPage.js）

### 1. UploadPage.js 核心逻辑

#### 1.1 技术栈
- **上传组件**: Fine Uploader (qq.FineUploader)
- **哈希计算**: CryptoJS (SHA-256)
- **UI框架**: Vue 2.x + Element UI
- **HTTP请求**: jQuery AJAX

#### 1.2 配置参数
```javascript
var chunkSize = 4194304;        // 分片大小: 4MB
var maxConnect = 1;             // 最大并发连接数
var maxfileCount = 1000;        // 最大文件数量
var maxLength4Name = 80;        // 文件名最大长度
var maxLength4Path = 200;       // 路径最大长度
var totalSizeLimit = ...;       // 总大小限制（从后端注入）
var blackList = ...;            // 黑名单字符（base64编码）
```

#### 1.3 上传状态枚举
```javascript
var TransTaskStatus = {
    PENDING: 'el-icon-time',           // 等待中
    UPLOADING: 'el-icon-upload',       // 上传中
    PAUSE: 'el-icon-video-pause',      // 已暂停
    FILE_HASH: 'el-icon-loading',      // 哈希计算中
    FINISHED: 'el-icon-success',       // 已完成
    ERROR: 'el-icon-error',            // 错误
    FILE_NOT_EQUALS: 'el-icon-warning' // 哈希不匹配
};
```

#### 1.4 与后端的接口交互

| 接口URL | 方法 | 操作(act) | 功能说明 |
|---------|------|-----------|----------|
| `Handler/UploadHandler` | POST | `add` | 分片上传文件 |
| `Handler/UploadHandler` | POST | `cancel` | 取消上传 |
| `Handler/UploadHandler` | POST | `pause` | 暂停上传 |
| `Handler/UploadHandler` | POST | `HASH` | 获取服务端哈希值 |
| `Handler/UploadHandler` | POST | `complete` | 确认上传完成 |
| `Handler/UploadHandler` | POST | `delete` | 删除已上传文件 |
| `/transWeb/Handler/FileListHandler` | POST | - | 获取文件列表 |
| `client/fileInfo/updateClientFileHashCode` | PUT | - | 更新客户端哈希值 |
| `agreedPrivacyStatement` | POST | - | 隐私声明确认 |
| `/transWeb/Handler/sessionManage` | POST | `clearCache` | 清除缓存 |
| `/transWeb/Handler/sessionManage` | POST | `unload` | 页面卸载通知 |

#### 1.5 上传流程详解

```
┌─────────────────────────────────────────────────────────────────┐
│                        文件上传流程                              │
├─────────────────────────────────────────────────────────────────┤
│  1. 用户选择文件                                                 │
│     └─► onSubmit: 校验文件名长度、黑名单字符、是否重复            │
│                                                                 │
│  2. 开始上传                                                     │
│     └─► onUpload: 客户端计算SHA-256哈希                          │
│     └─► POST /Handler/UploadHandler?act=add (分片上传)          │
│                                                                 │
│  3. 上传完成                                                     │
│     └─► onComplete: 触发服务端哈希计算                           │
│     └─► PUT client/fileInfo/updateClientFileHashCode            │
│                                                                 │
│  4. 哈希校验（轮询）                                             │
│     └─► POST /Handler/UploadHandler?act=HASH (每3秒)            │
│     └─► 对比 clientFileHashCode vs serverFileHashCode           │
│                                                                 │
│  5. 确认提交                                                     │
│     └─► POST /Handler/UploadHandler?act=complete                │
└─────────────────────────────────────────────────────────────────┘
```

#### 1.6 关键函数说明

| 函数名 | 功能 |
|--------|------|
| `createUploader()` | 初始化Fine Uploader实例 |
| `calcClientHash(id, name, chunkData)` | 客户端SHA-256哈希计算 |
| `updateClientHashToDB(id, clientFileHashCode)` | 更新客户端哈希到服务端 |
| `getServerHash(id, name)` | 获取服务端计算的哈希值 |
| `validHashTimer(id)` | 定时器：校验客户端与服务端哈希是否一致 |
| `refresh(relativeDir)` | 刷新文件列表 |
| `CompleteSubmit()` | 确认提交（完成上传） |
| `deleteFileList(files)` | 批量删除文件 |
| `AutoConfirm()` | 自动提交功能（定时检测） |

---

### 2. DownloadPage.js 核心逻辑

#### 2.1 与后端的接口交互

| 接口URL | 方法 | 功能说明 |
|---------|------|----------|
| `/transWeb/Handler/FileListHandler` | POST | 获取文件列表（支持目录浏览） |
| `fileDownload` | GET | 文件下载（通过iframe触发） |
| `/transWeb/HJWeb/isPackage` | GET | 检查文件夹是否正在打包 |
| `/transWeb/HJWeb/vedorName` | GET | 获取供应商名称 |

#### 2.2 下载流程详解

```
┌─────────────────────────────────────────────────────────────────┐
│                        文件下载流程                              │
├─────────────────────────────────────────────────────────────────┤
│  1. 页面加载                                                     │
│     └─► POST /transWeb/Handler/FileListHandler                  │
│         参数: RelativeDir, params                               │
│                                                                 │
│  2. 目录导航                                                     │
│     └─► 双击文件夹 → refresh(newRelativeDir)                    │
│     └─► 返回上级 → refresh(parentDir)                           │
│                                                                 │
│  3. 文件下载                                                     │
│     └─► 选择文件 → 点击下载按钮                                   │
│     └─► 如果是文件夹:                                            │
│         └─► GET /transWeb/HJWeb/isPackage (检查是否打包中)      │
│         └─► 若打包中则提示，否则创建iframe下载                   │
│     └─► 如果是文件:                                              │
│         └─► 创建隐藏iframe触发下载                               │
│         └─► iframe src: fileDownload?fileName=xxx&relativeDir=xxx|
│                                                                 │
│  4. 客户端下载（可选）                                           │
│     └─► 通过WebSocket通知本地客户端下载                          │
└─────────────────────────────────────────────────────────────────┘
```

#### 2.3 关键函数说明

| 函数名 | 功能 |
|--------|------|
| `refresh(relativeDir)` | 刷新文件列表 |
| `Download()` | 浏览器下载选中文件 |
| `downloadFile(fileName, relativeDir, fileType)` | 单文件下载 |
| `downloadFileByIFrame(...)` | 通过iframe触发下载 |
| `isPackage(relativeDir)` | 检查文件夹是否打包中 |
| `clientDownload(isRetry)` | 客户端下载（WebSocket） |
| `getSelectFiles()` | 获取选中的文件列表 |
| `selectAllFile(cbk)` | 全选/取消全选 |

---

### 3. 完整API接口汇总

#### 3.1 文件上传相关

| 接口 | 方法 | 参数 | 说明 |
|------|------|------|------|
| `/Handler/UploadHandler` | POST | `act=add`, 文件分片 | 分片上传文件 |
| `/Handler/UploadHandler` | POST | `act=cancel`, id, name, qquuid, qqpath | 取消上传 |
| `/Handler/UploadHandler` | POST | `act=pause`, name, qqpath | 暂停上传 |
| `/Handler/UploadHandler` | POST | `act=HASH`, RelativeFileName | 获取服务端哈希 |
| `/Handler/UploadHandler` | POST | `act=complete`, params | 确认上传完成 |
| `/Handler/UploadHandler` | POST | `act=delete`, files(JSON) | 批量删除文件 |

#### 3.2 文件列表相关

| 接口 | 方法 | 参数 | 说明 |
|------|------|------|------|
| `/transWeb/Handler/FileListHandler` | POST | RelativeDir, params | 获取文件列表 |
| `client/fileInfo/updateClientFileHashCode` | PUT | fileName, relativeDir, clientFileHashCode | 更新客户端哈希 |

#### 3.3 文件下载相关

| 接口 | 方法 | 参数 | 说明 |
|------|------|------|------|
| `fileDownload` | GET | fileName, relativeDir, fileType, value(token), params | 文件下载 |
| `/transWeb/HJWeb/isPackage` | GET | relativeDir, params | 检查文件夹打包状态 |
| `/transWeb/HJWeb/vedorName` | GET | - | 获取供应商名称 |

#### 3.4 其他接口

| 接口 | 方法 | 参数 | 说明 |
|------|------|------|------|
| `agreedPrivacyStatement` | POST | params | 隐私声明确认 |
| `/transWeb/Handler/sessionManage` | POST | act=clearCache, params | 清除缓存 |
| `/transWeb/Handler/sessionManage` | POST | act=unload, params, files | 页面卸载通知 |

---

### 4. 前后端数据交互格式

#### 4.1 文件列表返回格式 (FileListHandler)

```json
{
  "ret": "success",
  "data": "{
    \"fileList\": [
      {
        \"fileId\": 123,
        \"fileName\": \"example.txt\",
        \"fileSize\": 1024,
        \"extension\": \".txt\",
        \"lastModify\": \"2024-01-01 12:00:00\",
        \"hashCode\": \"ABCD1234...\",
        \"clientFileHashCode\": \"ABCD1234...\",
        \"relativeDir\": \"folder1/\"
      }
    ],
    \"directoryList\": [
      {
        \"name\": \"subfolder\",
        \"relativeDir\": \"folder1/subfolder/\",
        \"lastModify\": \"2024-01-01 12:00:00\"
      }
    ],
    \"currentRelativeDir\": \"folder1/\",
    \"totalFileSize\": 1024,
    \"totalFileCount\": 5,
    \"applicationId\": \"APP001\",
    \"version\": \"1.0\"
  }"
}
```

#### 4.2 上传返回格式 (UploadHandler)

```json
{
  "success": true,
  "error": "",
  "elapsedTime": "00:00:05",
  "timeLeft": "00:00:10"
}
```

#### 4.3 哈希查询返回格式

```json
{
  "success": true,
  "error": "fileId%2CHASH_VALUE"
}
```

---

### 5. 关键发现与改造建议

#### 5.1 接口复用性分析

| 接口 | 是否可直接复用 | 改造建议 |
|------|---------------|----------|
| `/Handler/UploadHandler` | ✅ 可复用 | 直接使用，无需修改 |
| `/transWeb/Handler/FileListHandler` | ✅ 可复用 | 直接使用，无需修改 |
| `client/fileInfo/updateClientFileHashCode` | ✅ 可复用 | 直接使用，无需修改 |
| `agreedPrivacyStatement` | ✅ 可复用 | 直接使用，无需修改 |
| `fileDownload` | ⚠️ 需适配 | 当前通过iframe+token，需改为标准REST |
| `/transWeb/Handler/sessionManage` | ❓ 待确认 | 页面卸载通知功能是否保留 |

#### 5.2 前端需要重写的功能

1. **文件上传组件** - 使用 Vue 3 + 新上传组件替代 Fine Uploader
2. **哈希计算** - 保持客户端SHA-256计算逻辑
3. **文件列表展示** - Vue组件重写
4. **多语言国际化** - 从后端i18n迁移到Vue i18n

#### 5.3 后端需要新增的接口

| 新接口 | 替代原有功能 | 说明 |
|--------|-------------|------|
| `GET /api/valid` | `/valid` 页面重定向 | 返回JSON: `{type: "upload/download", params: {...}}` |
| `GET /api/upload/init` | `/UploadPage` 页面渲染 | 返回页面初始化数据 |
| `GET /api/download/init` | `/DownloadPage` 页面渲染 | 返回页面初始化数据 |
| `GET /api/file/download` | `fileDownload` iframe | 标准REST文件下载接口 |

---

## 十五、前端复用现有接口的方式

### 1. 核心问题：Token获取

**当前流程（页面注入）：**
```
用户访问 /valid?params=xxx
    ↓
后端解密params，验证权限
    ↓
后端生成token，注入到HTML: <input id="hfToken" value="${token}"/>
    ↓
前端JS获取: $("#hfToken").val()
    ↓
后续请求携带: headers: { Authorization: token }
```

**新流程（API获取）：**
```
Vue工程调用 GET /api/init?params=xxx
    ↓
后端解密params，验证权限
    ↓
后端返回JSON: { token: "xxx", type: "upload", ... }
    ↓
Vue存储token: sessionStorage.setItem('trans_token', token)
    ↓
后续请求携带: axios.defaults.headers.common['Authorization'] = token
```

### 2. 封装请求工具示例

```typescript
// src/utils/transRequest.ts
import axios from 'axios';

// 创建专用于TransWebService的axios实例
const transClient = axios.create({
  baseURL: '/transWeb',  // 需要配置代理或同域部署
  timeout: 60000,
});

// 请求拦截器：自动携带token
transClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('trans_token');
  if (token) {
    config.headers.Authorization = token;
  }
  return config;
});

// 响应拦截器：处理登录过期
transClient.interceptors.response.use(
  (response) => {
    const { data } = response;
    // 处理登录过期
    if (data.success === false && 
        (data.error?.includes('当前登录信息已过期') || 
         data.error?.includes('The current login information has expired'))) {
      // 跳转登录或提示
      sessionStorage.removeItem('trans_token');
      window.location.href = '/login';
    }
    return response;
  },
  (error) => Promise.reject(error)
);

export default transClient;
```

### 3. 复用现有接口示例

```typescript
// src/api/transApi.ts
import transClient from '@/utils/transRequest';

// ============ 文件列表相关 ============

/**
 * 获取文件列表
 * 直接复用现有接口: /transWeb/Handler/FileListHandler
 */
export async function getFileList(relativeDir: string, params: string) {
  const response = await transClient.post('/Handler/FileListHandler', {
    RelativeDir: encodeURIComponent(relativeDir),
    params: params,
  });
  
  if (response.data.ret === 'success') {
    return JSON.parse(response.data.data);
  }
  throw new Error(response.data.message);
}

// ============ 文件上传相关 ============

/**
 * 分片上传文件
 * 直接复用现有接口: /Handler/UploadHandler?act=add
 * 注意：需要使用 FormData 格式
 */
export function uploadChunk(formData: FormData, params: string) {
  return transClient.post(`/Handler/UploadHandler?params=${encodeURIComponent(params)}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    params: { act: 'add' },
  });
}

/**
 * 获取服务端哈希
 * 直接复用现有接口: /Handler/UploadHandler?act=HASH
 */
export async function getServerHash(relativeFileName: string, params: string) {
  const response = await transClient.post('/Handler/UploadHandler', {
    act: 'HASH',
    RelativeFileName: encodeURIComponent(relativeFileName),
    params: params,
  });
  return response.data;
}

/**
 * 更新客户端哈希
 * 直接复用现有接口: client/fileInfo/updateClientFileHashCode
 */
export function updateClientHash(fileName: string, relativeDir: string, hashCode: string) {
  return transClient.put('/client/fileInfo/updateClientFileHashCode', {
    fileName: encodeURIComponent(fileName),
    relativeDir: relativeDir,
    clientFileHashCode: hashCode,
  });
}

/**
 * 确认上传完成
 * 直接复用现有接口: /Handler/UploadHandler?act=complete
 */
export function completeUpload(params: string) {
  return transClient.post('/Handler/UploadHandler', {
    act: 'complete',
    params: params,
  });
}

/**
 * 删除文件
 * 直接复用现有接口: /Handler/UploadHandler?act=delete
 */
export function deleteFiles(files: Array<{fileName: string, relativeDir: string}>, params: string) {
  return transClient.post('/Handler/UploadHandler', {
    act: 'delete',
    files: encodeURIComponent(JSON.stringify(files)),
    params: params,
  });
}

// ============ 文件下载相关 ============

/**
 * 检查文件夹打包状态
 * 直接复用现有接口: /transWeb/HJWeb/isPackage
 */
export async function checkPackageStatus(relativeDir: string, params: string) {
  const response = await transClient.get('/HJWeb/isPackage', {
    params: {
      relativeDir: relativeDir,
      params: params,
    },
  });
  return response.data;
}
```

### 4. 需要新增接口的调用示例

```typescript
// src/api/transInitApi.ts
import axios from 'axios';

/**
 * 初始化接口（新增）
 * 用于获取Token和页面初始化数据
 * 这是唯一需要后端新增的接口
 */
export async function initTransPage(params: string) {
  const response = await axios.get('/transWeb/api/init', {
    params: { params },
  });
  
  const { token, type, ...initData } = response.data;
  
  // 存储token
  sessionStorage.setItem('trans_token', token);
  
  return { type, initData };
}

/**
 * 文件下载接口（新增）
 * 替代原有的iframe下载方式
 */
export function downloadFile(fileName: string, relativeDir: string, params: string) {
  // 方式1: 直接打开新窗口下载
  const token = sessionStorage.getItem('trans_token');
  const url = `/transWeb/api/file/download?fileName=${encodeURIComponent(fileName)}&relativeDir=${encodeURIComponent(relativeDir)}&params=${params}&token=${token}`;
  window.open(url, '_blank');
  
  // 方式2: 使用fetch下载（支持进度）
  // return fetch(url).then(res => res.blob());
}
```

### 5. Vue组件中使用示例

```vue
<template>
  <div class="upload-page">
    <!-- 文件列表 -->
    <FileList :files="fileList" @refresh="loadFileList" />
    <!-- 上传组件 -->
    <Uploader @upload="handleUpload" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { initTransPage } from '@/api/transInitApi';
import { getFileList, completeUpload } from '@/api/transApi';

const route = useRoute();
const fileList = ref([]);
const initData = ref({});

onMounted(async () => {
  // 1. 初始化：获取Token和数据
  const params = route.query.params as string;
  const result = await initTransPage(params);
  initData.value = result.initData;
  
  // 2. 加载文件列表
  await loadFileList('');
});

async function loadFileList(relativeDir: string) {
  const params = route.query.params as string;
  const data = await getFileList(relativeDir, params);
  fileList.value = [...data.directoryList, ...data.fileList];
}

async function handleComplete() {
  const params = route.query.params as string;
  await completeUpload(params);
  // 提示成功
}
</script>
```

---

## 十六、新增API接口详细规范

### 1. 初始化接口（必需新增）

#### 1.1 上传页面初始化

```
GET /api/upload/init
```

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| params | string | 是 | 加密的参数字符串 |
| lang | string | 否 | 语言：zh_CN/en_US，默认zh_CN |

**响应示例：**

```json
{
  "success": true,
  "code": 200,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "applicationId": "APP202401010001",
    "applicantW3Id": "user001",
    "applicationSize": 10,
    "hashType": "SHA-256",
    "blackList": "JTNGJTNFJTdDJTQw...",  // base64编码的黑名单字符
    "maxLength4Name": 80,
    "maxLength4Path": 200,
    "privatePolicyUrl": "https://xxx/privacy",
    "maxFileCount": 1000,
    "chunkSize": 4194304,
    "i18n": {
      "lblUpload": "上传文件",
      "lblConfirm": "确认提交",
      "tipSubmittingPleaseWait": "正在提交，请稍候..."
    }
  }
}
```

**后端实现建议：**
```java
@GetMapping("/api/upload/init")
public ResponseResult<UploadInitVO> uploadInit(
    @RequestParam String params,
    @RequestParam(required = false, defaultValue = "zh_CN") String lang,
    HttpServletRequest request) {
    
    // 复用现有的UploadPageHandler逻辑
    RequestInfo reqInfo = ValidHelper.getRequestInfo(params, TransType.UPLOAD);
    
    UploadInitVO vo = new UploadInitVO();
    vo.setToken(ValidHelper.getToken(reqInfo, request));
    vo.setApplicationId(reqInfo.getApplicationId());
    // ... 其他字段
    
    return ResponseResult.success(vo);
}
```

---

#### 1.2 下载页面初始化

```
GET /api/download/init
```

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| params | string | 是 | 加密的参数字符串 |
| lang | string | 否 | 语言：zh_CN/en_US，默认zh_CN |

**响应示例：**

```json
{
  "success": true,
  "code": 200,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "applicationId": "APP202401010001",
    "hashType": "SHA-256",
    "blackList": "JTNGJTNFJTdDJTQw...",
    "fromRegionModCode": "INTERNET_ZONE",
    "showVendorNameCode": "INTERNET_ZONE",
    "vendorName": "供应商A",
    "i18n": {
      "lblDownload": "下载文件",
      "tipPleaseSelectAFile": "请选择文件"
    }
  }
}
```

---

### 2. 文件下载接口（需要适配）

#### 2.1 标准REST下载接口

```
GET /api/file/download
```

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| fileName | string | 是 | 文件名（URL编码） |
| relativeDir | string | 否 | 相对目录（URL编码） |
| fileType | string | 否 | 文件类型（.directory表示文件夹） |
| params | string | 是 | 加密的参数字符串 |
| token | string | 是 | 认证令牌（或通过Header传递） |

**响应：**
- 成功：文件流（Content-Type: application/octet-stream）
- 失败：JSON错误信息

**后端实现建议：**
```java
@GetMapping("/api/file/download")
public void downloadFile(
    @RequestParam String fileName,
    @RequestParam(required = false) String relativeDir,
    @RequestParam(required = false) String fileType,
    @RequestParam String params,
    @RequestParam String token,
    HttpServletRequest request,
    HttpServletResponse response) {
    
    // 验证token
    if (!ValidHelper.validateToken(token, params)) {
        response.setStatus(401);
        response.getWriter().write("{\"success\":false,\"error\":\"Token invalid\"}");
        return;
    }
    
    // 复用现有下载逻辑
    // ...
    
    // 设置响应头
    response.setContentType("application/octet-stream");
    response.setHeader("Content-Disposition", 
        "attachment; filename=" + URLEncoder.encode(fileName, "UTF-8"));
    
    // 写入文件流
    // ...
}
```

---

### 3. 验证接口（可选新增）

如果需要先验证params再决定跳转哪个页面：

```
GET /api/valid
```

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| params | string | 是 | 加密的参数字符串 |

**响应示例：**

```json
{
  "success": true,
  "code": 200,
  "data": {
    "type": "upload",  // 或 "download"
    "redirectUrl": "/transWeb/api/upload/init?params=xxx"
  }
}
```

---

### 4. 错误码规范

| 错误码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 参数错误 |
| 401 | Token无效或已过期 |
| 403 | 无权限访问 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

**错误响应格式：**
```json
{
  "success": false,
  "code": 401,
  "error": "当前登录信息已过期，请重新登录",
  "errorEn": "The current login information has expired, please log in again"
}
```

---

## 十七、接口复用总结

### 1. 完全复用（无需修改后端）

| 接口 | 调用方式 |
|------|----------|
| `POST /Handler/UploadHandler` | 直接使用，携带token |
| `POST /transWeb/Handler/FileListHandler` | 直接使用，携带token |
| `PUT /client/fileInfo/updateClientFileHashCode` | 直接使用，携带token |
| `POST /agreedPrivacyStatement` | 直接使用，携带token |
| `GET /transWeb/HJWeb/isPackage` | 直接使用，携带token |
| `GET /transWeb/HJWeb/vedorName` | 直接使用，携带token |

### 2. 需要新增

| 新接口 | 功能 | 实现方式 |
|--------|------|----------|
| `GET /api/upload/init` | 上传页面初始化 | 复用UploadPageHandler逻辑，返回JSON |
| `GET /api/download/init` | 下载页面初始化 | 复用DownloadPageHandler逻辑，返回JSON |
| `GET /api/file/download` | 文件下载 | 适配现有下载逻辑，支持REST调用 |

### 3. 可废弃

| 原接口 | 原因 |
|--------|------|
| `GET /valid` | 改用前端路由 |
| `GET /UploadPage` | 改用Vue组件 |
| `GET /DownloadPage` | 改用Vue组件 |
| `POST /transWeb/Handler/sessionManage` | 页面卸载通知可移除 |

---

## 十八、FileListRestController 详细分析

### 1. 接口信息

| 项目 | 值 |
|------|-----|
| 路径 | `POST /Handler/FileListHandler` |
| 功能 | 获取文件列表（支持目录浏览） |
| 认证 | Authorization Header (Token) |

### 2. 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `RelativeDir` | string | 否 | 相对目录路径（URL编码），为空则返回根目录 |
| `params` | string | 是 | 加密的参数字符串 |
| `Authorization` | header | 是 | JWT Token |

### 3. 响应格式

**成功响应：**
```json
{
  "ret": "success",
  "data": "{
    \"name\": \"62e15fb3828d6ce598b0\",
    \"directoryList\": [
      {
        \"name\": \"subfolder\",
        \"relativeDir\": \"/subfolder\",
        \"filePath\": \"/subfolder\",
        \"lastModify\": \"2024-01-01 12:00:00\"
      }
    ],
    \"fileList\": [
      {
        \"fileName\": \"example.txt\",
        \"fileSize\": 1024,
        \"relativeDir\": \"/\",
        \"lastModify\": \"2024-01-01 12:00:00\",
        \"extension\": \".txt\",
        \"filePath\": \"/example.txt\",
        \"hashCode\": \"ABCD1234...\",
        \"clientFileHashCode\": \"ABCD1234...\",
        \"fileId\": 123
      }
    ],
    \"currentRelativeDir\": \"\",
    \"applicationId\": 12345,
    \"totalFileSize\": 1024,
    \"totalFileCount\": 1
  }"
}
```

**失败响应：**
```json
{
  "ret": "fail",
  "message": "错误信息"
}
```

### 4. 核心处理逻辑

```java
@PostMapping(value = "/Handler/FileListHandler")
public void fileListHandler(HttpServletRequest request, HttpServletResponse response) {
    // 1. 获取并解码 RelativeDir 参数
    String relativeDir = getRelativeDir(request);
    
    // 2. 校验路径合法性（防止路径穿越）
    if (!FileConfig.filePathIsValid(relativeDir)) {
        throw new AccessDeniedException("Illegal parameters RelativeDir!");
    }
    
    // 3. 验证Token和请求
    TokenDataVO tokenData = ValidHelper.validToken(request);
    RequestInfo reqInfo = ValidHelper.validRequest(request, tokenData, false);
    
    // 4. 构建文件路径
    String filePath = FileHelper.combinePaths(reqInfo.getServerLocalPath(), reqInfo.getFolderName());
    
    // 5. 获取目录信息
    result = getDirectoryInfo(filePath, relativeDir, reqInfo);
    
    // 6. 返回JSON结果
    response.getWriter().print(JSON.toJSONString(result));
}
```

### 5. 关键安全机制

| 机制 | 说明 |
|------|------|
| 路径穿越防护 | `FileConfig.filePathIsValid()` 校验 |
| 黑名单字符校验 | `blacklistCharHandler.blacklistMatcherPath()` |
| Token验证 | `ValidHelper.validToken()` |
| 请求验证 | `ValidHelper.validRequest()` |

---

## 十九、SessionManageController 详细分析

### 1. 接口信息

| 项目 | 值 |
|------|-----|
| 路径 | `POST /Handler/sessionManage` |
| 功能 | 会话管理（页面卸载、缓存清理） |

### 2. 操作类型

| act值 | 功能 | 说明 |
|-------|------|------|
| `unload` | 页面卸载 | 移除上传文件信息，清理内存缓存 |
| `cache` | 刷新缓存时间 | 更新缓存最后使用时间 |
| `clearCache` | 清空缓存 | 清空指定申请单的文件上传信息 |

### 3. 前后端分离后建议

**可以废弃的功能：**
- `unload`: Vue工程可以自行管理状态，无需通知后端
- `cache`: 内存缓存管理可由后端自动处理

**可能需要保留的功能：**
- `clearCache`: 如果用户需要手动清理上传状态

---

## 二十、前端Vue工程复用完整示例

### 1. 封装TransWebService请求模块

```typescript
// src/api/transWebService.ts
import axios, { AxiosInstance, AxiosProgressEvent } from 'axios';

// ============ 类型定义 ============

/** 文件信息 */
interface FileEntity {
  fileName: string;
  fileSize: number;
  relativeDir: string;
  lastModify: string;
  extension: string;
  filePath: string;
  hashCode: string;
  clientFileHashCode: string;
  fileId: number;
}

/** 目录信息 */
interface DirectoryEntity {
  name: string;
  relativeDir: string;
  filePath: string;
  lastModify: string;
}

/** 文件列表响应 */
interface FileListData {
  name: string;
  directoryList: DirectoryEntity[];
  fileList: FileEntity[];
  currentRelativeDir: string;
  applicationId: number;
  totalFileSize: number;
  totalFileCount: number;
}

/** 初始化响应 */
interface InitResponse {
  token: string;
  applicationId: number;
  applicationSize: number;
  hashType: string;
  blackList: string;
  maxLength4Name: number;
  maxLength4Path: number;
  // ... 其他字段
}

// ============ 创建请求实例 ============

const createTransClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: '/transWeb',
    timeout: 60000,
  });

  // 请求拦截器：自动携带token
  client.interceptors.request.use((config) => {
    const token = sessionStorage.getItem('trans_token');
    if (token) {
      config.headers.Authorization = token;
    }
    return config;
  });

  // 响应拦截器：处理登录过期
  client.interceptors.response.use(
    (response) => {
      const { data } = response;
      if (data.success === false && 
          (data.error?.includes('当前登录信息已过期') || 
           data.error?.includes('The current login information has expired'))) {
        sessionStorage.removeItem('trans_token');
        // 可以在这里触发全局登录过期事件
        window.dispatchEvent(new CustomEvent('trans-token-expired'));
      }
      return response;
    },
    (error) => Promise.reject(error)
  );

  return client;
};

const transClient = createTransClient();

// ============ API 方法 ============

/**
 * 上传页面初始化（需要后端新增）
 */
export async function initUpload(params: string, lang = 'zh_CN'): Promise<InitResponse> {
  const response = await axios.get('/transWeb/api/upload/init', {
    params: { params, lang },
  });
  
  const { token, ...initData } = response.data.data;
  sessionStorage.setItem('trans_token', token);
  
  return { token, ...initData };
}

/**
 * 下载页面初始化（需要后端新增）
 */
export async function initDownload(params: string, lang = 'zh_CN'): Promise<InitResponse> {
  const response = await axios.get('/transWeb/api/download/init', {
    params: { params, lang },
  });
  
  const { token, ...initData } = response.data.data;
  sessionStorage.setItem('trans_token', token);
  
  return { token, ...initData };
}

/**
 * 获取文件列表（直接复用现有接口）
 */
export async function getFileList(relativeDir: string, params: string): Promise<FileListData> {
  const response = await transClient.post('/Handler/FileListHandler', null, {
    params: {
      RelativeDir: encodeURIComponent(relativeDir),
      params: params,
    },
  });
  
  if (response.data.ret === 'success') {
    // data 是 JSON 字符串，需要解析
    return JSON.parse(response.data.data);
  }
  throw new Error(response.data.message || '获取文件列表失败');
}

/**
 * 分片上传文件（直接复用现有接口）
 */
export async function uploadChunk(
  formData: FormData,
  params: string,
  onProgress?: (percent: number) => void
): Promise<{ success: boolean; error: string; elapsedTime?: string; timeLeft?: string }> {
  const response = await transClient.post(
    `/Handler/UploadHandler?params=${encodeURIComponent(params)}`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      params: { act: 'add' },
      onUploadProgress: (progressEvent: AxiosProgressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          onProgress(percent);
        }
      },
    }
  );
  return response.data;
}

/**
 * 删除文件（直接复用现有接口）
 */
export async function deleteFiles(
  files: Array<{ fileName: string; relativeDir: string }>,
  params: string
): Promise<{ success: boolean; error: string }> {
  const response = await transClient.post('/Handler/UploadHandler', null, {
    params: {
      act: 'delete',
      files: encodeURIComponent(JSON.stringify(files)),
      params: params,
    },
  });
  return response.data;
}

/**
 * 确认上传完成（直接复用现有接口）
 */
export async function completeUpload(params: string): Promise<{ success: boolean; error: string }> {
  const response = await transClient.post('/Handler/UploadHandler', null, {
    params: {
      act: 'complete',
      params: params,
    },
  });
  return response.data;
}

/**
 * 获取服务端哈希值（直接复用现有接口）
 */
export async function getServerHash(
  relativeFileName: string,
  params: string
): Promise<{ success: boolean; error: string }> {
  const response = await transClient.post('/Handler/UploadHandler', null, {
    params: {
      act: 'HASH',
      RelativeFileName: encodeURIComponent(relativeFileName),
      params: params,
    },
  });
  return response.data;
}

/**
 * 更新客户端哈希值（直接复用现有接口）
 */
export async function updateClientHash(
  fileName: string,
  relativeDir: string,
  hashCode: string
): Promise<{ status: boolean }> {
  const response = await transClient.put('/client/fileInfo/updateClientFileHashCode', {
    fileName: encodeURIComponent(fileName),
    relativeDir: relativeDir,
    clientFileHashCode: hashCode,
  });
  return response.data;
}

/**
 * 文件下载（fetch方式，支持进度）
 * 需要后端新增标准REST接口
 */
export async function downloadFile(
  fileName: string,
  relativeDir: string,
  params: string,
  onProgress?: (percent: number, loaded: number, total: number) => void
): Promise<Blob> {
  const token = sessionStorage.getItem('trans_token');
  const url = `/transWeb/api/file/download?fileName=${encodeURIComponent(fileName)}&relativeDir=${encodeURIComponent(relativeDir)}&params=${params}&token=${token}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: token || '',
    },
  });
  
  if (!response.ok) {
    throw new Error(`下载失败: ${response.statusText}`);
  }
  
  const contentLength = response.headers.get('content-length');
  const total = contentLength ? parseInt(contentLength, 10) : 0;
  
  if (!response.body) {
    throw new Error('响应体为空');
  }
  
  // 使用 ReadableStream 读取数据并计算进度
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    chunks.push(value);
    loaded += value.length;
    
    if (onProgress && total > 0) {
      const percent = Math.round((loaded / total) * 100);
      onProgress(percent, loaded, total);
    }
  }
  
  // 合并所有 chunks
  const blob = new Blob(chunks);
  return blob;
}

/**
 * 下载文件并保存（使用 downloadFile 后触发浏览器下载）
 */
export async function downloadAndSave(
  fileName: string,
  relativeDir: string,
  params: string,
  onProgress?: (percent: number, loaded: number, total: number) => void
): Promise<void> {
  const blob = await downloadFile(fileName, relativeDir, params, onProgress);
  
  // 创建下载链接
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 检查文件夹是否正在打包（直接复用现有接口）
 */
export async function checkPackageStatus(
  relativeDir: string,
  params: string
): Promise<{ status: boolean; result: boolean; message: string }> {
  const response = await transClient.get('/HJWeb/isPackage', {
    params: {
      relativeDir: relativeDir,
      params: params,
    },
  });
  return response.data;
}

// ============ 导出所有方法 ============

export const transApi = {
  // 初始化
  initUpload,
  initDownload,
  
  // 文件列表
  getFileList,
  
  // 上传相关
  uploadChunk,
  deleteFiles,
  completeUpload,
  getServerHash,
  updateClientHash,
  
  // 下载相关
  downloadFile,
  downloadAndSave,
  checkPackageStatus,
};

export default transApi;
```

### 2. Vue组件使用示例

```vue
<template>
  <div class="file-manager">
    <!-- 文件列表 -->
    <div class="file-list">
      <div v-for="dir in directoryList" :key="dir.relativeDir" class="directory-item">
        <span @click="navigateTo(dir.relativeDir)">📁 {{ dir.name }}</span>
      </div>
      <div v-for="file in fileList" :key="file.fileId" class="file-item">
        <span>📄 {{ file.fileName }} ({{ formatSize(file.fileSize) }})</span>
        <button @click="handleDownload(file)">下载</button>
      </div>
    </div>
    
    <!-- 下载进度 -->
    <div v-if="downloading" class="download-progress">
      <progress :value="downloadProgress" max="100"></progress>
      <span>{{ downloadProgress }}%</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { initDownload, getFileList, downloadAndSave, checkPackageStatus } from '@/api/transWebService';
import type { FileEntity, DirectoryEntity, FileListData } from '@/api/transWebService';

const route = useRoute();
const params = route.query.params as string;

const currentDir = ref('');
const fileList = ref<FileEntity[]>([]);
const directoryList = ref<DirectoryEntity[]>([]);
const downloading = ref(false);
const downloadProgress = ref(0);

onMounted(async () => {
  // 1. 初始化获取token
  await initDownload(params);
  
  // 2. 加载文件列表
  await loadFileList('');
});

async function loadFileList(relativeDir: string) {
  const data: FileListData = await getFileList(relativeDir, params);
  currentDir.value = data.currentRelativeDir;
  fileList.value = data.fileList;
  directoryList.value = data.directoryList;
}

async function navigateTo(relativeDir: string) {
  await loadFileList(relativeDir);
}

async function handleDownload(file: FileEntity) {
  if (file.extension === '.directory') {
    // 检查文件夹是否正在打包
    const status = await checkPackageStatus(file.relativeDir, params);
    if (status.result) {
      alert(status.message);
      return;
    }
  }
  
  downloading.value = true;
  downloadProgress.value = 0;
  
  try {
    await downloadAndSave(
      file.fileName,
      file.relativeDir,
      params,
      (percent, loaded, total) => {
        downloadProgress.value = percent;
      }
    );
  } catch (error) {
    console.error('下载失败', error);
  } finally {
    downloading.value = false;
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}
</script>
```

---

## 二十一、后端需要新增的接口汇总

| 接口 | 方法 | 功能 | 实现建议 |
|------|------|------|----------|
| `/api/upload/init` | GET | 上传页面初始化 | 复用 `UploadPageHandler` 逻辑，返回JSON |
| `/api/download/init` | GET | 下载页面初始化 | 复用 `DownloadPageHandler` 逻辑，返回JSON |
| `/api/file/download` | GET | 文件下载（REST风格） | 参考 `fileDownload` 逻辑，支持fetch调用 |

### 后端接口实现示例

```java
@RestController
@RequestMapping("/api")
public class TransWebApiController {

    @Resource
    private UploadPageHandler uploadPageHandler;
    
    @Resource
    private DownloadPageHandler downloadPageHandler;

    /**
     * 上传页面初始化接口
     */
    @GetMapping("/upload/init")
    public ResponseResult<UploadInitVO> uploadInit(
            @RequestParam String params,
            @RequestParam(required = false, defaultValue = "zh_CN") String lang,
            HttpServletRequest request) {
        
        // 复用现有的 UploadPageHandler 逻辑
        Model model = new ConcurrentModel();
        String view = uploadPageHandler.uploadPage(request, null, params, lang, model);
        
        // 从 model 中提取数据
        UploadInitVO vo = new UploadInitVO();
        vo.setToken((String) model.getAttribute("token"));
        vo.setApplicationId((Integer) model.getAttribute("applicationId"));
        // ... 其他字段
        
        return ResponseResult.success(vo);
    }

    /**
     * 下载页面初始化接口
     */
    @GetMapping("/download/init")
    public ResponseResult<DownloadInitVO> downloadInit(
            @RequestParam String params,
            @RequestParam(required = false, defaultValue = "zh_CN") String lang,
            HttpServletRequest request) {
        
        // 复用现有的 DownloadPageHandler 逻辑
        // ...
        
        return ResponseResult.success(vo);
    }

    /**
     * 文件下载接口（支持fetch调用）
     */
    @GetMapping("/file/download")
    public void downloadFile(
            @RequestParam String fileName,
            @RequestParam(required = false, defaultValue = "") String relativeDir,
            @RequestParam String params,
            @RequestParam String token,
            HttpServletRequest request,
            HttpServletResponse response) throws IOException {
        
        // 验证token
        TokenDataVO tokenData = ValidHelper.validTokenByValue(token);
        RequestInfo reqInfo = ValidHelper.validRequest(request, tokenData, false);
        
        // 构建文件路径
        String filePath = FileHelper.combinePaths(reqInfo.getServerLocalPath(), reqInfo.getFolderName());
        String fullPath = FileHelper.combinePaths(filePath, relativeDir, fileName);
        
        // 设置响应头
        response.setContentType("application/octet-stream");
        response.setHeader("Content-Disposition", 
            "attachment; filename=" + URLEncoder.encode(fileName, "UTF-8"));
        
        // 写入文件流
        File file = new File(fullPath);
        if (file.exists() && file.isFile()) {
            try (InputStream is = new FileInputStream(file);
                 OutputStream os = response.getOutputStream()) {
                byte[] buffer = new byte[8192];
                int bytesRead;
                while ((bytesRead = is.read(buffer)) != -1) {
                    os.write(buffer, 0, bytesRead);
                }
            }
        } else {
            response.setStatus(404);
            response.getWriter().write("{\"success\":false,\"error\":\"File not found\"}");
        }
    }
}
```

---

## 二十二、后端新增接口实现（已完成）

### 1. 实现概述

已按照上述规范完成三个核心接口的后端实现，新增文件如下：

| 文件路径 | 说明 |
|---------|------|
| `src/main/java/com/huawei/it/etrans/transwebservice/interfaces/dto/ApiResponse.java` | 统一API响应结构 |
| `src/main/java/com/huawei/it/etrans/transwebservice/interfaces/dto/UploadInitVO.java` | 上传初始化响应VO |
| `src/main/java/com/huawei/it/etrans/transwebservice/interfaces/dto/DownloadInitVO.java` | 下载初始化响应VO |
| `src/main/java/com/huawei/it/etrans/transwebservice/interfaces/controller/InitRestController.java` | 初始化接口控制器 |
| `src/main/java/com/huawei/it/etrans/transwebservice/interfaces/controller/FileDownloadRestController.java` | 文件下载接口控制器 |

### 2. 接口详细说明

#### 2.1 上传初始化接口

```
GET /api/upload/init?params={加密参数}&lang=zh_CN
```

**响应示例：**
```json
{
  "success": true,
  "code": 200,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "applicationId": "APP202401010001",
    "applicantW3Id": "W3Account:user001",
    "applicationSize": 10737418240,
    "hashType": "SHA-256",
    "blackList": "...",
    "maxLength4Name": 80,
    "maxLength4Path": 200,
    "privatePolicyUrl": "https://...",
    "showPrivacyDialog": true,
    "params": "...",
    "i18n": { "lblUpload": "上传文件", ... }
  }
}
```

#### 2.2 下载初始化接口

```
GET /api/download/init?params={加密参数}&lang=zh_CN
```

**响应示例：**
```json
{
  "success": true,
  "code": 200,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "applicationId": "APP202401010001",
    "applicantW3Id": "user001",
    "hashType": "SHA-256",
    "blackList": "...",
    "fromRegionModCode": "INTERNET_ZONE",
    "showVendorNameCode": "INTERNET_ZONE",
    "vendorName": "",
    "params": "...",
    "i18n": { "lblDownload": "下载文件", ... }
  }
}
```

#### 2.3 文件下载接口

```
GET /api/file/download?fileName={文件名}&relativeDir={相对目录}&params={加密参数}
Header: Authorization: Bearer {token}
```

**特性：**
- 支持fetch API调用，可显示下载进度
- 支持断点续传（Accept-Ranges）
- 完整的安全校验（Token验证、路径穿越防护、黑名单校验）
- 自动记录下载日志

### 3. 核心实现逻辑

#### InitRestController 核心流程：

```java
@GetMapping("/upload/init")
public ApiResponse<UploadInitVO> uploadInit(
        @RequestParam("params") String params,
        @RequestParam(value = "lang", defaultValue = "zh_CN") String lang,
        HttpServletRequest request, HttpServletResponse response) {
    
    // 1. DNS校验
    PageHelper.getInstance(PageHelper.class).validRequestDNS(request);
    
    // 2. 验证请求并获取请求信息
    RequestInfo reqInfo = ValidHelper.validRequest(request, true);
    
    // 3. 构建响应数据
    UploadInitVO vo = buildUploadInitVO(request, response, params, mLang, reqInfo);
    
    return ApiResponse.success(vo);
}
```

#### FileDownloadRestController 核心流程：

```java
@GetMapping("/download")
public void downloadFile(
        @RequestParam("fileName") String fileName,
        @RequestParam(value = "relativeDir", defaultValue = "") String relativeDir,
        @RequestParam("params") String params,
        HttpServletRequest request, HttpServletResponse response) {
    
    // 1. 验证Token
    TokenDataVO tokenData = ValidHelper.validToken(request);
    
    // 2. 验证请求信息
    RequestInfo reqInfo = ValidHelper.validRequest(request, tokenData, false);
    
    // 3. 黑名单校验
    blacklistCharHandler.blacklistMatcher(fileName, "fileName is " + fileName);
    
    // 4. 获取文件路径并校验合法性
    String filePath = getFilePath(reqInfo, relativeDir, fileName);
    if (!isPathValid(filePath, reqInfo)) { return; }
    
    // 5. 记录下载开始
    Long recordId = recordDownloadStart(request, reqInfo, fileName, relativeDir, fileSize);
    
    // 6. 执行下载（流式输出）
    doDownload(file, response);
    
    // 7. 记录下载完成
    updateRecordForFileDownload(reqInfo.getApplicationId(), reqInfo.getTransferId(), recordId);
}
```

### 4. 前端调用示例

```typescript
// 初始化获取Token
const initUpload = async (params: string) => {
  const res = await fetch(`/api/upload/init?params=${params}&lang=zh_CN`);
  const { data } = await res.json();
  sessionStorage.setItem('trans_token', data.token);
  return data;
};

// 使用fetch下载文件（支持进度显示）
const downloadFile = async (fileName: string, relativeDir: string, params: string) => {
  const token = sessionStorage.getItem('trans_token');
  const url = `/api/file/download?fileName=${encodeURIComponent(fileName)}&relativeDir=${encodeURIComponent(relativeDir)}&params=${params}`;
  
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  // 获取文件大小用于计算进度
  const contentLength = response.headers.get('Content-Length');
  const total = parseInt(contentLength, 10);
  let loaded = 0;
  
  // 创建可读流读取并显示进度
  const reader = response.body.getReader();
  const chunks = [];
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.length;
    const progress = (loaded / total * 100).toFixed(1);
    console.log(`下载进度: ${progress}%`);
  }
  
  // 合并chunks并下载
  const blob = new Blob(chunks);
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = fileName;
  a.click();
};
```

---

## 二十三、下一步行动

1. ~~**获取 UploadPage.js 和 DownloadPage.js**~~ - ✅ 已完成分析
2. ~~**设计新接口规范**~~ - ✅ 已完成
3. ~~**分析 FileListRestController**~~ - ✅ 已完成
4. **确认外网场景方案** - 后续讨论
5. ~~**实现后端新增接口**~~ - ✅ 已完成（见第二十二节）
6. **前端Vue工程对接** - 使用新增接口重构前端
7. **测试验证** - 集成测试新增接口
