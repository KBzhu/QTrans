# 图标管理和替换指南

## 📋 概述

本指南描述了项目中图标的管理方式以及如何在不修改代码的情况下替换图标。所有图标现在都统一存放在 `public/icons` 目录中，通过配置文件进行管理。

## 📁 目录结构

```
public/
  ├── icons/                    # 图标文件目录
  │   ├── green.svg            # 绿色区域图标
  │   ├── yellow.svg           # 黄色区域图标
  │   ├── red.svg              # 红色区域图标
  │   ├── external.svg         # 外部区域图标
  │   ├── arrow-green.svg      # 绿色箭头图标
  │   ├── arrow-yellow.svg     # 黄色箭头图标
  │   └── arrow-red.svg        # 红色箭头图标
  └── figma/                   # 原始设计文件（可删除）
```

## ⚙️ 配置文件

所有图标路径在以下文件中统一配置：

- `src/config/icons.ts` - 图标常量配置和映射

## 🎯 使用方式

### 1. 获取图标配置

```typescript
import { getTransferIcons, TRANSFER_ICONS } from '@/config/icons'

// 方式1：根据区域动态获取图标
const icons = getTransferIcons(fromZone, toZone)
// 返回：{ fromIcon: string, toIcon: string, arrowIcon: string }

// 方式2：直接使用常量
const greenIcon = TRANSFER_ICONS.GREEN
const greenArrow = TRANSFER_ICONS.GREEN_ARROW
```

### 2. 在组件中使用

```vue
<template>
  <div class="type-card__icons">
    <div class="type-card__icon-box">
      <img :src="item.fromIcon" :alt="item.title" />
    </div>
    <div class="type-card__arrow">
      <img :src="item.arrowIcon" alt="arrow" />
    </div>
    <div class="type-card__icon-box">
      <img :src="item.toIcon" :alt="item.title" />
    </div>
  </div>
</template>

<script setup>
import { getTransferIcons } from '@/config/icons'

const icons = getTransferIcons('green', 'yellow')
// icons.fromIcon, icons.toIcon, icons.arrowIcon
</script>
```

## 🔄 图标替换流程

### 1. 开发阶段替换

直接在 `public/icons` 目录中替换对应的SVG文件即可：

1. 找到要替换的图标文件，例如 `green.svg`
2. 用新的SVG文件覆盖原文件
3. 无需重新编译，刷新页面即可看到效果

### 2. 生产环境替换

**打包后仍然可以替换图标**，因为图标文件位于 `public` 目录：

```
dist/
  ├── assets/    # 打包的JS/CSS文件
  └── icons/     # 独立的图标文件（可替换）
```

**替换步骤：**
1. 停止应用服务
2. 替换 `dist/icons/` 目录中的图标文件
3. 重启应用服务
4. 图标立即生效

### 3. 添加新图标

1. 将新图标文件放入 `public/icons/` 目录
2. 在 `src/config/icons.ts` 中添加常量：
   ```typescript
   export const TRANSFER_ICONS = {
     // 现有图标...
     NEW_ICON: '/icons/new-icon.svg',
   }
   ```
3. 在需要的地方使用新图标

## 🎨 图标映射说明

当前图标映射关系：

| 区域组合 | From图标 | To图标 | 箭头图标 |
|---------|----------|--------|----------|
| green-green | green.svg | green.svg | arrow-green.svg |
| green-yellow | green.svg | yellow.svg | arrow-green.svg |
| green-red | green.svg | red.svg | arrow-green.svg |
| green-external | green.svg | external.svg | arrow-green.svg |
| yellow-green | yellow.svg | green.svg | arrow-yellow.svg |
| yellow-yellow | yellow.svg | yellow.svg | arrow-yellow.svg |
| yellow-red | yellow.svg | red.svg | arrow-yellow.svg |
| yellow-external | yellow.svg | external.svg | arrow-yellow.svg |
| red-green | red.svg | green.svg | arrow-red.svg |
| red-yellow | red.svg | yellow.svg | arrow-red.svg |
| red-red | red.svg | red.svg | arrow-red.svg |

## ⚡ 性能优化

1. **缓存友好**：图标文件有独立的URL，便于浏览器缓存
2. **按需加载**：图标只在需要时加载
3. **CDN支持**：可以通过CDN加速图标加载

## 🐛 故障排除

### 图标不显示
1. 检查图标文件路径是否正确
2. 确认图标文件是否存在
3. 检查浏览器控制台是否有404错误

### 图标显示异常
1. 确认SVG文件格式正确
2. 检查SVG文件内容是否完整
3. 确保图标文件没有损坏

### 替换后无变化
1. 检查浏览器缓存，尝试强制刷新（Ctrl+F5）
2. 确认替换了正确的文件
3. 检查是否有其他缓存机制（如CDN、Service Worker）

## 📝 最佳实践

1. **保持一致性**：使用相同风格的图标集
2. **优化SVG**：使用工具优化SVG文件大小
3. **版本控制**：为图标添加版本号便于管理
4. **备用方案**：为关键图标准备备用方案
5. **监控报警**：监控图标加载失败情况

## 🔗 相关文件

- `src/config/icons.ts` - 图标配置
- `src/composables/useTransferConfig.ts` - 传输配置逻辑
- `src/views/application/SelectTypeView.vue` - 主要使用图标的地方

---

**最后更新：2026-04-02**  
**维护者：前端开发团队**

补充：箭头图标未来统一使用arrow-green.svg了