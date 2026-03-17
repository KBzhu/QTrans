<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { departments, DEFAULT_DEPARTMENT, type DepartmentNode } from '@/mocks/data/departments'

interface Props {
  modelValue?: string
  placeholder?: string
  disabled?: boolean
  allowClear?: boolean
  allowSearch?: boolean
  defaultToFirst?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '请选择部门',
  disabled: false,
  allowClear: true,
  allowSearch: true,
  defaultToFirst: false,
})

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: { deptId: string, deptName: string }): void
}

const emit = defineEmits<Emits>()

// 将部门数据转换为 a-tree-select 需要的格式
interface TreeSelectNode {
  key: string
  title: string
  value: string
  children?: TreeSelectNode[]
}

const treeData = computed<TreeSelectNode[]>(() => {
  const transform = (nodes: DepartmentNode[]): TreeSelectNode[] => {
    return nodes.map(node => ({
      key: node.id,
      title: node.name,
      value: node.id,
      children: node.children?.length ? transform(node.children) : undefined,
    }))
  }
  return transform(departments)
})

// 递归查找部门节点
function findDepartmentNode(nodes: DepartmentNode[], id: string): DepartmentNode | null {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.children) {
      const found = findDepartmentNode(node.children, id)
      if (found) return found
    }
  }
  return null
}

// 递归查找部门节点的完整路径
function findDepartmentPath(nodes: DepartmentNode[], id: string, path: string[] = []): string[] | null {
  for (const node of nodes) {
    const currentPath = [...path, node.name]
    if (node.id === id) return currentPath
    if (node.children) {
      const found = findDepartmentPath(node.children, id, currentPath)
      if (found) return found
    }
  }
  return null
}

// 当前选中的值
const selectedValue = ref(props.modelValue)

// 监听外部传入的值变化
watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      selectedValue.value = newVal
    }
  },
  { immediate: true },
)

// 初始化默认部门
if (props.defaultToFirst && !selectedValue.value) {
  selectedValue.value = DEFAULT_DEPARTMENT
  emit('update:modelValue', DEFAULT_DEPARTMENT)
  const path = findDepartmentPath(departments, DEFAULT_DEPARTMENT)
  emit('change', { 
    deptId: DEFAULT_DEPARTMENT, 
    deptName: path ? path.join('/') : '' 
  })
}

// 处理选择变化
function handleChange(value: string | undefined) {
  const newValue = value || ''
  selectedValue.value = newValue
  emit('update:modelValue', newValue)

  // 查找选中节点并触发 change 事件，返回完整路径格式
  if (newValue) {
    const path = findDepartmentPath(departments, newValue)
    emit('change', { 
      deptId: newValue, 
      deptName: path ? path.join('/') : '' 
    })
  }
  else {
    emit('change', { deptId: '', deptName: '' })
  }
}
</script>

<template>
  <a-tree-select
    :model-value="selectedValue"
    :data="treeData"
    :placeholder="placeholder"
    :disabled="disabled"
    :allow-clear="allowClear"
    :allow-search="allowSearch"
    :filter-tree-node="allowSearch ? undefined : () => true"
    tree-checked-strategy="child"
    class="department-selector"
    @change="handleChange"
  />
</template>

<style src="./DepartmentSelector.scss" lang="scss" scoped />
