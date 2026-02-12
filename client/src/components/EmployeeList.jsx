import { useState, useEffect } from 'react';
import api, { getFileUrl } from '../api';
import { Search, UserPlus, User, Pencil, Trash2, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import EmployeeFormModal from './EmployeeFormModal';

const EmployeeList = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sectorFilter, setSectorFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const navigate = useNavigate();

    const fetchEmployees = async () => {
        try {
            const res = await api.get('/api/employees');
            setEmployees(res.data);
        } catch (error) {
            console.error('Failed to fetch employees:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    const handleCreate = () => {
        setEditingEmployee(null);
        setShowModal(true);
    };

    const handleEdit = (employee, e) => {
        e.stopPropagation();
        setEditingEmployee(employee);
        setShowModal(true);
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm('Tem certeza que deseja excluir este colaborador? Todas as métricas e feedbacks associados serão apagados permanentemente.')) return;
        try {
            await api.delete(`/api/employees/${id}`);
            fetchEmployees();
        } catch (error) {
            alert('Erro ao excluir colaborador: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleModalSaved = () => {
        setShowModal(false);
        fetchEmployees();
    };

    // Extract unique sectors
    const sectors = [...new Set(employees.map(emp => emp.sector).filter(Boolean))].sort();

    const filteredEmployees = employees.filter(emp => {
        const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (emp.sector && emp.sector.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesSector = !sectorFilter || emp.sector === sectorFilter;

        const matchesStatus = !statusFilter ||
            (statusFilter === 'active' ? emp.active : !emp.active);

        return matchesSearch && matchesSector && matchesStatus;
    });

    return (
        <div className="p-8 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Colaboradores</h2>
                    <p className="text-slate-500">Gestão de equipe e performance</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                    >
                        <UserPlus size={18} />
                        Novo Colaborador
                    </button>

                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">
                        <Filter size={16} className="text-slate-400" />
                        <select
                            className="text-sm bg-transparent border-none focus:outline-none text-slate-600 cursor-pointer"
                            value={sectorFilter}
                            onChange={(e) => setSectorFilter(e.target.value)}
                        >
                            <option value="">Todos os Setores</option>
                            {sectors.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                        <div className="w-[1px] h-4 bg-slate-200 mx-1"></div>
                        <select
                            className="text-sm bg-transparent border-none focus:outline-none text-slate-600 cursor-pointer"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">Status: Todos</option>
                            <option value="active">Ativos</option>
                            <option value="inactive">Inativos</option>
                        </select>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por nome..."
                            className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 text-sm font-medium uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Nome</th>
                            <th className="px-6 py-4">Setor</th>
                            <th className="px-6 py-4 text-center">Status</th>
                            <th className="px-6 py-4 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan="4" className="p-8 text-center text-slate-500">Carregando...</td></tr>
                        ) : filteredEmployees.length === 0 ? (
                            <tr><td colSpan="4" className="p-8 text-center text-slate-400">Nenhum colaborador encontrado com estes filtros.</td></tr>
                        ) : (
                            filteredEmployees.map((employee) => (
                                <tr
                                    key={employee.id}
                                    className="hover:bg-slate-50 transition-colors cursor-pointer group"
                                    onClick={() => navigate(`/employees/${employee.id}`)}
                                >
                                    <td className="px-6 py-4 font-medium text-slate-700 flex items-center gap-3 text-sm">
                                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden border border-slate-50">
                                            {employee.photo ? (
                                                <img src={getFileUrl(employee.photo)} alt="" className="h-full w-full object-cover" />
                                            ) : (
                                                <User size={16} />
                                            )}
                                        </div>
                                        {employee.name}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 text-sm">{employee.sector || '-'}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${employee.active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                            {employee.active ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => handleEdit(employee, e)}
                                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors shadow-sm bg-white border border-slate-100"
                                                title="Editar"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                onClick={(e) => handleDelete(employee.id, e)}
                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shadow-sm bg-white border border-slate-100"
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
                <EmployeeFormModal
                    employee={editingEmployee}
                    onClose={() => setShowModal(false)}
                    onSaved={handleModalSaved}
                />
            )}
        </div>
    );
};

export default EmployeeList;
