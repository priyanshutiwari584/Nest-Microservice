export interface RpcContext {
  method: string;
  path: string;
  body: Record<string, unknown>;
  query: Record<string, unknown>;
  params: string[];
  requestId: string;
}
