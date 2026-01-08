import React, { useState, useEffect } from 'react';
import { User, Trash2, UserPlus, Shield, ShieldCheck, ShieldAlert } from 'lucide-react';
import { User as UserType } from '../types';

interface UsersProps {
    token: string;
}

const Users: React.FC<UsersProps> = ({ token }) => {
    const [users, setUsers] = useState<UserType[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // New User Form State
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newRole, setNewRole] = useState<'master' | 'common'>('common');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, [token]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            } else {
                setError('Falha ao carregar usuários.');
            }
        } catch (err) {
            setError('Erro de conexão.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        setError('');

        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username: newUsername, password: newPassword, role: newRole })
            });

            if (res.ok) {
                const newUser = await res.json();
                setUsers([...users, newUser]);
                setNewUsername('');
                setNewPassword('');
                setNewRole('common');
                alert('Usuário criado com sucesso!');
            } else {
                const err = await res.json();
                setError(err.error || 'Erro ao criar usuário.');
            }
        } catch (err) {
            setError('Erro ao criar usuário.');
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteUser = async (id: string, username: string) => {
        if (!window.confirm(`Tem certeza que deseja remover o usuário "${username}"?`)) return;

        try {
            const res = await fetch(`/api/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                setUsers(users.filter(u => u.id !== id));
            } else {
                const err = await res.json();
                alert(err.error || 'Erro ao remover usuário.');
            }
        } catch (err) {
            alert('Erro ao remover usuário.');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                        <UserPlus className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Gerenciar Usuários</h2>
                        <p className="text-slate-500 dark:text-slate-400">Crie novos logins e gerencie permissões</p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5" />
                    {error}
                </div>
            )}

            {/* Create User Form */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Novo Usuário</h3>
                <form onSubmit={handleCreateUser} className="grid gap-4 md:grid-cols-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Usuário</label>
                        <input
                            type="text"
                            value={newUsername}
                            onChange={(e) => setNewUsername(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none dark:text-white"
                            placeholder="Ex: joao.silva"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Senha</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none dark:text-white"
                            placeholder="********"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Perfil de Acesso</label>
                        <select
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value as 'master' | 'common')}
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none dark:text-white cursor-pointer"
                        >
                            <option value="common">Comum (Visualizar/Criar)</option>
                            <option value="master">Master (Acesso Total)</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={creating}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-lg shadow-purple-200 dark:shadow-none flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                        {creating ? 'Criando...' : (
                            <>
                                <UserPlus className="w-5 h-5" />
                                Adicionar
                            </>
                        )}
                    </button>
                </form>
            </div>

            {/* Users List */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 dark:text-white">Usuários Cadastrados</h3>
                    <span className="text-xs font-mono bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-500 dark:text-slate-400">Total: {users.length}</span>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-slate-500">Carregando usuários...</div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-700">
                        {users.map((user) => (
                            <div key={user.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-full ${user.role === 'master' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'}`}>
                                        {user.role === 'master' ? <ShieldCheck className="w-5 h-5" /> : <User className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-800 dark:text-white">{user.username}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${user.role === 'master'
                                                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                                                    : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                                                }`}>
                                                {user.role === 'master' ? 'Master' : 'Comum'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleDeleteUser(user.id, user.username)}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    title="Remover Usuário"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))}

                        {users.length === 0 && !loading && (
                            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                                Nenhum usuário encontrado (além de você).
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Users;
