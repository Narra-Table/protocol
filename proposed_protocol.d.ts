/**
 * ============================================================
 *  故桌 (Narratable) 接口协议 v1
 *  基于《故桌产品策划案（初稿）》的精简设计
 * ============================================================
 *
 *  核心概念：
 *  1. 空间(Space) > 房间(Room) > 消息(Message)
 *  2. 面具(Mask) 是发言身份，可引用角色(Character)
 *  3. 帷幕(Veil) 绑定在消息上，控制可见性
 *  4. 消息分类型：聊天消息(段落块+行内块)、骰点消息、指令消息、系统消息
 *  5. 段落块(Block) 和 行内块(Inline) 区分层级
 */

export namespace Narratable {
  // ============================================================
  //  一、基础 ID 和通用类型
  // ============================================================

  type UserId = string;
  type MaskId = string;
  type CharacterId = string;
  type SpaceId = string;
  type RoomId = string;
  type MessageId = string;
  type Timestamp = string; // ISO 8601

  /** 指令参数 */

  // ============================================================
  export namespace Space {
  //  二、空间 (Space)
  //  策划案 7.1：一场完整游戏 = 一个空间
  //  归档后的空间可导出为模组，模组可导入为新空间
  // ============================================================

  export type Role = "gm" | "pl" | "observer";

  export interface Member {
    userId: UserId;
    role: Role;
    /** 空间内昵称 */
    displayName: string;
    joinedAt: Timestamp;
  }

  // ============================================================
  //  十二、空间导出（跨服迁移 / 结团存档）
  //  策划案 14.2：统一导出格式
  // ============================================================

  export interface Export {
    version: string;
    exportedAt: Timestamp;
    space: Space;
    rooms: Room[];
    characters: Character[];
    masks: Mask[];
    messages: Record<RoomId, Message[]>;
  }

} // end namespace Space

  interface Space {
    spaceId: SpaceId;
    name: string;
    description: string;
    avatar?: string;
    ownerId: UserId;
    members: Space.Member[];
    /** 空间中的房间列表 */
    rooms: RoomId[];
    /** 空间中的角色列表 */
    characters: CharacterId[];
    /** 空间中的面具列表 */
    masks: MaskId[];
    /** active: 跑团中 / archived: 已结团 */
    status: "active" | "archived";
    /** 从模组导入时的来源 */
    moduleSource?: { moduleId: string; moduleName: string };
    createdAt: Timestamp;
    updatedAt: Timestamp;
    archivedAt?: Timestamp;
  }

  export namespace Room {
  //  三、房间 (Room)
  //  策划案 7.2：会话房 / 资料房 / 私密房 / 工具房
  // ============================================================

  export type Type = "session" | "reference" | "private" | "tool";
  // ============================================================

  } // end namespace Room

  interface Room {
    roomId: RoomId;
    spaceId: SpaceId;
    name: string;
    description: string;
    type: Room.Type;
    /** 排序权重，越小越靠前 */
    sortOrder: number;
    /** 私密房的可见成员，undefined = 全体可见 */
    visibleMemberIds?: UserId[];
    isArchived: boolean;
    createdAt: Timestamp;
    lastActiveAt: Timestamp;
  }

  export namespace Mask {
  //  四、面具 (Mask) —— 发言身份
  //  策划案 6.2 / 7.3：
  //  用户以面具身份发言，一人可拥有多个面具
  //
  //  面具与角色的关系：
  //  - Mask 是"发言身份"层（名称、头像、类型、谁能用）
  //  - Character 是"角色数据"层（属性、技能、简介）
  //  - character/npc 类型面具必绑角色；system/gm 类型可选绑（自定义骰娘/GM 身份时绑定）
  //  - 一个角色可以被多个面具引用（如 PC 角色同时有主面具和战斗面具）
  // ============================================================

  export type Type = "character" | "npc" | "system" | "gm";
  // ============================================================

  } // end namespace Mask

  interface Mask {
    maskId: MaskId;
    spaceId: SpaceId;
    name: string;
    avatar?: string;
    type: Mask.Type;
    /** 绑定的角色 ID（character/npc 类型必填；system/gm 类型可选——绑则自定义身份信息，不绑用默认） */
    characterId?: CharacterId;
    /** 可使用此面具的用户列表 —— 一个用户可出现在多个面具中 */
    userIds: UserId[];
    createdAt: Timestamp;
  }

  export namespace Character {
  //  五、角色 (Character) —— 角色卡数据
  //  策划案 8.4：玩家角色卡、NPC 管理
  // ============================================================
  // ============================================================

  } // end namespace Character

  interface Character {
    characterId: CharacterId;
    spaceId: SpaceId;
    name: string;
    avatar?: string;
    /** pc: 玩家角色 / npc: 非玩家角色 / system: 系统角色（骰娘等） */
    type: "pc" | "npc" | "system";
    /** 角色属性（开放式，不同规则系统自行定义结构） */
    attributes: Record<string, unknown>;
    /** 角色模板 ID */
    templateId?: string;
    bio?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
  }

  export namespace Veil {
  //  六、帷幕 (Veil) —— 消息可见性控制
  //  策划案 6.3 / 7.4 / 8.6：
  //  帷幕绑定在每条消息上（不是空间级别）
  //
  //  可见策略：
  //  - all:            全体成员可见
  //  - gm_only:        仅 GM 可见（秘密信息）
  //  - custom:         仅指定成员可见（单线线索、秘密团分视角）
  //  - gm_and_custom:  GM + 指定成员可见
  //
  //  阶段性隐藏通过 revealOnSpaceClose 实现——结团前隐藏，结团后公开。
  // ============================================================

  export type Visibility = "all" | "gm_only" | "custom" | "gm_and_custom";
  // ============================================================

  } // end namespace Veil

  interface Veil {
    visibility: Veil.Visibility;
    /** 可见用户列表（custom / gm_and_custom 时使用） */
    visibleTo?: UserId[];
    /** 结团后自动公开 */
    revealOnSpaceClose: boolean;
  }

  interface Message {
    messageId: MessageId;
    roomId: RoomId;
    spaceId: SpaceId;
    type: Message.Type;

    /** 发送者 */
    sender: {
      userId: UserId;
      maskId: MaskId;
    };

    // ---- 时间与状态 ----
    sendTime: Timestamp;
    updateTime: Timestamp | null;
    /** 是否已删除（软删除，客户端可选择隐藏） */
    deleted: boolean;
    /** 是否置顶 */
    pinned: boolean;
    /** 是否折叠 */
    folded: boolean;

    // ---- 可见性 ----
    veil: Veil;

    // ---- 消息体（按 type 区分） ----

    /** chat 类型：块列表 */
    content?: Message.Block[];

    /** clue 类型：线索数据 */
    clue?: {
      title: string;
      description: string;
      imageUrl?: string;
      tags: string[];
      /** 是否已被发现 */
      isDiscovered: boolean;
    };

    /** command 类型：指令名 */
    command?: string;
    /** command 类型：指令参数 */
    params?: Message.Param[];
    /** command 类型：原始指令文本（如 ".r 3d6+2 力量检定"） */
    raw?: string;

    /** 指令执行结果（服务端计算后填入） */
    result?: Message.Result;

    /** command 类型：指令响应对应的原始消息 ID */
    refMessageId?: MessageId;

    // ---- 编辑历史 ----
    editHistory: Message.EditRecord[];
  }

  // ============================================================

  export namespace Message {
  //  七、消息 (Message)
  //  策划案 6.1 / 8.3：
  //  消息分为四种类型：
  //  - chat:    聊天消息，内容由块（Block）组成
  //  - clue:    线索消息（线索卡片，含发现状态）
  //  - command: 指令消息（如 .r 3d6+2、.help、.init）
  //  - system:  系统通知（入房、结团等自动消息）
  //
  //  指令（含骰点）是完整的消息，不是消息内的节点
  // ============================================================

  type Type = "chat" | "clue" | "command" | "system";

  /** 编辑记录 */
  interface EditRecord {
    editTime: Timestamp;
    /** 编辑前的内容（chat/clue 类型）或指令（command 类型） */
    previousRaw: unknown;
    editBy: UserId;
  }

  /** 指令参数 */
  interface Param {
    name: string;
    value: string;
  }

  /** 指令执行结果 */
  interface Result {
    success: boolean;
    /** 成功时的输出数据 */
    data?: unknown;
    /** 失败时的错误信息 */
    error?: string;
  }

  // ============================================================
  //  八、块 (Block) —— 消息内容的块级元素
  //  每个块独占一行/一个区块，类似 HTML 的 div
  // ============================================================

  export type Block =

    | Paragraph
    | Image
    | Audio
    | Table
    | Reply
    | Divider;

  /** 段落块 —— 包含若干行内元素 */
  export interface Paragraph {

    type: "paragraph";
    children: Inline[];
  }

  /** 图片块 */
  export interface Image {

    type: "image";
    url: string;
    width: number;
    height: number;
    alt?: string;
  }

  /** 音频块 */
  export interface Audio {

    type: "audio";
    url: string;
    title?: string;
    /** 时长（秒） */
    duration?: number;
  }

  /** 表格块 */
  export interface Table {

    type: "table";
    headers: string[];
    rows: string[][];
    caption?: string;
  }

  /** 引用回复块 —— 引用另一条消息 */
  export interface Reply {

    type: "reply";
    messageId: MessageId;
    /** 被引用消息的预览（客户端展示用） */
    preview?: {
      senderName: string;
      textSnippet: string;
    };
  }

  /** 分割线块 */
  export interface Divider {

    type: "divider";
    label?: string;
  }

  // ============================================================
  //  九、行内元素 (Inline) —— 段落内的内联元素
  //  不换行，在段落内流式排列，类似 HTML 的 span
  // ============================================================

  export type Inline = Text | Mention | Face;

  /** 提及目标 —— 可 @user、@mask 或 @character */
  export type MentionTarget =

    | { kind: "user";      userId: UserId }
    | { kind: "mask";      maskId: MaskId }
    | { kind: "character"; characterId: CharacterId };

  /** 文本行内元素 */
  export interface Text {

    type: "text";
    text: string;
    /** 可选样式 */
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strikethrough?: boolean;
  }

  /** @提及行内元素 */
  export interface Mention {

    type: "mention";
    /** 提及目标：user / mask / character */
    target: MentionTarget;
    /** 展示文本（不填则用目标名称） */
    displayText?: string;
  }

  /** 表情行内元素 */
  export interface Face {

    type: "face";
    faceId: string;
  }

  // ============================================================
  //  十、消息分页查询
  // ============================================================

  export interface MessageQuery {

    roomId: RoomId;
    /** 游标分页（null = 从头开始） */
    cursor: MessageId | null;
    limit: number;
    sort: "asc" | "desc";
    pinnedOnly?: boolean;
    maskId?: MaskId;
  }

  export interface PaginatedMessages {

    messages: Message[];
    nextCursor: MessageId | null;
    hasMore: boolean;
  }
  } // end namespace Message
  // ============================================================
  export namespace Event {
  //  十一、实时事件（WebSocket 推送）
  // ============================================================

  type Type =
    | "message.created"
    | "message.updated"
    | "message.deleted"
    | "member.joined"
    | "member.left"
    | "veil.revealed";

  interface Base {
    type: Type;
    spaceId: SpaceId;
    timestamp: Timestamp;
  }

  interface Created extends Base {
    type: "message.created";
    message: Message;
  }

  interface Updated extends Base {
    type: "message.updated";
    message: Message;
  }

  interface Deleted extends Base {
    type: "message.deleted";
    messageId: MessageId;
    roomId: RoomId;
  }

  /** 帷幕公开事件（结团后自动公开） */
  interface VeilRevealed extends Base {
    type: "veil.revealed";
    messageIds: MessageId[];
    reason: "space_closed";
  }

  /** 成员加入房间 */
  interface MemberJoined extends Base {
    type: "member.joined";
    roomId: RoomId;
    member: {
      userId: UserId;
      maskId?: MaskId;
      displayName: string;
    };
  }

  /** 成员离开房间 */
  interface MemberLeft extends Base {
    type: "member.left";
    roomId: RoomId;
    userId: UserId;
  }

  // ============================================================

  } // end namespace Event

  type Event =
    | Event.Created
    | Event.Updated
    | Event.Deleted
    | Event.MemberJoined
    | Event.MemberLeft
    | Event.VeilRevealed;

  // ============================================================
  //  十三、REST API 请求/响应类型
  //  用于前端 Mock 和后端实现对齐
  //  所有 /api/* 端点均需 Bearer Token 认证
  // ============================================================

  export namespace API {
    /** 通用错误响应 */
    interface ErrorResponse {
      error: string;
      details?: string;
    }

    // ---- 空间 ----

    /** POST /api/spaces */
    interface CreateSpaceRequest {
      name: string;
      description?: string;
    }

    /** GET /api/spaces */
    interface SpacesListResponse {
      spaces: SpaceSummary[];
    }

    interface SpaceSummary {
      spaceId: SpaceId;
      name: string;
      ownerId: UserId;
      memberCount: number;
      status: "active" | "archived";
      myRole: Space.Role;
      createdAt: Timestamp;
      lastActiveAt: Timestamp;
    }

    /** PATCH /api/spaces/:spaceId */
    interface UpdateSpaceRequest {
      name?: string;
      description?: string;
      status?: "active" | "archived";
    }

    /** POST /api/spaces/:spaceId/members */
    interface InviteMemberRequest {
      userId: UserId;
      role: Space.Role;
    }

    // ---- 房间 ----

    /** POST /api/spaces/:spaceId/rooms */
    interface CreateRoomRequest {
      name: string;
      type: Room.Type;
      description?: string;
      sortOrder?: number;
    }

    /** GET /api/spaces/:spaceId/rooms */
    interface RoomsListResponse {
      rooms: RoomSummary[];
    }

    interface RoomSummary {
      roomId: RoomId;
      spaceId: SpaceId;
      name: string;
      type: Room.Type;
      sortOrder: number;
      hasJoinCode: boolean;
      isArchived: boolean;
      lastMessage?: {
        senderName: string;
        textSnippet: string;
        sendTime: Timestamp;
      };
      unreadCount: number;
      memberCount: number;
      lastActiveAt: Timestamp;
    }

    /** PATCH /api/rooms/:roomId */
    interface UpdateRoomRequest {
      name?: string;
      description?: string;
      sortOrder?: number;
    }

    /** POST /api/rooms/:roomId/join */
    interface JoinRoomRequest {
      maskId?: MaskId;
      code?: string;  // 房间密码（有密码的房间必填）
    }

    interface JoinRoomResponse {
      roomId: RoomId;
      memberCount: number;
      joinedAt: Timestamp;
    }

    /** POST /api/rooms/:roomId/leave */
    interface LeaveRoomResponse {
      roomId: RoomId;
      memberCount: number;
    }

    /** POST /api/spaces/:spaceId/rooms — 响应 */
    interface CreateRoomResponse {
      room: Room;
      joinCode: string;  // 6位数字密码，仅在创建/重置时返回
    }

    /** POST /api/rooms/:roomId/regenerate-code — 响应 */
    interface RegenerateCodeResponse {
      joinCode: string;
    }

    // ---- 消息 ----

    /**
     * GET /api/rooms/:roomId/messages 的查询参数
     * 复用 Message.MessageQuery（roomId 来自 URL 路径）
     */
    type MessagesQuery = Message.MessageQuery;

    /** PATCH /api/messages/:messageId */
    interface EditMessageRequest {
      content?: Message.Block[];
      clue?: {
        title?: string;
        description?: string;
        imageUrl?: string;
        tags?: string[];
      };
    }
  }

  // ============================================================
  //  十四、WebSocket 客户端发送消息格式
  //  通过 WebSocket 发送，非 REST API
  // ============================================================

  export namespace WS {
    /** 发送聊天消息 */
    interface SendChat {
      type: "chat";
      roomId: RoomId;
      spaceId: SpaceId;
      content: Message.Block[];
      maskId?: MaskId;
      refMessageId?: MessageId;
    }

    /** 发送指令消息（含骰点） */
    interface SendCommand {
      type: "command";
      roomId: RoomId;
      spaceId: SpaceId;
      command: string;
      params: Message.Param[];
      raw: string;
      maskId?: MaskId;
    }

    /** 发送线索消息 */
    interface SendClue {
      type: "clue";
      roomId: RoomId;
      spaceId: SpaceId;
      clue: {
        title: string;
        description: string;
        imageUrl?: string;
        tags: string[];
      };
      maskId?: MaskId;
    }
  }

} // end namespace Narratable