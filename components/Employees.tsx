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
    if (!name || !role || !admissionDate) {
      alert('Preencha os campos obrigatórios!');
      return;
    }

    const empData: Employee = {
      id: editingId || crypto.randomUUID(),
      name,
      role,
      department,
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
    setName('');
    setRole('');
    setDepartment('Geral');
    setAdmissionDate('');
    setLastVacationEnd('');
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
    setEditingId(null);
    setName('');
    setRole('');
    setDepartment('Geral');
    setAdmissionDate('');
    setLastVacationEnd('');
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