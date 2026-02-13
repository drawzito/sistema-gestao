const express = require('express');
const router = express.Router();
const db = require('../db');

// Helper: build filtered query
function buildFilteredQuery(query, filters) {
    const { sector, month, search } = filters;
    if (sector) query = query.where('employees.sector', sector);
    if (month) query = query.where('performance_metrics.month_year', month);
    if (search) query = query.where('employees.name', 'like', `%${search}%`);
    return query;
}

// GET dashboard stats
router.get('/dashboard', async (req, res) => {
    try {
        const totalEmployees = await db('employees').count('id as count').first();
        const avgScore = await db('performance_metrics').avg('score as avg').first();
        const totalTickets = await db('performance_metrics').sum('tickets_finished as total').first();

        const topPerformers = await db('performance_metrics')
            .join('employees', 'performance_metrics.employee_id', 'employees.id')
            .select('employees.name', 'performance_metrics.score', 'performance_metrics.tickets_finished')
            .orderBy('score', 'desc')
            .limit(5);

        res.json({
            totalEmployees: totalEmployees.count,
            averageScore: avgScore.avg,
            totalTicketsFinished: totalTickets.total,
            topPerformers
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET export CSV (must be before /:id route)
router.get('/export', async (req, res) => {
    try {
        let query = db('performance_metrics')
            .join('employees', 'performance_metrics.employee_id', 'employees.id')
            .select(
                'employees.name as employee_name',
                'employees.sector as employee_sector',
                'performance_metrics.month_year',
                'performance_metrics.tickets_assumed',
                'performance_metrics.tickets_transferred',
                'performance_metrics.tickets_finished',
                'performance_metrics.score',
                'performance_metrics.grade_1',
                'performance_metrics.grade_2',
                'performance_metrics.grade_3',
                'performance_metrics.total_grade',
                'performance_metrics.goal_text'
            );

        query = buildFilteredQuery(query, req.query);
        const metrics = await query.orderBy('performance_metrics.score', 'desc');

        // Build CSV
        const headers = ['Colaborador', 'Setor', 'Mês/Ano', 'Assumidos', 'Transferidos', 'Finalizados', 'Score', 'Nota 1', 'Nota 2', 'Nota 3', 'Total Notas', 'Objetivo'];
        const csvRows = [headers.join(';')];

        for (const m of metrics) {
            const row = [
                m.employee_name,
                m.employee_sector || '',
                m.month_year,
                m.tickets_assumed,
                m.tickets_transferred,
                m.tickets_finished,
                m.score,
                m.grade_1,
                m.grade_2,
                m.grade_3,
                m.total_grade,
                m.goal_text || ''
            ].map(v => `"${String(v).replace(/"/g, '""')}"`);
            csvRows.push(row.join(';'));
        }

        const csv = csvRows.join('\n');
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="metricas.csv"');
        // BOM for Excel UTF-8 compatibility
        res.send('\uFEFF' + csv);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET filtered metrics
router.get('/', async (req, res) => {
    try {
        let query = db('performance_metrics')
            .join('employees', 'performance_metrics.employee_id', 'employees.id')
            .select(
                'performance_metrics.*',
                'employees.name as employee_name',
                'employees.sector as employee_sector'
            );

        query = buildFilteredQuery(query, req.query);
        const metrics = await query.orderBy('performance_metrics.score', 'desc');

        // Get unique sectors and months for filter dropdowns
        const sectors = await db('employees').distinct('sector').whereNotNull('sector').orderBy('sector');
        const months = await db('performance_metrics').distinct('month_year').orderBy('month_year', 'desc');

        res.json({
            data: metrics,
            filters: {
                sectors: sectors.map(s => s.sector),
                months: months.map(m => m.month_year)
            }
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST create metric
router.post('/', async (req, res) => {
    try {
        const {
            employee_id, month_year, tickets_assumed, tickets_transferred,
            tickets_finished, score, grade_1, grade_2, grade_3, total_grade, goal_text
        } = req.body;

        if (!employee_id || !month_year) {
            return res.status(400).json({ error: 'employee_id e month_year são obrigatórios.' });
        }

        const [id] = await db('performance_metrics').insert({
            employee_id,
            month_year,
            tickets_assumed: tickets_assumed || 0,
            tickets_transferred: tickets_transferred || 0,
            tickets_finished: tickets_finished || 0,
            score: score || 0,
            grade_1: grade_1 || 0,
            grade_2: grade_2 || 0,
            grade_3: grade_3 || 0,
            total_grade: total_grade || 0,
            goal_text: goal_text || ''
        });

        const created = await db('performance_metrics').where({ id }).first();
        res.status(201).json(created);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT update metric
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            employee_id, month_year, tickets_assumed, tickets_transferred,
            tickets_finished, score, grade_1, grade_2, grade_3, total_grade, goal_text
        } = req.body;

        const existing = await db('performance_metrics').where({ id }).first();
        if (!existing) {
            return res.status(404).json({ error: 'Métrica não encontrada.' });
        }

        await db('performance_metrics').where({ id }).update({
            employee_id: employee_id || existing.employee_id,
            month_year: month_year || existing.month_year,
            tickets_assumed: tickets_assumed ?? existing.tickets_assumed,
            tickets_transferred: tickets_transferred ?? existing.tickets_transferred,
            tickets_finished: tickets_finished ?? existing.tickets_finished,
            score: score ?? existing.score,
            grade_1: grade_1 ?? existing.grade_1,
            grade_2: grade_2 ?? existing.grade_2,
            grade_3: grade_3 ?? existing.grade_3,
            total_grade: total_grade ?? existing.total_grade,
            goal_text: goal_text ?? existing.goal_text,
            updated_at: db.fn.now()
        });

        const updated = await db('performance_metrics').where({ id }).first();
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE metric
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await db('performance_metrics').where({ id }).first();
        if (!existing) {
            return res.status(404).json({ error: 'Métrica não encontrada.' });
        }

        await db('performance_metrics').where({ id }).del();
        res.json({ message: 'Métrica excluída com sucesso.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
