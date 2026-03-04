# task_P2 - Mock数据层

> 对应需求：设计文档 3. Mock数据与API模拟设计
> 前置依赖：P1.1（类型定义）
> 预估工时：12h

---

## 任务目标

构建完整的前端 Mock 数据体系：IndexedDB 本地文件存储、MSW 拦截器、Demo 种子数据。实现文件分片上传的完整本地模拟逻辑。

---

## 子任务清单

### P2.1 IndexedDB 数据库设计（2h）

- [√] 安装并确认 `dexie` 依赖已安装
- [√] 创建 `src/mocks/db.ts`

  - 定义 `FileChunk` 接口（fileId, chunkIndex, chunkData, chunkHash, uploadTime）
  - 定义 `FileMeta` 接口（fileId, fileName, fileSize, fileType, totalChunks, uploadedChunks, md5, applicationId, status, createTime, updateTime）
  - 创建 `QTransDB extends Dexie` 类
  - 配置版本 1 的索引：`fileChunks: '++id, fileId, chunkIndex'`
  - 导出单例 `db` 实例
- [√] 创建 `src/composables/useFileChunk.ts`

  - `CHUNK_SIZE = 5MB` 常量
  - `calculateChunks(file: File): number`
  - `sliceFile(file: File, index: number): Blob`
  - `calculateChunkHash(chunk: Blob): Promise<string>` - 使用 Web Crypto API SHA-256

**验收标准：** 可向 IndexedDB 写入分片并读取，无类型错误

---

### P2.2 Mock 数据准备（3h）

- [√] 创建 `src/mocks/data/users.ts` - 5 个 Demo 用户数据

  - `submitter` / `approver1` / `approver2` / `approver3` / `admin`
  - 包含完整字段：id, username, password, name, email, phone, department, roles, status
- [√] 创建 `src/mocks/data/departments.ts` - 部门树数据

  - 5 个一级部门（研发部、技术部、安全部、管理部、IT部）
  - 每个一级部门有 0-2 个子部门
- [√] 创建 `src/mocks/data/cities.ts` - 国家城市数据

  - 中国（北京/上海/广州/深圳/成都）
  - 美国（纽约/洛杉矶/芝加哥）
  - 日本（东京/大阪）
  - 新加坡（新加坡）
  - 每个城市包含 dataCenter 字段（就近数据站点）
- [√] 创建 `src/mocks/data/applications.ts` - 示例申请单数据（5条）

  - 覆盖不同状态：completed / pending_approval / transferring / draft / rejected
- [√] 创建 `src/mocks/data/index.ts` - 统一导出所有 Mock 数据
- [√] 创建 `src/mocks/data/demo-init.ts` - Demo 数据初始化函数 `initDemoData()`


**验收标准：** Demo 数据覆盖所有演示场景，字段与类型定义一致

---

### P2.3 MSW Handler 实现（4h）

- [√] 创建 `src/mocks/browser.ts` - MSW Service Worker 配置

  ```typescript
  import { setupWorker } from 'msw/browser'
  import { handlers } from './handlers'
  export const worker = setupWorker(...handlers)
  ```
- [√] 执行 `npx msw init public/ --save` 生成 Service Worker 文件
- [√] 在 `src/main.ts` 中条件启动 MSW（仅开发环境）

- [√] 创建 `src/mocks/handlers/auth.ts`
  - `POST /api/auth/login` - 验证账号密码，返回 token + user，模拟 500ms 延迟

  - `POST /api/auth/logout` - 返回成功
  - `POST /api/auth/refresh` - 返回新 token
- [√] 创建 `src/mocks/handlers/application.ts`

  - `GET /api/applications` - 分页返回申请单列表，支持 status/transferType 筛选
  - `GET /api/applications/:id` - 返回申请单详情
  - `POST /api/applications` - 创建申请单，自动生成 applicationNo
  - `PUT /api/applications/:id` - 更新申请单
  - `DELETE /api/applications/:id` - 删除申请单
  - `POST /api/applications/:id/save-draft` - 保存草稿
  - `GET /api/applications/drafts` - 获取草稿列表
- [√] 创建 `src/mocks/handlers/approval.ts`

  - `GET /api/approvals/pending` - 返回当前用户待审批列表
  - `POST /api/approvals/:id/approve` - 审批通过，更新状态
  - `POST /api/approvals/:id/reject` - 审批驳回，添加驳回记录
  - `POST /api/approvals/:id/skip` - 免审通过
- [√] 创建 `src/mocks/handlers/file.ts`

  - `POST /api/files/upload` - 接收分片，模拟 200ms 延迟
  - `POST /api/files/merge` - 合并分片（伪实现，返回成功）
  - `GET /api/files/:id/chunks` - 返回已上传的分片列表（断点续传用）
  - `DELETE /api/files/:id` - 删除文件
  - `GET /api/files/:id/download` - 返回文件下载链接（模拟）
- [√] 创建 `src/mocks/handlers/user.ts`

  - `GET /api/users` - 返回用户列表，支持搜索
  - `POST /api/users` - 创建用户
  - `PUT /api/users/:id` - 更新用户
  - `PUT /api/users/:id/status` - 切换用户状态
- [√] 创建 `src/mocks/handlers/department.ts`

  - `GET /api/departments/tree` - 返回部门树
- [√] 创建 `src/mocks/handlers/city.ts`

  - `GET /api/cities/list` - 返回城市列表（级联格式）
  - `GET /api/cities/search` - 搜索城市
- [√] 创建 `src/mocks/handlers/notification.ts`

  - `GET /api/notifications` - 返回通知列表
  - `PUT /api/notifications/:id/read` - 标记已读
  - `PUT /api/notifications/read-all` - 全部已读
- [√] 创建 `src/mocks/handlers/index.ts` - 合并所有 handlers


**验收标准：** 登录接口可正常调用，返回 Mock 用户数据；所有接口有正确的延迟和错误模拟

---

### P2.4 文件分片上传逻辑（3h）

- [√] 创建 `src/composables/useFileUpload.ts`

  - `uploadFile(file, applicationId, onProgress): Promise<string>` - 主上传函数
  - 实现：文件唯一 ID 生成 → 查询已上传分片 → 跳过已完成分片 → 逐片上传 → 更新进度 → 完成合并
  - 支持暂停（`isPaused` 标志位检查）
  - 支持取消（清除 IndexedDB 记录）
- [√] 创建 `src/composables/useTransferSimulator.ts`

  - `simulateTransfer(applicationId, fileSize, onProgress, onComplete): () => void`
  - 使用 `setInterval` 模拟 10-15s 传输
  - 进度有随机波动（±2%），速度有随机浮动
  - 返回取消函数

**验收标准：** 文件上传可暂停/继续，刷新页面后可从断点恢复

---

## 测试要求

```typescript
// src/composables/__tests__/useFileChunk.spec.ts
describe('useFileChunk', () => {
  it('calculates correct chunk count', () => {
    const { calculateChunks, CHUNK_SIZE } = useFileChunk()
    const file = new File(['x'.repeat(CHUNK_SIZE * 2 + 1)], 'test.bin')
    expect(calculateChunks(file)).toBe(3)
  })

  it('slices file correctly', () => {
    const { sliceFile, CHUNK_SIZE } = useFileChunk()
    const file = new File(['x'.repeat(CHUNK_SIZE + 100)], 'test.bin')
    const chunk0 = sliceFile(file, 0)
    const chunk1 = sliceFile(file, 1)
    expect(chunk0.size).toBe(CHUNK_SIZE)
    expect(chunk1.size).toBe(100)
  })
})

// src/composables/__tests__/useTransferSimulator.spec.ts
describe('useTransferSimulator', () => {
  it('completes transfer and calls onComplete', async () => {
    vi.useFakeTimers()
    const { simulateTransfer } = useTransferSimulator()
    const onComplete = vi.fn()
    simulateTransfer('app001', 100 * 1024 * 1024, vi.fn(), onComplete)
    await vi.runAllTimersAsync()
    expect(onComplete).toHaveBeenCalledOnce()
  })
})
```

---

## 完成标志

- [√] 所有子任务勾选完毕
- [√] MSW 可正常拦截所有接口

- [ ] 登录/申请单/审批接口联调通过
- [ ] 文件分片写入 IndexedDB，断点续传可复现
