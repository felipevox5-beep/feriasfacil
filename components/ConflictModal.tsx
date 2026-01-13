import React from 'react';
import { AlertTriangle, X, Check, CalendarX } from 'lucide-react';

interface ConflictModalProps {
    isOpen: boolean;
    conflictingNames: string[];
    onConfirm: () => void;
    onCancel: () => void;
}

const ConflictModal: React.FC<ConflictModalProps> = ({ isOpen, conflictingNames, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
                onClick={onCancel}
            />

            {/* Modal Card */}
            <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200 scale-100">

                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mb-4 ring-8 ring-yellow-50 dark:ring-yellow-900/10">
                        <AlertTriangle className="w-8 h-8 text-yellow-600 dark:text-yellow-500" />
                    </div>

                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Conflito de Férias Detectado!</h3>

                    <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
                        As datas selecionadas coincidem com as férias de outros colaboradores do mesmo departamento:
                    </p>

                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 w-full mb-6 border border-slate-100 dark:border-slate-700">
                        <ul className="space-y-2">
                            {conflictingNames.map((name, idx) => (
                                <li key={idx} className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 flex-shrink-0" />
                                    {name}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="flex gap-3 w-full">
                        <button
                            onClick={onCancel}
                            className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <CalendarX className="w-4 h-4" />
                            Trocar Data
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20"
                        >
                            <Check className="w-4 h-4" />
                            Manter Assim
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConflictModal;
