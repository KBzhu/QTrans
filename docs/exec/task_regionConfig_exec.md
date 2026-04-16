# 区域配置动态化重构 - 执行文档

## 背景
- 红区（red）已废弃，前端需全面移除
- 后端提供 `region_type` 独立接口，可动态获取区域元数据
- 目标：消除前端硬编码映射，所有区域 code↔id↔name 映射来自后端配置

## 后端接口
- URL: `GET /commonService/services/jalor/lookup/itemquery/listbycodes/region_type/zh_CN`
- 关键字段: `itemAttr1`(区域ID), `itemAttr2`(code), `itemName`(中文名)
- 归一化规则: `Green→green`, `Yellow→yellow`, `Internet→external`

## 执行步骤

### 1. 新建 regionConfig Store
- [ ] 创建 `src/stores/regionConfig.ts`
- [ ] 定义 RegionItem 接口
- [ ] 实现请求后端接口 + 构建动态映射
- [ ] 派生 computed: idToCode, codeToId, codeToName, nameToCode, areaOptions
- [ ] 实现工具方法: getIdByCode, getCodeById, getNameByCode, getNameById, formatTransferTypeLabel, formatTransWayLabel

### 2. 重构 constants/region.ts
- [ ] 移除红区(red)相关
- [ ] 删除硬编码映射表(AREA_ID_MAP, ID_TO_AREA, AREA_LABEL_MAP, LABEL_TO_AREA, AREA_OPTIONS)
- [ ] 保留 SecurityArea 类型定义（移除 'red'）和 fallback 工具函数

### 3. 重构 constants/transferType.ts
- [ ] 移除红区相关选项
- [ ] TRANSFER_TYPE_OPTIONS 改为从 regionConfig store 动态生成或保留为函数

### 4. 重构 regionMetadata store
- [ ] setMetadataFromIds 改用 regionConfig store 的动态映射
- [ ] 删除对 ID_TO_AREA/AREA_LABEL_MAP 的硬编码 import

### 5. 清理 useApplicationForm.ts
- [ ] 删除 external→red 别名映射
- [ ] 更新 transferTypeAlias

### 6. 清理详情页 composable
- [ ] useApplicationDetail.ts: 删除本地 REGION_ID_TO_NAME
- [ ] useApprovalDetail.ts: 删除本地 REGION_ID_TO_NAME
- [ ] 改用 regionConfig store

### 7. 清理 useApplicationList.ts
- [ ] 删除本地红区硬编码映射

### 8. 清理其他散落引用
- [ ] mock 数据
- [ ] 业务组件
- [ ] 测试文件

### 9. App.vue 初始化
- [ ] 在 App.vue 的 onMounted 或路由守卫中初始化 regionConfig Store

### 10. 验证与文档
- [ ] 构建通过
- [ ] 更新 CHANGELOG
- [ ] 生成 quickStart 文档
