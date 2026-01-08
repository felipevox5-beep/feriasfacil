import React, { useState, useEffect } from 'react';
import { Employee, Vacation, Tab } from './types';
import Dashboard from './components/Dashboard';
import Employees from './components/Employees';
import Calculator from './components/Calculator';
import AIAdvisor from './components/AIAdvisor';
import Login from './components/Login';
import UsersComponent from './components/Users';
import { LayoutDashboard, Users, Calculator as CalcIcon, MessageSquareText, Moon, Sun, LogOut, Lock, Menu, ChevronLeft } from 'lucide-react';

const App: React.FC = () => {
  // Auth State
  const [token, setToken] = useState<string | null>(localStorage.getItem('authToken'));
  const [username, setUsername] = useState<string>(localStorage.getItem('username') || '');
  const [role, setRole] = useState<string>(localStorage.getItem('userRole') || 'common');

  // App State
  const [activeTab, setActiveTab] = useState<Tab>(Tab.DASHBOARD);
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [editingVacation, setEditingVacation] = useState<Vacation | null>(null);

  // Dark Mode State
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved === 'true';
  });

  // Sidebar State
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [vacations, setVacations] = useState<Vacation[]>([]);

  // Authenticated Fetch Helper
  const authFetch = async (url: string, options: RequestInit = {}) => {
    if (!token) throw new Error('No token');

    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    const res = await fetch(url, { ...options, headers });

    if (res.status === 401 || res.status === 403) {
      handleLogout();
      throw new Error('Unauthorized');
    }

    return res;
  };

  // Fetch Data on Load
  useEffect(() => {
    if (token) {
      fetchEmployees();
      fetchVacations();
    }
  }, [token]);

  // Dark Mode Effect
  useEffect(() => {
    localStorage.setItem('darkMode', darkMode.toString());
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleLogin = (newToken: string, newUsername: string, newRole?: string) => {
    const userRole = newRole || 'common';
    localStorage.setItem('authToken', newToken);
    localStorage.setItem('username', newUsername);
    localStorage.setItem('userRole', userRole);
    setToken(newToken);
    setUsername(newUsername);
    setRole(userRole);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    localStorage.removeItem('userRole');
    setToken(null);
    setUsername('');
    setRole('common');
    setEmployees([]);
    setVacations([]);
  };

  const fetchEmployees = async () => {
    try {
      const res = await authFetch('/api/employees');
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error('Failed to fetch employees', error);
    }
  };

  const fetchVacations = async () => {
    try {
      const res = await authFetch('/api/vacations');
      if (res.ok) {
        const data = await res.json();
        setVacations(data);
      }
    } catch (error) {
      console.error('Failed to fetch vacations', error);
    }
  };

  const handleAddEmployee = async (emp: Employee) => {
    try {
      const res = await authFetch('/api/employees', {
        method: 'POST',
        body: JSON.stringify(emp),
      });
      if (res.ok) {
        const savedEmp = await res.json();
        setEmployees([...employees, savedEmp]);
      }
    } catch (error) {
      console.error('Error adding employee', error);
    }
  };

  const handleEditEmployee = async (updatedEmp: Employee) => {
    try {
      const res = await authFetch(`/api/employees/${updatedEmp.id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedEmp),
      });
      if (res.ok) {
        const savedEmp = await res.json();
        setEmployees(employees.map(e => e.id === savedEmp.id ? savedEmp : e));
      }
    } catch (error) {
      console.error('Error updating employee', error);
    }
  };

  const handleRemoveEmployee = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja remover este colaborador?')) return;
    try {
      const res = await authFetch(`/api/employees/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setEmployees(employees.filter(e => e.id !== id));
      }
    } catch (error) {
      console.error('Error removing employee', error);
    }
  };

  const handleSaveVacation = async (vacation: Vacation) => {
    try {
      const res = await authFetch('/api/vacations', {
        method: 'POST',
        body: JSON.stringify(vacation),
      });
      if (res.ok) {
        const savedVacation = await res.json();
        setVacations([...vacations, savedVacation]);
        setActiveTab(Tab.DASHBOARD);
      }
    } catch (error) {
      console.error('Error saving vacation', error);
    }
  };

  const handleUpdateVacation = async (updatedVacation: Vacation) => {
    try {
      const res = await authFetch(`/api/vacations/${updatedVacation.id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedVacation),
      });
      if (res.ok) {
        const savedVacation = await res.json();
        setVacations(vacations.map(v => v.id === savedVacation.id ? savedVacation : v));
        setEditingVacation(null);
        setActiveTab(Tab.DASHBOARD);
      }
    } catch (error) {
      console.error('Error updating vacation', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingVacation(null);
  };

  const handleCancelVacation = async (id: string) => {
    if (window.confirm('Tem certeza que deseja cancelar estas férias?')) {
      try {
        const res = await authFetch(`/api/vacations/${id}`, { method: 'DELETE' });
        if (res.ok) {
          setVacations(vacations.filter(v => v.id !== id));
        }
      } catch (error) {
        console.error('Error deleting vacation', error);
      }
    }
  };

  const handleNavigate = (tab: Tab) => {
    setActiveTab(tab);
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

  // Render Login if not authenticated
  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col md:flex-row transition-colors duration-200">
      {/* Sidebar Navigation */}
      <aside className={`bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex-shrink-0 transition-all duration-300 flex flex-col ${sidebarOpen ? 'w-full md:w-64' : 'w-full md:w-20'}`}>
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xl overflow-hidden whitespace-nowrap">
            <div className="w-8 h-8 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg flex items-center justify-center text-lg shadow-sm flex-shrink-0">F</div>
            {sidebarOpen && <span className="transition-opacity duration-300">Férias Fácil</span>}
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hidden md:block">
            {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <nav className="p-2 space-y-2 flex-1 overflow-y-auto">
          <button
            onClick={() => handleNavigate(Tab.DASHBOARD)}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all font-medium whitespace-nowrap overflow-hidden ${activeTab === Tab.DASHBOARD ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200'}`}
            title="Dashboard"
          >
            <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Dashboard</span>}
          </button>

          <button
            onClick={() => handleNavigate(Tab.EMPLOYEES)}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all font-medium whitespace-nowrap overflow-hidden ${activeTab === Tab.EMPLOYEES ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200'}`}
            title="Colaboradores"
          >
            <Users className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Colaboradores</span>}
          </button>

          <button
            onClick={() => handleNavigate(Tab.CALCULATOR)}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all font-medium whitespace-nowrap overflow-hidden ${activeTab === Tab.CALCULATOR ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200'}`}
            title="Agendar/Calcular"
          >
            <CalcIcon className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Agendar/Calcular</span>}
          </button>

          <button
            onClick={() => handleNavigate(Tab.ADVISOR)}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all font-medium whitespace-nowrap overflow-hidden ${activeTab === Tab.ADVISOR ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200'}`}
            title="Consultor IA"
          >
            <MessageSquareText className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Consultor IA</span>}
          </button>

          {role === 'master' && (
            <button
              onClick={() => handleNavigate(Tab.USERS)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all font-medium whitespace-nowrap overflow-hidden ${activeTab === Tab.USERS ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200'}`}
              title="Usuários"
            >
              <Lock className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span>Usuários</span>}
            </button>
          )}
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-700 space-y-2">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors whitespace-nowrap overflow-hidden"
            title="Modo Escuro"
          >
            {darkMode ? <Moon className="w-5 h-5 flex-shrink-0 text-indigo-400" /> : <Sun className="w-5 h-5 flex-shrink-0 text-orange-500" />}
            {sidebarOpen && <span className="text-sm font-medium">Modo Escuro</span>}
          </button>

          <div className={`flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 overflow-hidden ${!sidebarOpen && 'justify-center'}`}>
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold flex-shrink-0">
              {username.charAt(0).toUpperCase()}
            </div>
            {sidebarOpen && (
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{username}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate capitalize">{role === 'master' ? 'Administrador' : 'Comum'}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
              {activeTab === Tab.DASHBOARD && 'Visão Geral'}
              {activeTab === Tab.EMPLOYEES && 'Gerenciar Time'}
              {activeTab === Tab.CALCULATOR && 'Planejamento de Férias'}
              {activeTab === Tab.ADVISOR && 'Consultoria Jurídica (IA)'}
              {activeTab === Tab.USERS && 'Gerenciamento de Usuários'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors font-medium text-sm"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
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
              onUpdateVacation={handleUpdateVacation}
            />
          )}
          {activeTab === Tab.EMPLOYEES && (
            <Employees
              employees={employees}
              onAddEmployee={handleAddEmployee}
              onRemoveEmployee={handleRemoveEmployee}
              onEditEmployee={handleEditEmployee}
            />
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
          {activeTab === Tab.USERS && role === 'master' && (
            <UsersComponent token={token} />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;