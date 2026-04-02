/**
 * 获取当前应用的 base 路径前缀
 * 用于拼接静态资源路径（如 /figma/xxx.svg），确保带 base 前缀后能正确访问
 */
export function getBasePath(): string {
  return import.meta.env.BASE_URL || '/'
}

/**
 * 将资源路径补全 base 前缀
 * @param path - 资源路径，如 '/figma/xxx.svg'
 * @returns 带 base 前缀的完整路径，如 '/tenant/figma/xxx.svg'
 */
export function assetPath(path: string): string {
  const base = getBasePath()
  if (path.startsWith('/') && !path.startsWith(base)) {
    return `${base}${path.replace(/^\//, '')}`
  }
  return path
}
