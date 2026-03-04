# failedLog

- 2026-03-04 P0.1 执行命令失败：`cd d:/VibeCoding/QTrans-0302new; pnpm create vite qtrans-frontend --template vue-ts`
  - 错误信息：系统找不到指定的路径。
- 2026-03-04 P0.1 执行命令失败：`Set-Location 'D:\VibeCoding\QTrans-0302new'; pnpm create vite qtrans-frontend --template vue-ts`
  - 错误信息：'Set-Location' 不是内部或外部命令，也不是可运行的程序或批处理文件。
- 2026-03-04 P0.1 执行命令失败：`cd /d D:\VibeCoding\QTrans-0302new && pnpm create vite qtrans-frontend --template vue-ts`
  - 错误信息：'pnpm' 不是内部或外部命令，也不是可运行的程序或批处理文件。
- 2026-03-04 P0.3 执行命令提示：`cd /d D:\VibeCoding\QTrans-0302new\qtrans-frontend && npx husky init`
  - 提示信息：`.git can't be found`（已生成 `.husky/pre-commit`，后续手动改为 lint-staged）。
- 2026-03-04 P0 验收命令失败：`cd /d D:\VibeCoding\QTrans-0302new\qtrans-frontend && corepack pnpm lint`
  - 错误信息：ESLint 需要安装 `jiti` 才能加载 `eslint.config.ts`。
- 2026-03-04 P0 验收命令失败：`cd /d D:\VibeCoding\QTrans-0302new\qtrans-frontend && corepack pnpm lint -- --fix`
  - 错误信息：脚本参数传递导致 ESLint 将 `--fix` 识别为文件模式。








