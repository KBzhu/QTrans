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
- 2026-03-04 P1 执行命令失败：`cd /d D:\VibeCoding\QTrans-0302new\qtrans-frontend && corepack pnpm install`
  - 错误信息：`package.json` 格式错误（scripts 结束后缺少逗号）。
- 2026-03-04 P1 单测失败：`cd /d D:\VibeCoding\QTrans-0302new\qtrans-frontend && corepack pnpm test:coverage`
  - 错误信息：`formatFileSize` 输出 `1.0 KB` / `1.0 MB` 与断言 `1 KB` / `1 MB` 不一致。
- 2026-03-04 P2.3 执行命令失败：`cd d:/VibeCoding/QTrans-0302new/qtrans-frontend; npx msw init public --save`
  - 错误信息：系统找不到指定的路径。
- 2026-03-04 P2 验收命令失败：`cd /d d:\VibeCoding\QTrans-0302new\qtrans-frontend && npm run build`
  - 错误信息：npm 在 `d:\VibeCoding\QTrans-0302new` 查找 `package.json` 失败（ENOENT）。
- 2026-03-04 P2 验收命令失败：`cd d:\VibeCoding\QTrans-0302new\qtrans-frontend && npm run build`
  - 错误信息：npm 仍在 `d:\VibeCoding\QTrans-0302new` 查找 `package.json` 失败（ENOENT）。
- 2026-03-04 P2.3 执行命令失败：`npx --yes --prefix d:\VibeCoding\QTrans-0302new\qtrans-frontend msw init d:\VibeCoding\QTrans-0302new\qtrans-frontend\public --save`
  - 错误信息：msw cli 默认 cwd 指向 `d:\VibeCoding\QTrans-0302new`，读取 `package.json` 失败（ENOENT）。
- 2026-03-04 P2 构建校验失败：`npm --prefix d:\VibeCoding\QTrans-0302new\qtrans-frontend run build`
  - 错误信息：首次构建出现 TypeScript 类型错误（路径别名缺失、handlers 严格类型报错），后续已通过补充 `tsconfig.app.json` 路径别名与修复 handlers 类型问题解决。
- 2026-03-04 P3 测试执行失败：`npm --prefix d:\VibeCoding\QTrans-0302new\qtrans-frontend run test -- src/stores/__tests__`
  - 错误信息：Vitest `vi.mock` 提升导致 `Cannot access 'xxxMock' before initialization`（后续已改为 `vi.hoisted` 解决）。
- 2026-03-04 P3 构建校验失败：`npm --prefix d:\VibeCoding\QTrans-0302new\qtrans-frontend run build`
  - 错误信息：`pinia-plugin-persistedstate` 类型定义不接受 `paths`，报 TS2353，后续改为 `pick` 解决。





































































