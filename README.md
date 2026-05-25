# @narratable/protocol

故桌 (Narratable) 接口协议 v2 — 共享 TypeScript 类型定义。

桌面端和移动端前端团队的单一事实来源。

## 安装

### npm（发布后）

```bash
npm install @narratable/protocol
```

### Git URL（无需发布）

```json
{
  "dependencies": {
    "@narratable/protocol": "github:Narra-Table/protocol"
  }
}
```

## 使用

```ts
import type { Narratable } from "@narratable/protocol";

// 领域类型
const space: Narratable.Space = { ... };
const room: Narratable.Room = { ... };
const msg: Narratable.Message = { ... };

// REST API 类型（用于前后端对齐 + Mock）
const req: Narratable.API.CreateSpaceRequest = { name: "..." };
const res: Narratable.API.SpacesListResponse = { spaces: [...] };
const q: Narratable.API.MessagesQuery = { cursor: null, limit: 50 };

// WebSocket 发送格式
const ws: Narratable.WS.SendChat = {
  type: "chat",
  roomId: "...",
  spaceId: "...",
  content: [{ type: "paragraph", children: [{ type: "text", text: "..." }] }]
};

// WebSocket 事件（服务端推送）
const evt: Narratable.Event = {
  type: "message.created",
  spaceId: "...",
  timestamp: "...",
  message: { ... }
};
```

## 核心概念

```
空间(Space) > 房间(Room) > 消息(Message)
  │              │
  ├─ 成员(Member)  ├─ 会话房 / 资料房 / 私密房 / 工具房
  ├─ 面具(Mask)    └─ 实时消息流 + 帷幕可见性
  ├─ 角色(Character)
  └─ 帷幕(Veil)绑定在消息上
```

## 类型结构

```
Narratable
├── Space / Space.Role / Space.Member  — 空间与成员
├── Room / Room.Type                   — 房间与类型
├── Mask / Mask.Type                   — 面具（发言身份）
├── Character                         — 角色卡
├── Veil / Veil.Visibility            — 帷幕（可见性）
├── Message / Message.Type            — 消息本体
│   ├── Message.Block[]               — 块级元素
│   ├── Message.Inline                — 行内元素
│   ├── Message.MessageQuery          — 分页查询
│   └── Message.PaginatedMessages     — 分页响应
├── Event                             — WebSocket 实时事件
├── API                               — REST API 请求/响应类型
└── WS                                — WebSocket 发送格式
```

## Go 后端类型对应

后端 Go 代码中对应的类型定义位于 `backend/pkg/protocol/`：

| TS 文件 | Go 文件 |
|---|---|
| `Narratable.Space` | `pkg/protocol/space.go` |
| `Narratable.Room` | `pkg/protocol/room.go` |
| `Narratable.Mask` | `pkg/protocol/mask.go` |
| `Narratable.Character` | `pkg/protocol/character.go` |
| `Narratable.Veil` | `pkg/protocol/veil.go` |
| `Narratable.Message` | `pkg/protocol/message.go` |
| `Narratable.Event` | `pkg/protocol/events.go` |
| 基础 ID 类型 | `pkg/protocol/types.go` |
| Block / Inline | `pkg/protocol/blocks.go` |

修改协议时需同步更新 TS 和 Go 两侧。

## 版本策略

- 主版本号 = 协议大版本（当前 v2）
- 次版本号 = 新增类型/字段（向后兼容）
- 修订号 = 注释/文档修正

协议破坏性变更升级主版本号。
