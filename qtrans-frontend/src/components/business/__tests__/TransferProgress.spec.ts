import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import TransferProgress from '../TransferProgress.vue'
import { useFileStore } from '@/stores'

const tagStub = {
  template: '<span class="tag-stub"><slot /></span>',
}

const progressStub = {

  props: ['percent', 'status'],
  template: '<div class="progress-stub">{{ percent }}-{{ status }}</div>',
}

const buttonStub = {
  emits: ['click'],
  template: '<button @click="$emit(\'click\')"><slot /></button>',
}

function setTransferState(status: 'pending' | 'transferring' | 'paused' | 'completed' | 'error', extra: Record<string, unknown> = {}) {
  const fileStore = useFileStore()
  fileStore.setTransferState({
    applicationId: 'app-1',
    status,
    progress: status === 'completed' ? 100 : 45,
    speedBytesPerSec: status === 'transferring' ? 1024 : 0,
    transferredBytes: status === 'completed' ? 1024 : 460,
    totalBytes: 1024,
    remainingSeconds: status === 'completed' ? 0 : 5,
    ...extra,
  })
}

function mountComponent(props?: Record<string, unknown>) {
  return mount(TransferProgress, {
    props: {
      applicationId: 'app-1',
      fileSize: 1024,
      ...props,
    },
    global: {
      stubs: {
        'a-tag': tagStub,
        'a-progress': progressStub,
        'a-button': buttonStub,
      },

    },
  })
}

describe('TransferProgress.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders pending status and start button by default', () => {
    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('等待传输')
    expect(wrapper.text()).toContain('开始传输')
  })

  it('renders transfer state from file store', () => {
    setTransferState('transferring')

    const wrapper = mountComponent()

    expect(wrapper.text()).toContain('传输中')
    expect(wrapper.text()).toContain('1 KB/s')
    expect(wrapper.text()).toContain('45')
    expect(wrapper.text()).toContain('暂停传输')
  })

  it('starts transfer automatically when autoStart is enabled', async () => {
    const fileStore = useFileStore()
    fileStore.startTransfer = vi.fn().mockResolvedValue(undefined) as any

    mountComponent({ autoStart: true })
    await Promise.resolve()

    expect(fileStore.startTransfer).toHaveBeenCalledWith('app-1')
  })

  it('calls pause, resume and retry actions from current status', async () => {
    const fileStore = useFileStore()
    fileStore.pauseTransfer = vi.fn() as any
    fileStore.resumeTransfer = vi.fn() as any
    fileStore.retryTransfer = vi.fn().mockResolvedValue(undefined) as any

    setTransferState('transferring')
    const wrapper = mountComponent()

    await wrapper.find('button').trigger('click')
    expect(fileStore.pauseTransfer).toHaveBeenCalledWith('app-1')

    setTransferState('paused')
    await wrapper.vm.$nextTick()
    await wrapper.find('button').trigger('click')
    expect(fileStore.resumeTransfer).toHaveBeenCalledWith('app-1')

    setTransferState('error', { errorMessage: 'boom' })
    await wrapper.vm.$nextTick()
    await wrapper.find('button').trigger('click')
    expect(fileStore.retryTransfer).toHaveBeenCalledWith('app-1')
  })

  it('emits complete and error events when state changes', async () => {
    const wrapper = mountComponent()

    setTransferState('completed')
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('complete')).toHaveLength(1)

    const errorWrapper = mountComponent()
    setTransferState('error', { errorMessage: 'boom' })
    await errorWrapper.vm.$nextTick()

    const emittedError = errorWrapper.emitted('error')
    expect(emittedError).toHaveLength(1)
    expect((emittedError?.[0]?.[0] as Error).message).toBe('boom')
  })
})

