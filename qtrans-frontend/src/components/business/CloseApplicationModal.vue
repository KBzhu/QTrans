<script setup lang="ts">
import { Message } from '@arco-design/web-vue'
import { computed, ref, watch } from 'vue'
import { applicationApi } from '@/api/application'

const props = defineProps<{
  visible: boolean
  applicationId: number | string
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'success': []
}>()

const inputValue = ref('')
const loading = ref(false)

const displayId = computed(() => String(props.applicationId))

// 校验输入的单号是否匹配
const isInputValid = computed(() => inputValue.value.trim() === displayId.value)

// 弹窗关闭时重置输入
watch(() => props.visible, (val) => {
  if (!val) {
    inputValue.value = ''
  }
})

function handleClose() {
  emit('update:visible', false)
}

async function handleConfirm() {
  if (!isInputValid.value) {
    Message.warning('请输入正确的申请单号')
    return
  }

  loading.value = true
  try {
    const result = await applicationApi.closeApplication(props.applicationId)
    if (result) {
      Message.success('申请单已关闭')
      emit('update:visible', false)
      emit('success')
    }
    else {
      Message.error('关闭申请单失败')
    }
  }
  catch (error) {
    Message.error('关闭申请单失败')
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <a-modal
    :visible="visible"
    :closable="false"
    :footer="false"
    :mask-closable="false"
    :width="400"
    unmount-on-close
    @cancel="handleClose"
  >
    <template #title>
      <span class="modal-title">关闭申请单</span>
    </template>

    <div class="close-confirm-content">
      <p class="confirm-hint">
        您即将关闭申请单，请输入申请单号 <strong>{{ displayId }}</strong> 以确认操作：
      </p>

      <a-input
        v-model="inputValue"
        :placeholder="`请输入 ${displayId}`"
        allow-clear
        @press-enter="handleConfirm"
      />

      <p class="confirm-warning">
        此操作不可撤销
      </p>
    </div>

    <div class="close-confirm-footer">
      <a-button @click="handleClose">取消</a-button>
      <a-button
        type="primary"
        status="danger"
        :disabled="!isInputValid"
        :loading="loading"
        @click="handleConfirm"
      >
        确认关闭
      </a-button>
    </div>
  </a-modal>
</template>

<style scoped lang="scss">
.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-1);
}

.close-confirm-content {
  padding: 8px 0;

  .confirm-hint {
    margin-bottom: 16px;
    color: var(--color-text-2);
    line-height: 1.6;

    strong {
      color: rgb(var(--danger-6));
      font-weight: 600;
    }
  }

  .confirm-warning {
    margin-top: 12px;
    font-size: 12px;
    color: var(--color-text-3);
  }
}

.close-confirm-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}
</style>
