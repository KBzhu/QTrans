# Task: 城市选择器接入真实接口

## 需求说明
将 `CitySelector` 组件从 mock 静态数据改为调用真实后端接口。

**接口说明：**
- 上传城市：页面加载时，根据 fromRegionTypeId/toRegionTypeId 查询
  `GET /workflowService/services/frontendService/frontend/city/findUploadCity?fromRegionTypeId=1&toRegionTypeId=1&isInternetFtpUpload=0&w3Account=xxx`
- 下载城市：选完上传城市后联动查询，uploadRegionId 取上传城市响应中的 regionId
  `GET /workflowService/services/frontendService/frontend/city/findDownloadCity?uploadRegionId=34&fromRegionTypeId=1&toRegionTypeId=1&isInternetFtpUpload=0&w3Account=xxx`
- 两个接口响应格式相同：`{ cityList: CityItem[], commonCity: null }`
- CityItem 关键字段：`cityId`, `cityName`, `countryName`, `regionId`

**联动逻辑：**
1. 页面进入 → 调用上传城市接口 → 渲染上传城市选择器
2. 用户选中上传城市 → 取该城市的 `regionId` → 调用下载城市接口 → 渲染下载城市选择器
3. 上传区域/下载区域变更时，重新触发上述流程并清空已选城市

---

## 子任务拆解

- [ ] **1. 新增城市相关 API 类型与方法**
  - 在 `src/api/application.ts` 中新增 `CityItem` 接口类型
  - 新增 `CityListResponse` 接口类型：`{ cityList: CityItem[], commonCity: null }`
  - 新增 `findUploadCity(params)` 方法（GET）
  - 新增 `findDownloadCity(params)` 方法（GET）
  - 参数中 `w3Account` 从 authStore 取当前用户 username

- [ ] **2. 改造 `CitySelector.vue` 支持外部传入选项**
  - 新增 prop：`options?: CityItem[]`（外部传入城市列表）、`loading?: boolean`
  - 当 `options` 存在时，使用外部数据渲染（单级选择，只选城市，不再分省份）
  - 当 `options` 不存在时，保留原有 mock 省份+城市两级逻辑（向后兼容）
  - emit 的 `change` 事件新增 `regionId` 字段：`{ province: string, city: string, cityId: number, regionId: number }`

- [ ] **3. 在 `StepOneBasicInfo.vue` 中实现联动逻辑**
  - 新增 `uploadCityOptions`、`downloadCityOptions`、`uploadCityLoading`、`downloadCityLoading` 响应式变量
  - 新增 `selectedUploadRegionId` ref，存储上传城市选中后的 regionId（供下载城市接口使用）
  - 封装 `fetchUploadCities()`：根据当前 sourceArea/targetArea 的 regionTypeId 调用接口
  - 封装 `fetchDownloadCities(uploadRegionId)`：根据 uploadRegionId 调用接口
  - `onMounted` 时调用 `fetchUploadCities()`
  - watch `sourceArea` / `targetArea`：变更时重新调用 `fetchUploadCities()`，并清空已选城市和下载城市列表
  - 修改 `onSourceCityChange`：选中后取 `regionId`，调用 `fetchDownloadCities(regionId)`
  - 将 `uploadCityOptions` / `downloadCityOptions` / loading 状态传给对应 `CitySelector`

- [ ] **4. 更新 `ApplicationFormData` 中 sourceCityId/targetCityId 的存储**
  - 确认 `sourceCityId` 存的是 `cityId`（已有），无需改动
  - 确认 `payloadConverter.ts` 中 `fromCityId` / `toCityId` 取的是 `sourceCityId` / `targetCityId`（已有）

- [ ] **5. 验收自测**
  - 页面加载后上传城市下拉有数据
  - 选中上传城市后，下载城市下拉联动刷新
  - 切换上传/下载区域后，两个城市选择器均清空并重新加载
  - loading 状态正常显示
  - 接口报错时选项为空，不崩溃

---

## 待确认问题

> **Q1：城市选择器 UI**
> 当前 CitySelector 是省份+城市两级联动。新接口返回的是平铺城市列表（无省份字段，只有 countryName）。
> 改造后是否直接改为**单级城市下拉**（去掉省份选择），还是用 countryName 作为分组保留两级？
>
> 请确认后我立即开始执行。
