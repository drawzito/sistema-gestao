import { useState, useEffect } from 'react';
import api from '../api';
import { X } from 'lucide-react';

const MetricFormModal = ({ metric, onClose, onSaved }) => {
    const isEdit = !!metric;
    const [employees, setEmployees] = useState([]);
    const [form, setForm] = useState({
        employee_id: '',
        month_year: '',
        tickets_assumed: 0,
        tickets_transferred: 0,
        tickets_finished: 0,
        grade_1: 0,
        grade_2: 0,
        grade_3: 0,
        total_grade: 0,
        score: 0,
        goal_text: ''
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const res = await api.get('/api/employees');
                setEmployees(res.data.filter(e => e.active));
            } catch (err) {
                console.error('Failed to fetch employees:', err);
            }
        };
        fetchEmployees();
    }, []);

    useEffect(() => {
        if (metric) {
            setForm({
                employee_id: metric.employee_id || '',
                month_year: metric.month_year || '',
                tickets_assumed: metric.tickets_assumed || 0,
                tickets_transferred: metric.tickets_transferred || 0,
                tickets_finished: metric.tickets_finished || 0,
                grade_1: metric.grade_1 || 0,
                grade_2: metric.grade_2 || 0,
                grade_3: metric.grade_3 || 0,
                total_grade: metric.total_grade || 0,
                score: metric.score || 0,
                goal_text: metric.goal_text || ''
            });
        }
    }, [metric]);

    const handleChange = (field, value) => {
        setForm(prev => {
            const newForm = { ...prev, [field]: value };

            // Auto-calculate total and score if notes are changed
            if (['grade_1', 'grade_2', 'grade_3', 'tickets_finished'].includes(field)) {
                const g1 = Number(field === 'grade_1' ? value : newForm.grade_1) || 0;
                const g2 = Number(field === 'grade_2' ? value : newForm.grade_2) || 0;
                const g3 = Number(field === 'grade_3' ? value : newForm.grade_3) || 0;
                const tf = Number(field === 'tickets_finished' ? value : newForm.tickets_finished) || 0;

                newForm.total_grade = g1 + g2 + g3;
                // Simple score calculation logic (can be adjusted)
                if (tf > 0) {
                    newForm.score = (newForm.total_grade / (tf * 3)) * 5; // Example logic
                    if (newForm.score > 5) newForm.score = 5;
                }
            }

            return newForm;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            if (!form.employee_id || !form.month_year) {
                setError('Colaborador e Mês/Ano são obrigatórios.');
                setSaving(false);
                return;
            }

            if (isEdit) {
                await api.put(`/api/metrics/${metric.id}`, form);
            } else {
                await api.post('/api/metrics', form);
            }

            onSaved();
            onClose();
        } catch (err) {
            setError(err.response?.data?.error || 'Erro ao salvar métrica.');
        } finally {
            setSaving(false);
        }
    };

    const inputClass = "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white";
    const labelClass = "block text-xs font-semibold text-slate-500 mb-1";

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800">
                        {isEdit ? 'Editar Métrica' : 'Nova Métrica'}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[80vh]">
                    {error && (
                        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg border border-red-100 mb-6">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Colaborador */}
                        <div className="md:col-span-1">
                            <label className={labelClass}>Colaborador *</label>
                            <select
                                className={inputClass}
                                value={form.employee_id}
                                onChange={(e) => handleChange('employee_id', e.target.value)}
                                required
                                disabled={isEdit}
                            >
                                <option value="">Selecione...</option>
                                {employees.map(e => (
                                    <option key={e.id} value={e.id}>{e.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Mês/Ano */}
                        <div className="md:col-span-1">
                            <label className={labelClass}>Mês/Ano * (Ex: 02/2026)</label>
                            <input
                                type="text"
                                className={inputClass}
                                value={form.month_year}
                                onChange={(e) => handleChange('month_year', e.target.value)}
                                placeholder="MM/AAAA"
                                required
                            />
                        </div>

                        {/* Tickets */}
                        <div className="grid grid-cols-3 gap-4 md:col-span-2">
                            <div>
                                <label className={labelClass}>Assumidos</label>
                                <input
                                    type="number"
                                    className={inputClass}
                                    value={form.tickets_assumed}
                                    onChange={(e) => handleChange('tickets_assumed', parseInt(e.target.value) || 0)}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Transferidos</label>
                                <input
                                    type="number"
                                    className={inputClass}
                                    value={form.tickets_transferred}
                                    onChange={(e) => handleChange('tickets_transferred', parseInt(e.target.value) || 0)}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Finalizados</label>
                                <input
                                    type="number"
                                    className={inputClass}
                                    value={form.tickets_finished}
                                    onChange={(e) => handleChange('tickets_finished', parseInt(e.target.value) || 0)}
                                />
                            </div>
                        </div>

                        {/* Notas */}
                        <div className="grid grid-cols-3 gap-4 md:col-span-2">
                            <div>
                                <label className={labelClass}>Nota 1</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    className={inputClass}
                                    value={form.grade_1}
                                    onChange={(e) => handleChange('grade_1', parseFloat(e.target.value) || 0)}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Nota 2</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    className={inputClass}
                                    value={form.grade_2}
                                    onChange={(e) => handleChange('grade_2', parseFloat(e.target.value) || 0)}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Nota 3</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    className={inputClass}
                                    value={form.grade_3}
                                    onChange={(e) => handleChange('grade_3', parseFloat(e.target.value) || 0)}
                                />
                            </div>
                        </div>

                        {/* Resultados Auto-calculados */}
                        <div>
                            <label className={labelClass}>Total de Notas</label>
                            <input
                                type="number"
                                className={`${inputClass} bg-slate-50 font-bold`}
                                value={form.total_grade}
                                readOnly
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Score Final (0-5)</label>
                            <input
                                type="number"
                                step="0.01"
                                className={`${inputClass} bg-slate-50 font-bold`}
                                value={form.score}
                                onChange={(e) => handleChange('score', parseFloat(e.target.value) || 0)}
                            />
                        </div>

                        {/* Objetivo */}
                        <div className="md:col-span-2">
                            <label className={labelClass}>Objetivo / Observação</label>
                            <textarea
                                className={`${inputClass} h-24`}
                                value={form.goal_text}
                                onChange={(e) => handleChange('goal_text', e.target.value)}
                                placeholder="Descreva o objetivo para o próximo mês..."
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-100">
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
                            className="px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {saving ? 'Salvando...' : (isEdit ? 'Atualizar' : 'Salvar')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MetricFormModal;
