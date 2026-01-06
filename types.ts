export interface Employee {
  id: string;
  name: string;
  role: string;
  admissionDate: string; // ISO Date string YYYY-MM-DD
  department: string;
  lastVacationEnd?: string; // ISO Date string YYYY-MM-DD (Optional - Last time they returned from vacation)
}

export interface Vacation {
  id: string;
  employeeId: string;
  startDate: string; // ISO Date string YYYY-MM-DD
  durationDays: number;
  status: 'scheduled' | 'active' | 'completed';
  hasAbono?: boolean; // Brazilian Abono Pecuniário (Selling 1/3 of vacation)
}

export interface VacationCalculation {
  returnDate: Date;
  limitDate: Date; // The deadline to take vacation before it "expires" (doubles)
  vestingPeriodStart: Date;
  vestingPeriodEnd: Date;
}

export enum Tab {
  DASHBOARD = 'DASHBOARD',
  EMPLOYEES = 'EMPLOYEES',
  CALCULATOR = 'CALCULATOR',
  ADVISOR = 'ADVISOR'
}

export interface TabNavigationProps {
  onNavigate?: (tab: Tab) => void;
  onAskAI?: (prompt: string) => void;
  onCancelVacation?: (id: string) => void;
  onEditVacation?: (vacation: Vacation) => void;
}