# failedLog

- 2026-04-02 tenant/admin 开发模式修复期间 lint 首次报错：`qtrans-frontend/vite.config.ts`
  - 错误信息：`找不到名称“appTitle”(TS2304)`，原因是首次替换仅更新了 `define.__APP_TITLE__`，未同步补充 `appTitle` 定义。
  - 处理：补齐 `const appTitle = ...` 后重新执行定向 lint 校验，问题已修复。
- 2026-04-02 tenant/admin 修复回归构建失败：`pnpm --dir "d:/VibeCoding/QTrans-0302new/qtrans-frontend" run build:tenant`
  - 错误信息：构建被项目内既有 TypeScript 错误阻塞，包括 `src/api/regionManage.ts` 缺少 `request.patch`、`src/api/transWebService.ts` `BlobPart` 类型不兼容、`DepartmentSelector.spec.ts` 空值/类型错误、`RoleSwitcher.vue` 参数签名不匹配，以及多处 `TransFileTableDemo.vue` / `TransUploadView.vue` / `TransferManageView.vue` 现存类型问题。
  - 处理：确认本轮修改文件定向 lint 全部通过；该构建失败为仓库既有问题，未在本轮继续扩散处理。
- 2026-04-02 tenant/admin 文根适配二次修复期间定向 lint 失败：`qtrans-frontend/src/mocks/browser.ts`、`qtrans-frontend/vite.config.ts`
  - 错误信息：首次将 `serviceWorker` 选项错误地传给 `setupWorker(...handlers, options)`，触发 `TS2353`；同时 `vite.config.ts` 在代理抽取过程中遗漏 `proxy` 定义，触发 `TS2552`。
  - 处理：将 `serviceWorker.url/scope` 配置移回 `worker.start(...)`，并在 `vite.config.ts` 中补齐 `basePath`/`basePrefix`/`withBaseProxy`/`proxy` 定义后重新执行定向 lint，问题已修复。







- 2026-03-10 P10.3 覆盖率首次失败：`pnpm --dir "d:\VibeCoding\QTrans-0302new\qtrans-frontend" test:coverage`
  - 错误信息：`useNotificationList.spec.ts` 断言错误，先执行 `handleMarkRead('n-1')` 后又执行 `handleClearRead()`，此时 `n-1` 已变为已读并被清理，原断言仍期待保留 `['n-1']`，实际结果为空数组。
  - 处理：修正测试预期为清空已读后的空列表，并重新执行覆盖率验证。



- 2026-03-10 P9.1 定向测试首次失败：`pnpm --dir "d:\VibeCoding\QTrans-0302new\qtrans-frontend" exec vitest run src/components/business/__tests__/TransferProgress.spec.ts src/composables/__tests__/useApprovalDetail.spec.ts src/stores/__tests__/file.spec.ts`
  - 错误信息：`TransferProgress.spec.ts` 中将 `a-tag` 直接 stub 为 `true`，导致状态文案插槽未渲染，断言 `等待传输/传输中` 失败；命令尾部同时出现 `ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL`。
  - 处理：将 `a-tag` 替换为保留 slot 的自定义 stub，并改用更稳定的测试命令方式复跑相关测试。
- 2026-03-10 P9.1 定向测试二次失败：`pnpm --dir "d:\VibeCoding\QTrans-0302new\qtrans-frontend" test -- src/components/business/__tests__/TransferProgress.spec.ts ...`
  - 错误信息：测试脚本未按预期筛选到单文件且 `TransferProgress.spec.ts` 中仅替换了 `a-tag` 的引用，遗漏 `tagStub` 常量声明，触发 `ReferenceError: tagStub is not defined`。
  - 处理：补齐 `tagStub` 常量定义，后续使用更稳定的项目脚本 `pnpm --dir ... test:coverage` 完成最终验收。
- 2026-03-10 P9.1 直连 vitest 命令失败：`d:\VibeCoding\QTrans-0302new\qtrans-frontend\node_modules\.bin\vitest.cmd run ...`
  - 错误信息：命令在仓库根目录启动，导致路径别名 `@/` 与 `.vue` 插件能力未正确加载，出现 `Cannot find package '@/stores'` 与 `Install @vitejs/plugin-vue to handle .vue files`。
  - 处理：放弃直连方式，改回 `pnpm --dir "d:\VibeCoding\QTrans-0302new\qtrans-frontend" test:coverage`，最终 16 个测试文件、65 个用例全部通过。
- 2026-03-10 P9.3 覆盖率首次失败：`pnpm --dir "d:\VibeCoding\QTrans-0302new\qtrans-frontend" test:coverage`
  - 错误信息：`useTransferManage.spec.ts` 文件结尾少写了 `)`，esbuild 报错 `Expected ")" but found end of file`。
  - 处理：补齐 `describe` 的闭合括号后重新执行覆盖率验证。






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
- 2026-03-04 P4 构建校验失败：`npm --prefix d:\VibeCoding\QTrans-0302new\qtrans-frontend run build`
  - 错误信息：路由 `meta` 类型与 `RouteMeta` 不兼容（TS2322/TS2352），已通过 `AppRouteMeta` 继承 `RouteMeta` 与侧边栏 `meta` 类型收敛修复。
- 2026-03-04 P4 构建校验二次失败：`npm --prefix d:\VibeCoding\QTrans-0302new\qtrans-frontend run build`
  - 错误信息：`AppSidebar.vue` 模板调用了未定义的 `routeMeta`，以及 `AppRouteMeta` 索引签名不兼容，后续已修复。
- 2026-03-04 P4 构建校验三次失败：`npm --prefix d:\VibeCoding\QTrans-0302new\qtrans-frontend run build`
  - 错误信息：`routes.ts` 中 `RouteMeta` 未正确导入（TS2552）并引发连锁类型报错，补充导入后已解决。
- 2026-03-05 P6.1 构建验证命令失败：`cd d:\VibeCoding\QTrans-0302new\qtrans-frontend && npx vue-tsc --noEmit 2>&1 | cat`
  - 错误信息：`'cat' 不是内部或外部命令，也不是可运行的程序或批处理文件。`（Windows 环境无 `cat` 命令，属于 shell 兼容性问题）
  - 处理：改用不带管道的命令执行。
- 2026-03-05 P6.1 构建验证命令异常：`npx vue-tsc --noEmit`
  - 错误信息：`npx vue-tsc` 解析到了全局 `tsc`（TypeScript 5.9.3）而非 `vue-tsc`，输出了 tsc 帮助信息而非类型检查结果。原因是 `node_modules` 不存在，npx 回退到全局。
  - 处理：发现 node_modules 缺失，改用 pnpm 安装依赖。
- 2026-03-05 P6.1 依赖安装失败：`npm install --prefix d:\VibeCoding\QTrans-0302new\qtrans-frontend`
  - 错误信息：`npm error code EUNSUPPORTEDPROTOCOL - Unsupported URL Type "workspace:": workspace:*`（项目使用 pnpm workspace 协议，npm 不支持）。
  - 处理：改用 `pnpm install --dir` 安装依赖，成功。
- 2026-03-05 P6.1 依赖安装失败：`cd d:\VibeCoding\QTrans-0302new\qtrans-frontend && npm install`
  - 错误信息：`npm error code ENOENT - Could not read package.json: d:\VibeCoding\QTrans-0302new\package.json`（根目录存在空的 `package-lock.json` 导致 npm 向上查找到根目录）。
  - 处理：使用 `pnpm install --dir` 指定目录绕过。
- 2026-03-05 P6.1 vite build 命令异常：`node node_modules/.bin/vite.js build` / `node node_modules/vite/bin/vite.js build`
  - 错误信息：`Error: Cannot find module` — node_modules 尚未安装时尝试直接调用 vite 二进制。
  - 处理：先完成 pnpm install，再通过 `pnpm run build` 执行构建，最终成功。
- 2026-03-05 P6.2 构建校验失败：`npm --prefix d:\VibeCoding\QTrans-0302new\qtrans-frontend run build`
  - 错误信息：`useApplicationForm.ts` 从 `@arco-design/web-vue` 导入 `FormRule` 失败（TS2614）。
  - 处理：移除该类型导入并改为本地宽类型规则声明，后续已修复。
- 2026-03-05 P6.2 页面改造 lint 失败：`CreateApplicationView.vue`
  - 错误信息：递归函数 `walk` 缺失显式返回类型，触发 TS7023 / TS7024（隐式 `any`）。
  - 处理：补充 `DepartmentTreeOption` 类型与 `walk(nodes: DepartmentNode[]): DepartmentTreeOption[]` 返回类型声明，问题已修复。
- 2026-03-05 P6.2 页面改造 lint 二次失败：`CreateApplicationView.vue`
  - 错误信息：`Cannot find name 'DepartmentNode'`（TS2552），原因是仅更新了类型使用，未同步补充 type import。
  - 处理：将部门数据导入改为 `import { departments, type DepartmentNode } ...`，问题已修复。
- 2026-03-05 P6.2 三次补齐样式替换失败：`create-application.scss`
  - 错误信息：`replace_in_file` 未命中目标片段（The string to replace was not found）。
  - 处理：重新读取文件并按最新内容二次替换，已成功应用样式修复。
- 2026-03-05 P6.2 样式校验命令失败：`cd d:\VibeCoding\QTrans-0302new\qtrans-frontend && npm run build`
  - 错误信息：PowerShell 环境下 `&&` 未生效，npm 在根目录 `d:\VibeCoding\QTrans-0302new` 查找 `package.json` 失败（ENOENT）。
  - 处理：改用 `npm --prefix d:\VibeCoding\QTrans-0302new\qtrans-frontend run build` 指定工作目录执行。
- 2026-03-05 P6.3 资源复制命令失败：`if (!(Test-Path 'd:\VibeCoding\QTrans-0302new\qtrans-frontend\public\figma\3961_3234')) { New-Item -ItemType Directory -Path 'd:\VibeCoding\QTrans-0302new\qtrans-frontend\public\figma\3961_3234' | Out-Null }; Copy-Item ...`
  - 错误信息：当前命令运行环境为 `cmd`，`Test-Path/New-Item/Out-Null`（PowerShell 语法）无法执行。
  - 处理：改用 `cmd` 语法 `if not exist ... mkdir ... & copy /Y ...`，已成功复制 33 个 SVG 资源。
- 2026-03-05 P6.3 构建校验失败：`npm --prefix d:\VibeCoding\QTrans-0302new\qtrans-frontend run build`
  - 错误信息：`ApplicationListView.vue` 模板内 `statusLabelMap[record.status]` 推断为 `any` 索引（TS7053）。
  - 处理：新增 `getStatusLabel(status: ApplicationStatus)` 包装函数并替换模板索引表达式，已修复。
- 2026-03-05 P6.4 资源复制命令失败：`if (!(Test-Path 'd:\VibeCoding\QTrans-0302new\qtrans-frontend\public\figma\3971_1904')) { New-Item -ItemType Directory -Path 'd:\VibeCoding\QTrans-0302new\qtrans-frontend\public\figma\3971_1904' | Out-Null }; Copy-Item ...`
  - 错误信息：当前命令运行环境为 `cmd`，`Test-Path/New-Item/Out-Null`（PowerShell 语法）无法执行。
  - 处理：改用 `cmd` 语法 `if not exist ... mkdir ... && copy /Y ...`，已成功复制 9 个 SVG 资源。
- 2026-03-05 P6.4 自检记录：
  - 错误信息：本轮详情页开发未新增构建/类型/lint 错误。
  - 处理：保持现状，无需额外修复。
- 2026-03-05 P8.2/P8.4 自检记录：
  - 错误信息：本轮审批详情与审批时间线开发未新增构建/类型/lint 错误。
  - 处理：`npm --prefix d:\VibeCoding\QTrans-0302new\qtrans-frontend run build` 已通过，保持现状。
- 2026-03-05 P8.1 类型错误修复：
  - 错误信息：`useApprovalList.ts` 中 `start`/`end` 可能为 `undefined`；`ApprovalListView.vue` 中 `record.transferType` 索引类型隐式 `any`。
  - 处理：
    1. `useApprovalList.ts` 添加 `if (start && end)` 空值检查。
    2. `ApprovalListView.vue` 添加类型断言 `as Application['transferType']`。
  - 结果：`npm run build` 通过，无新增错误。

































































































  
- 2026-03-06 P6.7 单测命令失败：`pnpm --dir d:\VibeCoding\QTrans-0302new\qtrans-frontend vitest run src/composables/__tests__/useDownloadList.spec.ts --coverage`
  - 错误信息：`ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL`，`Command "d:\VibeCoding\QTrans-0302new\qtrans-frontend" not found`。
  - 处理：改为 `pnpm --dir "...\qtrans-frontend" exec -- vitest run ... --coverage`。
- 2026-03-06 P6.7 覆盖率执行失败（首次）：`pnpm --dir "d:\VibeCoding\QTrans-0302new\qtrans-frontend" test:coverage`
  - 错误信息：`FileUpload.spec.ts` 在挂载 `FileUpload.vue` 时未初始化 Pinia，触发 `getActivePinia() was called but there was no active Pinia`。
  - 处理：在 `src/components/business/__tests__/FileUpload.spec.ts` 的 `beforeEach` 增加 `setActivePinia(createPinia())`，随后重新执行 `pnpm test:coverage`，14 个测试文件 53 个用例全部通过。

- 2026-03-06 AI工时统计文档更新失败：`replace_in_file` 修改 `docs/exec/task_P6.2.md` 时 old_str 命中多处。
  - 错误信息：`The old_str was found multiple times in the file, please include more context to only edit one occurrence.`

- 2026-03-10 P10.6 单测命令首次执行异常：`cd qtrans-frontend && pnpm vitest run src/composables/__tests__/useAuditLog.spec.ts`
  - 错误信息：输出 `ERR_PNPM_NO_IMPORTER_MANIFEST_FOUND`，命令在仓库根目录解析，未定位到 `qtrans-frontend/package.json`。
  - 处理：改用显式目录参数重试。

- 2026-03-10 P10.6 单测命令二次执行失败：`pnpm --dir "d:/VibeCoding/QTrans-0302new/qtrans-frontend" vitest run src/composables/__tests__/useAuditLog.spec.ts`
  - 错误信息：输出 `ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL`，`Command "d:/VibeCoding/QTrans-0302new/qtrans-frontend" not found`（Windows 下参数解析异常）。
  - 处理：改用 `npm --prefix d:\VibeCoding\QTrans-0302new\qtrans-frontend run test -- src/composables/__tests__/useAuditLog.spec.ts` 执行定向测试。
  - 处理：重新读取文件末尾上下文，使用更长上下文片段精确替换，已成功写入。

- 2026-03-06 P9.2 定向测试命令首次执行异常：`pnpm --dir "d:\VibeCoding\QTrans-0302new\qtrans-frontend" exec -- vitest run ...`
  - 错误信息：命令尾部触发 `ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL`，提示 `Command "vitest" not found`；同时 `src/stores/__tests__/file.spec.ts` 首次断言时，`startTransfer` 完成态尚未落盘，断言读到 `transferring`。
  - 处理：将命令修正为 `pnpm --dir "d:\VibeCoding\QTrans-0302new\qtrans-frontend" exec vitest run ...`，并在 `file.spec.ts` 的 `startTransfer` 用例中补充一次微任务等待后再断言，随后 3 个测试文件 19 个用例全部通过。

- 2026-03-06 P9.2 任务清单勾选写入失败：`replace_in_file` 修改 `task_P9.2.md` 时 old_str 未命中。
  - 错误信息：`The string to replace was not found in the file`。
  - 处理：重新读取 `task_P9.2.md` 当前内容后，用精确文本重新替换，已成功勾选覆盖率步骤。

## 2026-03-05 22:15 - P7 and P8��Ԫ����ִ������ 



������3�������ļ�����ִ�в���ʱ�������⣬�����Ѵ�����������֤�� 

- 2026-03-10 P10.4 上下文检查读取失败：`read_file d:/VibeCoding/QTrans-0302new/qtrans-frontend/src/test/setup.ts`
  - 错误信息：文件不存在（`Could not find file 'd:/VibeCoding/QTrans-0302new/qtrans-frontend/src/test/setup.ts' in the workspace.`）。
  - 处理：记录当前测试环境尚未按 `task_P11` 建立统一 `setup.ts`，本轮 P10.4 继续基于现有 `vitest.config.ts` 与局部测试文件实现，不阻塞用户管理开发。

- 2026-03-10 P9.3 运行时错误（BUG 修复）：点击「传输管理」菜单报错 `TypeError: _a.includes is not a function`
  - 错误信息：`TransferManageView.vue` 第 53 行，`rowSelection` 的 `selectedRowKeys` 应传数组 `selectedRows.value`，实际传了 ref 对象本身 `selectedRows`，导致 Arco Table 内部调用 `includes` 方法失败。
  - 错误代码：
    ```typescript
    const rowSelection = computed(() => ({
      type: 'checkbox',
      showCheckedAll: true,
      selectedRowKeys: selectedRows, // ❌ 错误：传递了 ref 对象
    }))
    ```
  - 修复方案：改为 `selectedRowKeys: selectedRows.value`（取 ref 的值）。
  - 处理：已修复并通过 lint 检查。

- 2026-03-10 P10.6 样式导入路径错误（BUG 修复）：点击「传输管理」菜单时 Vite 构建报错 `[sass] ENOENT: no such file or directory, open 'D:\VibeCoding\QTrans-0302new\qtrans-frontend\src\styles\mixins.scss'`
  - 错误文件：`system-config.scss`、`audit-log.scss` 第 1 行
  - 错误原因：导入路径 `@/styles/mixins.scss` 缺少 `assets` 目录，实际路径为 `@/assets/styles/mixins.scss`
  - 错误代码：
    ```scss
    @import '@/styles/mixins.scss'; // ❌ 错误：缺少 assets
    ```
  - 修复方案 1：修正导入路径为 `@import '@/assets/styles/mixins.scss';`
  - 修复方案 2：补充缺失的 `glass-card` mixin 到 `mixins.scss`（`system-config.scss`、`audit-log.scss` 使用但未定义）
  - 处理：已修复路径错误并补充 mixin，通过 lint 检查。

- 2026-03-10 P10.6 Mock 响应码错误（BUG 修复）：系统配置页面每个 Tab 加载时报错 `Error: success`，控制台显示 `request.ts:24` 拦截器抛出异常
  - 错误文件：`systemConfig.ts` 第 132、158 行
  - 错误原因：Mock 返回 `code: 0`，但 `request.ts` 拦截器期望 `code: 200`（第 23 行 `if (code !== 200)`），导致将 `message: 'success'` 作为错误抛出
  - 错误代码：
    ```typescript
    return HttpResponse.json({
      code: 0, // ❌ 错误：应为 200
      message: 'success',
      data: config
    })
    ```
  - 修复方案：将所有 Mock 响应的 `code: 0` 改为 `code: 200`
  - 处理：已修复 2 处响应码，通过 lint 检查。

- 2026-03-10 P10.6 SCSS 别名解析失败（BUG 修复）：修改 `SystemConfigView.vue` 保存后 Vite 热更新报错，提示无法解析 `@import '@/assets/styles/mixins.scss'`
  - 错误文件：`system-config.scss`、`audit-log.scss` 第 1 行
  - 错误原因：SCSS 的 `@import` 语句不支持 Vite 的 `@` 别名（即使加 `~` 前缀也失败：`Can't find stylesheet to import`）
  - 初次尝试：改为 `@import '~@/assets/styles/mixins.scss';` - 失败
  - 最终方案：使用相对路径 `@import '../../assets/styles/mixins.scss';`（从 `views/admin/` 到 `assets/styles/`）
  - 处理：已修复 2 处导入路径，通过 lint 检查。

- 2026-03-10 P10.7 模块导入错误（BUG 修复）：点击「区域管理」菜单时报错 `SyntaxError: The requested module '/src/utils/request.ts' does not provide an export named 'default'`
  - 错误文件：`src/api/file.ts` 第 1 行
  - 错误原因：`request.ts` 使用命名导出 `export const request`，但 `file.ts` 使用了默认导入 `import request from`
  - 错误代码：
    ```typescript
    import request from '@/utils/request' // ❌ 错误：默认导入
    ```
  - 修复方案：改为命名导入 `import { request } from '@/utils/request'`
  - 处理：已修复导入语句，通过 lint 检查。

- 2026-03-10 P10.8 测试命令执行路径错误：执行 `npm run` 时出现 `ENOENT` / `系统找不到指定的路径`
  - 错误原因：命令行环境无法正确切换到 `qtrans-frontend` 子目录（`cd` 失败）
  - 错误命令：
    ```bash
    cd /d D:\VibeCoding\QTrans-0302new\qtrans-frontend && npm run test ...
    ```
  - 修复方案：改为使用 `npm --prefix D:\VibeCoding\QTrans-0302new\qtrans-frontend ...` 直接指定项目根目录
  - 处理：命令已恢复正常，`useChannelManage.spec.ts` 12 个用例通过。

- 2026-03-10 P10.8 覆盖率执行失败（存量问题）：执行 `npm --prefix ... run test:coverage` 失败
  - 错误文件：`src/composables/__tests__/useSystemConfig.spec.ts`
  - 错误信息：
    1. `expected ... to have a length of 3 but got 11`
    2. `TypeError: composable.loadConfig is not a function`
  - 影响范围：非本次 P10.8 新增模块，属于历史测试基线与当前实现不一致
  - 处理：已保留失败信息，本次先完成 P10.8 功能交付与专项单测，覆盖率问题待单独修复。

- 2026-03-10 P10.9 覆盖率执行失败（存量问题延续）：执行 `npm --prefix ... run test:coverage` 失败
  - 错误文件：`src/composables/__tests__/useSystemConfig.spec.ts`
  - 错误信息：
    1. `expected ... to have a length of 3 but got 11`
    2. `TypeError: composable.loadConfig is not a function`
  - 影响范围：非本次 P10.9 新增模块，属于历史测试基线问题
  - 处理：P10.9 专项单测 `useUIConfig.spec.ts` 12 个用例已通过；覆盖率失败已记录，待单独修复 `useSystemConfig.spec.ts`。

- 2026-03-10 审批链路专项修复验证：执行 `npm --prefix ... run test:coverage` 失败（存量问题）
  - 错误文件：`src/composables/__tests__/useSystemConfig.spec.ts`
  - 错误信息：
    1. `expected ... to have a length of 3 but got 11`
    2. `TypeError: composable.loadConfig is not a function`
  - 影响范围：本次审批链路修复相关用例全部通过，失败来自历史存量测试
  - 处理：已完成专项回归（`useApplicationList.spec.ts`、`useApprovalList.spec.ts`、`useApprovalDetail.spec.ts` 共 19 用例通过），覆盖率问题待后续单独修复。

- 2026-03-24 Task4 回归验证出现运行时错误：创建页控制台报错 `Maximum recursive updates exceeded in component <CreateApplicationView>`
  - 错误文件：`src/views/application/components/StepOneBasicInfo.vue`、`useApprovalRoute.ts`、`useSecurityLevel.ts`、`useCitySelection.ts`
  - 错误信息：`Uncaught (in promise) Maximum recursive updates exceeded in component <CreateApplicationView>`
  - 原因：`StepOneBasicInfo.vue` 在 `defineModel` 新数据流下每次都整体替换 `formData`；同时 `useApprovalRoute/useSecurityLevel/useCitySelection` 的 watch 使用 getter 返回新数组，导致依赖未变化时也重复触发，其中审批清空逻辑再次写回相同字段，形成递归更新。
  - 处理：为 `updateFormData` 增加变更比对，未变化时不再回写；将 3 个 composable 的 watch 改为 getter 数组源；为 `clearApprovers()` 增加空值保护，阻断递归链路。

- 2026-04-01 用户面/管理面拆分后启动报错（3 个问题）

- 2026-04-09 上传进度条宽度溢出（根因：Arco Design `a-progress` percent 值域 0-1）
  - 错误现象：进度条 class="arco-progress-line-bar" 的 width 从 100% 直接翻倍增长到 5100%，视觉上进度条瞬间打满
  - 根因：Arco Design 的 `<a-progress>` 组件内部 `barStyle.width = percent * 100 + '%'`，`percent` 期望 0-1 小数（0.5=50%），但代码传入 0-100 整数（50→5000%）
  - 修复1：`TransFileTable.vue` 中 `:percent="item.progress"` 改为 `:percent="item.progress / 100"`
  - 修复2：`useTransUpload.ts` 的 `uploadFile` 函数中，push 后获取 `ri = uploadFileList.value[last]`（Vue Proxy 响应式引用），后续所有属性修改通过 `ri` 进行，直接触发 Proxy setter，不再依赖外部 `onProgress` 回调同步
  - 修复3：`StepTwoUploadFile.vue` 补充缺失的 `updateUploadProgress` 函数定义
  - 影响文件：`TransFileTable.vue`、`useTransUpload.ts`、`TransUploadView.vue`、`StepTwoUploadFile.vue`

- 2026-04-09 上传进度条 elapsedTime/timeLeft 解析错误
  - 错误信息：`parseFloat("00:00:08")` 返回 0，导致 `calcProgressFromServerTime` 条件 `(elapsedTime + timeLeft) > 0` 永远不成立，回退到字节进度，进度条瞬间到头
  - 原因：服务端返回的 elapsedTime/timeLeft 格式为 "HH:MM:SS"（如 "00:00:08"），不是纯数字字符串，`parseFloat` 只解析到第一个非数字字符就停止
  - 修复：新增 `parseServerTime` 函数，将 "HH:MM:SS" 格式解析为秒数（hours*3600 + minutes*60 + seconds），同时兼容纯数字格式
  - 问题1：`AppHeader.vue:70 TypeError: Cannot read properties of undefined (reading 'BASE_URL')`
    - 原因：第 70 行残留 `$env.BASE_URL`（Vue 模板中不存在的全局变量），此前批量修改时漏改
    - 修复：改为 `assetPath('/figma/3830_3/4.svg')`
  - 问题2：`MSW 启动失败: Service Worker script does not exist at the given path`
    - 原因：当 Vite base 变为 `/admin/` 时，MSW 默认在 `{base}mockServiceWorker.js` 路径下注册 SW，但该文件实际在 `public/` 根目录下
    - 修复：在 `mocks/browser.ts` 的 `setupWorker()` 中显式指定 `serviceWorker.url: '/mockServiceWorker.js'`（从根路径加载）
  - 问题3：`Failed to load resource: /notifications?userId=1 404`
    - 原因：`.env.admin` 中 `VITE_API_BASE_URL=/admin/api`，但 MSW handler 注册的路径是 `/api/notifications`，导致 mock 无法拦截，请求打到开发服务器返回 404
    - 修复：在 `.env.admin.development` 和 `.env.tenant.development` 中覆盖 `VITE_API_BASE_URL=/api`（开发环境保持 /api 让 MSW 正确拦截，生产环境才加 base 前缀）



























