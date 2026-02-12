const XLSX = require('xlsx');
const path = require('path');
const db = require('./db');

// Path to the Excel file on Desktop
const FILE_PATH = '/home/ixcsoft/Área de trabalho/sistema-gestao/V1 Acompanhamento Mensal CG Atualizado_ (2).xlsx';

async function importData() {
    try {
        console.log(`Reading file: ${FILE_PATH}`);
        const workbook = XLSX.readFile(FILE_PATH);

        // --- 1. Import Metrics from 'Resultados Suporte 2025' ---
        const metricsSheetName = 'Resultados Suporte 2025';
        if (workbook.Sheets[metricsSheetName]) {
            console.log(`Importing metrics from ${metricsSheetName}...`);
            const metricsData = XLSX.utils.sheet_to_json(workbook.Sheets[metricsSheetName]);

            for (const row of metricsData) {
                // Headers based on analysis: 'Atendente 🙋', 'Assumidos', etc.
                // Normalize names: remove whitespace, handle undefined
                const rawName = row['Atendente 🙋'] || row['Atendente'] || row['Colaborador'];

                if (!rawName || rawName.includes('Total') || rawName.includes('Média')) continue;

                const name = rawName.trim();
                const sector = row['Setor  🖥️'] || row['Setor'] || 'Suporte'; // Defaulting

                // Find or Create Employee
                let employee = await db('employees').where({ name }).first();
                if (!employee) {
                    const [id] = await db('employees').insert({ name, sector }).returning('id');
                    // SQLite returns [ { id: ... } ] or [id] depending on version/config, 
                    // but better-sqlite3 usually returns { id: ... } for returning('*') or standard insert result.
                    // Knex .insert() .returning('id') -> array of objects usually.
                    // Let's safe fetch again.
                    employee = await db('employees').where({ name }).first();
                }

                // Insert Metric
                await db('performance_metrics').insert({
                    employee_id: employee.id,
                    month_year: '2025', // Assuming 2025 context from sheet name, row doesn't specify month per se? 
                    // Wait, analysis step 113 showed 'Mês' in other sheet. This sheet might be YTD or specific month?
                    // For now, hardcode or fetch from context if possible, but sheet name says 2025.
                    tickets_assumed: parseInt(row['Assumidos']) || 0,
                    tickets_transferred: parseInt(row['Transferidos']) || 0,
                    tickets_finished: parseInt(row['Finalizados']) || 0,
                    score: parseFloat(row['SCORE']) || 0,
                    goal_text: row['Objetivo']
                });
            }
            console.log('Metrics imported.');
        } else {
            console.warn(`Sheet ${metricsSheetName} not found.`);
        }

        // --- 2. Import Feedback from 'Observações - Colaboradores' ---
        const feedbackSheetName = 'Observações - Colaboradores';
        if (workbook.Sheets[feedbackSheetName]) {
            console.log(`Importing feedback from ${feedbackSheetName}...`);
            const feedbackData = XLSX.utils.sheet_to_json(workbook.Sheets[feedbackSheetName]);

            for (const row of feedbackData) {
                const rawName = row['Colaborador'];
                if (!rawName) continue;

                const name = rawName.trim();
                const sector = row['Setor'];

                // Find or Create Employee (Upsert sector if missing?)
                let employee = await db('employees').where({ name }).first();
                if (!employee) {
                    await db('employees').insert({ name, sector });
                    employee = await db('employees').where({ name }).first();
                } else if (sector && !employee.sector) {
                    await db('employees').where({ id: employee.id }).update({ sector });
                }

                await db('feedbacks').insert({
                    employee_id: employee.id,
                    observation: row['Observações'],
                    type: row['Tipo'],
                    status: row['Status'],
                    category: row['Categoria'],
                    actions_taken: row['Ações Tomadas'],
                    responsible: row['Responsável pelo Feedback'],
                    sector: sector
                });
            }
            console.log('Feedbacks imported.');
        } else {
            console.warn(`Sheet ${feedbackSheetName} not found.`);
        }

        console.log('Import completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('Import failed:', error);
        process.exit(1);
    }
}

importData();
