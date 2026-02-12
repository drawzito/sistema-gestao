import { useState, useEffect } from 'react';
import axios from 'axios';
import { UserCheck, CheckCircle, TrendingUp, AlertCircle } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
        <div>
            <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
        </div>
        <div className={`p-3 rounded-full ${color.bg} ${color.text}`}>
            <Icon size={24} />
        </div>
    </div>
);

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await axios.get('/api/metrics/dashboard');
                setStats(res.data);
            } catch (error) {
                console.error('Failed to fetch stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) return <div className="p-8">Carregando dashboard...</div>;
    if (!stats) return <div className="p-8 text-red-500">Erro ao carregar dados.</div>;

    return (
        <div className="p-8 space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Visão Geral</h2>
                <p className="text-slate-500">Acompanhamento de performance e feedbacks</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Colaboradores"
                    value={stats.totalEmployees}
                    icon={UserCheck}
                    color={{ bg: 'bg-blue-50', text: 'text-blue-600' }}
                />
                <StatCard
                    title="Média Score"
                    value={stats.averageScore ? stats.averageScore.toFixed(2) : '-'}
                    icon={TrendingUp}
                    color={{ bg: 'bg-emerald-50', text: 'text-emerald-600' }}
                />
                <StatCard
                    title="Tickets Finalizados"
                    value={stats.totalTicketsFinished}
                    icon={CheckCircle}
                    color={{ bg: 'bg-purple-50', text: 'text-purple-600' }}
                />
                <StatCard
                    title="Alertas (Feedbacks)"
                    value="-"
                    icon={AlertCircle}
                    color={{ bg: 'bg-orange-50', text: 'text-orange-600' }}
                />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800">Top Performance (Score)</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-medium">
                            <tr>
                                <th className="px-6 py-4">Colaborador</th>
                                <th className="px-6 py-4">Score</th>
                                <th className="px-6 py-4">Tickets Finalizados</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {stats.topPerformers.map((p, i) => (
                                <tr key={i} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-700">{p.name}</td>
                                    <td className="px-6 py-4">
                                        <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold">
                                            {p.score}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">{p.tickets_finished}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
