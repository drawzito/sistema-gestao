const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for feedback photos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'feedback-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Apenas imagens (jpeg, jpg, png, webp) são permitidas!'));
    }
});

// GET all feedbacks (with filters)
router.get('/', async (req, res) => {
    try {
        const { sector, type, status, search } = req.query;

        let query = db('feedbacks')
            .join('employees', 'feedbacks.employee_id', 'employees.id')
            .select(
                'feedbacks.*',
                'employees.name as employee_name',
                'employees.sector as employee_sector'
            );

        if (sector) query = query.where('employees.sector', sector);
        if (type) query = query.where('feedbacks.type', type);
        if (status) query = query.where('feedbacks.status', status);
        if (search) query = query.where('employees.name', 'like', `%${search}%`);

        const feedbacks = await query.orderBy('feedbacks.created_at', 'desc');

        // Get filter options
        const sectors = await db('employees').distinct('sector').whereNotNull('sector').orderBy('sector');
        const types = await db('feedbacks').distinct('type').whereNotNull('type').orderBy('type');
        const statuses = await db('feedbacks').distinct('status').whereNotNull('status').orderBy('status');

        res.json({
            data: feedbacks,
            filters: {
                sectors: sectors.map(s => s.sector),
                types: types.map(t => t.type),
                statuses: statuses.map(s => s.status)
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST create feedback
router.post('/', async (req, res) => {
    try {
        const { employee_id, observation, type, status, category, actions_taken, responsible, sector, image } = req.body;

        if (!employee_id || !observation) {
            return res.status(400).json({ error: 'employee_id e observation são obrigatórios.' });
        }

        const [id] = await db('feedbacks').insert({
            employee_id,
            observation,
            type: type || '',
            status: status || 'Pendente',
            category: category || '',
            actions_taken: actions_taken || '',
            responsible: responsible || '',
            sector: sector || '',
            image: image || null
        });

        const created = await db('feedbacks').where({ id }).first();
        res.status(201).json(created);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST upload feedback photo
router.post('/:id/photo', upload.single('photo'), async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.file) {
            return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
        }

        const feedback = await db('feedbacks').where({ id }).first();
        if (!feedback) {
            return res.status(404).json({ error: 'Feedback não encontrado.' });
        }

        // Delete old image if exists
        if (feedback.image) {
            const oldPath = path.join(__dirname, '../uploads', feedback.image);
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }

        const photoName = req.file.filename;
        await db('feedbacks').where({ id }).update({
            image: photoName,
            updated_at: db.fn.now()
        });

        res.json({ image: photoName });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT update feedback
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await db('feedbacks').where({ id }).first();
        if (!existing) return res.status(404).json({ error: 'Feedback não encontrado.' });

        const { observation, type, status, category, actions_taken, responsible, sector, image } = req.body;

        await db('feedbacks').where({ id }).update({
            observation: observation ?? existing.observation,
            type: type ?? existing.type,
            status: status ?? existing.status,
            category: category ?? existing.category,
            actions_taken: actions_taken ?? existing.actions_taken,
            responsible: responsible ?? existing.responsible,
            sector: sector ?? existing.sector,
            image: image ?? existing.image,
            updated_at: db.fn.now()
        });

        const updated = await db('feedbacks').where({ id }).first();
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE feedback
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await db('feedbacks').where({ id }).first();
        if (!existing) return res.status(404).json({ error: 'Feedback não encontrado.' });

        // Delete image from disk if exists
        if (existing.image) {
            const photoPath = path.join(__dirname, '../uploads', existing.image);
            if (fs.existsSync(photoPath)) {
                fs.unlinkSync(photoPath);
            }
        }

        await db('feedbacks').where({ id }).del();
        res.json({ message: 'Feedback excluído com sucesso.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
