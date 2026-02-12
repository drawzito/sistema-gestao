import { useState, useEffect } from 'react';
import api, { getFileUrl } from '../api';
import { X } from 'lucide-react';

const FeedbackFormModal = ({ feedback, employeeId, employees, onClose, onSaved }) => {
    const isEdit = !!feedback;
    const [employeeList, setEmployeeList] = useState(employees || []);
    const [form, setForm] = useState({
        employee_id: employeeId || '',
        observation: '',
        type: '',
        status: 'Pendente',
        category: '',
        actions_taken: '',
        responsible: '',
        sector: ''
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(feedback?.image ? getFileUrl(feedback.image) : null);

    useEffect(() => {
        if (!employees || employees.length === 0) {
            api.get('/api/employees')
                .then(res => setEmployeeList(res.data))
                .catch(() => setError('Erro ao carregar colaboradores.'));
        }
    }, [employees]);

    useEffect(() => {
        if (feedback) {
            setForm({
                employee_id: feedback.employee_id,
                observation: feedback.observation || '',
                type: feedback.type || '',
                status: feedback.status || 'Pendente',
                category: feedback.category || '',
                actions_taken: feedback.actions_taken || '',
                responsible: feedback.responsible || '',
                sector: feedback.sector || ''
            });
        }
    }, [feedback]);

    const handleChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            if (!form.employee_id || !form.observation) {
                setError('Colaborador e Observação são obrigatórios.');
                setSaving(false);
                return;
            }

            let fbId = feedback?.id;
            if (isEdit) {
                await api.put(`/api/feedbacks/${feedback.id}`, form);
            } else {
                const res = await api.post('/api/feedbacks', form);
                fbId = res.data.id;
            }

            // Upload image if selected
            if (selectedFile) {
                const formData = new FormData();
                formData.append('photo', selectedFile);
                await api.post(`/api/feedbacks/${fbId}/photo`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            onSaved();
            onClose();
        } catch (err) {
            setError(err.response?.data?.error || 'Erro ao salvar feedback.');
        } finally {
            setSaving(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const inputClass = "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";
    const labelClass = "block text-xs font-semibold text-slate-500 mb-1";

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800">
                        {isEdit ? 'Editar Feedback' : 'Novo Feedback'}
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

                    {/* Colaborador (only show if not pre-set) */}
                    {!employeeId && (
                        <div>
                            <label className={labelClass}>Colaborador *</label>
                            <select
                                className={inputClass}
                                value={form.employee_id}
                                onChange={(e) => handleChange('employee_id', e.target.value)}
                                required
                            >
                                <option value="">Selecione...</option>
                                {employeeList.map(emp => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.name} {emp.sector ? `(${emp.sector})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Observação */}
                    <div>
                        <label className={labelClass}>Observação *</label>
                        <textarea
                            className={`${inputClass} min-h-[100px] resize-y`}
                            value={form.observation}
                            onChange={(e) => handleChange('observation', e.target.value)}
                            placeholder="Descreva a observação ou feedback..."
                            required
                        />
                    </div>

                    {/* Row: Tipo + Status */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Tipo</label>
                            <select
                                className={inputClass}
                                value={form.type}
                                onChange={(e) => handleChange('type', e.target.value)}
                            >
                                <option value="">Selecione...</option>
                                <option value="Elogio">Elogio</option>
                                <option value="Atenção">Atenção</option>
                                <option value="Advertência">Advertência</option>
                                <option value="Orientação">Orientação</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Status</label>
                            <select
                                className={inputClass}
                                value={form.status}
                                onChange={(e) => handleChange('status', e.target.value)}
                            >
                                <option value="Pendente">Pendente</option>
                                <option value="Em andamento">Em andamento</option>
                                <option value="Resolvido">Resolvido</option>
                            </select>
                        </div>
                    </div>

                    {/* Row: Categoria + Responsável */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Categoria</label>
                            <input
                                type="text"
                                className={inputClass}
                                value={form.category}
                                onChange={(e) => handleChange('category', e.target.value)}
                                placeholder="Ex: Comportamento, Resultado..."
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Responsável pelo Feedback</label>
                            <input
                                type="text"
                                className={inputClass}
                                value={form.responsible}
                                onChange={(e) => handleChange('responsible', e.target.value)}
                                placeholder="Nome do responsável"
                            />
                        </div>
                    </div>

                    {/* Ações Tomadas */}
                    <div>
                        <label className={labelClass}>Ações Tomadas</label>
                        <textarea
                            className={`${inputClass} min-h-[80px] resize-y`}
                            value={form.actions_taken}
                            onChange={(e) => handleChange('actions_taken', e.target.value)}
                            placeholder="Descreva as ações tomadas..."
                        />
                    </div>

                    {/* Imagem/Anexo */}
                    <div>
                        <label className={labelClass}>Imagem / Anexo</label>
                        <div className="flex items-center gap-4">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                            {previewUrl && (
                                <div className="h-12 w-12 rounded border border-slate-200 overflow-hidden flex-shrink-0">
                                    <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                                </div>
                            )}
                        </div>
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

export default FeedbackFormModal;
