# task_P6.6.2 - 城市选择器组件

## 任务目标

实现城市选择器组件 CitySelector.vue，使用 a-cascader 展示省份-城市级联，替换 StepOneBasicInfo.vue 中的城市选择 a-cascader。

## 需求变更记录

1. **城市 Mock 数据调整**: 去掉所有国外城市，默认都是国内的省份-城市结构
2. **默认城市**: 用户每次进入页面时，自动填充默认城市（如：广东省-深圳）

## 子任务清单

- [√] 更新 `src/mocks/data/cities.ts`
  - [√] 改为省份-城市结构（去掉国外城市）
  - [√] 保留省份代码、城市代码、数据中心信息
  - [√] 新增 DEFAULT_CITY 默认城市常量
- [√] 创建 `src/components/business/CitySelector.vue`
  - [√] 使用 a-cascader 组件
  - [√] 支持搜索、清空
  - [√] Props：modelValue（v-model 绑定，数组格式 `[provinceId, cityId]`）
  - [√] Emits：update:modelValue, change
  - [√] 从 Mock 数据加载城市列表
  - [√] 支持默认城市设置（defaultToFirst prop）
- [√] 创建独立样式文件 `src/components/business/CitySelector.scss`
- [√] 替换 StepOneBasicInfo.vue 中的城市选择逻辑
  - [√] 替换源城市 a-cascader
  - [√] 替换目标城市 a-cascader
  - [√] 添加默认城市初始化逻辑
- [√] 更新 useApplicationForm.ts
  - [√] 引入 DEFAULT_CITY 常量
  - [√] defaultFormData 设置默认城市
  - [√] formRules 更新提示信息
- [ ] 单元测试（跳过）

## 验收标准

1. a-cascader 正常展示省份-城市级联
2. 搜索功能正常
3. 清空功能正常
4. v-model 双向绑定正常
5. 页面加载时有默认城市
