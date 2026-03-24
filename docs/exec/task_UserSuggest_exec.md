# 人员搜索选择器对接真实接口

## 需求概述
将"下载人账号"、"抄送人账号"、"直接主管"三个选择框对接真实的人员模糊查询接口。

## 接口信息
- **URL**: `POST /workflowService/services/frontendService/frontend/suggestUser`
- **参数**: `{ keyWord: string, userType: number }`
- **userType**: 固定使用 `LOGIN_USER_TYPE = 2`
- **响应字段**:
  - `userAccount`: 用户账号
  - `displayNameCn`: 中文名
  - `dept`: 部门

## 显示格式
- 格式：`displayNameCn / userAccount / dept`
- 布局：中文名和账号在左侧，部门在右侧单行显示

## 交互要求
- 防抖处理（300ms）
- 至少输入3个字符才触发搜索
- placeholder 提示用户输入要求
- 直接主管为单选，其他为多选

---

## 执行步骤

### 1. API 层 - 添加人员搜索接口
- [√] 在 `src/api/auth.ts` 中添加 `suggestUser` 接口
- [√] 定义 `SuggestUserItem` 和 `SuggestUserResponse` 类型

### 2. Composable 层 - 创建人员搜索逻辑
- [√] 创建 `src/composables/useUserSuggest.ts`
- [√] 实现防抖搜索、数据转换、状态管理

### 3. 组件层 - 更新选择器组件
- [√] 创建通用的 `UserSuggestSelect.vue` 组件
- [√] 支持单选/多选模式
- [√] 实现自定义显示格式

### 4. 集成到表单
- [√] 替换 `StepOneBasicInfo.vue` 中的下载人账号选择器
- [√] 替换抄送人账号选择器
- [√] 替换直接主管选择器

### 5. 测试验证
- [√] 输入少于3个字符不触发搜索
- [√] 输入3个字符后正确触发搜索
- [√] 选项显示格式正确
- [√] 单选/多选功能正常

### 6. 二/三/四层审批人对接真实接口
- [√] 在 `src/api/application.ts` 中添加 `getAllApprovers` 接口和 `ApproverItem` 类型
- [√] 在 `useApprovalRoute.ts` 中添加 `approverOptions` 状态
- [√] 修改 `fetch` 方法并行调用两个接口
- [√] 根据 `approverTypeId` 解析审批人数据到对应层级
- [√] 自动选中第一个审批人
- [√] 将二/三/四层审批人改回普通下拉选择框

### 7. 测试验证（二/三/四层审批人）
- [ ] 选择"文件最高密级"后触发接口调用
- [ ] 审批人下拉框正确显示接口返回的人员
- [ ] 自动选中第一个审批人
- [ ] 显示格式正确（displayName / account）

---

## 执行日志

### 执行时间: 2026-03-24

**修改文件清单：**
1. `src/api/auth.ts` - 添加 `suggestUser` 接口和 `SuggestUserItem`、`SuggestUserResponse` 类型定义
2. `src/composables/useUserSuggest.ts` - 新建人员搜索 composable（防抖、状态管理、数据转换）
3. `src/components/business/UserSuggestSelect.vue` - 新建通用人员搜索选择器组件（支持单选/多选）
4. `src/views/application/components/StepOneBasicInfo.vue` - 替换下载人、抄送人、直接主管选择器
5. `src/api/application.ts` - 添加 `getAllApprovers` 接口和 `ApproverItem` 类型
6. `src/views/application/components/useApprovalRoute.ts` - 添加审批人选项获取和自动选中逻辑
7. `src/views/application/components/constants.ts` - 删除废弃的 `MOCK_APPROVER_OPTIONS`

**注意事项：**
- 直接主管使用 `UserSuggestSelect`（用户主动搜索，单选）
- 下载人账号、抄送人使用 `UserSuggestSelect`（用户主动搜索，多选）
- 二/三/四层审批人使用普通下拉框，选项从 `getAllApprovers` 接口获取，自动选中第一个
- `approverTypeId` 映射：0=一层, 1=二层, 2=三层, 3=四层
- 显示格式：`displayName / account`

测试验证清单
 选择"文件最高密级"后触发两个接口并行调用
 二/三/四层审批人下拉框正确显示接口返回的人员
 自动选中第一个审批人
 显示格式正确（displayName / account）
 直接主管仍可正常搜索选择

 字段	选择器类型	数据来源	选择方式
下载人账号	UserSuggestSelect	用户搜索	多选
抄送人	UserSuggestSelect	用户搜索	多选
直接主管	UserSuggestSelect	用户搜索	单选
二层审批人	a-select	getAllApprovers 接口	自动选中第一个
三层审批人	a-select	getAllApprovers 接口	自动选中第一个
四层审批人	a-select	getAllApprovers 接口	自动选中第一个