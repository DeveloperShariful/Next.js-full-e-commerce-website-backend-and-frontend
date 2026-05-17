// File Location: app/admin/logs/types.ts

export interface ActivityLogUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
}

export interface ActivityLogType {
  id: string;
  userId: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  details: Record<string, unknown> | null; // Strict JSON type
  ipAddress: string | null;
  createdAt: string | Date;
  user: ActivityLogUser;
}

export interface LogFilterParams {
  page: number;
  limit: number;
  query?: string;
  action?: string;
  entityType?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

export interface LogMetaType {
  total: number;
  pages: number;
}