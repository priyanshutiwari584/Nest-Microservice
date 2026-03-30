export interface RpcResponse<T = unknown> {
  success: boolean;
  status: number;
  message: string;
  data?: T;
  timestamp: string;
  requestId?: string;
}

export interface RpcErrorResponse<T = unknown> {
  success: boolean;
  message: string;
  error: T;
  path: string;
  timestamp: string;
  requestId?: string;
}
