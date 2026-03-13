import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import DepartmentSelector from '../DepartmentSelector.vue'

// Stub for a-tree-select
const treeSelectStub = {
  props: ['modelValue', 'data', 'placeholder', 'disabled', 'allowClear', 'allowSearch'],
  emits: ['update:modelValue', 'change'],
  template: `
    <div class="tree-select-stub" data-testid="tree-select">
      <input 
        :value="modelValue" 
        :placeholder="placeholder" 
        :disabled="disabled"
        @input="$emit('update:modelValue', $event.target.value)"
        data-testid="tree-select-input"
      />
      <button @click="$emit('change', 'dept-rd')" data-testid="select-rd">选择研发部</button>
      <button @click="$emit('change', 'dept-tech-ops')" data-testid="select-tech-ops">选择技术运营组</button>
      <button @click="$emit('change', undefined)" data-testid="clear">清空</button>
    </div>
  `,
}

function mountComponent(props?: Record<string, unknown>) {
  return mount(DepartmentSelector, {
    props: {
      modelValue: '',
      ...props,
    },
    global: {
      stubs: {
        'a-tree-select': treeSelectStub,
      },
    },
  })
}

describe('DepartmentSelector.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with default props', () => {
    const wrapper = mountComponent()

    expect(wrapper.find('[data-testid="tree-select"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="tree-select-input"]').attributes('placeholder')).toBe('请选择部门')
  })

  it('displays correct placeholder from props', () => {
    const wrapper = mountComponent({ placeholder: '请选择您的部门' })

    expect(wrapper.find('[data-testid="tree-select-input"]').attributes('placeholder')).toBe('请选择您的部门')
  })

  it('emits update:modelValue and change when selection changes', async () => {
    const wrapper = mountComponent()

    await wrapper.find('[data-testid="select-rd"]').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['dept-rd'])
    expect(wrapper.emitted('change')).toBeTruthy()
    expect(wrapper.emitted('change')![0][0]).toBe('dept-rd')
    expect(wrapper.emitted('change')![0][1]).toMatchObject({
      id: 'dept-rd',
      name: '研发部',
    })
  })

  it('emits empty value when cleared', async () => {
    const wrapper = mountComponent({ modelValue: 'dept-rd' })

    await wrapper.find('[data-testid="clear"]').trigger('click')

    expect(wrapper.emitted('update:modelValue')![0]).toEqual([''])
    expect(wrapper.emitted('change')![0][0]).toBe('')
    expect(wrapper.emitted('change')![0][1]).toBeNull()
  })

  it('selects nested department correctly', async () => {
    const wrapper = mountComponent()

    await wrapper.find('[data-testid="select-tech-ops"]').trigger('click')

    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['dept-tech-ops'])
    expect(wrapper.emitted('change')![0][1]).toMatchObject({
      id: 'dept-tech-ops',
      name: '技术运营组',
    })
  })

  it('updates internal value when modelValue prop changes', async () => {
    const wrapper = mountComponent({ modelValue: '' })

    await wrapper.setProps({ modelValue: 'dept-security' })

    expect(wrapper.find('[data-testid="tree-select-input"]').element.value).toBe('dept-security')
  })

  it('passes disabled prop to tree-select', () => {
    const wrapper = mountComponent({ disabled: true })

    expect(wrapper.find('[data-testid="tree-select-input"]').attributes('disabled')).toBeDefined()
  })
})
