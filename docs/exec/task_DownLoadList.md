# 待我下载列表 — 执行记录

## 一、变更概述

将"待我下载"列表从 Mock 数据方案切换为对接真实后端接口，同时保留字段差异兜底处理。

---

## 二、涉及文件

| 文件 | 变更类型 | 说明 |
|---|---|---|
| `src/api/application.ts` | 新增 | 新增 `WaitingDownloadItem`、`RealPageVO`、`WaitingDownloadResponse` 类型；新增 `getWaitingDownloadList` 接口方法 |
| `src/utils/request.ts` | 新增 | 新增 `request.rawGet` 方法，支持 rawClient 发送 GET 请求 |
| `src/composables/useDownloadList.ts` | 重写 | 接入真实接口，移除 applicationStore/fileStore 依赖，增加前端过滤逻辑 |
| `src/views/download/DownloadListView.vue` | 重写 | 适配真实字段，新增申请状态、下载状态列 |

---

## 三、真实接口信息

- **接口**：`GET /workflowService/services/frontendService/frontend/waitingForDownload/page/{pageSize}/{pageNum}`
- **认证**：请求头 `token: <登录后获取的 token>`，由 `rawClient` 拦截器自动注入
- **分页参数**：路径参数，`pageSize` 在前，`pageNum` 在后

**响应结构：**
```json
{
  "pageVO": {
    "totalRows": 7,
    "curPage": 1,
    "pageSize": 10,
    "totalPages": 1
  },
  "result": [ /* WaitingDownloadItem[] */ ]
}
```

---

## 四、字段差异说明

| 场景 | 真实字段 | 原 Mock 字段 | 处理方式 |
|---|---|---|---|
| 申请单 ID | `applicationId` | `id` / `applicationNo` | 直接使用 `applicationId` |
| 申请人 | `applicantW3Account`（账号） | `applicantName`（姓名） | 显示账号，列名改为"申请人账号" |
| 创建时间 | `creationDate`（`YYYY-MM-DD HH:mm:ss`） | `createdAt` | 直接使用，`-` 替换为 `/` 展示 |
| 结束时间 | `downloadEndDate` | `downloadExpireTime` | 直接使用，`-` 替换为 `/` 展示 |
| 申请状态 | `currentStatus`（英文字符串，如 `"Notification Download"`） | `status` 枚举 | 本地 map 转中文；筛选选项值改为英文原值 |
| 下载状态 | `downloadStatus`（`"Wait Download"` / `"Downloading"` / `"Downloaded"`） | `DownloadStatus` 枚举 | 本地 map 转 `not_started` / `partial` / `completed` |
| 申请原因 | `reason` | `applyReason` | 直接使用 `reason` |
| 申请类型 | `transWay`（如 `"Green Zone,Green Zone"`） | `transferType` 枚举 | 逗号拆分，英文区域名转中文，`→` 拼接展示 |
| **文件数** | ❌ 接口未返回 | `fileStore` 获取 | **暂用 mock 填充 0，待文件列表接口补充** |
| 下载方式 | `downloadUrl`（跳转链接） | fileStore Blob 流 | 改为 `window.open(downloadUrl, '_blank')` |

---

## 五、开发快速上手

### 本地联调前置条件

1. 确保后端服务运行在 `http://localhost.huawei.com:8109`
2. 确保 `vite.config.ts` 的代理或 `VITE_API_BASE_URL` 已正确配置（rawClient `baseURL` 为空，直接走绝对路径）
3. 先调用登录接口获取 token，token 会自动存入 Pinia `authStore.token`，rawClient 拦截器会自动注入到请求头 `token`

### 核心数据流

```
fetchList()
  └─ applicationApi.getWaitingDownloadList(pageSize, pageNum)
       └─ rawClient.get(...)  // 自动注入 token
            └─ 响应 { pageVO, result[] }
                 └─ rawList.value = result
                      └─ applyFilters()  // 前端关键字/状态过滤
                           └─ listData.value  // 渲染到表格
```

### 下载逻辑

点击下载按钮 → `handleDownloadApplication(applicationId)` → 从 `rawList` 找到对应记录 → `window.open(record.downloadUrl, '_blank')`

> 注意：`downloadUrl` 为完整 URL（含 `params` token），直接跳转即可，不需要额外鉴权。

---

## 六、测试 QA 回归步骤

### 前置条件

- 使用有"待下载"数据的账号登录（如 `ywx1420846`）

### 回归步骤

| 步骤 | 操作 | 预期结果 |
|---|---|---|
| 1 | 进入"待我下载"页面 | 表格加载中显示 loading，加载完成后展示真实数据；总条数与后端 `totalRows` 一致 |
| 2 | 检查列内容 | 申请单号、申请人账号、申请类型（中文区域名）、申请原因、创建时间、结束时间均正确展示 |
| 3 | 在搜索框输入申请单号关键字，回车 | 表格仅显示包含该关键字的记录 |
| 4 | 切换"申请状态"下拉为"通知下载" | 表格仅显示 `currentStatus = "Notification Download"` 的记录 |
| 5 | 切换"下载状态"下拉为"未下载" | 表格仅显示 `downloadStatus = "Wait Download"` 的记录 |
| 6 | 点击"重置"按钮 | 所有筛选条件清空，重新请求接口，数据恢复完整列表 |
| 7 | 切换分页（如选 20 条/页） | 重新请求接口，`pageSize` 参数更新为 20 |
| 8 | 点击某条记录的"下载"图标 | 新标签页打开 `downloadUrl`；若 `downloadUrl` 为空则弹出 warning 提示 |
| 9 | 点击某条记录的"查看"图标 | 跳转到 `/application/{applicationId}` 详情页 |
| 10 | 网络异常或 token 失效时 | 显示错误 Toast："获取待下载列表失败" |

---

## 七、待办 / 已知问题

- [ ] **文件数列**：真实接口未返回文件数，当前固定显示 `0`，需等待文件列表接口后补充
- [ ] **下载状态持久化**：当前下载状态仅依赖接口返回的 `downloadStatus` 字段，未做本地记录
