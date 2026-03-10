<script setup lang="ts">
import type { CityDomainMapping, CreateCityMappingRequest, CreateSecurityDomainRequest, DomainStatus, SecurityDomain, UpdateCityMappingRequest, UpdateSecurityDomainRequest } from '@/types'
import type { ModalMode } from '@/composables/useRegionManage'
import { computed, reactive, ref, watch } from 'vue'

interface Props {
  visible: boolean
  mode: ModalMode
  item: CityDomainMapping | SecurityDomain | null
  domainOptions: SecurityDomain[]
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'saveCity', data: CreateCityMappingRequest | UpdateCityMappingRequest): void
  (e: 'saveDomain', data: CreateSecurityDomainRequest | UpdateSecurityDomainRequest): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const formRef = ref()
const isEditMode = computed(() => !!props.item)

const modalTitle = computed(() => {
  if (props.mode === 'city') {
    return isEditMode.value ? '编辑城市映射' : '新增城市映射'
  }
  return isEditMode.value ? '编辑安全域' : '新增安全域'
})

// 城市映射表单
const cityForm = reactive<CreateCityMappingRequest>({
  cityName: '',
  country: '',
  domainCode: '',
})

// 安全域表单
const domainForm = reactive<CreateSecurityDomainRequest & { status: DomainStatus }>({
  name: '',
  code: '',
  color: '#165dff',
  description: '',
  status: 'enabled',
})

const cityRules = {
  cityName: [{ required: true, message: '请输入城市名称' }],
  country: [{ required: true, message: '请输入国家' }],
  domainCode: [{ required: true, message: '请选择安全域' }],
}

const domainRules = {
  name: [{ required: true, message: '请输入安全域名称' }],
  code: [
    { required: true, message: '请输入安全域代码' },
    { match: /^[a-z][a-z0-9-_]*$/, message: '代码只能包含小写字母、数字、- 和 _' },
  ],
  color: [{ required: true, message: '请选择颜色标识' }],
}

// 预设颜色
const presetColors = ['#00b42a', '#ff7d00', '#f53f3f', '#1d2129', '#165dff', '#722ed1', '#eb2f96', '#faad14']

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      if (props.mode === 'city') {
        const city = props.item as CityDomainMapping | null
        Object.assign(cityForm, {
          cityName: city?.cityName || '',
          country: city?.country || '',
          domainCode: city?.domainCode || '',
        })
      }
      else {
        const domain = props.item as SecurityDomain | null
        Object.assign(domainForm, {
          name: domain?.name || '',
          code: domain?.code || '',
          color: domain?.color || '#165dff',
          description: domain?.description || '',
          status: domain?.status || 'enabled',
        })
      }
    }
  },
)

function handleCancel() {
  emit('update:visible', false)
}

async function handleOk() {
  const valid = await formRef.value?.validate()
  if (!valid) {
    if (props.mode === 'city') {
      emit('saveCity', { ...cityForm })
    }
    else {
      emit('saveDomain', { ...domainForm })
    }
  }
}
</script>

<template>
  <a-modal
    :visible="visible"
    :title="modalTitle"
    :mask-closable="false"
    width="520px"
    @cancel="handleCancel"
    @ok="handleOk"
  >
    <!-- 城市映射表单 -->
    <a-form
      v-if="mode === 'city'"
      ref="formRef"
      :model="cityForm"
      :rules="cityRules"
      layout="vertical"
    >
      <a-form-item field="cityName" label="城市名称">
        <a-input v-model="cityForm.cityName" placeholder="请输入城市名称" />
      </a-form-item>

      <a-form-item field="country" label="国家">
        <a-input v-model="cityForm.country" placeholder="请输入国家" />
      </a-form-item>

      <a-form-item field="domainCode" label="安全域">
        <a-select v-model="cityForm.domainCode" placeholder="请选择安全域" allow-search>
          <a-option
            v-for="domain in domainOptions"
            :key="domain.code"
            :value="domain.code"
            :label="domain.name"
          >
            <span class="domain-option">
              <span class="domain-dot" :style="{ background: domain.color }" />
              {{ domain.name }}
            </span>
          </a-option>
        </a-select>
      </a-form-item>
    </a-form>

    <!-- 安全域配置表单 -->
    <a-form
      v-else
      ref="formRef"
      :model="domainForm"
      :rules="domainRules"
      layout="vertical"
    >
      <a-form-item field="name" label="安全域名称">
        <a-input v-model="domainForm.name" placeholder="请输入安全域名称，如：绿区" />
      </a-form-item>

      <a-row :gutter="16">
        <a-col :span="12">
          <a-form-item field="code" label="安全域代码">
            <a-input
              v-model="domainForm.code"
              placeholder="如：green"
              :disabled="isEditMode"
            />
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item field="color" label="颜色标识">
            <a-input v-model="domainForm.color" placeholder="#000000">
              <template #prefix>
                <span class="color-preview" :style="{ background: domainForm.color }" />
              </template>
            </a-input>
          </a-form-item>
        </a-col>
      </a-row>

      <!-- 预设颜色 -->
      <div class="preset-colors">
        <span
          v-for="color in presetColors"
          :key="color"
          class="preset-color-dot"
          :class="{ active: domainForm.color === color }"
          :style="{ background: color }"
          @click="domainForm.color = color"
        />
      </div>

      <a-form-item field="description" label="描述">
        <a-textarea v-model="domainForm.description" placeholder="请输入描述（可选）" :max-length="200" show-word-limit />
      </a-form-item>

      <a-form-item field="status" label="启用状态">
        <a-switch
          v-model="domainForm.status"
          checked-value="enabled"
          unchecked-value="disabled"
          checked-text="启用"
          unchecked-text="禁用"
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<style lang="scss" scoped>
.domain-option {
  display: flex;
  align-items: center;
  gap: 6px;
}

.domain-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.color-preview {
  display: inline-block;
  width: 16px;
  height: 16px;
  border-radius: 3px;
  border: 1px solid var(--color-border);
}

.preset-colors {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.preset-color-dot {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: border-color 0.2s, transform 0.2s;

  &:hover {
    transform: scale(1.15);
  }

  &.active {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px rgba(var(--primary-6), 0.3);
  }
}
</style>
