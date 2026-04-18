# 暂停 BUG 修复任务

## 问题描述
暂停上传只能生效一次，第二次点暂停时不停止上传，仍在调用 `act=add` 接口上传；第一次暂停后继续上传，进度条从 0 重新开始。

## 根因分析
`generateFileUUID` 包含 `Date.now()`，导致每次 `resumeUpload` → `uploadFile` 都生成新的 UUID：
1. Map 中的 AbortController key 与列表 item.id 不一致 → 第二次暂停找不到 controller
2. 服务端分片状态查询用新 UUID → 查不到已上传分片 → 从 0 重新上传

## 修复方案
1. `uploadFile` 接受可选的 `existingFileUUID` 参数，resume 场景复用已有 ID
2. `resumeUpload` 传入 `item.id` 给 `uploadFile`
3. `retryUpload` 同步修复，传入 `item.id` 给 `uploadFile`
4. resume 后保留 `uploadedChunkCount`，通过断点续传正确恢复进度

## 子任务
- [ √ ] 修改 `uploadFile` 函数签名，增加可选 `existingFileUUID` 参数
- [ √ ] 修改 `resumeUpload`，传入 `item.id` 给 `uploadFile`
- [ √ ] 修改 `retryUpload`，传入 `item.id` 给 `uploadFile`
- [ √ ] 确保进度恢复逻辑正确（通过 checkChunkStatus 恢复）
- [ √ ] 更新 CHANGELOG
