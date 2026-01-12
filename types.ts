
export enum RatingLevel {
  VERY_UNSATISFIED = 1,
  UNSATISFIED = 2,
  NEUTRAL = 3,
  SATISFIED = 4,
  EXCELLENT = 5
}

export interface EvaluationCategory {
  id: string;
  label: string;
  icon: string;
}

export interface UserFeedback {
  overall: RatingLevel | null;
  categories: Record<string, RatingLevel>;
  comments: string;
  apartmentNumber: string;
  timestamp?: number;
  // Dados enriquecidos do banco externo
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
}

export interface DashboardStats {
  averageOverall: number;
  categoryAverages: Record<string, number>;
  totalFeedbacks: number;
  recentComments: string[];
}

export interface PostgresConfig {
  host: string;
  port: string;
  database: string;
  user: string;
  password?: string;
  ssl: boolean;
}

export interface AdminUser {
  name: string;
  sector: string;
  password: string;
}
