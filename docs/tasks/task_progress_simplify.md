# 进度条重构：分片计数法

## 背景
之前方案使用 elapsedTime/(elapsedTime+timeLeft) 计算进度百分比，但服务端时间是 "HH:MM:SS" 格式导致解析问题，且分片上传期间无服务端时间导致回退字节进度瞬间跳变。

## 新方案
用最简单直接的数据：
- **进度** = `已上传分片数 / 总分片数 * 99`（上传阶段上限99%）
- **速率** = `剩余字节数 / timeLeft`（timeLeft 为服务端返回的 "HH:MM:SS" 解析后的秒数）
- **完成** = 校验通过后设 100%

## 子任务
- [ √ ] 1. 删除 calcProgressFromServerTime / estimateSpeed 函数，替换为分片计数法
- [ √ ] 2. 简化分片上传回调：onProgress 不再更新进度/速率，仅分片完成后更新
- [ √ ] 3. 清理 TransUploadFileItem 中不再需要的字段（lastElapsedTime、uploadedBytes、uploadedChunks）
- [ √ ] 4. 同步修改重试上传中的进度逻辑
- [ √ ] 5. 更新 CHANGELOG
