import React, { useState } from 'react';
import { Employee } from '../types';
import { Plus, Trash2, User, Calendar, Briefcase, Download, Clock, Pencil, UserPlus, Search } from 'lucide-react';
import { formatDate } from '../utils/dateUtils';

interface EmployeesProps {
  employees: Employee[];
  onAddEmployee: (emp: Employee) => void;
  onRemoveEmployee: (id: string) => void;
  onEditEmployee?: (emp: Employee) => void;
  userRole?: string;
}

const Employees: React.FC<EmployeesProps> = ({ employees, onAddEmployee, onRemoveEmployee, onEditEmployee, userRole }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState('Geral');
  const [admissionDate, setAdmissionDate] = useState('');
  const [lastVacationEnd, setLastVacationEnd] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!name || !role || !admissionDate) {
      alert("Por favor, preencha os campos obrigatórios (Nome, Cargo, Admissão).");
      return;
    }

    const admission = new Date(admissionDate + 'T12:00:00');

    // Optional Logic Validation: Admission Date vs Last Vacation
    if (lastVacationEnd) {
      const lastVacation = new Date(lastVacationEnd + 'T12:00:00');
      if (lastVacation <= admission) {
        alert("Erro: A Data de Fim das Últimas Férias deve ser posterior à Data de Admissão.");
        return;
      }
    }

    const empData: Employee = {
      id: editingId || crypto.randomUUID(),
      name,
      role,
      department: department || 'Geral',
      admissionDate,
      lastVacationEnd: lastVacationEnd || undefined
    };

    if (editingId && onEditEmployee) {
      onEditEmployee(empData);
      setEditingId(null);
    } else {
      onAddEmployee(empData);
    }

    // Reset Form
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setRole('');
    setDepartment('Geral');
    setAdmissionDate('');
    setLastVacationEnd('');
    setEditingId(null);
  };

  const handleEditClick = (emp: Employee) => {
    setEditingId(emp.id);
    setName(emp.name);
    setRole(emp.role);
    setDepartment(emp.department);
    setAdmissionDate(emp.admissionDate);
    setLastVacationEnd(emp.lastVacationEnd || '');
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    resetForm();
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

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Form Section */}
      <div className="lg:col-span-1">
        <div className={`bg-white dark:bg-slate-800 p-6 rounded-xl border shadow-sm transition-all ${editingId ? 'border-orange-200 dark:border-orange-800 ring-2 ring-orange-100 dark:ring-orange-900/20' : 'border-slate-200 dark:border-slate-700'}`}>
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-2 rounded-lg ${editingId ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400' : 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'}`}>
              {editingId ? <Pencil className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />}
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
              {editingId ? 'Editar Colaborador' : 'Novo Colaborador'}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome Completo</label>
              <input
                type="text"
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none dark:bg-slate-900 dark:text-white"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: João da Silva"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cargo</label>
                <input
                  type="text"
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none dark:bg-slate-900 dark:text-white"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  placeholder="Ex: Desenvolvedor"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Departamento</label>
                <select
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none dark:bg-slate-900 dark:text-white"
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                >
                  <option value="Geral">Geral</option>
                  <option value="TI">TI</option>
                  <option value="RH">RH</option>
                  <option value="Comercial">Comercial</option>
                  <option value="Financeiro">Financeiro</option>
                  <option value="Operações">Operações</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data de Admissão</label>
              <input
                type="date"
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none dark:bg-slate-900 dark:text-white"
                value={admissionDate}
                onChange={e => setAdmissionDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Fim das Últimas Férias <span className="text-slate-400 font-normal">(Opcional)</span>
              </label>
              <input
                type="date"
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none dark:bg-slate-900 dark:text-white"
                value={lastVacationEnd}
                onChange={e => setLastVacationEnd(e.target.value)}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Deixe em branco se for a primeira vez.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium text-white transition-colors ${editingId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
              >
                {editingId ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {editingId ? 'Salvar Alterações' : 'Cadastrar'}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* List Section */}
      <div className="lg:col-span-2">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col h-full">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center gap-4 flex-wrap">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-500" />
              Colaboradores ({employees.length})
            </h2>

            <div className="flex gap-2 flex-1 justify-end">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 w-full md:w-48"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                title="Exportar CSV"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Exportar</span>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4 custom-scrollbar">
            {filteredEmployees.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <User className="w-12 h-12 mb-3 opacity-20" />
                <p>Nenhum colaborador encontrado.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredEmployees.map(emp => (
                  <div key={emp.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold">
                        {emp.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-800 dark:text-white text-sm">{emp.name}</h3>
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> {emp.role}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                          <span>{emp.department}</span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1 flex flex-wrap gap-x-3">
                          <span>Admissão: <span className="font-medium text-slate-600 dark:text-slate-300">{formatDate(new Date(emp.admissionDate + 'T12:00:00'))}</span></span>
                          {emp.lastVacationEnd && (
                            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                              <Clock className="w-3 h-3" />
                              Últimas: {formatDate(new Date(emp.lastVacationEnd + 'T12:00:00'))}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEditEmployee && onEditEmployee(emp)}
                        className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                      {userRole === 'master' && (
                        <button
                          onClick={() => onRemoveEmployee(emp.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Remover"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Employees;