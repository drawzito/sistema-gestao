const db = require('./db');

async function check() {
    try {
        const count = await db('employees').count('id as c').first();
        console.log('Employees count:', count.c);

        const rows = await db('employees').select('*').limit(5);
        console.log('Sample employees:', rows);

        const metrics = await db('performance_metrics').count('id as c').first();
        console.log('Metrics count:', metrics.c);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
