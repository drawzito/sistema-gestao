import { useState, useEffect } from 'react';
import api from '../api';
import { Search, Filter, Plus, Download, Pencil, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import MetricFormModal from './MetricFormModal';

const MetricsPage = () => {
    const [metrics, setMetrics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: '',
        sector: '',
        month: ''
    });
    const [availableFilters, setAvailableFilters] = useState({
        sectors: [],
        months: []
    });
    const [sortConfig, setSortConfig] = useState({ key: 'month_year', direction: 'desc' });
    const [showModal, setShowModal] = useState(false);
    const [editingMetric, setEditingMetric] = useState(null);

    const fetchMetrics = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams(filters).toString();
            const res = await api.get(`/api/metrics?${query}`);
            setMetrics(res.data.data);
            if (res.data.filters) {
                setAvailableFilters({
                    sectors: res.data.filters.sectors || [],
                    months: res.data.filters.months || []
                });
            }
        } catch (error) {
            console.error('Failed to fetch metrics:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchMetrics();
        }, 500); // Debounce search

        return () => clearTimeout(timeoutId);
    }, [filters]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleSort = (key) => {
        let direction = 'desc';
        if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

    const sortedMetrics = [...metrics].sort((a, b) => {
        if (!sortConfig.key) return 0;

        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        // Handle numeric values
        if (['tickets_assumed', 'tickets_finished', 'score'].includes(sortConfig.key)) {
            aVal = Number(aVal) || 0;
            bVal = Number(bVal) || 0;
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const handleCreate = () => {
        setEditingMetric(null);
        setShowModal(true);
    };

    const handleEdit = (metric) => {
        setEditingMetric(metric);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Tem certeza que deseja excluir esta métrica?')) return;
        try {
            await api.delete(`/api/metrics/${id}`);
            fetchMetrics();
        } catch (error) {
            alert('Erro ao excluir métrica.');
        }
    };

    const handleExport = () => {
        const query = new URLSearchParams(filters).toString();
        window.open(`/api/metrics/export?${query}`, '_blank');
    };

    const handleModalSaved = () => {
        fetchMetrics();
    };

    const SortIcon = ({ column }) => {
        if (sortConfig.key !== column) return null;
        return sortConfig.direction === 'asc' ? <ChevronUp size={14} className="ml-1" /> : <ChevronDown size={14} className="ml-1" />;
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Métricas de Desempenho</h2>
                    <p className="text-slate-500">Análise de resultados por colaborador e setor</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                    >
                        <Plus size={16} />
                        Nova Métrica
                    </button>

                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                    >
                        <Download size={16} />
                        Exportar CSV
                    </button>

                    <div className="relative">
                        <select
                            className="appearance-none bg-white border border-slate-200 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-600"
                            value={filters.sector}
                            onChange={(e) => handleFilterChange('sector', e.target.value)}
                        >
                            <option value="">Todos os Setores</option>
                            {availableFilters.sectors.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                        <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    </div>

                    <div className="relative">
                        <select
                            className="appearance-none bg-white border border-slate-200 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-600"
                            value={filters.month}
                            onChange={(e) => handleFilterChange('month', e.target.value)}
                        >
                            <option value="">Todos os Meses</option>
                            {availableFilters.months.map(m => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                        <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar colaborador..."
                            className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full md:w-64"
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left font-medium">
                    <thead className="bg-slate-50 text-slate-500 text-sm">
                        <tr>
                            <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('employee_name')}>
                                <div className="flex items-center">Colaborador <SortIcon column="employee_name" /></div>
                            </th>
                            <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('employee_sector')}>
                                <div className="flex items-center">Setor <SortIcon column="employee_sector" /></div>
                            </th>
                            <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('month_year')}>
                                <div className="flex items-center">Mês/Ano <SortIcon column="month_year" /></div>
                            </th>
                            <th className="px-6 py-4 text-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('tickets_assumed')}>
                                <div className="flex items-center justify-center">Assumidos <SortIcon column="tickets_assumed" /></div>
                            </th>
                            <th className="px-6 py-4 text-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('tickets_finished')}>
                                <div className="flex items-center justify-center">Finalizados <SortIcon column="tickets_finished" /></div>
                            </th>
                            <th className="px-6 py-4 text-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('score')}>
                                <div className="flex items-center justify-center">Score <SortIcon column="score" /></div>
                            </th>
                            <th className="px-6 py-4 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                        {loading ? (
                            <tr><td colSpan="7" className="p-8 text-center text-slate-500">Carregando métricas...</td></tr>
                        ) : sortedMetrics.length === 0 ? (
                            <tr><td colSpan="7" className="p-8 text-center text-slate-400">Nenhum resultado encontrado.</td></tr>
                        ) : (
                            sortedMetrics.map((m, i) => (
                                <tr key={i} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 text-slate-700 font-semibold">{m.employee_name}</td>
                                    <td className="px-6 py-4 text-slate-600">{m.employee_sector || '-'}</td>
                                    <td className="px-6 py-4 text-slate-600">{m.month_year}</td>
                                    <td className="px-6 py-4 text-center text-slate-700">{m.tickets_assumed}</td>
                                    <td className="px-6 py-4 text-center text-slate-700">{m.tickets_finished}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${m.score >= 4.7 ? 'bg-emerald-100 text-emerald-700' :
                                            m.score >= 4.0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                            {Number(m.score).toFixed(2)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => handleEdit(m)}
                                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Editar"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(m.id)}
                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Excluir"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <MetricFormModal
                    metric={editingMetric}
                    onClose={() => setShowModal(false)}
                    onSaved={handleModalSaved}
                />
            )}
        </div>
    );
};

export default MetricsPage;
