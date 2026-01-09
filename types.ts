export interface Employee {
  id: string;
  name: string;
  role: string;
  admissionDate: string; // ISO Date string YYYY-MM-DD
  department: string;
  lastVacationEnd?: string; // ISO Date string YYYY-MM-DD (Optional - Last time they returned from vacation)
}

export interface Department {
  id: string;
  name: string;
}

export interface Vacation {
  id: string;
  employeeId: string;
  startDate: string; // ISO Date string YYYY-MM-DD
  durationDays: number;
  status: 'scheduled' | 'active' | 'completed';
  hasAbono?: boolean; // Brazilian Abono Pecuniário (Selling 1/3 of vacation)
  noticeSent?: boolean; // If the formal notice was given 30 days prior
  advance13th?: boolean; // If 1st installment of 13th salary was requested
}

export interface VacationCalculation {
  returnDate: Date;
  limitDate: Date; // The deadline to take vacation before it "expires" (doubles)
  vestingPeriodStart: Date;
  vestingPeriodEnd: Date;
}

export enum Tab {
  DASHBOARD = 'dashboard',
  EMPLOYEES = 'employees',
  CALCULATOR = 'calculator',
  ADVISOR = 'advisor',
  USERS = 'users'
}

export type Role = 'master' | 'common';

export interface User {
  id: string;
  username: string;
  role: Role;
  createdAt?: string; // Optional for display
}

export interface TabNavigationProps {
  onNavigate?: (tab: Tab) => void;
  onAskAI?: (prompt: string) => void;
  onCancelVacation?: (id: string) => void;
  onEditVacation?: (vacation: Vacation) => void;
}