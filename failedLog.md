# Failed Log

## 2026-04-16: CreateApplicationView 黄区场景刷新丢失区域信息

**现象**: 直接在 `/application/create` 路由刷新浏览器，涉及黄区的场景（绿传黄、外网传黄、黄传绿、黄传外网、黄传黄）丢失区域和 label 信息；而绿/外网组合正常。

**根因**: 黄区的后端 ID 是 `0`。原代码使用 `if (fromId && toId)` 判断是否调用 `setMetadataFromIds`，而 JavaScript 中 `0` 是 falsy 值，导致黄区 ID=0 时条件判断为 false，`setMetadataFromIds` 不被执行。

原代码：
```ts
const fromId = Number(route.query.fromId) ?? 1  // "0" → 0，0 ?? 1 仍为 0
const toId = Number(route.query.toId) ?? 1
if (fromId && toId) {  // 0 && ... → false，黄区被过滤
  regionMetadataStore.setMetadataFromIds(fromId, toId)
}
```

**修复**: 改用 `!isNaN()` 判断，0 是合法 ID：
```ts
const fromId = Number(route.query.fromId)
const toId = Number(route.query.toId)
if (!isNaN(fromId) && !isNaN(toId)) {
  regionMetadataStore.setMetadataFromIds(fromId, toId)
}
```

**影响文件**: `qtrans-frontend/src/views/application/CreateApplicationView.vue`
