const express = require('express');
const router = express.Router();
const db = require('../db');
const path = require('path');
const fs = require('fs');
const { upload, cloudinary, isCloudinary } = require('../storage');


// GET all employees
router.get('/', async (req, res) => {
    try {
        const employees = await db('employees').select('*').orderBy('name');
        res.json(employees);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET employee report CSV
router.get('/:id/report', async (req, res) => {
    try {
        const { id } = req.params;
        const employee = await db('employees').where({ id }).first();
        if (!employee) return res.status(404).json({ error: 'Colaborador não encontrado.' });

        const metrics = await db('performance_metrics')
            .where({ employee_id: id })
            .orderBy('month_year', 'desc');

        const feedbacks = await db('feedbacks')
            .where({ employee_id: id })
            .orderBy('created_at', 'desc');

        // Build CSV report
        const lines = [];
        lines.push(`Relatório Completo - ${employee.name}`);
        lines.push(`Setor: ${employee.sector || '-'}`);
        lines.push(`Status: ${employee.active ? 'Ativo' : 'Inativo'}`);
        lines.push('');

        // Metrics section
        lines.push('=== MÉTRICAS DE DESEMPENHO ===');
        lines.push('Mês/Ano;Assumidos;Transferidos;Finalizados;Score;Nota 1;Nota 2;Nota 3;Total Notas;Objetivo');
        for (const m of metrics) {
            lines.push([
                m.month_year,
                m.tickets_assumed,
                m.tickets_transferred,
                m.tickets_finished,
                m.score,
                m.grade_1,
                m.grade_2,
                m.grade_3,
                m.total_grade,
                `"${(m.goal_text || '').replace(/"/g, '""')}"`
            ].join(';'));
        }

        lines.push('');

        // Feedbacks section
        lines.push('=== FEEDBACKS E OBSERVAÇÕES ===');
        lines.push('Data;Tipo;Status;Categoria;Observação;Ações Tomadas;Responsável');
        for (const fb of feedbacks) {
            lines.push([
                new Date(fb.created_at).toLocaleDateString('pt-BR'),
                fb.type || '',
                fb.status || '',
                fb.category || '',
                `"${(fb.observation || '').replace(/"/g, '""')}"`,
                `"${(fb.actions_taken || '').replace(/"/g, '""')}"`,
                fb.responsible || ''
            ].join(';'));
        }

        const csv = lines.join('\n');
        const safeName = employee.name.replace(/[^a-zA-Z0-9\u00C0-\u024F]/g, '_');
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="relatorio_${safeName}.csv"`);
        res.send('\uFEFF' + csv);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET employee by ID with metrics and feedbacks
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const employee = await db('employees').where({ id }).first();

        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        const metrics = await db('performance_metrics')
            .where({ employee_id: id })
            .orderBy('month_year', 'desc');

        const feedbacks = await db('feedbacks')
            .where({ employee_id: id })
            .orderBy('created_at', 'desc');

        res.json({ ...employee, metrics, feedbacks });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST upload employee photo
router.post('/:id/photo', upload.single('photo'), async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.file) {
            return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
        }

        const employee = await db('employees').where({ id }).first();
        if (!employee) {
            return res.status(404).json({ error: 'Colaborador não encontrado.' });
        }

        // Delete old photo if exists
        if (employee.photo) {
            if (isCloudinary) {
                try {
                    // Extract public_id from URL/filename for Cloudinary
                    const publicId = 'sistema-gestao/' + employee.photo.split('.')[0];
                    await cloudinary.uploader.destroy(publicId);
                } catch (e) {
                    console.error('Failed to delete from Cloudinary:', e);
                }
            } else {
                const oldPath = path.join(__dirname, '../uploads', employee.photo);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }
        }

        // In Cloudinary, filename is usually the public_id + extension
        // In this implementation, req.file.filename will be the public_id (if using cloudinary storage)
        const photoName = isCloudinary ? req.file.path : req.file.filename;

        await db('employees').where({ id }).update({
            photo: photoName,
            updated_at: db.fn.now()
        });

        res.json({ photo: photoName });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST create new employee
router.post('/', async (req, res) => {
    try {
        const { name, sector } = req.body;
        if (!name) return res.status(400).json({ error: 'Nome é obrigatório.' });

        const [id] = await db('employees').insert({
            name,
            sector: sector || '',
            active: 1,
            created_at: db.fn.now(),
            updated_at: db.fn.now()
        });

        const newEmployee = await db('employees').where({ id }).first();
        res.status(201).json(newEmployee);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT update employee
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, sector, active } = req.body;

        const updated = await db('employees').where({ id }).update({
            name,
            sector,
            active,
            updated_at: db.fn.now()
        });

        if (!updated) return res.status(404).json({ error: 'Colaborador não encontrado.' });

        const employee = await db('employees').where({ id }).first();
        res.json(employee);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE employee (cascading cleanup)
router.delete('/:id', async (req, res) => {
    console.log('DELETE request received for ID:', req.params.id);
    try {
        const { id } = req.params;

        const employee = await db('employees').where({ id }).first();
        if (!employee) return res.status(404).json({ error: 'Colaborador não encontrado.' });

        // Start transaction for atomic cleanup
        await db.transaction(async trx => {
            // Delete metrics
            await trx('performance_metrics').where({ employee_id: id }).del();
            // Delete feedbacks
            await trx('feedbacks').where({ employee_id: id }).del();
            // Delete employee record
            await trx('employees').where({ id }).del();
        });

        // Delete photo from disk/cloud if exists
        if (employee.photo) {
            if (isCloudinary) {
                try {
                    const publicId = 'sistema-gestao/' + employee.photo.split('/').pop().split('.')[0];
                    await cloudinary.uploader.destroy(publicId);
                } catch (e) {
                    console.error('Failed to delete from Cloudinary:', e);
                }
            } else {
                const photoPath = path.join(__dirname, '../uploads', employee.photo);
                if (fs.existsSync(photoPath)) {
                    fs.unlinkSync(photoPath);
                }
            }
        }

        res.json({ message: 'Colaborador e dados associados excluídos com sucesso.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
