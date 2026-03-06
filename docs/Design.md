# B端企业跨安全域大文件传输平台 - 设计文档

## 文档信息

| 项目名称 | B端企业跨安全域大文件传输平台 - 前端设计 |
|---------|--------------------------------------|
| 文档版本 | v1.0 |
| 创建日期 | 2026-03-02 |
| 文档类型 | Design（设计文档） |
| 编写人 | AI Assistant |
| 依据文档 | Requirements v1.0 |

---

## 1. 设计概述

### 1.1 设计目标

本设计文档针对**前端演示系统**，实现完整的业务流程演示，包括：
- 完整的前端交互界面
- 基于Mock数据的业务流程模拟
- 文件上传/传输的可视化演示
- 多角色切换演示
- 审批流程完整演示

### 1.2 技术范围

**包含：**
- Vue 3前端应用完整实现
- Mock数据和API模拟
- 前端状态管理
- 文件上传模拟（断点续传演示）
- 传输进度模拟
- 本地存储持久化

**不包含：**
- 真实后端服务
- 数据库设计
- 真实的跨域传输
- 真实的文件加密

### 1.3 演示策略

采用**前端全栈模拟**方案：
- 使用MSW (Mock Service Worker)模拟API
- 使用IndexedDB存储文件分片
- 使用LocalStorage/SessionStorage存储业务数据
- 使用Pinia管理应用状态
- 使用定时器模拟异步传输过程

---

## 2. 技术架构设计

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                        用户界面层                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │ 登录页面  │  │ 申请单页  │  │ 审批页面 │ │ 管理页面 │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                        组件层                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │ 表单组件  │  │ 上传组件  │  │ 选择器    │  │ 进度条    │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     状态管理层 (Pinia)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │ 用户Store │  │ 申请单Store│  │ 文件Store │  │ 审批Store │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     API模拟层 (MSW)                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ 认证API   │  │ 申请单API │  │ 文件API   │  │ 审批API   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     数据持久化层                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
│  │LocalStorage│  │IndexedDB  │  │SessionStorage│             │
│  │(业务数据)  │  │(文件分片)  │  │(会话数据)   │             │
│  └──────────┘  └──────────┘  └──────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 技术栈详细

| 类别 | 技术 | 版本 | 用途 |
|-----|------|------|------|
| 核心框架 | Vue 3 | ^3.5.13 | 前端框架 |
| 开发语言 | TypeScript | ^5.9.2 | 类型安全 |
| 构建工具 | Vite | ^7.1.11 | 开发构建 |
| UI组件库 | ArcoDesign Vue | ^2.57.0 | UI组件 |
| 路由管理 | Vue Router | ^4.2.0 | 路由管理 |
| 状态管理 | Pinia | ^2.2.2 | 状态管理 |
| 状态持久化 | pinia-plugin-persistedstate | ^3.2.0 | 状态持久化 |
| HTTP客户端 | Axios | ^1.13.0 | HTTP请求 |
| Mock工具 | MSW | ^2.0.0 | API模拟 |
| 文件存储 | Dexie.js | ^3.2.0 | IndexedDB封装 |
| 样式预处理 | SCSS | - | 样式编写 |
| 工具库 | lodash-es | ^4.17.21 | 工具函数 |
| 日期处理 | dayjs | ^1.11.10 | 日期处理 |
| 代码规范 | ESLint + Prettier | - | 代码规范 |
| Git钩子 | Husky + lint-staged | - | 提交检查 |
| 单元测试 | Vitest | ^4.0.17 | 单元测试 |

### 2.3 目录结构设计

```
qtrans-frontend/
├── .husky/                      # Git钩子配置
├── .vscode/                     # VSCode配置
├── docs/                        # 文档
│   ├── Requirements.md          # 需求文档
│   ├── Design.md               # 设计文档
│   └── TaskList.md             # 任务清单
├── public/                      # 静态资源
│   ├── favicon.ico
│   └── mock-data/              # Mock数据文件
├── src/
│   ├── api/                    # API接口定义
│   │   ├── auth.ts             # 认证API
│   │   ├── application.ts      # 申请单API
│   │   ├── file.ts             # 文件API
│   │   ├── approval.ts         # 审批API
│   │   ├── user.ts             # 用户API
│   │   ├── department.ts       # 部门API
│   │   ├── city.ts             # 城市API
│   │   └── index.ts            # API统一导出
│   ├── assets/                 # 静态资源
│   │   ├── images/             # 图片
│   │   ├── icons/              # 图标
│   │   └── styles/             # 全局样式
│   │       ├── variables.scss  # SCSS变量
│   │       ├── mixins.scss     # SCSS混入
│   │       └── global.scss     # 全局样式
│   ├── components/             # 公共组件
│   │   ├── common/             # 通用组件
│   │   │   ├── AppHeader.vue   # 头部
│   │   │   ├── AppSidebar.vue  # 侧边栏
│   │   │   ├── AppFooter.vue   # 底部
│   │   │   └── PageContainer.vue # 页面容器
│   │   ├── business/           # 业务组件
│   │   │   ├── DepartmentSelector.vue  # 部门选择器
│   │   │   ├── CitySelector.vue        # 城市选择器
│   │   │   ├── UserSelector.vue        # 用户选择器
│   │   │   ├── FileUploader.vue        # 文件上传器
│   │   │   ├── FileList.vue            # 文件列表
│   │   │   ├── ApprovalTimeline.vue    # 审批时间线
│   │   │   ├── TransferProgress.vue    # 传输进度
│   │   │   └── StatusBadge.vue         # 状态徽章
│   │   └── index.ts            # 组件统一导出
│   ├── composables/            # 组合式函数
│   │   ├── useAuth.ts          # 认证逻辑
│   │   ├── usePermission.ts    # 权限逻辑
│   │   ├── useFileUpload.ts    # 文件上传逻辑
│   │   ├── useFileChunk.ts     # 文件分片逻辑
│   │   ├── useTransferSimulator.ts # 传输模拟逻辑
│   │   └── useNotification.ts  # 通知逻辑
│   ├── layouts/                # 布局组件
│   │   ├── DefaultLayout.vue   # 默认布局
│   │   ├── BlankLayout.vue     # 空白布局
│   │   └── index.ts
│   ├── mocks/                  # Mock数据和处理器
│   │   ├── handlers/           # MSW处理器
│   │   │   ├── auth.ts         # 认证Mock
│   │   │   ├── application.ts  # 申请单Mock
│   │   │   ├── file.ts         # 文件Mock
│   │   │   ├── approval.ts     # 审批Mock
│   │   │   ├── user.ts         # 用户Mock
│   │   │   ├── department.ts   # 部门Mock
│   │   │   └── city.ts         # 城市Mock
│   │   ├── data/               # Mock数据
│   │   │   ├── users.ts        # 用户数据
│   │   │   ├── departments.ts  # 部门数据
│   │   │   ├── cities.ts       # 城市数据
│   │   │   └── applications.ts # 申请单数据
│   │   ├── db.ts               # IndexedDB封装
│   │   ├── browser.ts          # MSW浏览器配置
│   │   └── index.ts
│   ├── router/                 # 路由配置
│   │   ├── routes.ts           # 路由表
│   │   ├── guards.ts           # 路由守卫
│   │   └── index.ts
│   ├── stores/                 # Pinia状态管理
│   │   ├── auth.ts             # 认证Store
│   │   ├── application.ts      # 申请单Store
│   │   ├── file.ts             # 文件Store
│   │   ├── approval.ts         # 审批Store
│   │   ├── user.ts             # 用户Store
│   │   ├── notification.ts     # 通知Store
│   │   └── index.ts
│   ├── types/                  # TypeScript类型定义
│   │   ├── api.ts              # API类型
│   │   ├── application.ts      # 申请单类型
│   │   ├── file.ts             # 文件类型
│   │   ├── user.ts             # 用户类型
│   │   ├── approval.ts         # 审批类型
│   │   ├── common.ts           # 通用类型
│   │   └── index.ts
│   ├── utils/                  # 工具函数
│   │   ├── request.ts          # Axios封装
│   │   ├── storage.ts          # 存储工具
│   │   ├── format.ts           # 格式化工具
│   │   ├── validate.ts         # 验证工具
│   │   ├── file.ts             # 文件工具
│   │   ├── constants.ts        # 常量定义
│   │   └── index.ts
│   ├── views/                  # 页面组件
│   │   ├── login/              # 登录
│   │   │   └── index.vue
│   │   ├── dashboard/          # 首页
│   │   │   └── index.vue
│   │   ├── transfer/           # 传输
│   │   │   └── select-type.vue # 选择传输类型
│   │   ├── applications/       # 申请单
│   │   │   ├── index.vue       # 申请单列表
│   │   │   ├── create.vue      # 创建申请单
│   │   │   ├── detail.vue      # 申请单详情
│   │   │   ├── upload.vue      # 上传文件
│   │   │   └── drafts.vue      # 草稿箱
│   │   ├── approvals/          # 审批
│   │   │   ├── index.vue       # 待审批列表
│   │   │   └── detail.vue      # 审批详情
│   │   ├── transfers/          # 传输管理
│   │   │   └── index.vue
│   │   ├── users/              # 用户管理
│   │   │   └── index.vue
│   │   ├── settings/           # 系统配置
│   │   │   └── index.vue
│   │   ├── logs/               # 日志审计
│   │   │   └── index.vue
│   │   ├── profile/            # 个人中心
│   │   │   └── index.vue
│   │   ├── notifications/      # 消息中心
│   │   │   └── index.vue
│   │   └── error/              # 错误页面
│   │       ├── 403.vue
│   │       └── 404.vue
│   ├── App.vue                 # 根组件
│   ├── main.ts                 # 入口文件
│   └── env.d.ts                # 环境变量类型
├── .env.development            # 开发环境变量
├── .env.production             # 生产环境变量
├── .eslintrc.cjs               # ESLint配置
├── .prettierrc.json            # Prettier配置
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json               # TypeScript配置
├── tsconfig.node.json
├── vite.config.ts              # Vite配置
└── README.md
```

---

## 3. Mock数据与API模拟设计

### 3.1 Mock方案选择

采用**MSW (Mock Service Worker)**方案：

**优势：**
- 拦截网络请求，无需修改业务代码
- 支持开发和测试环境
- 可模拟真实的网络延迟
- 支持复杂的业务逻辑
- 易于切换到真实API

**架构：**
```
前端代码 → Axios → MSW拦截 → Mock Handler → 返回Mock数据
```

### 3.2 数据存储方案

| 数据类型 | 存储方式 | 用途 | 持久化 |
|---------|---------|------|--------|
| 用户信息 | LocalStorage | 登录状态、用户信息 | 是 |
| Token | LocalStorage | 认证令牌 | 是 |
| 申请单列表 | Pinia + LocalStorage | 申请单数据 | 是 |
| 文件分片 | IndexedDB | 文件分片存储 | 是 |
| 上传进度 | Pinia | 上传进度状态 | 否 |
| 传输进度 | Pinia | 传输进度状态 | 否 |
| 草稿数据 | LocalStorage | 草稿保存 | 是 |
| 通知消息 | Pinia + LocalStorage | 消息通知 | 是 |

### 3.3 IndexedDB数据库设计

使用Dexie.js封装IndexedDB，设计如下：

```typescript
// src/mocks/db.ts
import Dexie, { Table } from 'dexie'

// 文件分片接口
interface FileChunk {
  id?: number
  fileId: string          // 文件唯一标识
  chunkIndex: number      // 分片索引
  chunkData: Blob         // 分片数据
  chunkHash: string       // 分片哈希
  uploadTime: number      // 上传时间
}

// 文件元数据接口
interface FileMeta {
  id?: number
  fileId: string          // 文件唯一标识
  fileName: string        // 文件名
  fileSize: number        // 文件大小
  fileType: string        // 文件类型
  totalChunks: number     // 总分片数
  uploadedChunks: number  // 已上传分片数
  md5: string            // 文件MD5
  applicationId: string   // 所属申请单ID
  status: string         // 状态
  createTime: number     // 创建时间
  updateTime: number     // 更新时间
}

class QTransDB extends Dexie {
  fileChunks!: Table<FileChunk>
  fileMetas!: Table<FileMeta>

  constructor() {
    super('QTransDB')
    this.version(1).stores({
      fileChunks: '++id, fileId, chunkIndex',
      fileMetas: '++id, fileId, applicationId'
    })
  }
}

export const db = new QTransDB()
```

### 3.4 Mock数据设计

#### 3.4.1 用户Mock数据

```typescript
// src/mocks/data/users.ts
export const mockUsers = [
  {
    id: 'user001',
    username: 'submitter',
    password: '123456',
    name: '张三',
    email: 'zhangsan@company.com',
    phone: '13800138000',
    department: 'dept001',
    departmentName: '研发部',
    roles: ['submitter'],
    status: 'active',
    createTime: '2026-01-01T00:00:00Z'
  },
  {
    id: 'user002',
    username: 'approver1',
    password: '123456',
    name: '李四',
    email: 'lisi@company.com',
    phone: '13800138001',
    department: 'dept002',
    departmentName: '技术部',
    roles: ['approver_level1'],
    status: 'active',
    createTime: '2026-01-01T00:00:00Z'
  },
  {
    id: 'user003',
    username: 'approver2',
    password: '123456',
    name: '王五',
    email: 'wangwu@company.com',
    phone: '13800138002',
    department: 'dept003',
    departmentName: '安全部',
    roles: ['approver_level2'],
    status: 'active',
    createTime: '2026-01-01T00:00:00Z'
  },
  {
    id: 'user004',
    username: 'approver3',
    password: '123456',
    name: '赵六',
    email: 'zhaoliu@company.com',
    phone: '13800138003',
    department: 'dept004',
    departmentName: '管理部',
    roles: ['approver_level3'],
    status: 'active',
    createTime: '2026-01-01T00:00:00Z'
  },
  {
    id: 'user005',
    username: 'admin',
    password: '123456',
    name: '管理员',
    email: 'admin@company.com',
    phone: '13800138004',
    department: 'dept005',
    departmentName: 'IT部',
    roles: ['admin'],
    status: 'active',
    createTime: '2026-01-01T00:00:00Z'
  }
]
```

#### 3.4.2 部门Mock数据

```typescript
// src/mocks/data/departments.ts
export const mockDepartments = [
  {
    id: 'dept001',
    name: '研发部',
    parentId: null,
    level: 1,
    children: [
      { id: 'dept001-01', name: '前端组', parentId: 'dept001', level: 2 },
      { id: 'dept001-02', name: '后端组', parentId: 'dept001', level: 2 }
    ]
  },
  {
    id: 'dept002',
    name: '技术部',
    parentId: null,
    level: 1,
    children: [
      { id: 'dept002-01', name: '架构组', parentId: 'dept002', level: 2 },
      { id: 'dept002-02', name: '测试组', parentId: 'dept002', level: 2 }
    ]
  },
  {
    id: 'dept003',
    name: '安全部',
    parentId: null,
    level: 1,
    children: []
  },
  {
    id: 'dept004',
    name: '管理部',
    parentId: null,
    level: 1,
    children: []
  },
  {
    id: 'dept005',
    name: 'IT部',
    parentId: null,
    level: 1,
    children: []
  }
]
```

#### 3.4.3 城市Mock数据

```typescript
// src/mocks/data/cities.ts
export const mockCities = [
  {
    country: '中国',
    countryCode: 'CN',
    cities: [
      { id: 'cn-beijing', name: '北京', code: 'BJ', dataCenter: 'dc-cn-north' },
      { id: 'cn-shanghai', name: '上海', code: 'SH', dataCenter: 'dc-cn-east' },
      { id: 'cn-guangzhou', name: '广州', code: 'GZ', dataCenter: 'dc-cn-south' },
      { id: 'cn-shenzhen', name: '深圳', code: 'SZ', dataCenter: 'dc-cn-south' },
      { id: 'cn-chengdu', name: '成都', code: 'CD', dataCenter: 'dc-cn-west' }
    ]
  },
  {
    country: '美国',
    countryCode: 'US',
    cities: [
      { id: 'us-newyork', name: '纽约', code: 'NY', dataCenter: 'dc-us-east' },
      { id: 'us-losangeles', name: '洛杉矶', code: 'LA', dataCenter: 'dc-us-west' },
      { id: 'us-chicago', name: '芝加哥', code: 'CHI', dataCenter: 'dc-us-central' }
    ]
  },
  {
    country: '日本',
    countryCode: 'JP',
    cities: [
      { id: 'jp-tokyo', name: '东京', code: 'TYO', dataCenter: 'dc-jp-east' },
      { id: 'jp-osaka', name: '大阪', code: 'OSA', dataCenter: 'dc-jp-west' }
    ]
  },
  {
    country: '新加坡',
    countryCode: 'SG',
    cities: [
      { id: 'sg-singapore', name: '新加坡', code: 'SG', dataCenter: 'dc-sg-central' }
    ]
  }
]
```

### 3.5 文件上传模拟方案

#### 3.5.1 文件分片策略

```typescript
// src/composables/useFileChunk.ts
export function useFileChunk() {
  const CHUNK_SIZE = 5 * 1024 * 1024 // 5MB

  // 计算文件分片
  const calculateChunks = (file: File) => {
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
    return totalChunks
  }

  // 切分文件
  const sliceFile = (file: File, chunkIndex: number) => {
    const start = chunkIndex * CHUNK_SIZE
    const end = Math.min(start + CHUNK_SIZE, file.size)
    return file.slice(start, end)
  }

  // 计算分片哈希
  const calculateChunkHash = async (chunk: Blob) => {
    const buffer = await chunk.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  return {
    CHUNK_SIZE,
    calculateChunks,
    sliceFile,
    calculateChunkHash
  }
}
```

#### 3.5.2 断点续传实现

```typescript
// src/composables/useFileUpload.ts
import { db } from '@/mocks/db'
import { useFileChunk } from './useFileChunk'

export function useFileUpload() {
  const { calculateChunks, sliceFile, calculateChunkHash } = useFileChunk()

  // 上传文件
  const uploadFile = async (file: File, applicationId: string, onProgress: (progress: number) => void) => {
    const fileId = `${applicationId}-${file.name}-${file.size}`
    const totalChunks = calculateChunks(file)

    // 检查是否已有上传记录
    let fileMeta = await db.fileMetas.where('fileId').equals(fileId).first()
    
    if (!fileMeta) {
      // 创建文件元数据
      fileMeta = {
        fileId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        totalChunks,
        uploadedChunks: 0,
        md5: '',
        applicationId,
        status: 'uploading',
        createTime: Date.now(),
        updateTime: Date.now()
      }
      await db.fileMetas.add(fileMeta)
    }

    // 获取已上传的分片
    const uploadedChunks = await db.fileChunks
      .where('fileId')
      .equals(fileId)
      .toArray()
    
    const uploadedIndexes = new Set(uploadedChunks.map(c => c.chunkIndex))

    // 上传未完成的分片
    for (let i = 0; i < totalChunks; i++) {
      if (uploadedIndexes.has(i)) {
        continue // 跳过已上传的分片
      }

      const chunk = sliceFile(file, i)
      const chunkHash = await calculateChunkHash(chunk)

      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200))

      // 保存分片到IndexedDB
      await db.fileChunks.add({
        fileId,
        chunkIndex: i,
        chunkData: chunk,
        chunkHash,
        uploadTime: Date.now()
      })

      // 更新进度
      const progress = Math.round(((i + 1) / totalChunks) * 100)
      onProgress(progress)

      // 更新文件元数据
      await db.fileMetas.update(fileMeta.id!, {
        uploadedChunks: i + 1,
        updateTime: Date.now()
      })
    }

    // 上传完成，更新状态
    await db.fileMetas.update(fileMeta.id!, {
      status: 'uploaded',
      updateTime: Date.now()
    })

    return fileId
  }

  // 暂停上传
  const pauseUpload = (fileId: string) => {
    // 实现暂停逻辑
  }

  // 恢复上传
  const resumeUpload = (fileId: string) => {
    // 实现恢复逻辑
  }

  // 取消上传
  const cancelUpload = async (fileId: string) => {
    await db.fileChunks.where('fileId').equals(fileId).delete()
    await db.fileMetas.where('fileId').equals(fileId).delete()
  }

  return {
    uploadFile,
    pauseUpload,
    resumeUpload,
    cancelUpload
  }
}
```

### 3.6 传输进度模拟方案

```typescript
// src/composables/useTransferSimulator.ts
export function useTransferSimulator() {
  // 模拟跨域传输
  const simulateTransfer = (
    applicationId: string,
    fileSize: number,
    onProgress: (progress: number, speed: number) => void,
    onComplete: () => void
  ) => {
    let progress = 0
    const totalTime = 10000 + Math.random() * 5000 // 10-15秒完成
    const interval = 100 // 每100ms更新一次
    const totalSteps = totalTime / interval
    const progressPerStep = 100 / totalSteps

    const timer = setInterval(() => {
      progress += progressPerStep + Math.random() * 2 // 增加随机性
      progress = Math.min(progress, 100)

      // 计算模拟速度 (MB/s)
      const speed = (fileSize / 1024 / 1024) / (totalTime / 1000) * (1 + Math.random() * 0.5)

      onProgress(Math.round(progress), parseFloat(speed.toFixed(2)))

      if (progress >= 100) {
        clearInterval(timer)
        onComplete()
      }
    }, interval)

    return () => clearInterval(timer) // 返回取消函数
  }

  return {
    simulateTransfer
  }
}
```

---

## 4. 状态管理设计 (Pinia)

### 4.1 Store结构

```
stores/
├── auth.ts          # 认证状态
├── application.ts   # 申请单状态
├── file.ts          # 文件状态
├── approval.ts      # 审批状态
├── user.ts          # 用户状态
├── notification.ts  # 通知状态
└── index.ts         # Store统一导出
```

### 4.2 Auth Store设计

```typescript
// src/stores/auth.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  // State
  const token = ref<string>('')
  const currentUser = ref<User | null>(null)
  const isLoggedIn = computed(() => !!token.value && !!currentUser.value)

  // Actions
  const login = async (username: string, password: string) => {
    // 调用登录API
    const response = await authApi.login({ username, password })
    token.value = response.data.token
    currentUser.value = response.data.user
    
    // 保存到LocalStorage
    localStorage.setItem('token', token.value)
    localStorage.setItem('user', JSON.stringify(currentUser.value))
  }

  const logout = () => {
    token.value = ''
    currentUser.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const initAuth = () => {
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (savedToken && savedUser) {
      token.value = savedToken
      currentUser.value = JSON.parse(savedUser)
    }
  }

  // Getters
  const hasRole = (role: string) => {
    return currentUser.value?.roles.includes(role) || false
  }

  const hasPermission = (permission: string) => {
    // 权限判断逻辑
    return true
  }

  return {
    token,
    currentUser,
    isLoggedIn,
    login,
    logout,
    initAuth,
    hasRole,
    hasPermission
  }
}, {
  persist: {
    key: 'auth',
    storage: localStorage,
    paths: ['token', 'currentUser']
  }
})
```

### 4.3 Application Store设计

```typescript
// src/stores/application.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Application } from '@/types'

export const useApplicationStore = defineStore('application', () => {
  // State
  const applications = ref<Application[]>([])
  const currentApplication = ref<Application | null>(null)
  const drafts = ref<Application[]>([])

  // Actions
  const fetchApplications = async (params: any) => {
    const response = await applicationApi.getList(params)
    applications.value = response.data.list
    return response.data
  }

  const fetchApplicationDetail = async (id: string) => {
    const response = await applicationApi.getDetail(id)
    currentApplication.value = response.data
    return response.data
  }

  const createApplication = async (data: Partial<Application>) => {
    const response = await applicationApi.create(data)
    applications.value.unshift(response.data)
    return response.data
  }

  const updateApplication = async (id: string, data: Partial<Application>) => {
    const response = await applicationApi.update(id, data)
    const index = applications.value.findIndex(app => app.id === id)
    if (index !== -1) {
      applications.value[index] = response.data
    }
    return response.data
  }

  const saveDraft = async (data: Partial<Application>) => {
    // 保存草稿到LocalStorage
    const draft = {
      ...data,
      id: data.id || `draft-${Date.now()}`,
      status: 'draft',
      createTime: data.createTime || new Date().toISOString(),
      updateTime: new Date().toISOString()
    }
    
    const existingIndex = drafts.value.findIndex(d => d.id === draft.id)
    if (existingIndex !== -1) {
      drafts.value[existingIndex] = draft as Application
    } else {
      drafts.value.push(draft as Application)
    }
    
    return draft
  }

  const deleteDraft = (id: string) => {
    const index = drafts.value.findIndex(d => d.id === id)
    if (index !== -1) {
      drafts.value.splice(index, 1)
    }
  }

  return {
    applications,
    currentApplication,
    drafts,
    fetchApplications,
    fetchApplicationDetail,
    createApplication,
    updateApplication,
    saveDraft,
    deleteDraft
  }
}, {
  persist: {
    key: 'application',
    storage: localStorage,
    paths: ['drafts']
  }
})
```

### 4.4 File Store设计

```typescript
// src/stores/file.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { FileInfo, UploadProgress } from '@/types'

export const useFileStore = defineStore('file', () => {
  // State
  const files = ref<Map<string, FileInfo>>(new Map())
  const uploadProgress = ref<Map<string, UploadProgress>>(new Map())
  const transferProgress = ref<Map<string, number>>(new Map())

  // Actions
  const addFile = (fileInfo: FileInfo) => {
    files.value.set(fileInfo.id, fileInfo)
  }

  const updateUploadProgress = (fileId: string, progress: number) => {
    uploadProgress.value.set(fileId, {
      fileId,
      progress,
      status: progress < 100 ? 'uploading' : 'uploaded',
      updateTime: Date.now()
    })
  }

  const updateTransferProgress = (fileId: string, progress: number) => {
    transferProgress.value.set(fileId, progress)
  }

  const removeFile = (fileId: string) => {
    files.value.delete(fileId)
    uploadProgress.value.delete(fileId)
    transferProgress.value.delete(fileId)
  }

  return {
    files,
    uploadProgress,
    transferProgress,
    addFile,
    updateUploadProgress,
    updateTransferProgress,
    removeFile
  }
})
```

---

## 5. 路由与权限设计

### 5.1 路由表设计

```typescript
// src/router/routes.ts
import type { RouteRecordRaw } from 'vue-router'

export const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: {
      layout: 'blank',
      title: '登录',
      requiresAuth: false
    }
  },
  {
    path: '/',
    redirect: '/dashboard',
    meta: { requiresAuth: true }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/dashboard/index.vue'),
    meta: {
      layout: 'default',
      title: '首页',
      requiresAuth: true,
      icon: 'icon-home'
    }
  },
  {
    path: '/transfer',
    name: 'Transfer',
    meta: {
      title: '传输',
      requiresAuth: true
    },
    children: [
      {
        path: 'select-type',
        name: 'SelectTransferType',
        component: () => import('@/views/transfer/select-type.vue'),
        meta: {
          title: '选择传输类型',
          requiresAuth: true
        }
      }
    ]
  },
  {
    path: '/applications',
    name: 'Applications',
    meta: {
      title: '申请单管理',
      requiresAuth: true,
      icon: 'icon-file'
    },
    children: [
      {
        path: '',
        name: 'ApplicationList',
        component: () => import('@/views/applications/index.vue'),
        meta: {
          title: '申请单列表',
          requiresAuth: true
        }
      },
      {
        path: 'create',
        name: 'CreateApplication',
        component: () => import('@/views/applications/create.vue'),
        meta: {
          title: '创建申请单',
          requiresAuth: true
        }
      },
      {
        path: ':id',
        name: 'ApplicationDetail',
        component: () => import('@/views/applications/detail.vue'),
        meta: {
          title: '申请单详情',
          requiresAuth: true
        }
      },
      {
        path: ':id/upload',
        name: 'UploadFiles',
        component: () => import('@/views/applications/upload.vue'),
        meta: {
          title: '上传文件',
          requiresAuth: true
        }
      },
      {
        path: 'drafts',
        name: 'Drafts',
        component: () => import('@/views/applications/drafts.vue'),
        meta: {
          title: '草稿箱',
          requiresAuth: true
        }
      }
    ]
  },
  {
    path: '/approvals',
    name: 'Approvals',
    meta: {
      title: '审批管理',
      requiresAuth: true,
      icon: 'icon-check-circle',
      roles: ['approver_level1', 'approver_level2', 'approver_level3', 'admin']
    },
    children: [
      {
        path: '',
        name: 'ApprovalList',
        component: () => import('@/views/approvals/index.vue'),
        meta: {
          title: '待审批列表',
          requiresAuth: true,
          roles: ['approver_level1', 'approver_level2', 'approver_level3', 'admin']
        }
      },
      {
        path: ':id',
        name: 'ApprovalDetail',
        component: () => import('@/views/approvals/detail.vue'),
        meta: {
          title: '审批详情',
          requiresAuth: true,
          roles: ['approver_level1', 'approver_level2', 'approver_level3', 'admin']
        }
      }
    ]
  },
  {
    path: '/transfers',
    name: 'TransferManagement',
    component: () => import('@/views/transfers/index.vue'),
    meta: {
      title: '传输管理',
      requiresAuth: true,
      icon: 'icon-swap',
      roles: ['admin']
    }
  },
  {
    path: '/users',
    name: 'UserManagement',
    component: () => import('@/views/users/index.vue'),
    meta: {
      title: '用户管理',
      requiresAuth: true,
      icon: 'icon-user',
      roles: ['admin']
    }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/settings/index.vue'),
    meta: {
      title: '系统配置',
      requiresAuth: true,
      icon: 'icon-settings',
      roles: ['admin']
    }
  },
  {
    path: '/logs',
    name: 'Logs',
    component: () => import('@/views/logs/index.vue'),
    meta: {
      title: '日志审计',
      requiresAuth: true,
      icon: 'icon-file-text',
      roles: ['admin']
    }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/profile/index.vue'),
    meta: {
      title: '个人中心',
      requiresAuth: true,
      icon: 'icon-user'
    }
  },
  {
    path: '/notifications',
    name: 'Notifications',
    component: () => import('@/views/notifications/index.vue'),
    meta: {
      title: '消息中心',
      requiresAuth: true,
      icon: 'icon-notification'
    }
  },
  {
    path: '/403',
    name: 'Forbidden',
    component: () => import('@/views/error/403.vue'),
    meta: {
      layout: 'blank',
      title: '无权限',
      requiresAuth: false
    }
  },
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: {
      layout: 'blank',
      title: '页面不存在',
      requiresAuth: false
    }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404'
  }
]
```

### 5.2 路由守卫设计

```typescript
// src/router/guards.ts
import type { Router } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

export function setupRouterGuards(router: Router) {
  // 全局前置守卫
  router.beforeEach((to, from, next) => {
    const authStore = useAuthStore()
    
    // 设置页面标题
    document.title = to.meta.title ? `${to.meta.title} - QTrans` : 'QTrans'

    // 检查是否需要登录
    if (to.meta.requiresAuth && !authStore.isLoggedIn) {
      next({
        name: 'Login',
        query: { redirect: to.fullPath }
      })
      return
    }

    // 检查角色权限
    if (to.meta.roles && Array.isArray(to.meta.roles)) {
      const hasRole = to.meta.roles.some(role => authStore.hasRole(role))
      if (!hasRole) {
        next({ name: 'Forbidden' })
        return
      }
    }

    // 已登录用户访问登录页，跳转到首页
    if (to.name === 'Login' && authStore.isLoggedIn) {
      next({ name: 'Dashboard' })
      return
    }

    next()
  })

  // 全局后置钩子
  router.afterEach((to, from) => {
    // 记录路由跳转日志
    console.log(`Route changed: ${from.path} -> ${to.path}`)
  })
}
```

### 5.3 权限指令设计

```typescript
// src/directives/permission.ts
import type { Directive } from 'vue'
import { useAuthStore } from '@/stores/auth'

export const vPermission: Directive = {
  mounted(el, binding) {
    const { value } = binding
    const authStore = useAuthStore()

    if (value && !authStore.hasPermission(value)) {
      el.parentNode?.removeChild(el)
    }
  }
}

export const vRole: Directive = {
  mounted(el, binding) {
    const { value } = binding
    const authStore = useAuthStore()

    if (value && !authStore.hasRole(value)) {
      el.parentNode?.removeChild(el)
    }
  }
}
```

---

## 6. 核心组件设计

### 6.1 页面组件树

```
App.vue
├── DefaultLayout
│   ├── AppHeader
│   │   ├── Logo
│   │   ├── UserDropdown
│   │   └── NotificationBell
│   ├── AppSidebar
│   │   └── MenuTree
│   └── PageContainer
│       └── <router-view>
└── BlankLayout
    └── <router-view>
```

### 6.2 文件上传组件设计

```vue
<!-- src/components/business/FileUploader.vue -->
<template>
  <div class="file-uploader">
    <a-upload
      :custom-request="handleUpload"
      :before-upload="beforeUpload"
      :show-upload-list="false"
      :multiple="true"
      :accept="acceptTypes"
      drag
    >
      <div class="upload-area">
        <icon-upload />
        <div class="upload-text">
          <div>点击或拖拽文件到此区域上传</div>
          <div class="upload-hint">
            支持单个或批量上传，单文件最大50GB
          </div>
        </div>
      </div>
    </a-upload>

    <!-- 文件列表 -->
    <div class="file-list">
      <div
        v-for="file in fileList"
        :key="file.id"
        class="file-item"
      >
        <div class="file-info">
          <icon-file />
          <span class="file-name">{{ file.name }}</span>
          <span class="file-size">{{ formatFileSize(file.size) }}</span>
        </div>
        
        <div class="file-progress">
          <a-progress
            :percent="file.progress"
            :status="file.status"
          />
        </div>

        <div class="file-actions">
          <a-button
            v-if="file.status === 'uploading'"
            size="small"
            @click="pauseUpload(file.id)"
          >
            暂停
          </a-button>
          <a-button
            v-if="file.status === 'paused'"
            size="small"
            type="primary"
            @click="resumeUpload(file.id)"
          >
            继续
          </a-button>
          <a-button
            size="small"
            status="danger"
            @click="removeFile(file.id)"
          >
            删除
          </a-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useFileUpload } from '@/composables/useFileUpload'
import { formatFileSize } from '@/utils/format'

interface FileItem {
  id: string
  name: string
  size: number
  progress: number
  status: 'uploading' | 'paused' | 'uploaded' | 'error'
}

const props = defineProps<{
  applicationId: string
  acceptTypes?: string
  maxSize?: number
}>()

const emit = defineEmits<{
  (e: 'upload-success', fileId: string): void
  (e: 'upload-error', error: Error): void
}>()

const fileList = ref<FileItem[]>([])
const { uploadFile, pauseUpload: pause, resumeUpload: resume, cancelUpload } = useFileUpload()

const beforeUpload = (file: File) => {
  // 文件大小校验
  const maxSize = props.maxSize || 50 * 1024 * 1024 * 1024 // 50GB
  if (file.size > maxSize) {
    Message.error(`文件大小不能超过${formatFileSize(maxSize)}`)
    return false
  }

  // 文件类型校验
  if (props.acceptTypes) {
    const types = props.acceptTypes.split(',')
    const fileExt = `.${file.name.split('.').pop()}`
    if (!types.includes(fileExt)) {
      Message.error('不支持的文件类型')
      return false
    }
  }

  return true
}

const handleUpload = async (option: any) => {
  const file = option.file
  const fileItem: FileItem = {
    id: `${Date.now()}-${file.name}`,
    name: file.name,
    size: file.size,
    progress: 0,
    status: 'uploading'
  }

  fileList.value.push(fileItem)

  try {
    const fileId = await uploadFile(
      file,
      props.applicationId,
      (progress) => {
        fileItem.progress = progress
      }
    )

    fileItem.status = 'uploaded'
    emit('upload-success', fileId)
  } catch (error) {
    fileItem.status = 'error'
    emit('upload-error', error as Error)
  }
}

const pauseUpload = (fileId: string) => {
  const file = fileList.value.find(f => f.id === fileId)
  if (file) {
    file.status = 'paused'
    pause(fileId)
  }
}

const resumeUpload = (fileId: string) => {
  const file = fileList.value.find(f => f.id === fileId)
  if (file) {
    file.status = 'uploading'
    resume(fileId)
  }
}

const removeFile = async (fileId: string) => {
  await cancelUpload(fileId)
  const index = fileList.value.findIndex(f => f.id === fileId)
  if (index !== -1) {
    fileList.value.splice(index, 1)
  }
}
</script>
```

### 6.3 传输进度组件设计

```vue
<!-- src/components/business/TransferProgress.vue -->
<template>
  <div class="transfer-progress">
    <div class="progress-header">
      <span class="progress-title">传输进度</span>
      <span class="progress-status" :class="statusClass">
        {{ statusText }}
      </span>
    </div>

    <a-progress
      :percent="progress"
      :status="progressStatus"
      :stroke-width="12"
    />

    <div class="progress-info">
      <div class="info-item">
        <span class="info-label">传输速度：</span>
        <span class="info-value">{{ speed }} MB/s</span>
      </div>
      <div class="info-item">
        <span class="info-label">已传输：</span>
        <span class="info-value">{{ transferredSize }} / {{ totalSize }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">剩余时间：</span>
        <span class="info-value">{{ remainingTime }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useTransferSimulator } from '@/composables/useTransferSimulator'
import { formatFileSize } from '@/utils/format'

const props = defineProps<{
  applicationId: string
  fileSize: number
  autoStart?: boolean
}>()

const emit = defineEmits<{
  (e: 'complete'): void
  (e: 'error', error: Error): void
}>()

const progress = ref(0)
const speed = ref(0)
const status = ref<'pending' | 'transferring' | 'completed' | 'error'>('pending')

const { simulateTransfer } = useTransferSimulator()
let cancelTransfer: (() => void) | null = null

const statusClass = computed(() => {
  return `status-${status.value}`
})

const statusText = computed(() => {
  const statusMap = {
    pending: '等待传输',
    transferring: '传输中',
    completed: '传输完成',
    error: '传输失败'
  }
  return statusMap[status.value]
})

const progressStatus = computed(() => {
  if (status.value === 'error') return 'danger'
  if (status.value === 'completed') return 'success'
  return 'normal'
})

const transferredSize = computed(() => {
  return formatFileSize(props.fileSize * progress.value / 100)
})

const totalSize = computed(() => {
  return formatFileSize(props.fileSize)
})

const remainingTime = computed(() => {
  if (progress.value === 0 || speed.value === 0) return '--'
  const remaining = (props.fileSize * (100 - progress.value) / 100) / (speed.value * 1024 * 1024)
  if (remaining < 60) return `${Math.ceil(remaining)}秒`
  if (remaining < 3600) return `${Math.ceil(remaining / 60)}分钟`
  return `${Math.ceil(remaining / 3600)}小时`
})

const startTransfer = () => {
  status.value = 'transferring'
  cancelTransfer = simulateTransfer(
    props.applicationId,
    props.fileSize,
    (prog, spd) => {
      progress.value = prog
      speed.value = spd
    },
    () => {
      status.value = 'completed'
      emit('complete')
    }
  )
}

onMounted(() => {
  if (props.autoStart) {
    startTransfer()
  }
})

onUnmounted(() => {
  if (cancelTransfer) {
    cancelTransfer()
  }
})

defineExpose({
  startTransfer
})
</script>
```

### 6.4 部门选择器组件设计

```vue
<!-- src/components/business/DepartmentSelector.vue -->
<template>
  <a-tree-select
    v-model="selectedDepartment"
    :data="departmentTree"
    :field-names="{ key: 'id', title: 'name', children: 'children' }"
    placeholder="请选择部门"
    allow-search
    allow-clear
    @change="handleChange"
  />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { departmentApi } from '@/api'

const props = defineProps<{
  modelValue?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string, department: any): void
}>()

const selectedDepartment = ref(props.modelValue)
const departmentTree = ref([])

const loadDepartments = async () => {
  const response = await departmentApi.getTree()
  departmentTree.value = response.data
}

const handleChange = (value: string) => {
  emit('update:modelValue', value)
  const department = findDepartment(departmentTree.value, value)
  emit('change', value, department)
}

const findDepartment = (tree: any[], id: string): any => {
  for (const node of tree) {
    if (node.id === id) return node
    if (node.children) {
      const found = findDepartment(node.children, id)
      if (found) return found
    }
  }
  return null
}

onMounted(() => {
  loadDepartments()
})
</script>
```

### 6.5 城市选择器组件设计

```vue
<!-- src/components/business/CitySelector.vue -->
<template>
  <a-cascader
    v-model="selectedCity"
    :options="cityOptions"
    :field-names="{ label: 'name', value: 'id', children: 'cities' }"
    placeholder="请选择国家/城市"
    allow-search
    allow-clear
    @change="handleChange"
  />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { cityApi } from '@/api'

const props = defineProps<{
  modelValue?: string[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void
  (e: 'change', value: string[], city: any): void
}>()

const selectedCity = ref(props.modelValue || [])
const cityOptions = ref([])

const loadCities = async () => {
  const response = await cityApi.getList()
  cityOptions.value = response.data
}

const handleChange = (value: string[]) => {
  emit('update:modelValue', value)
  // 查找选中的城市信息
  const city = findCity(cityOptions.value, value)
  emit('change', value, city)
}

const findCity = (options: any[], path: string[]) => {
  // 实现查找逻辑
  return null
}

onMounted(() => {
  loadCities()
})
</script>
```

---

## 7. 演示流程设计

### 7.1 Demo账号设计

为了完整演示业务流程，设计以下Demo账号：

| 账号 | 密码 | 角色 | 姓名 | 用途 |
|------|------|------|------|------|
| submitter | 123456 | 提交人 | 张三 | 创建申请单、上传文件 |
| approver1 | 123456 | 一级审批人 | 李四 | 一级审批 |
| approver2 | 123456 | 二级审批人 | 王五 | 二级审批 |
| approver3 | 123456 | 三级审批人 | 赵六 | 三级审批 |
| admin | 123456 | 管理员 | 管理员 | 系统管理、全部权限 |

### 7.2 演示场景设计

#### 场景1：绿区到绿区（免审批）

**流程：**
1. 使用`submitter`账号登录
2. 首页点击"绿区传到绿区"
3. 填写申请信息（自动填充部分字段）
4. 点击"下一步"，进入上传文件页面
5. 上传文件（模拟分片上传，支持断点续传）
6. 上传完成后，自动开始传输（免审批）
7. 查看传输进度
8. 传输完成，可下载文件

**演示要点：**
- 自动填充字段展示
- 文件分片上传演示
- 断点续传演示（暂停/继续）
- 传输进度实时更新
- 免审批流程

#### 场景2：绿区到红区（二级审批）

**流程：**
1. 使用`submitter`账号登录
2. 首页点击"绿区传到红区"
3. 填写申请信息，选择文件密级
4. 上传文件
5. 提交申请，状态变为"待审批"
6. 切换到`approver1`账号
7. 查看待审批列表，审批通过
8. 切换到`approver2`账号
9. 查看待审批列表，审批通过
10. 自动开始传输
11. 切换回`submitter`账号查看传输进度

**演示要点：**
- 多级审批流程
- 审批时间线展示
- 角色切换演示
- 审批通知

#### 场景3：包含客户网络数据

**流程：**
1. 使用`submitter`账号登录
2. 创建申请单
3. 选择"包含客户网络数据"为"是"
4. 上传客户授权文件
5. 填写SR单号
6. 系统自动带出最小部门主管
7. 提交申请
8. 审批流程

**演示要点：**
- 条件字段显示
- 客户授权文件上传
- 自动带出字段

#### 场景4：草稿保存与恢复

**流程：**
1. 使用`submitter`账号登录
2. 开始创建申请单
3. 填写部分信息
4. 点击"保存草稿"或直接关闭页面
5. 进入"草稿箱"
6. 继续编辑草稿
7. 完成并提交

**演示要点：**
- 草稿自动保存
- 草稿列表展示
- 草稿恢复编辑

### 7.3 演示数据初始化

```typescript
// src/mocks/data/demo-init.ts
export const initDemoData = () => {
  // 初始化用户数据
  localStorage.setItem('mock-users', JSON.stringify(mockUsers))
  
  // 初始化部门数据
  localStorage.setItem('mock-departments', JSON.stringify(mockDepartments))
  
  // 初始化城市数据
  localStorage.setItem('mock-cities', JSON.stringify(mockCities))
  
  // 初始化示例申请单
  const demoApplications = [
    {
      id: 'app001',
      applicationNo: 'TRANS-20260302-00001',
      transferType: 'green-to-green',
      department: 'dept001',
      sourceCity: ['CN', 'cn-beijing'],
      targetCity: ['CN', 'cn-shanghai'],
      downloaderAccounts: ['user002'],
      applyReason: '项目需要传输测试数据',
      status: 'completed',
      applicantId: 'user001',
      applicantName: '张三',
      createTime: '2026-03-01T10:00:00Z'
    },
    {
      id: 'app002',
      applicationNo: 'TRANS-20260302-00002',
      transferType: 'green-to-red',
      department: 'dept001',
      sourceCity: ['CN', 'cn-beijing'],
      targetCity: ['CN', 'cn-shanghai'],
      downloaderAccounts: ['user003'],
      applyReason: '生产环境数据同步',
      status: 'pending_approval',
      applicantId: 'user001',
      applicantName: '张三',
      currentApprovalLevel: 1,
      createTime: '2026-03-02T09:00:00Z'
    }
  ]
  
  localStorage.setItem('mock-applications', JSON.stringify(demoApplications))
}
```

### 7.4 演示辅助功能

#### 7.4.1 角色快速切换

```vue
<!-- src/components/common/RoleSwitcher.vue -->
<template>
  <a-dropdown v-if="isDemoMode">
    <a-button type="text">
      <icon-user />
      快速切换角色
    </a-button>
    <template #content>
      <a-doption
        v-for="user in demoUsers"
        :key="user.id"
        @click="switchUser(user)"
      >
        {{ user.name }} ({{ user.roles[0] }})
      </a-doption>
    </template>
  </a-dropdown>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { mockUsers } from '@/mocks/data/users'

const isDemoMode = import.meta.env.MODE === 'development'
const demoUsers = mockUsers
const authStore = useAuthStore()

const switchUser = async (user: any) => {
  await authStore.login(user.username, user.password)
  location.reload()
}
</script>
```

#### 7.4.2 演示数据重置

```typescript
// src/utils/demo.ts
export const resetDemoData = () => {
  // 清除所有Mock数据
  localStorage.clear()
  
  // 清除IndexedDB
  indexedDB.deleteDatabase('QTransDB')
  
  // 重新初始化
  initDemoData()
  
  // 刷新页面
  location.reload()
}
```

---

## 8. MSW Handler设计

### 8.1 认证Handler

```typescript
// src/mocks/handlers/auth.ts
import { http, HttpResponse } from 'msw'
import { mockUsers } from '../data/users'

export const authHandlers = [
  // 登录
  http.post('/api/auth/login', async ({ request }) => {
    const { username, password } = await request.json()
    
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const user = mockUsers.find(
      u => u.username === username && u.password === password
    )
    
    if (!user) {
      return HttpResponse.json(
        {
          code: 401,
          message: '账号或密码错误',
          data: null,
          timestamp: Date.now()
        },
        { status: 401 }
      )
    }
    
    // 生成Token
    const token = `mock-token-${user.id}-${Date.now()}`
    
    return HttpResponse.json({
      code: 200,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          phone: user.phone,
          department: user.department,
          departmentName: user.departmentName,
          roles: user.roles,
          status: user.status
        }
      },
      timestamp: Date.now()
    })
  }),

  // 登出
  http.post('/api/auth/logout', async () => {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    return HttpResponse.json({
      code: 200,
      message: '登出成功',
      data: null,
      timestamp: Date.now()
    })
  }),

  // 刷新Token
  http.post('/api/auth/refresh', async () => {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    return HttpResponse.json({
      code: 200,
      message: 'Token刷新成功',
      data: {
        token: `mock-token-refresh-${Date.now()}`
      },
      timestamp: Date.now()
    })
  })
]
```

### 8.2 申请单Handler

```typescript
// src/mocks/handlers/application.ts
import { http, HttpResponse } from 'msw'

let applications = JSON.parse(localStorage.getItem('mock-applications') || '[]')

export const applicationHandlers = [
  // 获取申请单列表
  http.get('/api/applications', async ({ request }) => {
    const url = new URL(request.url)
    const pageNum = parseInt(url.searchParams.get('pageNum') || '1')
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10')
    
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const start = (pageNum - 1) * pageSize
    const end = start + pageSize
    const list = applications.slice(start, end)
    
    return HttpResponse.json({
      code: 200,
      message: '获取成功',
      data: {
        list,
        total: applications.length,
        pageNum,
        pageSize
      },
      timestamp: Date.now()
    })
  }),

  // 创建申请单
  http.post('/api/applications', async ({ request }) => {
    const data = await request.json()
    
    await new Promise(resolve => setTimeout(resolve, 800))
    
    const application = {
      ...data,
      id: `app${Date.now()}`,
      applicationNo: `TRANS-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(applications.length + 1).padStart(5, '0')}`,
      status: 'pending_upload',
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString()
    }
    
    applications.unshift(application)
    localStorage.setItem('mock-applications', JSON.stringify(applications))
    
    return HttpResponse.json({
      code: 200,
      message: '创建成功',
      data: application,
      timestamp: Date.now()
    })
  }),

  // 保存草稿
  http.post('/api/applications/:id/save-draft', async ({ request, params }) => {
    const data = await request.json()
    
    await new Promise(resolve => setTimeout(resolve, 300))
    
    return HttpResponse.json({
      code: 200,
      message: '草稿保存成功',
      data: {
        id: params.id,
        ...data
      },
      timestamp: Date.now()
    })
  })
]
```

---

## 9. 性能优化设计

### 9.1 代码分割

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['vue', 'vue-router', 'pinia'],
          'arco': ['@arco-design/web-vue'],
          'utils': ['lodash-es', 'dayjs']
        }
      }
    }
  }
})
```

### 9.2 组件懒加载

```typescript
// 路由懒加载
const routes = [
  {
    path: '/applications',
    component: () => import('@/views/applications/index.vue')
  }
]

// 组件懒加载
const FileUploader = defineAsyncComponent(() => 
  import('@/components/business/FileUploader.vue')
)
```

### 9.3 虚拟滚动

对于长列表（申请单列表、文件列表），使用虚拟滚动：

```vue
<template>
  <a-virtual-list
    :data="applications"
    :height="600"
    :item-height="80"
  >
    <template #item="{ item }">
      <ApplicationItem :application="item" />
    </template>
  </a-virtual-list>
</template>
```

---

## 10. 部署配置

### 10.1 环境变量

```bash
# .env.development
VITE_APP_TITLE=QTrans开发环境
VITE_API_BASE_URL=/api
VITE_MOCK_ENABLED=true
VITE_UPLOAD_CHUNK_SIZE=5242880

# .env.production
VITE_APP_TITLE=QTrans
VITE_API_BASE_URL=https://api.qtrans.com
VITE_MOCK_ENABLED=false
VITE_UPLOAD_CHUNK_SIZE=5242880
```

### 10.2 构建配置

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1000
  }
})
```

---

## 11. 测试策略

### 11.1 单元测试

```typescript
// src/composables/__tests__/useFileChunk.spec.ts
import { describe, it, expect } from 'vitest'
import { useFileChunk } from '../useFileChunk'

describe('useFileChunk', () => {
  it('should calculate chunks correctly', () => {
    const { calculateChunks, CHUNK_SIZE } = useFileChunk()
    const fileSize = CHUNK_SIZE * 2.5
    const chunks = calculateChunks({ size: fileSize } as File)
    expect(chunks).toBe(3)
  })

  it('should slice file correctly', () => {
    const { sliceFile, CHUNK_SIZE } = useFileChunk()
    const mockFile = new File(['a'.repeat(CHUNK_SIZE * 2)], 'test.txt')
    const chunk = sliceFile(mockFile, 0)
    expect(chunk.size).toBe(CHUNK_SIZE)
  })
})
```

### 11.2 组件测试

```typescript
// src/components/business/__tests__/FileUploader.spec.ts
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import FileUploader from '../FileUploader.vue'

describe('FileUploader', () => {
  it('should render upload area', () => {
    const wrapper = mount(FileUploader, {
      props: {
        applicationId: 'test-app-001'
      }
    })
    expect(wrapper.find('.upload-area').exists()).toBe(true)
  })

  it('should emit upload-success event', async () => {
    const wrapper = mount(FileUploader, {
      props: {
        applicationId: 'test-app-001'
      }
    })
    // 模拟文件上传
    // ...
    expect(wrapper.emitted('upload-success')).toBeTruthy()
  })
})
```

---

## 12. 文档结束

本设计文档涵盖了前端演示系统的完整技术设计，包括：

1. ✅ 技术架构与目录结构
2. ✅ Mock数据与API模拟方案
3. ✅ IndexedDB文件存储设计
4. ✅ 文件分片上传与断点续传实现
5. ✅ 传输进度模拟方案
6. ✅ Pinia状态管理设计
7. ✅ 路由与权限控制
8. ✅ 核心组件设计
9. ✅ 演示流程与Demo账号
10. ✅ MSW Handler实现
11. ✅ 性能优化策略
12. ✅ 部署配置
13. ✅ 测试策略

**下一步：TaskList（任务清单）**

根据本设计文档，将拆分详细的开发任务清单，包括任务优先级、预估工时、依赖关系等。






