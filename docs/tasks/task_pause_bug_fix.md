# 暂停 BUG 修复任务

## 问题描述
1. 暂停上传只能生效一次，第二次点暂停时不停止上传，仍在调用 `act=add` 接口上传
2. 第一次暂停后继续上传，进度条从 0 重新开始
3. `checkChunkStatus` 将 `hash=partial` 误判为分片不完整，导致已有完整数据的分片被重新上传

## 根因分析

### BUG1 & BUG2：UUID 不一致
`generateFileUUID` 包含 `Date.now()`，导致每次 `resumeUpload` → `uploadFile` 都生成新的 UUID：
1. Map 中的 AbortController key 与列表 item.id 不一致 → 第二次暂停找不到 controller
2. 服务端分片状态查询用新 UUID → 查不到已上传分片 → 从 0 重新上传

### BUG3：partial 哈希误判
服务端 `act=chunks` 接口返回的 `hash=partial` 仅表示"服务端哈希尚未计算完成"，不代表数据不完整。
旧代码把 `hash === 'partial'` 直接判为"分片不完整需要重传"，导致已有完整数据（size=4194304）的分片被重复上传，进度从 0 开始。

## 修复方案
1. `uploadFile` 接受可选的 `existingFileUUID` 参数，resume 场景复用已有 ID
2. `resumeUpload` 传入 `item.id` 给 `uploadFile`
3. `retryUpload` 同步修复，传入 `item.id` 给 `uploadFile`
4. `checkChunkStatus` 改为按 `size` 判断数据完整性，`hash=partial` 不再影响判断
5. 移除不再使用的 `getChunksByFileUUID` import 和 IndexedDB 本地分片比对逻辑

## 子任务
- [ √ ] 修改 `uploadFile` 函数签名，增加可选 `existingFileUUID` 参数
- [ √ ] 修改 `resumeUpload`，传入 `item.id` 给 `uploadFile`
- [ √ ] 修改 `retryUpload`，传入 `item.id` 给 `uploadFile`
- [ √ ] 修复 `checkChunkStatus` 的 `hash=partial` 误判逻辑，改为按 size 判断数据完整性
- [ √ ] 移除不再使用的 `getChunksByFileUUID` import 和 localChunks 逻辑
- [ √ ] 更新 CHANGELOG
