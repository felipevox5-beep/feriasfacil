/**
 * Parses a date string 'YYYY-MM-DD' as a local date (preventing timezone shifts)
 */
export const parseLocalDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const subDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
};

// Calculate the deadline to avoid "double pay" (vencimento da segunda férias)
// Updated Logic: 
// 1. Iterate periods starting from admission.
// 2. If `lastVacationEnd` is provided, assume any vesting period (periodo aquisitivo) 
//    that ended significantly before the last vacation was settled.
// 3. Find the oldest "Open" period.
export const calculateVacationDeadlines = (admissionDateStr: string, lastVacationEndStr?: string): { limitDate: Date, periodStart: Date, periodEnd: Date } => {
  const admission = parseLocalDate(admissionDateStr);
  const today = new Date();
  
  let lastVacationEnd: Date | null = null;
  if (lastVacationEndStr) {
    lastVacationEnd = parseLocalDate(lastVacationEndStr);
  }

  // We start iterating vesting periods from admission
  // A vesting period (Aquisitivo) is 1 year.
  // The concessive period (Concessivo) is the following 1 year.
  // The deadline (Limit) is the end of the concessive period.

  let currentStart = new Date(admission);
  
  // Safety break for infinite loops (e.g. invalid dates)
  let iterations = 0;
  
  while (iterations < 50) {
    const currentEnd = new Date(currentStart);
    currentEnd.setFullYear(currentEnd.getFullYear() + 1);
    currentEnd.setDate(currentEnd.getDate() - 1); // Period ends 1 day before anniversary

    const limitDate = new Date(currentEnd);
    limitDate.setFullYear(limitDate.getFullYear() + 1); // Limit is 1 year after period end

    // Check if this specific period is "cleared" or "open"
    let isCleared = false;

    if (lastVacationEnd) {
      // Heuristic: If the last vacation ended AFTER the vesting period ended (or very close to the limit),
      // we assume this specific vesting period was paid out.
      // We add a small buffer (e.g., vacation taken within the concessive period clears the vesting period).
      
      // If I took vacation that ended *after* the period was acquired, it likely counts towards that period or a previous one.
      // Simpler heuristic: If the Limit Date of this period is BEFORE the Last Vacation Date, 
      // it means this period is definitely old history (or already paid/doubled and resolved).
      if (limitDate < lastVacationEnd) {
        isCleared = true;
      }
      
      // Also, if the vacation happened *during* the concessive period of this cycle, it clears it.
      if (lastVacationEnd >= currentEnd && lastVacationEnd <= limitDate) {
         isCleared = true;
      }
    } else {
      // If no last vacation data, we assume past deadlines are done/irrelevant 
      // and only look for the first one that is in the future (or currently overdue).
      if (limitDate < today) {
        isCleared = true; 
        // Note: In a strict system, this might be "Overdue" not "Cleared", 
        // but for a simple calculator without history, we assume older years are settled.
      }
    }

    if (!isCleared) {
      // Found the active period!
      return {
        limitDate: limitDate,
        periodStart: currentStart,
        periodEnd: currentEnd
      };
    }

    // Move to next period
    currentStart.setFullYear(currentStart.getFullYear() + 1);
    iterations++;
  }

  // Fallback (shouldn't happen with valid dates)
  return {
    limitDate: new Date(),
    periodStart: new Date(),
    periodEnd: new Date()
  };
};

export const getStatusColor = (limitDate: Date): string => {
  const today = new Date();
  const monthsUntilLimit = (limitDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30);

  if (monthsUntilLimit < 0) return 'text-red-600 bg-red-100'; // Expired
  if (monthsUntilLimit < 3) return 'text-orange-600 bg-orange-100'; // Critical
  if (monthsUntilLimit < 6) return 'text-yellow-600 bg-yellow-100'; // Warning
  return 'text-green-600 bg-green-100'; // Safe
};