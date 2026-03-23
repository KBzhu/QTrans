# Task: 文件最高密级下拉框（高密传低密场景）

## 需求说明
当传输类型为"高密传低密"时（即 sourceArea→targetArea 属于以下组合），在"申请原因"字段**上方**新增"文件最高密级"下拉框，选项来源于后端接口。

**触发组合（高密→低密）：**
| 源区域 | 目标区域 | 说明 |
|--------|----------|------|
| yellow | green    | 黄区传绿区 |
| green  | external | 绿区传外网 |
| yellow | external | 黄区传外网 |
| red    | yellow   | 红区传黄区 |
| red    | green    | 红区传绿区 |

**接口信息：**
- URL: `POST /workflowService/services/frontendService/frontend/securityLevel/findSecurityLevelList`
- 请求体：`{ fromRegionTypeId, toRegionTypeId, isUrgent:0, isContainSourceCode:0, procType:"0", isContainLargeModel:0 }`
- 响应：数组，每项取 `securityLookupVO.itemCode`（value）、`securityLookupVO.itemName`（label）

---

## 子任务拆解

- [ ] **1. 确认区域枚举与 regionTypeId 映射关系**
  - 梳理 sourceArea/targetArea 的 value（green/yellow/red/external）与接口参数 fromRegionTypeId/toRegionTypeId 的数值映射
  - 若 areaOptions 缺少"外网"选项，补充进去

- [ ] **2. 在 `src/api/application.ts` 中新增接口方法**
  - 新增 `SecurityLevelItem` / `FindSecurityLevelParams` 接口类型
  - 新增 `findSecurityLevelList(params)` 方法，使用 `request.raw` POST 调用

- [ ] **3. 在 `useApplicationForm.ts` 中扩展 `ApplicationFormData`**
  - 新增字段 `securityLevel?: string`（存储选中的 itemCode）
  - 更新 formRules：高密传低密时 `securityLevel` 为必填，否则非必填

- [ ] **4. 新增 composable 或在 `StepOneBasicInfo.vue` 中实现联动逻辑**
  - 计算属性 `isHighToLow`：判断当前 sourceArea+targetArea 是否属于触发组合
  - 计算属性 `regionTypeIdMap`：area value → regionTypeId 数值映射
  - watch `isHighToLow`：当变为 false 时清空 `formData.securityLevel`；变为 true 时调用接口
  - 接口调用：传入当前 fromRegionTypeId/toRegionTypeId，结果存为 `securityLevelOptions`
  - 加载状态 `securityLevelLoading`

- [ ] **5. 更新 `StepOneBasicInfo.vue` 模板**
  - 在"申请原因" `a-form-item` 前，添加 `v-if="isHighToLow"` 的"文件最高密级"下拉框
  - 绑定 `formData.securityLevel`，选项来自 `securityLevelOptions`
  - 支持 `:disabled="readonly"` 与加载状态 `:loading="securityLevelLoading"`

- [ ] **6. 在 `src/api/application.ts` 中确认 `request.raw` 的使用方式与现有代码一致**
  - 参考 `createReal` 方法写法，保持风格统一

- [ ] **7. 验收自测**
  - 切换区域组合，确认下拉框显示/隐藏
  - 确认切换非触发组合时 securityLevel 自动清空
  - 确认 readonly 状态下不可操作
  - 确认接口报错时有兜底（loading 取消，options 为空）

---

## 需要你确认的问题

> **Q1：区域枚举映射**
> StepOneBasicInfo 中 areaOptions 目前只有 `green/yellow/red`，但需求中有"外网"（external）场景。请确认：
> - "外网"是否需要作为新选项加入下拉框？其 regionTypeId 数值是多少？
> - green=? / yellow=? / red=? / external=? 对应的 regionTypeId 数值分别是什么？
>
> **Q2：接口请求参数中 `isUrgent`、`isContainSourceCode`、`isContainLargeModel`**
> 当前是否固定传 0，还是与表单中其他字段联动？
>
> 如以上两问你都能在执行时告知，我将直接开始执行。

