<script setup lang="ts">
import type { CreateChannelRequest, EncryptionConfigType, TransferChannel, UpdateChannelRequest } from '@/types'
import { computed, reactive, ref, watch } from 'vue'

interface Props {
  visible: boolean
  channel: TransferChannel | null
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'save', data: CreateChannelRequest | UpdateChannelRequest): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const formRef = ref()
const isEditMode = computed(() => !!props.channel)

const encryptionOptions: Array<{ label: string, value: EncryptionConfigType }> = [
  { label: '数据加密', value: 'data_encryption' },
  { label: 'RMS加密', value: 'rms_encryption' },
  { label: '资产检测', value: 'asset_detection' },
]

const formData = reactive<CreateChannelRequest>({
  name: '',
  code: '',
  encryptionConfigs: ['data_encryption'],
  description: '',
  status: 'enabled',
})

const formRules = {
  name: [
    { required: true, message: '请输入通道名称' },
    { minLength: 2, message: '通道名称至少2个字符' },
  ],
  code: [
    { required: true, message: '请输入通道代码' },
    { match: /^[a-z0-9_-]+$/, message: '通道代码仅支持小写字母、数字、-、_' },
  ],
  encryptionConfigs: [{ required: true, type: 'array', minLength: 1, message: '至少选择一个加密配置' }],
}

watch(
  () => props.visible,
  (visible) => {
    if (!visible) return

    if (props.channel) {
      Object.assign(formData, {
        name: props.channel.name,
        code: props.channel.code,
        encryptionConfigs: [...props.channel.encryptionConfigs],
        description: props.channel.description,
        status: props.channel.status,
      })
      return
    }

    Object.assign(formData, {
      name: '',
      code: '',
      encryptionConfigs: ['data_encryption'],
      description: '',
      status: 'enabled',
    })
  },
)

function handleCancel() {
  emit('update:visible', false)
}

async function handleOk() {
  const valid = await formRef.value?.validate()
  if (valid)
    return

  const payload = isEditMode.value
    ? {
        name: formData.name,
        code: formData.code,
        encryptionConfigs: [...formData.encryptionConfigs],
        description: formData.description,
        status: formData.status,
      } as UpdateChannelRequest
    : {
        ...formData,
        encryptionConfigs: [...formData.encryptionConfigs],
      } as CreateChannelRequest

  emit('save', payload)
}
</script>

<template>
  <a-modal
    :visible="visible"
    :title="isEditMode ? '编辑通道' : '新建通道'"
    :mask-closable="false"
    width="640px"
    @cancel="handleCancel"
    @ok="handleOk"
  >
    <a-form ref="formRef" :model="formData" :rules="formRules" layout="vertical">
      <a-form-item field="name" label="通道名称">
        <a-input v-model="formData.name" placeholder="请输入通道名称" allow-clear />
      </a-form-item>

      <a-form-item field="code" label="通道代码">
        <a-input v-model="formData.code" placeholder="例如：cross_border_line" allow-clear />
      </a-form-item>

      <a-form-item field="encryptionConfigs" label="加密配置">
        <a-checkbox-group v-model="formData.encryptionConfigs" direction="vertical">
          <a-checkbox v-for="item in encryptionOptions" :key="item.value" :value="item.value">
            {{ item.label }}
          </a-checkbox>
        </a-checkbox-group>
      </a-form-item>

      <a-form-item field="description" label="描述">
        <a-textarea
          v-model="formData.description"
          placeholder="请输入描述信息"
          :max-length="100"
          show-word-limit
          allow-clear
        />
      </a-form-item>

      <a-form-item field="status" label="启用状态">
        <a-switch
          :model-value="formData.status === 'enabled'"
          checked-text="启用"
          unchecked-text="禁用"
          @change="(value) => { formData.status = value ? 'enabled' : 'disabled' }"
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>
