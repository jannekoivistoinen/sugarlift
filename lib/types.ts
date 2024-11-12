export interface Artist {
  id: string;
  name: string;
  biography?: string;
  instagram?: string;
  created_at?: string;
  updated_at?: string;
}

export interface WebhookError extends Error {
  status?: number;
  response?: {
    message?: string;
    details?: unknown;
  };
}

export interface SyncError extends Error {
  code?: string;
  details?: unknown;
  record?: {
    id: string;
    fields?: unknown;
  };
}
