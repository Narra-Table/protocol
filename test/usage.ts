// Compile-time checks of how consumers use the generated types; `pnpm check` runs tsc over it.
import type {
  Audience,
  ClientFrame,
  CpiMethods,
  Message,
  MessageSubmit,
  ServerFrame,
  ServerFrames,
  paths,
} from '../index';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
const assert = <T extends true>(): T => true as T;

export function handle(frame: ServerFrame): string {
  switch (frame.type) {
    case 'sync.batch':
      return frame.before + frame.after + (frame.changes.messages ?? []).length;
    case 'sync.heartbeat':
      return frame.checkpoint;
    case 'operation.receipt':
      return frame.requestId + (frame.error?.code ?? frame.receipt?.status ?? '');
    default:
      return frame.type;
  }
}

export const submit: ClientFrame = {
  type: 'message.submit',
  requestId: 'r1',
  body: {
    clientOperationId: 'c1',
    roomId: 'room',
    presentation: { kind: 'account' },
    blocks: [{ type: 'paragraph', children: [{ type: 'text', text: 'hi' }] }],
    audience: { kind: 'members', memberIds: ['u1'] },
  },
};

// @ts-expect-error members audience requires memberIds
export const badAudience: Audience = { kind: 'members' };
// @ts-expect-error presentation is required
export const badSubmit: MessageSubmit = { clientOperationId: 'c', roomId: 'r', blocks: [] };

type HistoryQuery = NonNullable<paths['/api/v2/rooms/{roomId}/messages']['get']['parameters']['query']>;
type HistoryOk = paths['/api/v2/rooms/{roomId}/messages']['get']['responses'][200]['content']['application/json'];
export const checks = [
  assert<Equal<HistoryQuery['limit'], number | undefined>>(),
  assert<Equal<HistoryOk['items'], Message[] | null>>(),
  assert<Equal<ServerFrames['sync.heartbeat']['type'], 'sync.heartbeat'>>(),
  assert<Equal<CpiMethods['roll']['output'], number>>(),
];
