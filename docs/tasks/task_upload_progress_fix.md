# 任务：上传进度条三个问题修复

## 问题描述

1. 正在上传的文件，不需要hash校验的进度条（上传阶段不应展示hashState区域）
2. 上传速度一直显示为0（formatTransferSpeed入参始终为0）
3. 进度条瞬间到头 — 应按服务端响应的 elapsedTime/timeLeft 计算百分比进度

## 子任务

- [ √ ] 1. 修复TransFileTable：上传中状态隐藏hash校验进度条区域
- [ √ ] 2. 修复speed计算：当前speed用的是累计平均速度，分片级onProgress回调在分片很小时触发极少，导致speed始终为0
- [ √ ] 3. 修复进度条：改用服务端elapsedTime/timeLeft计算进度百分比，对齐老代码逻辑
