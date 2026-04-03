# 表格列宽拖拽优化 - 执行记录

## 执行时间
2026-04-03

## 问题分析

### 问题1: 拖拽手柄不可见
**现象**: 用户无法看到列之间的分隔符,不知道在哪里可以拖拽

**根本原因**:
1. Arco Design 默认的 `.arco-table-col-resize-handle` 宽度仅 4px,背景透明
2. 表头没有明显的列分隔线
3. hover 效果不够明显

### 问题2: 拖拽响应不准确
**现象**: 鼠标轻微移动,列宽变化过大

**根本原因**:
1. CSS 中定义了 `.col-file-name` 等类,设置了 `min-width` 和 `max-width`
2. 这些 CSS 约束与 a-table 的 columns 配置中的 `width` 属性冲突
3. 拖拽时宽度计算被 CSS 约束干扰

## 解决方案

### 1. 优化拖拽手柄样式

#### 1.1 添加列分隔线
```scss
.arco-table-th {
  // 添加列分隔线
  &::after {
    content: '';
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 1px;
    height: 50%;
    background: #e2e8f0;
  }
}
```

**效果**: 每列表头右侧显示一条浅灰色竖线,明确列的边界

#### 1.2 增强拖拽手柄可见性
```scss
.arco-table-col-resize-handle {
  width: 10px; // 从 4px 增加到 10px
  
  // 拖拽图标(竖线)
  &::before {
    content: '';
    width: 2px;
    height: 40%;
    background: #cbd5e1;
  }
}
```

**效果**: 
- 可点击区域从 4px 增加到 10px,更容易定位
- 默认显示浅灰色竖线图标,提示可拖拽

#### 1.3 增强 hover 反馈
```scss
&:hover {
  background: rgba(22, 93, 255, 0.05);
  
  &::before {
    background: #165dff;
    height: 60%;
    width: 3px;
  }
}
```

**效果**: 
- hover 时显示浅蓝色背景
- 拖拽图标变粗变高,变为蓝色
- 用户明确知道可以拖拽

#### 1.4 拖拽激活状态
```scss
&.arco-table-col-resize-handle-active {
  background: rgba(22, 93, 255, 0.1);
  
  &::before {
    background: #165dff;
    height: 80%;
    width: 3px;
  }
}
```

**效果**: 拖拽过程中拖拽图标进一步变长,背景更深

### 2. 修复列宽冲突

#### 2.1 移除 CSS 约束
移除了以下 CSS 类定义:
```scss
// 已删除
.col-file-name { min-width: 160px; max-width: 220px; }
.col-file-type { width: 120px; }
.col-file-size { width: 100px; }
.col-secret-level { width: 80px; }
.col-unzip-level { width: 80px; }
.col-file-path { min-width: 200px; max-width: 300px; }
.col-action { width: 100px; }
```

#### 2.2 依赖 columns 配置
所有列宽通过 `AssetDetectionTab.vue` 的 `columns` 配置管理:
```typescript
const fileColumns = computed<TableColumnData[]>(() => [
  {
    title: '文件名称',
    dataIndex: 'fileName',
    width: 180,
    resizable: true,
  },
  // ... 其他列
])
```

**效果**: 
- 避免了 CSS 约束与 columns 配置的冲突
- 拖拽时宽度计算准确
- 拖拽后的宽度能正确保持

## 产出文件

### 修改文件
1. `src/components/business/asset-detection.scss`
   - 增加表头列分隔线样式
   - 优化拖拽手柄样式(默认/hover/激活)
   - 移除 CSS 列宽约束类

2. `docs/tasks/task_column_resize_optimization.md`
   - 任务定义文档

3. `docs/exec/task_column_resize_exec.md` (本文件)
   - 执行记录文档

## 验收测试

### 测试步骤

#### 测试1: 拖拽手柄可见性
1. 打开申请单详情页
2. 切换到"资产检测结果" Tab
3. 查看文件列表表格

**预期结果**:
- ✅ 每列表头右侧有明显的浅灰色分隔线
- ✅ 鼠标移到分隔线附近,显示蓝色竖线图标和浅蓝色背景
- ✅ 用户可以清楚地知道在哪里拖拽

#### 测试2: 拖拽响应准确性
1. 将鼠标移到"文件名称"列的右侧分隔线
2. 看到蓝色拖拽图标后,按住鼠标左键
3. 向右拖拽 50px

**预期结果**:
- ✅ 列宽增加约 50px,不是跳跃式变化
- ✅ 拖拽过程中有蓝色指示线跟随鼠标
- ✅ 松开鼠标后,宽度保持在拖拽后的值,不会自动跳回

#### 测试3: 多列拖拽
1. 拖拽"文件名称"列宽从 180px 到 230px
2. 再拖拽"文件路径"列宽从 220px 到 300px
3. 切换到"关键资产" tab

**预期结果**:
- ✅ 每列的宽度变化准确响应拖拽距离
- ✅ 拖拽后的宽度保持不变
- ✅ 文件列表和关键资产表格使用相同的列宽配置

#### 测试4: 不影响其他功能
1. 拖拽某列宽度后
2. 点击表头排序
3. 使用筛选功能

**预期结果**:
- ✅ 排序功能正常
- ✅ 筛选功能正常
- ✅ 分页功能正常
- ✅ 列宽保持拖拽后的值

## 技术要点

### Arco Design 列宽拖拽原理
1. 设置 `column-resizable` 属性启用列宽拖拽
2. 在 columns 配置中设置 `resizable: true` 标识可拖拽列
3. Arco Design 会自动在列右侧生成 `.arco-table-col-resize-handle` 元素
4. 拖拽时会触发 `column-resize` 事件,更新列宽

### 注意事项
1. **不要用 CSS 约束列宽**: 避免使用 `min-width`/`max-width`,会与拖拽功能冲突
2. **拖拽手柄宽度**: 默认 4px 太小,建议增加到 10px 以提高可点击性
3. **视觉反馈**: 提供明显的 hover 和激活状态,引导用户正确拖拽
4. **固定列问题**: Arco Design 存在已知 bug,固定列 + column-resizable 可能导致滚动异常(issue #2370)

## 后续优化建议

1. **保存列宽配置**: 可考虑将用户拖拽后的列宽保存到 localStorage,下次打开时恢复
2. **双击自适应**: 可实现双击分隔线,自动调整列宽为内容宽度
3. **列宽限制**: 在 columns 配置中添加 `minWidth` 和 `maxWidth`,限制拖拽范围

## 总结

通过本次优化:
1. **解决了拖拽手柄不可见问题**: 增加了列分隔线和明显的拖拽图标
2. **解决了拖拽响应不准确问题**: 移除了 CSS 约束,避免与 columns 配置冲突
3. **提升了用户体验**: hover 和激活状态提供清晰的视觉反馈

优化后的表格列宽拖拽功能可以准确、流畅地响应用户操作,符合用户预期。
