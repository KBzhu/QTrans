# task_P1 - 类型定义与工具层

> 对应需求：9.2.3 TypeScript 规范
> 前置依赖：P0.4（目录结构）
> 预估工时：6h

---

## 任务目标

定义全局 TypeScript 类型体系，实现可复用的工具函数、常量定义和 Axios 请求封装。所有类型严格禁止 `any`，每个工具函数均需对应单元测试。

---

## 子任务清单

### P1.1 TypeScript 类型定义（2h）

- [ ] 创建 `src/types/common.ts` - 通用类型
  ```typescript
  // ApiResponse<T>、PageRequest、PageResponse<T>、StatusEnum 等
  ```
- [ ] 创建 `src/types/user.ts` - 用户相关类型
  ```typescript
  // User、UserRole、UserStatus 等
  ```
- [ ] 创建 `src/types/application.ts` - 申请单相关类型
  ```typescript
  // Application、TransferType、ApplicationStatus、UrgencyLevel 等
  ```
- [ ] 创建 `src/types/file.ts` - 文件相关类型
  ```typescript
  // FileInfo、FileStatus、UploadProgress、FileChunk、FileMeta 等
  ```
- [ ] 创建 `src/types/approval.ts` - 审批相关类型
  ```typescript
  // ApprovalRecord、ApprovalAction、ApprovalLevel 等
  ```
- [ ] 创建 `src/types/notification.ts` - 通知相关类型
  ```typescript
  // Notification、NotificationType 等
  ```
- [ ] 创建 `src/types/index.ts` - 统一导出所有类型
- [ ] 确保所有类型无 `any`，使用 `unknown` 替代不确定类型

**验收标准：** `tsc --noEmit` 无类型错误

---

### P1.2 工具函数实现（2h）

- [ ] 创建 `src/utils/format.ts` - 格式化工具
  - `formatFileSize(bytes: number): string` - 文件大小格式化（B/KB/MB/GB）
  - `formatDateTime(time: string | number): string` - 日期时间格式化
  - `formatDuration(seconds: number): string` - 时长格式化
  - `formatTransferSpeed(bytesPerSec: number): string` - 传输速度格式化
- [ ] 创建 `src/utils/validate.ts` - 验证工具
  - `isValidEmail(email: string): boolean`
  - `isValidPhone(phone: string): boolean`
  - `isValidFileName(name: string): boolean` - 校验文件名特殊字符
  - `isAllowedFileType(name: string, allowList: string[]): boolean`
- [ ] 创建 `src/utils/storage.ts` - 存储工具
  - `getLocalStorage<T>(key: string): T | null`
  - `setLocalStorage<T>(key: string, value: T): void`
  - `removeLocalStorage(key: string): void`
  - `clearLocalStorage(): void`
- [ ] 创建 `src/utils/file.ts` - 文件工具
  - `getFileExtension(fileName: string): string`
  - `generateFileId(file: File): string` - 基于文件名+大小+修改时间生成唯一ID
  - `calculateChunkCount(fileSize: number, chunkSize: number): number`
- [ ] 创建 `src/utils/index.ts` - 统一导出

**验收标准：** 每个函数有对应单元测试，覆盖率 ≥ 80%

---

### P1.3 常量定义（1h）

- [ ] 创建 `src/utils/constants.ts`
  ```typescript
  // 文件相关
  export const MAX_FILE_SIZE = 50 * 1024 * 1024 * 1024 // 50GB
  export const CHUNK_SIZE = 5 * 1024 * 1024 // 5MB
  export const MAX_CONCURRENT_UPLOADS = 3
  export const MAX_FILES_PER_APPLICATION = 100

  // 传输类型
  export const TRANSFER_TYPES = { ... } as const

  // 申请单状态
  export const APPLICATION_STATUS = { ... } as const

  // 审批层级
  export const APPROVAL_LEVEL_MAP = { ... } as const

  // 禁止上传的文件类型
  export const FORBIDDEN_FILE_TYPES = ['.exe', '.bat', '.cmd', '.sh', '.ps1']

  // 路由名称
  export const ROUTE_NAMES = { ... } as const

  // LocalStorage Key
  export const STORAGE_KEYS = { ... } as const
  ```
- [ ] 所有常量使用 `as const` 确保字面量类型推导

**验收标准：** 无魔法字符串，所有常量可 TypeScript 类型推导

---

### P1.4 Axios 封装（1h）

- [ ] 创建 `src/utils/request.ts`
  - 创建 Axios 实例，配置 `baseURL`、`timeout`
  - 请求拦截器：自动附加 `Authorization: Bearer {token}`
  - 响应拦截器：统一处理 `ApiResponse<T>` 解包
  - 响应拦截器：处理 401（跳登录）、403（跳权限页）、500（全局错误提示）
  - 导出 `request.get<T>()`, `request.post<T>()`, `request.put<T>()`, `request.delete<T>()` 泛型方法
- [ ] 在 `src/api/auth.ts` 中使用 `request` 实现第一个接口（验证封装正确性）

**验收标准：** 401 响应自动跳转登录页，500 响应显示全局错误提示

---

## 测试要求

```typescript
// src/utils/__tests__/format.spec.ts
describe('formatFileSize', () => {
  it('formats bytes correctly', () => {
    expect(formatFileSize(1024)).toBe('1 KB')
    expect(formatFileSize(1024 * 1024)).toBe('1 MB')
    expect(formatFileSize(1.5 * 1024 * 1024 * 1024)).toBe('1.5 GB')
  })
})

// src/utils/__tests__/validate.spec.ts
describe('isValidFileName', () => {
  it('rejects special characters', () => {
    expect(isValidFileName('file/name.txt')).toBe(false)
    expect(isValidFileName('normal_file.txt')).toBe(true)
  })
})

// src/utils/__tests__/file.spec.ts
describe('generateFileId', () => {
  it('generates consistent id for same file', () => {
    const file = new File(['content'], 'test.txt')
    expect(generateFileId(file)).toBe(generateFileId(file))
  })
})
```

---

## 完成标志

- [ ] 所有子任务勾选完毕
- [ ] `tsc --noEmit` 无错误
- [ ] 工具函数单元测试覆盖率 ≥ 80%
