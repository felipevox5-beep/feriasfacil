import React, { useState, useEffect } from 'react';
import { Employee, Vacation } from '../types';
import { addDays, subDays, calculateVacationDeadlines, formatDate, parseLocalDate } from '../utils/dateUtils';
import { Calendar as CalendarIcon, ArrowRight, AlertTriangle, Calculator as CalcIcon, CheckCircle, FileText, Users, X, Banknote } from 'lucide-react';
import ConflictModal from './ConflictModal';

interface CalculatorProps {
  employees: Employee[];
  vacations?: Vacation[];
  onSaveVacation: (vacation: Vacation) => void;
  editingVacation?: Vacation | null;
  onUpdateVacation?: (vacation: Vacation) => void;
  onCancelEdit?: () => void;
}

const Calculator: React.FC<CalculatorProps> = ({
  employees,
  vacations = [],
  onSaveVacation,
  editingVacation,
  onUpdateVacation,
  onCancelEdit
}) => {
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [days, setDays] = useState<number>(30);
  const [hasAbono, setHasAbono] = useState(false);
  const [advance13th, setAdvance13th] = useState(false);

  // Computed values
  const [returnDate, setReturnDate] = useState<Date | null>(null);
  const [noticeDeadline, setNoticeDeadline] = useState<Date | null>(null);
  const [deadlineInfo, setDeadlineInfo] = useState<{ limitDate: Date, periodStart: Date, periodEnd: Date } | null>(null);
  const [conflicts, setConflicts] = useState<Array<{ name: string, start: string, end: string }>>([]);

  // Modal State
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [modalConflictNames, setModalConflictNames] = useState<string[]>([]);

  // Reset abono if days change and is not 30
  useEffect(() => {
    if (days !== 30) {
      setHasAbono(false);
    }
  }, [days]);

  // Populate form if editing
  useEffect(() => {
    if (editingVacation) {
      setSelectedEmpId(editingVacation.employeeId);
      setStartDate(editingVacation.startDate);
      setDays(editingVacation.durationDays);
      setHasAbono(!!editingVacation.hasAbono);
      setAdvance13th(!!editingVacation.advance13th);
    } else {
      setSelectedEmpId('');
      setStartDate('');
      setDays(30);
      setHasAbono(false);
      setAdvance13th(false);
    }
  }, [editingVacation]);

  useEffect(() => {
    if (selectedEmpId) {
      const emp = employees.find(e => e.id === selectedEmpId);
      if (emp) {
        const info = calculateVacationDeadlines(emp.admissionDate, emp.lastVacationEnd);
        setDeadlineInfo(info);
      }
    } else {
      setDeadlineInfo(null);
    }
  }, [selectedEmpId, employees]);

  useEffect(() => {
    setReturnDate(null);
    setNoticeDeadline(null);
    setConflicts([]);

    if (startDate && days > 0 && selectedEmpId) {
      const start = parseLocalDate(startDate);

      // LOGIC: If hasAbono is true and days is 30, rest period is 20 days.
      const actualRestDays = hasAbono ? 20 : days;
      const end = addDays(start, actualRestDays);

      const ret = addDays(start, actualRestDays);
      const notice = subDays(start, 45);

      setReturnDate(ret);
      setNoticeDeadline(notice);

      const currentEmp = employees.find(e => e.id === selectedEmpId);
      if (currentEmp) {
        const overlapping = vacations.filter(v => {
          if (v.employeeId === selectedEmpId) return false;
          if (editingVacation && v.id === editingVacation.id) return false;

          const otherEmp = employees.find(e => e.id === v.employeeId);
          if (!otherEmp || otherEmp.department !== currentEmp.department) return false;

          const vStart = parseLocalDate(v.startDate);
          // For conflict checking, we use the rest period or duration recorded
          const vActualRest = v.hasAbono ? 20 : v.durationDays;
          const vEnd = addDays(vStart, vActualRest);

          return start <= vEnd && end >= vStart;
        }).map(v => {
          const otherEmp = employees.find(e => e.id === v.employeeId);
          const vActualRest = v.hasAbono ? 20 : v.durationDays;
          return {
            name: otherEmp?.name || 'Desconhecido',
            start: v.startDate,
            end: addDays(parseLocalDate(v.startDate), vActualRest).toISOString().split('T')[0]
          };
        });

        // Check specifically if this is a NEW conflict for the user interaction to avoid loops or initial load prompts
        if (overlapping.length > 0) {
          // Verify if the current selection is different from the original editing value (to simply prevent annoyance when opening edit)
          const isSameAsOriginal = editingVacation && editingVacation.startDate === startDate && editingVacation.durationDays === days;

          if (!isSameAsOriginal) {
            const names = overlapping.map(o => o.name);
            setModalConflictNames(names);
            setShowConflictModal(true);
          }
        }

        setConflicts(overlapping);
      }
    }
  }, [startDate, days, selectedEmpId, vacations, employees, hasAbono]);

  const handleConfirmConflict = () => {
    setShowConflictModal(false);
    // Date remains set, allowing user to proceed
  };

  const handleCancelConflict = () => {
    setShowConflictModal(false);
    setStartDate('');
    setConflicts([]);
  };

  const handleSave = () => {
    if (selectedEmpId && startDate && days > 0) {
      const vacationData: Vacation = {
        id: editingVacation?.id || crypto.randomUUID(),
        employeeId: selectedEmpId,
        startDate: startDate,
        durationDays: days,
        status: 'scheduled',
        hasAbono: hasAbono,
        advance13th: advance13th
      };

      if (editingVacation && onUpdateVacation) {
        onUpdateVacation(vacationData);
        alert('Férias atualizadas com sucesso!');
      } else {
        onSaveVacation(vacationData);
        setStartDate('');
        setConflicts([]);
        setHasAbono(false);
        alert('Férias agendadas com sucesso!');
      }
    }
  };

  const isCritical = deadlineInfo && startDate ? (parseLocalDate(startDate) > deadlineInfo.limitDate) : false;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Input Section */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm h-fit transition-colors">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-lg">
              <CalcIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">{editingVacation ? 'Editar Férias' : 'Simulador de Férias'}</h2>
          </div>
          {editingVacation && onCancelEdit && (
            <button onClick={onCancelEdit} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1 text-xs font-medium">
              <X className="w-4 h-4" /> Cancelar Edição
            </button>
          )}
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Selecione o Colaborador</label>
            <select
              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none bg-slate-50 dark:bg-slate-900 dark:text-white"
              value={selectedEmpId}
              onChange={e => setSelectedEmpId(e.target.value)}
              disabled={!!editingVacation}
            >
              <option value="">-- Selecione --</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.name} - {e.department}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data de Início</label>
              <input
                type="date"
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none dark:bg-slate-900 dark:text-white dark:[color-scheme:dark]"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Total de Dias</label>
              <select
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none dark:bg-slate-900 dark:text-white"
                value={days}
                onChange={e => setDays(Number(e.target.value))}
              >
                <option value={30}>30 dias</option>
                <option value={20}>20 dias</option>
                <option value={15}>15 dias</option>
                <option value={14}>14 dias</option>
                <option value={10}>10 dias</option>
                <option value={5}>5 dias</option>
              </select>
            </div>
          </div>

          {/* Abono Pecuniario Logic & 13th */}
          <div className="space-y-3">
            {days === 30 && (
              <div className="bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg p-4 animate-fade-in transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Banknote className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Vender 10 dias (Abono)?</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">O colaborador descansa 20 dias e recebe 10 em dinheiro.</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={hasAbono}
                      onChange={() => setHasAbono(!hasAbono)}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:after:border-gray-600 peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>
            )}

            <div className="bg-emerald-50/50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-lg p-4 animate-fade-in transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/40 rounded text-emerald-600 dark:text-emerald-400">
                    <span className="text-xs font-bold">13º</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Adiantar 1ª Parcela do 13º?</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Pagar metade do décimo terceiro junto com as férias.</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={advance13th}
                    onChange={() => setAdvance13th(!advance13th)}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:after:border-gray-600 peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
            <button
              onClick={handleSave}
              disabled={!selectedEmpId || !startDate}
              className={`w-full text-white font-medium py-3 rounded-lg transition-colors shadow-sm flex justify-center items-center gap-2 ${editingVacation ? 'bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600' : 'bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:bg-slate-300 dark:disabled:bg-slate-700'}`}
            >
              <CheckCircle className="w-5 h-5" />
              {editingVacation ? 'Atualizar Férias' : 'Confirmar Agendamento'}
            </button>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="space-y-6">

        {/* Conflict Warning */}
        {conflicts.length > 0 && (
          <div className="rounded-xl border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 p-6 shadow-sm animate-fade-in transition-all">
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <Users className="w-5 h-5 text-yellow-600 dark:text-yellow-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-yellow-800 dark:text-yellow-400 mb-2">Conflito de Equipe Detectado</h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-2">
                  Existem outros colaboradores do mesmo departamento de férias neste período:
                </p>
                <ul className="list-disc list-inside text-xs text-yellow-800 dark:text-yellow-200 space-y-1">
                  {conflicts.map((c, idx) => (
                    <li key={idx}><strong>{c.name}</strong> ({formatDate(parseLocalDate(c.start))} até {formatDate(parseLocalDate(c.end))})</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Deadline Info Card */}
        {deadlineInfo ? (
          <div className={`rounded-xl border p-6 shadow-sm transition-all ${isCritical ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">Análise de Prazos (CLT)</h3>

            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <AlertTriangle className={`w-5 h-5 ${isCritical ? 'text-red-500 dark:text-red-400' : 'text-orange-500 dark:text-orange-400'}`} />
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Limite para gozo da 2ª férias (Risco de Dobra)</p>
                  <p className={`text-2xl font-bold ${isCritical ? 'text-red-700 dark:text-red-400' : 'text-slate-800 dark:text-white'}`}>
                    {formatDate(deadlineInfo.limitDate)}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Refere-se ao período aquisitivo de {formatDate(deadlineInfo.periodStart)} até {formatDate(deadlineInfo.periodEnd)}.
                  </p>
                </div>
              </div>

              {isCritical && (
                <div className="bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200 p-3 rounded-lg text-sm font-medium border border-red-200 dark:border-red-800 mt-2">
                  ⚠️ Atenção: A data de início selecionada ultrapassa ou está muito próxima do limite de vencimento. Risco de pagamento em dobro.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-8 flex flex-col items-center text-slate-400 dark:text-slate-500">
            <p>Selecione um colaborador para ver os prazos legais.</p>
          </div>
        )}

        {/* Calculation Result Card */}
        {startDate && returnDate && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-indigo-100 dark:border-slate-700 shadow-md p-6 overflow-hidden relative transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 dark:bg-indigo-900/20 rounded-full -mr-16 -mt-16 z-0 pointer-events-none opacity-50"></div>

            <h3 className="text-sm font-semibold uppercase tracking-wider text-indigo-500 dark:text-indigo-400 mb-6 relative z-10">Resumo do Gozo</h3>

            <div className="flex items-center justify-between relative z-10 mb-6">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                  {hasAbono ? 'Descanso (20 dias)' : 'Fim das Férias'}
                </p>
                <p className="text-lg font-medium text-slate-700 dark:text-slate-200">
                  {formatDate(addDays(parseLocalDate(startDate), (hasAbono ? 20 : days) - 1))}
                </p>
              </div>
              <ArrowRight className="text-indigo-300 dark:text-indigo-600 w-6 h-6 mx-2" />
              <div className="text-right">
                <p className="text-sm text-indigo-600 dark:text-indigo-400 font-bold mb-1">Volta ao trabalho</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {formatDate(returnDate)}
                </p>
              </div>
            </div>

            {hasAbono && (
              <div className="mb-6 relative z-10 bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-100 dark:border-green-800 flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-full text-green-600 dark:text-green-400">
                  <Banknote className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase">Configuração de Abono</p>
                  <p className="text-sm font-bold text-green-800 dark:text-green-200">
                    Venda de 1/3 (10 dias) confirmada.
                  </p>
                </div>
              </div>
            )}

            {noticeDeadline && (
              <div className="relative z-10 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-lg p-3 border border-indigo-100 dark:border-indigo-800 flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-full text-indigo-600 dark:text-indigo-400">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase">Data ideal para o Aviso de Férias</p>
                  <p className="text-base font-bold text-slate-800 dark:text-slate-100">
                    {formatDate(noticeDeadline)} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">(45 dias antes)</span>
                  </p>
                </div>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 relative z-10">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <CalendarIcon className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                <span>Configuração: <strong>{hasAbono ? '20 dias descanso + 10 abono' : `${days} dias corridos`}</strong></span>
              </div>
            </div>
          </div>
        )}
      </div>

      <ConflictModal
        isOpen={showConflictModal}
        conflictingNames={modalConflictNames}
        onConfirm={handleConfirmConflict}
        onCancel={handleCancelConflict}
      />
    </div>
  );
};

export default Calculator;