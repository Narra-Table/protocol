/**
 * ============================================================
 *  故桌 (Narratable) 接口协议 v1
 *  基于《故桌产品策划案（初稿）》的精简设计
 * ============================================================
 *
 *  核心概念：
 *  1. 空间(Space) > 房间(Room) > 消息(Message)
 *  2. 面具(Mask) 是发言身份，可组合角色卡(CharacterCard)
 *  3. 帷幕(Veil) 绑定在消息上，控制可见性
 *  4. 消息分类型：聊天消息(段落块+行内块)、骰点消息、指令消息、系统消息
 *  5. 段落块(Block) 和 行内块(Inline) 区分层级
 */

export namespace Narratable {
  // ============================================================
  //  一、基础 ID 和通用类型
  // ============================================================

  export type UserId = string;
  export type MaskId = string;
  export type CharacterId = string;
  export type CharacterCardId = string;

  export type SpaceId = string;
  export type RoomId = string;
  export type MessageId = string;
  export type ResourceId = string;
  export type PluginId = string;
  export type RuleId = string;
  export type Timestamp = string; // ISO 8601

  /** 指令参数 */

  // ============================================================
  export namespace Space {
  //  二、空间 (Space)
  //  策划案 7.1：一场完整游戏 = 一个空间
  //  归档后的空间可导出为模组，模组可导入为新空间
  // ============================================================

  export type Role = "gm" | "agm" | "pl" | "ob";

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
    space: Narratable.Space;
    rooms: Narratable.Room[];
    characterCards: Narratable.CharacterCard[];
    masks: Narratable.Mask[];
    resources?: Narratable.Resource[];
    messages: Record<RoomId, Narratable.Message[]>;
  }

} // end namespace Space

  export interface Space {
    spaceId: SpaceId;
    name: string;
    description: string;
    avatar?: string;
    ownerId: UserId;
    members: Space.Member[];
    /** 空间中的房间列表 */
    rooms: RoomId[];
    /** 空间中的角色卡列表 */
    characterCards: CharacterCardId[];
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

  export interface Room {
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
  //  面具与角色卡的关系：
  //  - Mask 是"发言身份"层（名称、头像、类型、谁能用）
  //  - CharacterCard 是"角色数据"层（属性、技能、简介）
  //  - 一个面具可绑定 0..N 张角色卡（不同规则兼容）
  //  - 当前使用哪张卡由空间规则（space.ruleType）自动匹配
  // ============================================================

  export type Type = "character" | "npc" | "system" | "gm";
  // ============================================================

  } // end namespace Mask

  export interface Mask {
    maskId: MaskId;
    spaceId: SpaceId;
    name: string;
    /** 头像映射：名称 → avatarId（如 {"default":"av_001","立绘":"av_002"}） */
    avatars: Record<string, string>;
    /** 当前发言头像 ID */
    currentAvatarId: string;
    /** 默认头像 ID（fallback） */
    defaultAvatarId: string;
    type: Mask.Type;
    /** 绑定的角色卡列表（0..N），当前卡由空间规则自动匹配 */
    characterCards: CharacterCardId[];
    /** 可使用此面具的用户列表 */
    userIds: UserId[];
    /** 是否为默认面具 */
    isDefault: boolean;
    createdAt: Timestamp;
    updatedAt: Timestamp;
  }

  export namespace CharacterCard {
  //  五、角色卡 (CharacterCard) —— 规则无关的属性数据
  //  策划案 8.4：玩家角色、NPC 管理
  //
  //  角色卡只存纯数据（attributes），不负责展示。
  //  展示层（名字、头像）由 Mask 管理。
  //
  //  不同规则系统的属性结构不同（DND 面板 ≠ CoC 面板），
  //  通过 card.name 区分，由 space.ruleType 自动匹配当前使用的卡。
  // ============================================================

  export type Type = "pc" | "npc" | "system";
  // ============================================================

  } // end namespace CharacterCard

  export interface CharacterCard {
    characterId: CharacterCardId;
    /** 所属面具 ID */
    maskId: MaskId;
    /** 卡名，如 "DND 5e"、"CoC 7th"（与 space.ruleType 匹配） */
    name: string;
    /** 规则无关的角色属性（不同规则系统自行定义结构） */
    attributes: Record<string, unknown>;
    /** 角色模板 ID */
    templateId?: string;
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
  //  - gm_only:        仅 GM / AGM 可见（秘密信息）
  //  - custom:         仅指定成员可见（单线线索、秘密团分视角）
  //  - gm_and_custom:  GM / AGM + 指定成员可见
  //
  //  阶段性隐藏通过 revealOnSpaceClose 实现——结团前隐藏，结团后公开。
  // ============================================================

  export type Visibility = "all" | "gm_only" | "custom" | "gm_and_custom";
  // ============================================================

  } // end namespace Veil

  export interface Veil {
    visibility: Veil.Visibility;
    /** 可见用户列表（custom / gm_and_custom 时使用） */
    visibleTo?: UserId[];
    /** 结团后自动公开 */
    revealOnSpaceClose: boolean;
  }

  export interface Message {
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
    updateTime?: Timestamp;
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

    /** forward 类型：合并转发内容 */
    forward?: Narratable.ForwardContent;

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
  //  - forward: 合并转发消息（引用模式或完整模式）
  //
  //  指令（含骰点）是完整的消息，不是消息内的节点
  // ============================================================

  export type Type = "chat" | "clue" | "command" | "system" | "forward";

  /** 编辑记录 */
  export interface EditRecord {
    editTime: Timestamp;
    /** 编辑前的内容（chat/clue 类型）或指令（command 类型） */
    previousRaw: unknown;
    editBy: UserId;
  }

  /** 指令参数 */
  export interface Param {
    name: string;
    value: string;
  }

  /** 指令执行结果 */
  export interface Result {
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
    resourceId: string;
    width: number;
    height: number;
    alt?: string;
  }

  /** 音频块 */
  export interface Audio {

    type: "audio";
    resourceId: string;
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

  /** 提及目标 —— 可 @user、@mask 或 @characterCard */
  export type MentionTarget =

    | { kind: "user";      userId: UserId }
    | { kind: "mask";      maskId: MaskId }
    | { kind: "characterCard"; characterCardId: CharacterCardId };

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
    /** 提及目标：user / mask / characterCard */
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
  //  十、合并转发 (Forward)
  //  合并转发消息类型，支持两种模式：
  //    引用模式（有 sourceMessageId + sourceRoomId）—— 可跳转原文
  //    完整模式（无 sourceMessageId）—— 纯快照
  //  递归嵌套深度限制为 3 层
  // ============================================================

  /** 合并转发内容 */
  export interface ForwardContent {
    /** 标题，手动填写或自动生成 */
    title: string;
    /** 来源描述（空间/房间） */
    sourceDesc?: string;
    messages: ForwardedMessage[];
    /** 嵌套深度，服务端填充，从 1 开始 */
    depth: number;
  }

  /** 单条被转发消息 */
  export interface ForwardedMessage {
    /** 原始消息 ID（引用模式时存在） */
    sourceMessageId?: MessageId;
    /** 原始房间 ID */
    sourceRoomId?: string;
    senderMaskId: MaskId;
    senderName: string;
    avatarId: string;
    type: string;
    blocks: Message.Block[];
    timestamp: Timestamp;
    /** 递归：转发内嵌转发 */
    forward?: ForwardContent;
  }

  export namespace Resource {
  // ============================================================
  //  资源 (Resource) —— 空间附件与外部资源引用
  // ============================================================

  export type Kind = "image" | "audio" | "video" | "document" | "archive" | "other";

  } // end namespace Resource

  export interface Resource {
    resourceId: ResourceId;
    spaceId: SpaceId;
    roomId?: RoomId;
    messageId?: MessageId;
    name: string;
    kind: Resource.Kind;
    uri: string;
    mimeType: string;
    sizeBytes: number;
    checksum?: string;
    metadata?: Record<string, unknown>;
    uploadedBy: UserId;
    createdAt: Timestamp;
    updatedAt: Timestamp;
  }

  export namespace Plugin {
  // ============================================================
  //  插件与规则模板
  // ============================================================

  export interface OverrideConfig {
    priority?: number;
    isImportant: boolean;
  }

  export interface Ref {
    pluginId: PluginId;
    sortOrder: number;
    overrides?: Record<string, OverrideConfig>;
  }

  } // end namespace Plugin

  export interface Plugin {
    pluginId: PluginId;
    name: string;
    displayName: string;
    version: string;
    description: string;
    author: string;
    source: string;
    characterDataType?: string;
    configSchema?: Record<string, unknown>;
    builtIn: boolean;
    enabled: boolean;
    createdAt: Timestamp;
    updatedAt: Timestamp;
  }

  export interface PluginRule {
    ruleId: RuleId;
    spaceId: SpaceId;
    name: string;
    active: boolean;
    plugins: Plugin.Ref[];
    createdAt: Timestamp;
    updatedAt: Timestamp;
  }

  export interface RuleTemplate {
    templateId: string;
    name: string;
    description: string;
    plugins: Plugin.Ref[];
  }

  // ============================================================
  export namespace Event {
  //  十一、实时事件（WebSocket 推送）
  // ============================================================

  export type Type =
    | "message.created"
    | "message.updated"
    | "message.deleted"
    | "member.joined"
    | "member.left"
    | "veil.revealed";

  export interface Base {
    type: Type;
    spaceId: SpaceId;
    timestamp: Timestamp;
  }

  export interface Created extends Base {
    type: "message.created";
    message: Message;
  }

  export interface Updated extends Base {
    type: "message.updated";
    message: Message;
  }

  export interface Deleted extends Base {
    type: "message.deleted";
    messageId: MessageId;
    roomId: RoomId;
  }

  /** 帷幕公开事件（结团后自动公开） */
  export interface VeilRevealed extends Base {
    type: "veil.revealed";
    messageIds: MessageId[];
    reason: "space_closed";
  }

  /** 成员加入房间 */
  export interface MemberJoined extends Base {
    type: "member.joined";
    roomId: RoomId;
    member: {
      userId: UserId;
      maskId?: MaskId;
      displayName: string;
    };
  }

  /** 成员离开房间 */
  export interface MemberLeft extends Base {
    type: "member.left";
    roomId: RoomId;
    userId: UserId;
  }

  // ============================================================

  } // end namespace Event

  export type Event =
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
    export interface ErrorResponse {
      error: string;
      details?: string;
    }

    // ---- 认证 ----

    /** POST /auth/login */
    export interface LoginRequest {
      username: string;
      password: string;
    }

    /** POST /auth/register */
    export interface RegisterRequest {
      email: string;
      password: string;
      code: string;
    }

    /** POST /auth/send-code */
    export interface SendCodeRequest {
      email: string;
    }

    /** POST /auth/refresh */
    export interface RefreshRequest {
      refreshToken: string;
    }

    /** POST /auth/reset-password */
    export interface ResetPasswordRequest {
      email: string;
      code: string;
      newPassword: string;
    }

    export interface UserResponse {
      id: UserId;
      username: string;
      email?: string;
      nickname: string;
      avatar: string;
    }

    export interface AuthTokenResponse {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    }

    // ---- 管理后台 ----

    /** POST /admin/login */
    export interface AdminLoginRequest {
      username: string;
      password: string;
    }

    /** POST /admin/change-password */
    export interface ChangePasswordRequest {
      oldPassword: string;
      newPassword: string;
    }

    // ---- 空间 ----

    /** POST /api/spaces */
    export interface CreateSpaceRequest {
      name: string;
      description?: string;
    }

    /** GET /api/spaces */
    export interface SpacesListResponse {
      spaces: SpaceSummary[];
    }

    export interface SpaceSummary {
      spaceId: SpaceId;
      name: string;
      ownerId: UserId;
      memberCount: number;
      status: "active" | "archived";
      myRole: Space.Role;
      createdAt: Timestamp;
      lastActiveAt: Timestamp;
    }

    export interface SpaceDetail {
      spaceId: SpaceId;
      name: string;
      description: string;
      ownerId: UserId;
      members: Space.Member[];
      status: "active" | "archived";
      moduleSource?: { moduleId: string; moduleName: string };
      createdAt: Timestamp;
      updatedAt: Timestamp;
    }

    /** PATCH /api/spaces/:spaceId */
    export interface UpdateSpaceRequest {
      name?: string;
      description?: string;
      status?: "active" | "archived";
    }

    /** POST /api/spaces/:spaceId/members */
    export interface InviteMemberRequest {
      userId: UserId;
      role: Space.Role;
    }

    /** PATCH /api/spaces/:spaceId/members/:userId/role */
    export interface UpdateMemberRoleRequest {
      role: Space.Role;
    }

    /** POST /api/spaces/:spaceId/reveal-all-veils */
    export interface RevealAllVeilsResponse {
      messageIds: MessageId[];
      count: number;
    }

    // ---- 房间 ----

    /** POST /api/spaces/:spaceId/rooms */
    export interface CreateRoomRequest {
      name: string;
      type: Room.Type;
      description?: string;
      sortOrder?: number;
      visibleUserIds?: UserId[];
    }

    /** GET /api/spaces/:spaceId/rooms */
    export interface RoomsListResponse {
      rooms: RoomSummary[];
    }

    export interface RoomSummary {
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

    /** PATCH /api/spaces/:spaceId/rooms/:roomId */
    export interface UpdateRoomRequest {
      name?: string;
      description?: string;
      sortOrder?: number;
      visibleUserIds?: UserId[];
    }

    /** POST /api/spaces/:spaceId/rooms/:roomId/join */
    export interface JoinRoomRequest {
      maskId?: MaskId;
      code?: string;  // 房间密码（有密码的房间必填）
    }

    export interface JoinRoomResponse {
      roomId: RoomId;
      memberCount: number;
      joinedAt: Timestamp;
    }

    /** POST /api/spaces/:spaceId/rooms/:roomId/leave */
    export interface LeaveRoomResponse {
      roomId: RoomId;
      memberCount: number;
    }

    /** POST /api/spaces/:spaceId/rooms — 响应 */
    export interface CreateRoomResponse {
      room: Room;
      joinCode: string;  // 6位数字密码，仅在创建/重置时返回
    }

    /** POST /api/spaces/:spaceId/rooms/:roomId/regenerate-code — 响应 */
    export interface RegenerateCodeResponse {
      joinCode: string;
    }

    // ---- 消息 ----

    /**
     * GET /api/spaces/:spaceId/rooms/:roomId/messages 的查询参数
     * 复用 Message.MessageQuery（roomId 来自 URL 路径）
     */
    export type MessagesQuery = Message.MessageQuery;

    /** PATCH /api/messages/:messageId */
    export interface EditMessageRequest {
      content?: Message.Block[];
      clue?: {
        title?: string;
        description?: string;
        imageUrl?: string;
        tags?: string[];
      };
    }

    /** POST /api/messages/:messageId/pin */
    export interface PinMessageRequest {
      pinned: boolean;
    }

    /** POST /api/messages/:messageId/fold */
    export interface FoldMessageRequest {
      folded: boolean;
    }

    /** PATCH /api/messages/:messageId/veil */
    export interface UpdateMessageVeilRequest {
      visibility: Veil.Visibility;
      visibleTo?: UserId[];
    }

    // ---- 面具 ----

    /** POST /api/spaces/:spaceId/masks */
    export interface CreateMaskRequest {
      name: string;
      type: Mask.Type;
      /** 头像映射 */
      avatars: Record<string, string>;
      currentAvatarId: string;
      defaultAvatarId: string;
    }

    /** PATCH /api/spaces/:spaceId/masks/:maskId */
    export interface UpdateMaskRequest {
      name?: string;
      avatars?: Record<string, string>;
      currentAvatarId?: string;
      defaultAvatarId?: string;
      userIds?: UserId[];
    }

    export interface MaskListResponse {
      masks: Mask[];
    }

    // ---- 角色卡 ----

    /** POST /api/masks/:maskId/cards */
    export interface CreateCharacterCardRequest {
      /** 卡名，如 "DND 5e" */
      name: string;
      attributes?: Record<string, unknown>;
      templateId?: string;
    }

    /** PUT /api/masks/:maskId/cards/:cardId */
    export interface UpdateCharacterCardRequest {
      name?: string;
      attributes?: Record<string, unknown>;
      templateId?: string;
    }

    export interface CharacterCardListResponse {
      cards: CharacterCard[];
    }

    // ---- 私聊 ----

    /** GET /api/dm/:targetUserID */
    export interface DirectMessageRoomResponse {
      room: Room;
    }

    // ---- 资源 ----

    /** POST /api/spaces/:spaceId/resources */
    export interface CreateResourceRequest {
      name: string;
      kind: Resource.Kind;
      uri: string;
      roomId?: RoomId;
      messageId?: MessageId;
      mimeType?: string;
      sizeBytes?: number;
      checksum?: string;
      metadata?: Record<string, unknown>;
    }

    /** GET /api/spaces/:spaceId/resources */
    export interface ResourceListResponse {
      resources: Resource[];
    }

    // ---- 插件与规则 ----

    /** GET /api/plugins/defaults */
    export interface PluginListResponse {
      plugins: Plugin[];
    }

    /** GET /api/plugin-rule-templates/defaults */
    export interface RuleTemplateListResponse {
      templates: RuleTemplate[];
    }

    /** POST /api/spaces/:spaceId/plugin-rules/from-template */
    export interface ApplyRuleTemplateRequest {
      templateId: string;
      name?: string;
    }

    // ---- 管理员插件管理 ----

    /** POST /admin/plugins */
    export interface CreateAdminPluginRequest {
      name: string;
      displayName: string;
      version: string;
      description?: string;
      author?: string;
      source: string;
      characterDataType?: string;
      configSchema?: string;
      enabled?: boolean;
    }

    /** PATCH /admin/plugins/:pluginId */
    export interface UpdateAdminPluginRequest {
      displayName?: string;
      version?: string;
      description?: string;
      author?: string;
      source?: string;
      characterDataType?: string;
      configSchema?: string;
      enabled?: boolean;
    }

    /** GET /admin/plugins */
    export interface AdminPluginListResponse {
      plugins: Plugin[];
    }
  }

  // ============================================================
  //  十四、WebSocket 客户端发送消息格式
  //  通过 WebSocket 发送，非 REST API
  // ============================================================

  export namespace WS {
    /** 发送聊天消息 */
    export interface SendChat {
      type: "chat";
      roomId: RoomId;
      spaceId: SpaceId;
      content: Message.Block[];
      maskId?: MaskId;
      refMessageId?: MessageId;
    }

    /** 发送指令消息（含骰点） */
    export interface SendCommand {
      type: "command";
      roomId: RoomId;
      spaceId: SpaceId;
      command: string;
      params: Message.Param[];
      raw: string;
      maskId?: MaskId;
    }

    /** 发送线索消息 */
    export interface SendClue {
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

    export type ClientMessage = SendChat | SendCommand | SendClue;
  }

} // end namespace Narratable
