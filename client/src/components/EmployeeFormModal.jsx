import { useState, useEffect } from 'react';
import api from '../api';
import { X } from 'lucide-react';

const EmployeeFormModal = ({ employee, onClose, onSaved }) => {
    const isEdit = !!employee;
    const [form, setForm] = useState({
        name: '',
        sector: '',
        active: 1
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (employee) {
            setForm({
                name: employee.name || '',
                sector: employee.sector || '',
                active: employee.active === undefined ? 1 : employee.active
            });
        }
    }, [employee]);

    const handleChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            if (!form.name.trim()) {
                setError('O nome é obrigatório.');
                setSaving(false);
                return;
            }

            if (isEdit) {
                await api.put(`/api/employees/${employee.id}`, form);
            } else {
                await api.post('/api/employees', form);
            }

            onSaved();
            onClose();
        } catch (err) {
            setError(err.response?.data?.error || 'Erro ao salvar colaborador.');
        } finally {
            setSaving(false);
        }
    };

    const inputClass = "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";
    const labelClass = "block text-xs font-semibold text-slate-500 mb-1";

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800">
                        {isEdit ? 'Editar Colaborador' : 'Novo Colaborador'}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}

                    {/* Nome */}
                    <div>
                        <label className={labelClass}>Nome Completo *</label>
                        <input
                            type="text"
                            className={inputClass}
                            value={form.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            placeholder="Ex: João Silva"
                            required
                        />
                    </div>

                    {/* Setor */}
                    <div>
                        <label className={labelClass}>Setor</label>
                        <input
                            type="text"
                            className={inputClass}
                            value={form.sector}
                            onChange={(e) => handleChange('sector', e.target.value)}
                            placeholder="Ex: Financeiro"
                        />
                    </div>

                    {/* Status (only in Edit) */}
                    <div>
                        <label className={labelClass}>Status</label>
                        <select
                            className={inputClass}
                            value={form.active}
                            onChange={(e) => handleChange('active', parseInt(e.target.value))}
                        >
                            <option value={1}>Ativo</option>
                            <option value={0}>Inativo</option>
                        </select>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {saving ? 'Salvando...' : (isEdit ? 'Atualizar' : 'Salvar')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EmployeeFormModal;
