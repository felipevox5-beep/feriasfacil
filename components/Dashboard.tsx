import React from 'react';
import { Employee, Vacation, TabNavigationProps } from '../types';
import { calculateVacationDeadlines, formatDate, parseLocalDate, addDays, subDays } from '../utils/dateUtils';
import { Users, AlertCircle, Sun, Calendar, FileText, FileSignature, Sparkles, Trash2, Pencil, Banknote } from 'lucide-react';

interface DashboardProps extends TabNavigationProps {
  employees: Employee[];
  vacations: Vacation[];
  onCancelVacation?: (id: string) => void;
  onEditVacation?: (vacation: Vacation) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ employees, vacations, onAskAI, onCancelVacation, onEditVacation }) => {
  const today = new Date();

  // Logic to find expiring vacations
  const expiringEmployees = employees.map(emp => {
    const deadlines = calculateVacationDeadlines(emp.admissionDate, emp.lastVacationEnd);
    const monthsLeft = (deadlines.limitDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30);
    return { ...emp, monthsLeft, deadline: deadlines.limitDate };
  }).filter(e => e.monthsLeft < 3).sort((a, b) => a.monthsLeft - b.monthsLeft);

  const activeVacations = vacations.filter(v => {
    const start = parseLocalDate(v.startDate);
    const actualRest = v.hasAbono ? 20 : v.durationDays;
    const end = addDays(start, actualRest);
    return today >= start && today <= end;
  });

  // Logic for Notice Deadlines (Avisos)
  const pendingNotices = vacations
    .filter(v => parseLocalDate(v.startDate) > today) // Only future vacations
    .map(v => {
        const emp = employees.find(e => e.id === v.employeeId);
        const start = parseLocalDate(v.startDate);
        const noticeDeadline = subDays(start, 45);
        const daysUntilDeadline = Math.ceil((noticeDeadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const isLate = today > noticeDeadline;
        
        return {
            vacation: v,
            employee: emp,
            start,
            noticeDeadline,
            daysUntilDeadline,
            isLate
        };
    })
    .sort((a, b) => a.noticeDeadline.getTime() - b.noticeDeadline.getTime());

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Total de Colaboradores</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">{employees.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 rounded-lg">
              <Sun className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Em Férias Agora</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">{activeVacations.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Vencimento Próximo</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">{expiringEmployees.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Notice Control */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col order-first lg:order-none transition-colors">
           <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-indigo-50/30 dark:bg-indigo-900/20">
             <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
               <FileSignature className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
               Controle de Avisos (45 dias)
             </h3>
             <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Monitore quem precisa assinar o aviso de férias em breve.</p>
           </div>
           <div className="flex-1 p-4">
              {pendingNotices.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                    <p>Todos os avisos estão em dia.</p>
                  </div>
              ) : (
                  <div className="space-y-3">
                      {pendingNotices.map((item, idx) => (
                          <div key={idx} className={`flex flex-col p-3 rounded-lg border ${item.isLate ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-white dark:bg-slate-700/50 border-slate-200 dark:border-slate-700'}`}>
                             <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="font-semibold text-slate-800 dark:text-slate-200">{item.employee?.name}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Início: {formatDate(item.start)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Prazo do Aviso</p>
                                    <p className={`text-sm font-bold ${item.isLate ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                        {formatDate(item.noticeDeadline)}
                                    </p>
                                </div>
                             </div>
                             
                             <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100/50 dark:border-slate-600/50">
                                <span className={`text-xs font-bold px-2 py-1 rounded ${item.isLate ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-200' : 'bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-200'}`}>
                                    {item.isLate ? 'ATRASADO' : `Faltam ${item.daysUntilDeadline} dias`}
                                </span>
                                
                                {onAskAI && (
                                    <button 
                                        onClick={() => onAskAI(`Gere um modelo formal de aviso de férias para o colaborador ${item.employee?.name}, referente ao período de férias de ${formatDate(item.start)} a ${formatDate(addDays(item.start, item.vacation.hasAbono ? 20 : item.vacation.durationDays))}. O aviso deve ser datado de hoje. Mencione que o colaborador optou pelo Abono Pecuniário de 10 dias caso aplicável.`)}
                                        className="flex items-center gap-1 text-xs bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 px-2 py-1 rounded hover:bg-indigo-100 dark:hover:bg-indigo-800 transition-colors font-medium border border-indigo-100 dark:border-indigo-800"
                                    >
                                        <Sparkles className="w-3 h-3" />
                                        Gerar Modelo
                                    </button>
                                )}
                             </div>
                          </div>
                      ))}
                  </div>
              )}
           </div>
        </div>

        {/* Expiring List */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col transition-colors">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700">
             <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
               <AlertCircle className="w-5 h-5 text-red-500" />
               Risco de Dobra (2ª Férias)
             </h3>
          </div>
          <div className="flex-1 p-4">
            {expiringEmployees.length === 0 ? (
              <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                <p>Nenhum vencimento crítico próximo.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {expiringEmployees.map(emp => (
                  <div key={emp.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{emp.name}</p>
                      <p className="text-xs text-red-600 dark:text-red-400 font-medium">Vence em: {formatDate(emp.deadline)}</p>
                    </div>
                    <span className="text-xs font-bold bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 px-2 py-1 rounded border border-red-200 dark:border-red-900">
                      {Math.ceil(emp.monthsLeft)} meses
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Scheduled List */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col col-span-1 lg:col-span-2 transition-colors">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700">
             <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
               <Calendar className="w-5 h-5 text-indigo-500" />
               Agenda Geral de Férias
             </h3>
          </div>
          <div className="flex-1 p-4">
             {vacations.length === 0 ? (
               <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                 <p>Nenhuma férias agendada.</p>
               </div>
             ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                 {vacations
                  .sort((a,b) => parseLocalDate(a.startDate).getTime() - parseLocalDate(b.startDate).getTime())
                  .slice(0, 6)
                  .map(vac => {
                    const emp = employees.find(e => e.id === vac.employeeId);
                    if (!emp) return null;
                    const restDays = vac.hasAbono ? 20 : vac.durationDays;
                    return (
                      <div key={vac.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-700 group">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                             <p className="font-semibold text-slate-800 dark:text-slate-200">{emp.name}</p>
                             {vac.hasAbono && (
                               <span className="text-[10px] bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                                 <Banknote className="w-3 h-3" />
                                 ABONO
                               </span>
                             )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(parseLocalDate(vac.startDate))} • {restDays} dias descanso</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Volta</p>
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{formatDate(addDays(parseLocalDate(vac.startDate), restDays))}</p>
                          </div>
                          
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {onEditVacation && (
                              <button
                                onClick={() => onEditVacation(vac)}
                                className="text-slate-400 hover:text-indigo-500 dark:text-slate-500 dark:hover:text-indigo-400 p-1 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all"
                                title="Editar Férias"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                            )}
                            
                            {onCancelVacation && (
                              <button
                                onClick={() => onCancelVacation(vac.id)}
                                className="text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                title="Cancelar Férias"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                 })}
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;