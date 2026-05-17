//app/actions/admin/dashboard/types.ts

export interface PulseMetric {
  value: number;
  growth: number;
}

export interface OrderStats {
  total: number;       // Total orders count
  paid: number;        // Only PAID orders
  unpaid: number;      // UNPAID orders
  growth: number;      // Total growth %
}

export interface StatusBreakdown {
  [key: string]: number; // e.g., PENDING: 5, PROCESSING: 2
}

export interface DashboardPulse {
  revenue: PulseMetric;    // Only PAID revenue
  orders: OrderStats;      // Detailed order stats
  customers: PulseMetric;
  statusBreakdown: StatusBreakdown; // List of all statuses
}

export interface DashboardStats {
  today: DashboardPulse;
  yesterday: DashboardPulse;
  week: DashboardPulse;
  month: DashboardPulse;
}

export interface ActionAlerts {
  unfulfilled: number;
  returns: number;
  disputes: number;
  lowStock: number;
}