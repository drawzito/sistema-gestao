import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { User, ArrowLeft, Star, MessageSquare, AlertCircle, CheckCircle, Plus, Download, Pencil, Trash2 } from 'lucide-react';
import FeedbackFormModal from './FeedbackFormModal';
import EmployeeFormModal from './EmployeeFormModal';

const EmployeeDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [showEmployeeModal, setShowEmployeeModal] = useState(false);
    const [editingFeedback, setEditingFeedback] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [monthFilter, setMonthFilter] = useState('');

    const fetchEmployee = async () => {
        try {
            const res = await axios.get(`/api/employees/${id}`);
            setEmployee(res.data);
        } catch (error) {
            console.error('Failed to fetch employee details:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployee();
    }, [id]);

    const handleAddFeedback = () => {
        setEditingFeedback(null);
        setShowFeedbackModal(true);
    };

    const handleEditFeedback = (fb) => {
        setEditingFeedback(fb);
        setShowFeedbackModal(true);
    };

    const handleDeleteFeedback = async (fbId) => {
        if (!window.confirm('Tem certeza que deseja excluir este feedback?')) return;
        try {
            await axios.delete(`/api/feedbacks/${fbId}`);
            fetchEmployee();
        } catch (error) {
            alert('Erro ao excluir feedback.');
        }
    };

    const handleDownloadReport = () => {
        window.open(`/api/employees/${id}/report`, '_blank');
    };

    const handleFeedbackSaved = () => {
        fetchEmployee();
    };

    const handleEditEmployee = () => {
        setShowEmployeeModal(true);
    };

    const handleDeleteEmployee = async () => {
        if (!window.confirm('Tem certeza que deseja excluir este colaborador? Todas as métricas e feedbacks associados serão apagados permanentemente.')) return;
        try {
            await axios.delete(`/api/employees/${id}`);
            navigate('/employees');
        } catch (error) {
            alert('Erro ao excluir colaborador: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleEmployeeSaved = () => {
        fetchEmployee();
    };

    const handlePhotoChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('photo', file);

        setUploading(true);
        try {
            await axios.post(`/api/employees/${id}/photo`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            fetchEmployee();
        } catch (error) {
            console.error('Failed to upload photo:', error);
            alert('Erro ao fazer upload da foto.');
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Carregando perfil...</div>;
    if (!employee) return <div className="p-8 text-center text-red-500">Colaborador não encontrado.</div>;

    return (
        <div className="p-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/employees')}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
                    >
                        <ArrowLeft size={24} />
                    </button>

                    <div
                        className="relative group h-16 w-16 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 overflow-hidden border-2 border-slate-100 cursor-pointer"
                        title="Mudar foto"
                        onClick={() => document.getElementById('avatar-upload').click()}
                    >
                        {employee.photo ? (
                            <img
                                src={`/uploads/${employee.photo}`}
                                alt={employee.name}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <User size={32} />
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Plus size={20} className="text-white" />
                        </div>
                        {uploading && (
                            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
                            </div>
                        )}
                        <input
                            id="avatar-upload"
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handlePhotoChange}
                        />
                    </div>

                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">{employee.name}</h1>
                        <div className="flex items-center gap-2 text-slate-500">
                            <span className="bg-slate-100 px-2 py-1 rounded text-sm font-medium">{employee.sector}</span>
                            <span className={`px-2 py-1 rounded text-sm font-bold ${employee.active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                {employee.active ? 'Ativo' : 'Inativo'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleEditEmployee}
                        className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
                    >
                        <Pencil size={16} />
                        Editar
                    </button>
                    <button
                        onClick={handleDeleteEmployee}
                        className="flex items-center gap-2 bg-white hover:bg-red-50 text-red-600 border border-red-100 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
                    >
                        <Trash2 size={16} />
                        Excluir
                    </button>
                    <button
                        onClick={handleDownloadReport}
                        className="flex items-center gap-2 bg-slate-600 hover:bg-slate-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
                    >
                        <Download size={16} />
                        Baixar Relatório
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Metrics History */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Star className="text-yellow-400" size={20} />
                                Histórico de Desempenho
                            </h3>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400 font-medium">Filtrar mês:</span>
                                <select
                                    className="text-xs border border-slate-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    value={monthFilter}
                                    onChange={(e) => setMonthFilter(e.target.value)}
                                >
                                    <option value="">Todos</option>
                                    {[...new Set(employee.metrics?.map(m => m.month_year))].sort((a, b) => {
                                        const [m1, y1] = a.split('/');
                                        const [m2, y2] = b.split('/');
                                        return `${y2}${m2}` - `${y1}${m1}`;
                                    }).map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 text-slate-500 font-medium uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Mês/Ano</th>
                                        <th className="px-6 py-4">Score</th>
                                        <th className="px-6 py-4">Assumidos</th>
                                        <th className="px-6 py-4">Transf.</th>
                                        <th className="px-6 py-4">Finalizados</th>
                                        <th className="px-6 py-4">N1</th>
                                        <th className="px-6 py-4">N2</th>
                                        <th className="px-6 py-4">N3</th>
                                        <th className="px-6 py-4 text-center">Total</th>
                                        <th className="px-6 py-4">Objetivo</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {employee.metrics && employee.metrics.length > 0 ? (
                                        employee.metrics
                                            .filter(m => !monthFilter || m.month_year === monthFilter)
                                            .map((metric, i) => (
                                                <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4 font-medium text-slate-700">{metric.month_year}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${metric.score >= 4.7 ? 'bg-emerald-100 text-emerald-700' :
                                                            metric.score >= 4.0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                                            }`}>
                                                            {Number(metric.score).toFixed(2)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-600">{metric.tickets_assumed}</td>
                                                    <td className="px-6 py-4 text-slate-600">{metric.tickets_transferred}</td>
                                                    <td className="px-6 py-4 text-slate-600">{metric.tickets_finished}</td>
                                                    <td className="px-6 py-4 text-slate-600">{metric.grade_1}</td>
                                                    <td className="px-6 py-4 text-slate-600">{metric.grade_2}</td>
                                                    <td className="px-6 py-4 text-slate-600">{metric.grade_3}</td>
                                                    <td className="px-6 py-4 text-slate-600 font-bold text-center">{metric.total_grade}</td>
                                                    <td className="px-6 py-4 text-slate-500 max-w-[150px] truncate" title={metric.goal_text}>
                                                        {metric.goal_text || '-'}
                                                    </td>
                                                </tr>
                                            ))
                                    ) : (
                                        <tr><td colSpan="10" className="p-6 text-center text-slate-400">Nenhum dado de performance.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right Column: Feedbacks */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <MessageSquare className="text-blue-500" size={20} />
                                Feedbacks e Observações
                            </h3>
                            <button
                                onClick={handleAddFeedback}
                                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                            >
                                <Plus size={14} />
                                Novo
                            </button>
                        </div>
                        <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                            {employee.feedbacks && employee.feedbacks.length > 0 ? (
                                employee.feedbacks.map((fb, i) => (
                                    <div key={i} className="p-6 space-y-3 group">
                                        <div className="flex justify-between items-start">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${fb.type === 'Elogio' ? 'bg-emerald-100 text-emerald-700' :
                                                fb.type === 'Atenção' ? 'bg-orange-100 text-orange-700' :
                                                    fb.type === 'Advertência' ? 'bg-red-100 text-red-700' :
                                                        'bg-slate-100 text-slate-600'
                                                }`}>
                                                {fb.type || 'Neutro'}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-slate-400">{new Date(fb.created_at).toLocaleDateString()}</span>
                                                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                                                    <button
                                                        onClick={() => handleEditFeedback(fb)}
                                                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteFeedback(fb.id)}
                                                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                        title="Excluir"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-sm text-slate-700">{fb.observation}</p>

                                        {fb.image && (
                                            <div className="mt-2 rounded-lg overflow-hidden border border-slate-100 max-w-sm">
                                                <img
                                                    src={`/uploads/${fb.image}`}
                                                    alt="Feedback attachment"
                                                    className="w-full h-auto cursor-pointer hover:opacity-95 transition-opacity"
                                                    onClick={() => window.open(`/uploads/${fb.image}`, '_blank')}
                                                />
                                            </div>
                                        )}

                                        {fb.actions_taken && (
                                            <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-1">
                                                <strong className="text-slate-600 block">Ações Tomadas:</strong>
                                                <p className="text-slate-500">{fb.actions_taken}</p>
                                            </div>
                                        )}
                                        {fb.responsible && (
                                            <p className="text-[10px] text-slate-400">Responsável: {fb.responsible}</p>
                                        )}
                                        <div className="flex items-center gap-2 pt-2">
                                            {fb.status === 'Resolvido' ? (
                                                <CheckCircle size={14} className="text-emerald-500" />
                                            ) : (
                                                <AlertCircle size={14} className="text-yellow-500" />
                                            )}
                                            <span className="text-[10px] text-slate-400">{fb.status || 'Pendente'}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-6 text-center text-slate-400 text-sm">Nenhum feedback registrado.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Feedback Modal */}
            {showFeedbackModal && (
                <FeedbackFormModal
                    feedback={editingFeedback}
                    employeeId={id}
                    onClose={() => setShowFeedbackModal(false)}
                    onSaved={handleFeedbackSaved}
                />
            )}

            {/* Employee Form Modal */}
            {showEmployeeModal && (
                <EmployeeFormModal
                    employee={employee}
                    onClose={() => setShowEmployeeModal(false)}
                    onSaved={handleEmployeeSaved}
                />
            )}
        </div>
    );
};

export default EmployeeDetail;
