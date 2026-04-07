/**
  * 文件检测结果类型映射
  * 用于标识文件检测过程中发现的各类问题或状态
  */
export const FILE_DETECTION_TYPE_MAP: Record<number, string> = {
    // === 检测状态 ===
    0: '检测通过',
    18: '检测失败',

    // === 安全风险 ===
    1: '文件伪装（真实后缀被篡改）',
    3: '加密压缩包',
    8: '压缩包解压失败（已知原因）',
    15: '压缩包解压失败（原因未知）',

    // === 资产分类 ===
    4: '关键资产',
    22: '员工个人照片',
    23: '禁止外传资产',
    24: '非资产文件',

    // === 代码相关 ===
    5: '源码文件',
    19: '损坏代码文件',
    62: '公司源码',
    66: '代码文件',
    67: '疑似夹带代码',

    // === 敏感内容 ===
    51: '设计文档（含敏感关键字或禁止后缀）',
    57: '特种文件',
}

/**
  * 文件检测类型分类枚举
  */
export enum FileDetectionCategory {
    /** 检测状态类 */
    STATUS = 'status',
    /** 安全风险类 */
    SECURITY = 'security',
    /** 资产分类类 */
    ASSET = 'asset',
    /** 代码相关类 */
    CODE = 'code',
    /** 敏感内容类 */
    SENSITIVE = 'sensitive',
}

/**
  * 按类别分组的检测类型
  */
export const FILE_DETECTION_BY_CATEGORY = {
    [FileDetectionCategory.STATUS]: {
        label: '检测状态',
        types: [
            { code: 0, label: '检测通过', description: '文件检测未发现异常' },
            { code: 18, label: '检测失败', description: '文件检测过程发生错误' },
        ],
    },
    [FileDetectionCategory.SECURITY]: {
        label: '安全风险',
        types: [
            { code: 1, label: '文件伪装', description: '文件真实后缀被篡改，实际类型与声明不符' },
            { code: 3, label: '加密压缩包', description: '压缩包设有密码保护，无法检测内部内容' },
            { code: 8, label: '解压失败（已知原因）', description: '压缩包解压过程出错，错误信息已记录' },
            { code: 15, label: '解压失败（原因未知）', description: '压缩包解压过程出错，未能确定具体原因' },
        ],
    },
    [FileDetectionCategory.ASSET]: {
        label: '资产分类',
        types: [
            { code: 4, label: '关键资产', description: '识别为重要业务资产，需重点审核' },
            { code: 22, label: '员工个人照片', description: '包含员工个人信息的人像照片' },
            { code: 23, label: '禁止外传资产', description: '标记为不允许外发的敏感资产' },
            { code: 24, label: '非资产文件', description: '不属于公司资产范畴的文件' },
        ],
    },
    [FileDetectionCategory.CODE]: {
        label: '代码文件',
        types: [
            { code: 5, label: '源码文件', description: '程序源代码文件' },
            { code: 19, label: '损坏代码文件', description: '代码文件结构损坏或内容不完整' },
            { code: 62, label: '公司源码', description: '公司自有知识产权的源代码' },
            { code: 66, label: '代码文件', description: '常规编程语言代码文件' },
            { code: 67, label: '疑似夹带代码', description: '检测到可能隐含在文件中的代码片段' },
        ],
    },
    [FileDetectionCategory.SENSITIVE]: {
        label: '敏感内容',
        types: [
            { code: 51, label: '设计文档（敏感）', description: '包含敏感关键字或使用禁止的后缀格式' },
            { code: 57, label: '特种文件', description: '特殊类型文件，需专项审核' },
        ],
    },
}
