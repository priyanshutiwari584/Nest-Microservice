import { User } from 'libs/drizzle';

export interface RpcContext {
  method: string;
  path: string;
  headers: Record<string, string>;
  body: Record<string, unknown>;
  query: Record<string, unknown>;
  params: string[];
  requestId: string;
  user?: User | null;
}
