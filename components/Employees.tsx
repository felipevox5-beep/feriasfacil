import React, { useState } from 'react';
import { Employee, Department } from '../types';
import { Plus, Trash2, User, Briefcase, Download, Clock, Pencil, UserPlus, Search, X, Settings, Building2 } from 'lucide-react';
import { formatDate } from '../utils/dateUtils';

interface EmployeesProps {
  employees: Employee[];
  departments: Department[];
  onAddEmployee: (emp: Employee) => void;
  onRemoveEmployee: (id: string) => void;
  onEditEmployee?: (emp: Employee) => void;
  onAddDepartment: (name: string) => void;
  onRemoveDepartment: (id: string) => void;
  userRole?: string;
}

const Employees: React.FC<EmployeesProps> = ({
  employees,
  departments,
  onAddEmployee,
  onRemoveEmployee,
  onEditEmployee,
  onAddDepartment,
  onRemoveDepartment,
  userRole
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');

  // Delete Modal State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState<string>('');

  // Form State
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState('');
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
      department: department || (departments.length > 0 ? departments[0].name : 'Geral'),
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
    setIsModalOpen(false);
  };

  const resetForm = () => {
    setName('');
    setRole('');
    setDepartment(departments.length > 0 ? departments[0].name : '');
    setAdmissionDate('');
    setLastVacationEnd('');
    setEditingId(null);
    setIsModalOpen(false);
  };

  const handleEditClick = (emp: Employee) => {
    setEditingId(emp.id);
    setName(emp.name);
    setRole(emp.role);
    setDepartment(emp.department);
    setAdmissionDate(emp.admissionDate);
    setLastVacationEnd(emp.lastVacationEnd || '');
    setIsModalOpen(true);
  };

  const handleAddNewClick = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleCancelEdit = () => {
    resetForm();
  };

  const confirmDelete = (id: string, empName: string) => {
    setDeleteId(id);
    setDeleteName(empName);
  };

  const handleDelete = () => {
    if (deleteId) {
      onRemoveEmployee(deleteId);
      setDeleteId(null);
      setDeleteName('');
    }
  };

  const handleAddDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    onAddDepartment(newDeptName);
    setNewDeptName('');
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mb-4 text-red-600 dark:text-red-400">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Excluir Colaborador?</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                Tem certeza que deseja remover <strong>{deleteName}</strong>? Essa ação não pode ser desfeita.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setDeleteId(null)}
                  className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-200 dark:shadow-none transition-colors"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Department Management Modal */}
      {isDeptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-lg">
                  <Settings className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">Gerenciar Departamentos</h3>
              </div>
              <button onClick={() => setIsDeptModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddDept} className="flex gap-2 mb-6">
              <input
                type="text"
                placeholder="Novo Departamento..."
                className="flex-1 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500 dark:bg-slate-900 dark:text-white"
                value={newDeptName}
                onChange={e => setNewDeptName(e.target.value)}
              />
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold shadow-lg shadow-purple-200 dark:shadow-none transition-colors"
                disabled={!newDeptName.trim()}
              >
                <Plus className="w-5 h-5" />
              </button>
            </form>

            <div className="flex-1 overflow-y-auto custom-scrollbar -mr-2 pr-2">
              {departments.length === 0 ? (
                <p className="text-center text-slate-400 py-4">Nenhum departamento cadastrado.</p>
              ) : (
                <div className="space-y-2">
                  {departments.map(dept => (
                    <div key={dept.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-100 dark:border-slate-700">
                      <div className="flex items-center gap-3">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        <span className="font-medium text-slate-700 dark:text-slate-300">{dept.name}</span>
                      </div>
                      {userRole === 'master' && (
                        <button
                          onClick={() => onRemoveDepartment(dept.id)}
                          className="text-slate-400 hover:text-red-500 transition-colors p-1"
                          title="Remover departamento"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700 flex flex-col">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${editingId ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400' : 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'}`}>
                  {editingId ? <Pencil className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                </div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                  {editingId ? 'Editar Colaborador' : 'Novo Colaborador'}
                </h2>
              </div>
              <button onClick={handleCancelEdit} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
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
                      <option value="" disabled>Selecione...</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.name}>{dept.name}</option>
                      ))}
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

                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-bold text-white transition-colors shadow-lg ${editingId ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-200 dark:shadow-none' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 dark:shadow-none'}`}
                  >
                    {editingId ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {editingId ? 'Salvar Alterações' : 'Cadastrar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* List Section - Full Width */}
      <div className="col-span-1 lg:col-span-3">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col h-full">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center gap-4 flex-wrap">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-500" />
              Colaboradores ({employees.length})
            </h2>

            <div className="flex gap-2 flex-1 justify-end">
              {userRole === 'master' && (
                <button
                  onClick={() => setIsDeptModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors font-medium text-sm"
                  title="Gerenciar Departamentos"
                >
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Departamentos</span>
                </button>
              )}

              <button
                onClick={handleAddNewClick}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Novo Colaborador</span>
              </button>

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
                        onClick={() => handleEditClick(emp)}
                        className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                      {userRole === 'master' && (
                        <button
                          onClick={() => confirmDelete(emp.id, emp.name)}
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