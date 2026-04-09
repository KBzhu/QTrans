/**
 * 上传文件名/路径合法性校验工具
 * 对齐老代码 FineUploader onSubmit 中的校验逻辑
 *
 * 老代码校验规则：
 * 1. blackList: 初始化时后端返回的黑名单字符（base64 编码，解码后如 / \ : * ? " < > |）
 * 2. maxLength4Name: 文件名最大长度
 * 3. maxLength4Path: 文件路径最大长度
 */

/** 校验结果 */
export interface FileNameValidationResult {
  valid: boolean
  error?: string
}

/**
 * 解码后端返回的 base64 编码黑名单
 * @param encodedBlackList 后端返回的 base64 编码黑名单字符串
 * @returns 解码后的黑名单字符字符串
 */
function decodeBlackList(encodedBlackList: string): string {
  if (!encodedBlackList) return ''
  try {
    return atob(encodedBlackList)
  }
  catch {
    // 如果不是合法 base64，直接返回原值（兼容非编码场景）
    return encodedBlackList
  }
}

/**
 * 校验文件名合法性
 * @param fileName 文件名（不含路径）
 * @param blackList 后端返回的黑名单字符（base64 编码，如 atob 后为 "/\\:*?\"<>|"）
 * @param maxLength4Name 文件名最大长度（来自 initData.maxLength4Name）
 */
export function validateFileName(
  fileName: string,
  blackList: string,
  maxLength4Name: number,
): FileNameValidationResult {
  if (!fileName || !fileName.trim()) {
    return { valid: false, error: '文件名不能为空' }
  }

  // 检查黑名单字符（后端返回的 blackList 为 base64 编码，需先解码）
  const decodedBlackList = decodeBlackList(blackList)
  if (decodedBlackList) {
    const forbiddenChars = decodedBlackList.split('').filter(ch => fileName.includes(ch))
    if (forbiddenChars.length > 0) {
      return {
        valid: false,
        error: `文件名包含非法字符: ${forbiddenChars.map(ch => ch === ' ' ? '空格' : ch).join('、')}`,
      }
    }
  }

  // 默认黑名单字符（即使后端未返回，也应拦截）
  const defaultForbidden = /[\\:*?"<>|]/
  if (defaultForbidden.test(fileName)) {
    return {
      valid: false,
      error: `文件名包含非法字符: \\ : * ? " < > |`,
    }
  }

  // 文件名长度校验
  if (maxLength4Name && fileName.length > maxLength4Name) {
    return {
      valid: false,
      error: `文件名过长（${fileName.length}/${maxLength4Name}），请缩短后重试`,
    }
  }

  return { valid: true }
}

/**
 * 校验文件路径合法性
 * @param relativeDir 相对目录
 * @param fileName 文件名
 * @param maxLength4Path 路径最大长度（来自 initData.maxLength4Path）
 */
export function validateFilePath(
  relativeDir: string,
  fileName: string,
  maxLength4Path: number,
): FileNameValidationResult {
  const fullPath = relativeDir ? `${relativeDir}/${fileName}` : fileName

  if (maxLength4Path && fullPath.length > maxLength4Path) {
    return {
      valid: false,
      error: `文件路径过长（${fullPath.length}/${maxLength4Path}），请缩短后重试`,
    }
  }

  return { valid: true }
}

/**
 * 批量校验文件名/路径
 * @param files 待校验的文件列表
 * @param blackList 黑名单字符（base64 编码）
 * @param maxLength4Name 文件名最大长度
 * @param maxLength4Path 路径最大长度
 * @param relativeDir 相对目录
 * @returns 非法文件列表及错误信息
 */
export function validateFileNames(
  files: File[],
  blackList: string,
  maxLength4Name: number,
  maxLength4Path: number,
  relativeDir = '',
): Array<{ file: File; error: string }> {
  const invalidFiles: Array<{ file: File; error: string }> = []

  for (const file of files) {
    const nameResult = validateFileName(file.name, blackList, maxLength4Name)
    if (!nameResult.valid) {
      invalidFiles.push({ file, error: nameResult.error! })
      continue
    }

    const pathResult = validateFilePath(relativeDir, file.name, maxLength4Path)
    if (!pathResult.valid) {
      invalidFiles.push({ file, error: pathResult.error! })
    }
  }

  return invalidFiles
}
