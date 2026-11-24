## CI 主要是在查"代码错误"吗？

大部分是，但更准确的说法是：**CI 在一台干净的、不是你的机器上，验证代码是否满足约定**。"你的机器上能跑"不等于"别人拿到也能跑"，原因通常有：

- 某个文件改了但忘了 `git add`
- 本地装了某个包，但没写进 `package.json`
- 本地 Node 版本和线上不同
- 本地有 `node_modules`、`.env.local`、生成文件这些残留状态

所以 CI 检查的不只是"代码写对没有"，而是三类事：

| 类别 | 问的问题 | 对应步骤 |
|---|---|---|
| **正确性** | 类型对不对，能不能构建 | `typecheck`、`build` |
| **一致性** | 格式和写法是否统一，有没有可疑模式 | `check`（prettier）、`lint`（eslint） |
| **可复现性** | 从零开始能不能装好、跑起来 | `--frozen-lockfile`、`prisma generate`、干净的 runner |

最后一步 `audit` 不属于"代码错误"，它查的是依赖有没有已知漏洞，后面会单独说。

## 逐段解释

### 触发条件

```yaml
on:
  pull_request:
  push:
    branches: [main]
```

- `pull_request`：每个 PR 在合并前跑一遍，这是最重要的拦截点。
- `push` 到 `main`：合并之后再跑一遍。因为 PR 检查的是"分支当时的代码"，合并后的结果可能和它不同，另外也能兜住直接推送到 main 的情况。

### 并发控制

```yaml
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true
```

同一个分支连续推送两次时，第一次的运行已经过时，没必要跑完。这段配置会取消旧的，只保留最新的，省 Actions 分钟数，也避免看到过时结果。

### 权限

```yaml
permissions:
  contents: read
```

GitHub 会给每次运行发一个临时令牌 `GITHUB_TOKEN`，默认权限可能比较宽。这里收紧到只读代码，是**最小权限原则**：万一某个依赖的安装脚本被投毒，它能拿到的令牌也只能读。

### 环境变量

```yaml
env:
  DATABASE_URL: postgresql://user:pass@localhost:5432/ci
  BETTER_AUTH_SECRET: ci-dummy-secret-do-not-use-in-prod
  ...
```

`prisma generate` 和 `vite build` 可能在执行时读取这些变量，缺了会报错。它们只是占位用的假值，不连接任何真实服务。

有两点要注意：

- **变量名是我按惯例猜的**，请对照你的 `.env.example` 和代码里实际读取的名字修改。
- 如果你的代码在启动时用 zod 校验环境变量格式（比如要求 URL 格式、最小长度），假值必须满足这些格式，否则 build 会失败。

### 步骤

**1. `actions/checkout@v4`**：把代码拉到 runner 上。runner 是一台全新的虚拟机，什么都没有。

**2. `pnpm/action-setup@v4`**：安装 pnpm，版本从 `package.json` 的 `packageManager` 字段读取，所以那个字段必须先加上。

**3. `actions/setup-node@v4` + `cache: pnpm`**：安装 Node 22，并缓存 pnpm 的包仓库，缓存的键由 lockfile 决定。依赖没变时，安装会快很多。这一步必须排在 pnpm 安装之后，因为它要调用 pnpm 去查缓存路径。

**4. `pnpm install --frozen-lockfile`**：这是可复现性的关键。含义是"严格按 lockfile 安装，如果 `package.json` 和 `pnpm-lock.yaml` 对不上，直接报错"。它能抓住"加了依赖但忘了提交 lockfile"这种错误。没有这个参数，pnpm 会自己悄悄更新 lockfile，问题就被掩盖了。

**5. `pnpm prisma generate`**：生成 Prisma 客户端代码。这些生成文件不在 git 里，干净的 runner 上不存在。不先生成，`@prisma/client` 的类型是缺失的，`tsc` 和 `build` 都可能失败。你本地能过，是因为之前已经生成过。

**6. `pnpm check`**：即 `prettier --check .`，只检查格式，不修改文件。如果有文件没按规范格式化，这一步失败。和你的 `format` 脚本不同，`format` 会直接改文件，在 CI 里改了也不会提交回去，没有意义。

**7. `pnpm lint`**：即 ESLint，查可疑写法：未使用的变量、React hooks 规则违反、可能的空引用等。它不检查类型，查的是"这样写很可能有问题"。

**8. `pnpm build`**：即 `vite build`，验证项目能打出生产包。它能抓到的问题：import 路径写错、依赖缺失、构建配置问题。同时它会触发 TanStack Router 的插件生成 `routeTree.gen.ts`，这个文件如果没提交到仓库，后面的类型检查需要它。

**9. `pnpm typecheck`**：即 `tsc --noEmit`，查类型错误。把它放在 build 之后，就是因为要等路由树生成完。

这里要说清楚一个容易误解的点：**`vite build` 成功不代表类型正确**，因为 Vite 构建时只转译、不检查类型。这就是为什么需要单独的 typecheck 步骤。

**10. `pnpm audit --prod --audit-level=high`**：检查生产依赖里有没有 high 及以上等级的已知漏洞。这一步和前面性质不同，有个副作用需要知道：**它会因为外部原因失败**。某天某个依赖新披露了一个 CVE，你没改任何代码，CI 也会变红。如果把它设为必过检查，可能出现"所有 PR 都被一个和自己无关的漏洞卡住"的情况。更稳妥的做法是把它拆成独立 job，不设为 required，或者只在定时任务里跑。

## 步骤顺序的逻辑

顺序大致是"便宜的在前，依赖前置条件的在后"：先装依赖，再生成代码，然后格式和 lint 这类快速检查，最后是 build 和 typecheck 这类较慢的检查。`typecheck` 必须在 `build` 之后只是依赖关系，不是随意排的。

## CI 抓不到什么

这点同样重要，免得产生虚假的安全感：

- **你目前没有测试**，所以 CI 只能证明"能构建、类型对、格式齐"，不能证明"功能正确"。登录流程坏了、查询返回错数据，CI 都是绿的。这也是后面要加 `test` job 的原因。
- **类型检查的可靠程度取决于你的类型标注**。如果到处是 `any`，或者 server function 的入参只有类型没有运行时校验，类型检查帮不上忙。
- **运行时才暴露的问题**（环境变量缺失、数据库连不上、第三方 API 变化）都不在检查范围内。

## 开始使用前要做的两件事

1. 在 `package.json` 里加 `packageManager` 字段。
2. 在 `scripts` 里加 `"typecheck": "tsc --noEmit"`。

这两项没做，workflow 会在第 2 步和第 9 步直接失败。

你看完这份解释后，如果想继续逐个分析其他配置（CodeQL、Gitleaks 等），告诉我下一个是哪个。