require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

// Routes
const employeesRoutes = require('./routes/employees');
const metricsRoutes = require('./routes/metrics');
const feedbacksRoutes = require('./routes/feedbacks');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration - Allow all in dev, specific ones in production if needed
const corsOptions = {
    origin: process.env.FRONTEND_URL || '*',
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount routes
app.use('/api/employees', employeesRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/feedbacks', feedbacksRoutes);

// Basic health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
