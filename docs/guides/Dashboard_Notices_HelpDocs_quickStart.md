# 首页公告与帮助文档 Quick Start

> 本文档覆盖首页「重要公告」和「帮助文档」两个卡片对接真实后端接口的功能。

## 1. 模块概述

### 功能范围
- **重要公告**：从后端获取公告列表，展示标题、内容、链接和时间
- **帮助文档**：从后端获取帮助文档列表，点击跳转到文档链接

### 数据来源
| 模块 | 接口 | 数据字段 |
|------|------|----------|
| 重要公告 | `/commonService/services/jalor/lookup/itemquery/listbycodes/top_affiche/zh_CN` | itemAttr1(标题)、itemAttr2(图标)、itemDesc(内容)、itemAttr3(链接)、lastUpdateDate(时间) |
| 帮助文档 | `/commonService/services/jalor/lookup/itemquery/listbycodes/help_doc_link/zh_CN` | itemName(标题)、itemAttr1(链接)、lastUpdateDate(时间) |

## 2. 关键文件

### API 层
| 文件 | 说明 |
|------|------|
| `src/api/uiConfig.ts` | 新增 `HelpDocItem`、`TopAfficheItem` 接口和 `getHelpDocs`、`getTopAffiches` API 方法 |

### Composables
| 文件 | 说明 |
|------|------|
| `src/composables/useHelpDocs.ts` | 帮助文档数据获取与状态管理 |
| `src/composables/useTopAffiches.ts` | 重要公告数据获取与状态管理 |

### 页面视图
| 文件 | 说明 |
|------|------|
| `src/views/dashboard/index.vue` | 首页视图，整合公告和帮助文档卡片 |

## 3. 开发侧使用说明

### 3.1 使用帮助文档 Composable

```ts
import { useHelpDocs } from '@/composables/useHelpDocs'

const {
  loading,      // 加载状态
  helpDocs,     // 帮助文档列表
  fetchHelpDocs, // 刷新数据
  openDocLink,   // 打开文档链接
} = useHelpDocs()
```

**HelpDocListItem 数据结构**：
```ts
interface HelpDocListItem {
  id: string          // 文档 ID
  code: string        // 文档编码
  title: string       // 文档标题
  link: string        // 文档链接
  updateTime: string  // 更新时间（格式：YYYY-MM-DD HH:mm）
  order: number       // 排序序号
}
```

### 3.2 使用公告 Composable

```ts
import { useTopAffiches } from '@/composables/useTopAffiches'

const {
  loading,        // 加载状态
  affiches,       // 公告列表
  fetchAffiches,   // 刷新数据
  openAfficheLink, // 打开公告链接（当前模板使用 <a> 标签直接跳转）
} = useTopAffiches()
```

**TopAfficheListItem 数据结构**：
```ts
interface TopAfficheListItem {
  id: string          // 公告 ID
  code: string        // 公告编码
  title: string       // 公告标题（itemAttr1，为空显示"系统公告"）
  content: string     // 公告内容（itemDesc）
  link: string | null // 公告链接（itemAttr3）
  icon: string | null // 公告图标（itemAttr2）
  updateTime: string  // 更新时间（格式：YYYY-MM-DD HH:mm）
  order: number       // 排序序号
}
```

### 3.3 页面模板使用示例

```vue
<template>
  <!-- 帮助文档 -->
  <ol>
    <template v-if="helpDocs.length > 0">
      <li v-for="(doc, idx) in helpDocs" :key="doc.id" @click="openDocLink(doc.link)">
        <span class="index">{{ idx + 1 }}.</span>
        <span class="text">{{ doc.title }}</span>
        <span class="time">{{ doc.updateTime }}</span>
      </li>
    </template>
    <li v-else class="empty-tip">暂无帮助文档</li>
  </ol>

  <!-- 重要公告 -->
  <ul>
    <template v-if="affiches.length > 0">
      <li v-for="affiche in affiches" :key="affiche.id">
        <div class="notice-title">
          <img v-if="affiche.icon" :src="affiche.icon" :alt="affiche.title" />
          <span class="title-text">{{ affiche.title }}</span>
        </div>
        <p class="notice-content">
          <span class="content-text">{{ affiche.content }}</span>
          <span class="affiche-time">{{ affiche.updateTime }}</span>
        </p>
        <a v-if="affiche.link" :href="affiche.link" target="_blank" class="affiche-link">
          查看详情
        </a>
      </li>
    </template>
    <li v-else class="notices-empty-tip">暂无公告</li>
  </ul>
</template>
```

### 3.4 字段映射规则

#### 帮助文档
| 后端字段 | UI 字段 | 说明 |
|----------|---------|------|
| itemName | title | 文档标题 |
| itemAttr1 | link | 文档链接（中文） |
| lastUpdateDate | updateTime | 格式化后的更新时间 |

#### 重要公告
| 后端字段 | UI 字段 | 说明 |
|----------|---------|------|
| itemAttr1 | title | 公告标题，为空显示"系统公告" |
| itemDesc | content | 公告正文内容 |
| itemAttr2 | icon | 公告图标（可为 null） |
| itemAttr3 | link | 公告链接（可为 null） |
| lastUpdateDate | updateTime | 格式化后的更新时间 |

### 3.5 时间格式化

时间统一格式化为 `YYYY-MM-DD HH:mm`，使用 `formatDateTime` 函数：
```ts
function formatDateTime(dateStr: string): string {
  // 输入: "2023-07-25T11:30:07.000+0800"
  // 输出: "2023-07-25 11:30"
}
```

## 4. 当前限制

- **无链接时**：公告不显示"查看详情"链接，内容行右侧仅显示时间
- **无图标时**：公告标题行不显示图标
- **无数据时**：显示"暂无帮助文档"或"暂无公告"提示
- **链接打开方式**：帮助文档使用 `window.open()`，公告使用 `<a target="_blank">`

## 5. QA 回归步骤

### 重要公告卡片回归

| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | 打开首页 | 页面正常加载，重要公告卡片显示后端数据 |
| 2 | 检查公告标题 | 显示 itemAttr1 的值，若为空显示"系统公告" |
| 3 | 检查公告图标 | 若 itemAttr2 有值，显示图标；否则不显示 |
| 4 | 检查公告内容 | 显示 itemDesc 的内容 |
| 5 | 检查时间和内容布局 | 时间和内容同一行，内容靠左，时间靠右 |
| 6 | 检查链接按钮 | 若 itemAttr3 有值，显示"查看详情"链接；否则不显示 |
| 7 | 点击"查看详情" | 在新标签页打开链接 |
| 8 | 无数据测试 | 后端无数据时显示"暂无公告" |

### 帮助文档卡片回归

| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | 打开首页 | 页面正常加载，帮助文档卡片显示后端数据 |
| 2 | 检查文档标题 | 显示 itemName 的值 |
| 3 | 检查序号 | 按 itemIndex 排序，显示 1. 2. 3. 序号 |
| 4 | 检查时间 | 显示格式化后的 lastUpdateDate |
| 5 | 检查时间格式 | 格式为 YYYY-MM-DD HH:mm |
| 6 | 点击文档标题 | 在新标签页打开 itemAttr1 链接 |
| 7 | 无数据测试 | 后端无数据时显示"暂无帮助文档"（横向显示，非竖排） |

### 样式回归

| 步骤 | 检查项 | 预期结果 |
|------|--------|----------|
| 1 | 帮助文档空状态 | "暂无帮助文档"横向居中显示，不受 grid 布局影响 |
| 2 | 公告内容换行 | 长内容自动换行，时间保持在最右侧 |
| 3 | 响应式布局 | 窗口缩小时样式正常，无溢出 |

## 6. 本轮测试命令

```bash
# 类型检查
cd d:\VibeCoding\QTrans-0302new\qtrans-frontend
npx vue-tsc --noEmit

# Lint 检查
pnpm lint

# 运行测试（如有）
pnpm test
```

## 7. 页面布局说明

### 重要公告卡片布局
```
┌─────────────────────────────────────────────────────────────┐
│  [图标] 重要公告                                            │
├─────────────────────────────────────────────────────────────┤
│  • [图标] 公告标题                                          │
│    内容文本第一行内容文本第一行内容文本第一行...    2026-03-06 │
│    [查看详情]                                               │
│                                                             │
│  • 公告标题2                                               │
│    内容文本第二行...                               2026-11-21 │
│    [查看详情]                                               │
└─────────────────────────────────────────────────────────────┘
```

### 帮助文档卡片布局
```
┌─────────────────────────────────────────────────────────────┐
│  [图标] 帮助文档                              IT 热线        │
├─────────────────────────────────────────────────────────────┤
│  1. 文档标题1                                    2023-07-25 │
│  2. 文档标题2                                    2025-05-15 │
│  3. 文档标题3                                    2023-08-20 │
└─────────────────────────────────────────────────────────────┘
```
