import React, { useState, useEffect } from 'react';
import { Employee, Vacation, Tab } from './types';
import Dashboard from './components/Dashboard';
import Employees from './components/Employees';
import Calculator from './components/Calculator';
import AIAdvisor from './components/AIAdvisor';
import { LayoutDashboard, Users, Calculator as CalcIcon, MessageSquareText, Moon, Sun } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.DASHBOARD);
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [editingVacation, setEditingVacation] = useState<Vacation | null>(null);
  
  // Dark Mode State
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved === 'true';
  });

  // Basic Persistence for Data
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('employees');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'João Silva', role: 'Desenvolvedor', department: 'TI', admissionDate: '2021-06-15', lastVacationEnd: '2023-07-20' },
      { id: '2', name: 'Maria Souza', role: 'Designer', department: 'Marketing', admissionDate: '2022-01-10', lastVacationEnd: '2024-02-15' },
      { id: '3', name: 'Carlos Oliveira', role: 'Analista', department: 'Financeiro', admissionDate: '2020-03-01', lastVacationEnd: '2023-04-10' }
    ];
  });

  const [vacations, setVacations] = useState<Vacation[]>(() => {
    const saved = localStorage.getItem('vacations');
    return saved ? JSON.parse(saved) : [];
  });

  // Effects
  useEffect(() => {
    localStorage.setItem('employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('vacations', JSON.stringify(vacations));
  }, [vacations]);

  // Dark Mode Effect
  useEffect(() => {
    localStorage.setItem('darkMode', darkMode.toString());
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleAddEmployee = (emp: Employee) => {
    setEmployees([...employees, emp]);
  };

  const handleRemoveEmployee = (id: string) => {
    setEmployees(employees.filter(e => e.id !== id));
  };

  const handleSaveVacation = (vacation: Vacation) => {
    setVacations([...vacations, vacation]);
    setActiveTab(Tab.DASHBOARD);
  };

  const handleUpdateVacation = (updatedVacation: Vacation) => {
    setVacations(vacations.map(v => v.id === updatedVacation.id ? updatedVacation : v));
    setEditingVacation(null);
    setActiveTab(Tab.DASHBOARD);
  };

  const handleCancelEdit = () => {
    setEditingVacation(null);
  };

  const handleCancelVacation = (id: string) => {
    if (window.confirm('Tem certeza que deseja cancelar estas férias?')) {
      setVacations(vacations.filter(v => v.id !== id));
    }
  };

  const handleNavigate = (tab: Tab) => {
    setActiveTab(tab);
    // If navigating away from calculator manually, clear edit mode
    if (tab !== Tab.CALCULATOR) {
      setEditingVacation(null);
    }
  };

  const handleAskAI = (prompt: string) => {
    setAiPrompt(prompt);
    setActiveTab(Tab.ADVISOR);
  };

  const handleEditVacation = (vacation: Vacation) => {
    setEditingVacation(vacation);
    setActiveTab(Tab.CALCULATOR);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col md:flex-row transition-colors duration-200">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex-shrink-0 transition-colors duration-200">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700">
           <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xl">
             <div className="w-8 h-8 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg flex items-center justify-center text-lg shadow-sm">F</div>
             <span>Férias Fácil</span>
           </div>
        </div>
        
        <nav className="p-4 space-y-2 flex-1">
          <button 
            onClick={() => handleNavigate(Tab.DASHBOARD)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === Tab.DASHBOARD ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </button>
          
          <button 
             onClick={() => handleNavigate(Tab.EMPLOYEES)}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === Tab.EMPLOYEES ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            <Users className="w-5 h-5" />
            Colaboradores
          </button>
          
          <button 
             onClick={() => handleNavigate(Tab.CALCULATOR)}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === Tab.CALCULATOR ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            <CalcIcon className="w-5 h-5" />
            Agendar/Calcular
          </button>
          
          <button 
             onClick={() => handleNavigate(Tab.ADVISOR)}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === Tab.ADVISOR ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            <MessageSquareText className="w-5 h-5" />
            Consultor IA
          </button>
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-700">
           <button 
             onClick={() => setDarkMode(!darkMode)}
             className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
           >
             <span className="text-sm font-medium">Modo Escuro</span>
             {darkMode ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-orange-500" />}
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <header className="mb-8">
           <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
             {activeTab === Tab.DASHBOARD && 'Visão Geral'}
             {activeTab === Tab.EMPLOYEES && 'Gerenciar Time'}
             {activeTab === Tab.CALCULATOR && 'Planejamento de Férias'}
             {activeTab === Tab.ADVISOR && 'Consultoria Jurídica (IA)'}
           </h1>
           <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
           </p>
        </header>

        <div className="max-w-6xl mx-auto h-[calc(100vh-12rem)]">
          {activeTab === Tab.DASHBOARD && (
            <Dashboard 
              employees={employees} 
              vacations={vacations} 
              onNavigate={handleNavigate}
              onAskAI={handleAskAI}
              onCancelVacation={handleCancelVacation}
              onEditVacation={handleEditVacation}
            />
          )}
          {activeTab === Tab.EMPLOYEES && (
            <Employees employees={employees} onAddEmployee={handleAddEmployee} onRemoveEmployee={handleRemoveEmployee} />
          )}
          {activeTab === Tab.CALCULATOR && (
            <Calculator 
              employees={employees} 
              vacations={vacations} 
              onSaveVacation={handleSaveVacation}
              editingVacation={editingVacation}
              onUpdateVacation={handleUpdateVacation}
              onCancelEdit={handleCancelEdit}
            />
          )}
          {activeTab === Tab.ADVISOR && (
            <AIAdvisor initialPrompt={aiPrompt} employees={employees} />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;