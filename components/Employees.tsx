import React, { useState } from 'react';
import { Employee } from '../types';
import { Plus, Trash2, User, Calendar, Briefcase, Download, Clock } from 'lucide-react';
import { formatDate } from '../utils/dateUtils';

interface EmployeesProps {
  employees: Employee[];
  onAddEmployee: (emp: Employee) => void;
  onRemoveEmployee: (id: string) => void;
}

const Employees: React.FC<EmployeesProps> = ({ employees, onAddEmployee, onRemoveEmployee }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newEmp, setNewEmp] = useState<Partial<Employee>>({
    name: '',
    role: '',
    department: '',
    admissionDate: '',
    lastVacationEnd: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation (Name, Admission, Role are always required)
    if (!newEmp.name || !newEmp.admissionDate || !newEmp.role) {
       alert("Por favor, preencha os campos obrigatórios (Nome, Cargo, Admissão).");
       return;
    }

    const admission = new Date(newEmp.admissionDate + 'T12:00:00');
    
    // Optional Logic Validation: Admission Date vs Last Vacation
    // Only validate if lastVacationEnd is provided
    if (newEmp.lastVacationEnd) {
      const lastVacation = new Date(newEmp.lastVacationEnd + 'T12:00:00');

      if (lastVacation <= admission) {
        alert("Erro: A Data de Fim das Últimas Férias deve ser posterior à Data de Admissão.");
        return;
      }
    }

    onAddEmployee({
      id: crypto.randomUUID(),
      name: newEmp.name,
      role: newEmp.role,
      department: newEmp.department || 'Geral',
      admissionDate: newEmp.admissionDate,
      lastVacationEnd: newEmp.lastVacationEnd || undefined // Ensure it's undefined if empty string
    } as Employee);
    
    setNewEmp({ name: '', role: '', department: '', admissionDate: '', lastVacationEnd: '' });
    setIsAdding(false);
  };

  const handleExportCSV = () => {
    if (employees.length === 0) return;
    
    // Create CSV content
    const headers = ['ID', 'Nome', 'Cargo', 'Departamento', 'Data de Admissão', 'Fim Últimas Férias'];
    const rows = employees.map(e => [
      e.id,
      e.name,
      e.role,
      e.department,
      e.admissionDate,
      e.lastVacationEnd || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `colaboradores_ferias_facil.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Colaboradores</h2>
          <p className="text-slate-500 dark:text-slate-400">Gerencie seu time e datas de admissão</p>
        </div>
        
        <div className="flex gap-2">
           <button
             onClick={handleExportCSV}
             className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium text-sm"
             title="Exportar lista para CSV"
           >
             <Download className="w-4 h-4" />
             Exportar
           </button>
           <button
            onClick={() => setIsAdding(!isAdding)}
            className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm text-sm"
           >
            <Plus className="w-4 h-4" />
            {isAdding ? 'Cancelar' : 'Novo Colaborador'}
           </button>
        </div>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-indigo-100 dark:border-slate-700 shadow-sm animate-fade-in-down transition-colors">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome Completo <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent outline-none dark:bg-slate-900 dark:text-white"
                value={newEmp.name}
                onChange={e => setNewEmp({ ...newEmp, name: e.target.value })}
                placeholder="Ex: Ana Silva"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cargo <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent outline-none dark:bg-slate-900 dark:text-white"
                value={newEmp.role}
                onChange={e => setNewEmp({ ...newEmp, role: e.target.value })}
                placeholder="Ex: Desenvolvedor Senior"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Departamento</label>
              <input
                type="text"
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent outline-none dark:bg-slate-900 dark:text-white"
                value={newEmp.department}
                onChange={e => setNewEmp({ ...newEmp, department: e.target.value })}
                placeholder="Ex: TI"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data de Admissão <span className="text-red-500">*</span></label>
              <input
                type="date"
                required
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent outline-none dark:bg-slate-900 dark:text-white dark:[color-scheme:dark]"
                value={newEmp.admissionDate}
                onChange={e => setNewEmp({ ...newEmp, admissionDate: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
                 Fim da Última Férias
              </label>
              <input
                type="date"
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent outline-none dark:bg-slate-900 dark:text-white dark:[color-scheme:dark]"
                value={newEmp.lastVacationEnd}
                onChange={e => setNewEmp({ ...newEmp, lastVacationEnd: e.target.value })}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Preencha apenas se o colaborador já tiver gozado férias anteriormente. Caso contrário, deixe em branco.
              </p>
            </div>
          </div>
          <div className="flex justify-end">
             <button type="submit" className="bg-indigo-600 dark:bg-indigo-500 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 font-medium">Salvar</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {employees.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
            <User className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>Nenhum colaborador cadastrado.</p>
          </div>
        ) : (
          employees.map(emp => (
            <div key={emp.id} className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow group relative">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-sm border border-slate-200 dark:border-slate-600">
                    {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-white">{emp.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{emp.role}</p>
                  </div>
                </div>
                <button 
                  onClick={() => onRemoveEmployee(emp.id)}
                  className="text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1"
                  title="Remover"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <span>{emp.department}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <span>Admissão: <span className="font-medium text-slate-800 dark:text-slate-300">{formatDate(new Date(emp.admissionDate + 'T12:00:00'))}</span></span>
                </div>
                {emp.lastVacationEnd && (
                   <div className="flex items-center gap-2 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded -ml-2 w-fit">
                     <Clock className="w-4 h-4" />
                     <span className="text-xs">Última Férias: <strong>{formatDate(new Date(emp.lastVacationEnd + 'T12:00:00'))}</strong></span>
                   </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Employees;