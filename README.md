# @narratable/protocol

故桌（NarraTable）接口协议的 TypeScript 类型。类型全部由后端实际导出的契约生成，后端（`narra-table-server`）是唯一事实来源；本仓库不手写接口定义。

## 内容

```text
contract/            # 后端 `make contract` 导出的完整契约包，原样固定（不要手动编辑）
├── openapi.json     # HTTP 接口
├── realtime.json    # WebSocket 帧、会话、心跳与同步语义
├── plugin.json      # 插件清单、CPI、窗口桥
├── schemas/         # 独立 schema
└── source.json      # backendCommit、contractHash、能力集合
generated/           # 由 contract/ 生成的声明（不要手动编辑）
legacy/              # 旧版手写协议，仅供迁移参考，不对应任何新版接口
scripts/             # 同步、生成与校验脚本
test/usage.ts        # 编译期用法检查
```

当前固定版本见 `contract/source.json`。

## 使用

```ts
import type { Message, MessageSubmit, ServerFrame, paths } from '@narratable/protocol';

function onFrame(frame: ServerFrame) {
  switch (frame.type) {
    case 'sync.snapshot': // frame.view.messages
    case 'sync.batch': // frame.before / frame.after / frame.changes
    case 'sync.heartbeat': // frame.checkpoint
  }
}

type History = paths['/api/v2/rooms/{roomId}/messages']['get'];
```

- `paths`、`operations`：HTTP 路径与操作，可直接用于 `openapi-fetch` 等类型化客户端。
- 每个 schema 都有同名类型别名，例如 `Message`、`Space`、`Audience`、`BatchFrame`。
- `ClientFrame`、`ServerFrame` 是按 `type` 判别的帧联合；`ClientFrames`、`ServerFrames` 按帧类型索引。
- `CpiMethods`、`BridgeMethod`、`BridgeInputs` 描述插件运行时与窗口桥。
- 会话、心跳、checkpoint 与错误回执的语义以 `contract/realtime.json` 中的说明字段为准。
- 数组字段在契约中声明为“数组或 null”，消费方需要处理 `null`。
- 旧版类型可从 `@narratable/protocol/legacy` 导入，只用于迁移期间对照，新代码不得使用。

## 更新契约

```bash
# 后端：在干净的提交上导出
make contract

# 本仓库：同步、生成并校验
pnpm sync-contract ../narra-table-server/dist/contract
pnpm generate
pnpm check
```

- `sync-contract` 拒绝 `dirty=true` 的导出，并按后端算法重算 `contractHash`，与 `source.json` 不一致时拒绝。
- `check` 校验契约未被改动、`generated/` 与契约一致，并对 `test/usage.ts` 做类型检查。
- 生成时同名 schema 在 HTTP 与 WebSocket/插件契约中必须完全一致，否则失败。

## 版本

- 包版本 `2.x` 对应新版后端契约；`contract/source.json` 的 `contractHash` 标识具体契约。
- 消费方应固定到本仓库的具体提交，而不是分支。
- 契约有破坏性变更时提升主版本或预发布序号，并在提交说明中写明 `contractHash`。
