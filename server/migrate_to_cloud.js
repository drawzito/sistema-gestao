require('dotenv').config();
const knex = require('knex');
const config = require('./knexfile');

const localDb = knex(config.development);
const cloudDb = knex(config.production);

async function migrateData() {
    console.log('--- 🚀 INICIANDO MIGRAÇÃO PARA A NUVEM ---');

    try {
        // 1. Run migrations on Cloud DB
        console.log('1. Criando tabelas na nuvem...');
        await cloudDb.migrate.latest();
        console.log('✅ Tabelas criadas.');

        // 2. Clear Cloud DB (optional but safer for clean migration)
        console.log('2. Limpando dados antigos na nuvem (se existirem)...');
        await cloudDb('feedbacks').del();
        await cloudDb('performance_metrics').del();
        await cloudDb('employees').del();

        // 3. Migrate Employees
        console.log('3. Migrando Colaboradores...');
        const employees = await localDb('employees').select('*');
        if (employees.length > 0) {
            await cloudDb('employees').insert(employees);
            console.log(`✅ ${employees.length} colaboradores migrados.`);
        }

        // 4. Migrate Metrics
        console.log('4. Migrando Métricas...');
        const metrics = await localDb('performance_metrics').select('*');
        if (metrics.length > 0) {
            await cloudDb('performance_metrics').insert(metrics);
            console.log(`✅ ${metrics.length} métricas migradas.`);
        }

        // 5. Migrate Feedbacks
        console.log('5. Migrando Feedbacks...');
        const feedbacks = await localDb('feedbacks').select('*');
        if (feedbacks.length > 0) {
            await cloudDb('feedbacks').insert(feedbacks);
            console.log(`✅ ${feedbacks.length} feedbacks migrados.`);
        }

        console.log('\n--- 🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO! ---');
        console.log('Agora seu sistema está rodando na Nuvem!');
    } catch (error) {
        console.error('\n❌ ERRO NA MIGRAÇÃO:', error.message);
        if (error.message.includes('authentication failed')) {
            console.log('\n💡 DICA: Verifique se você colocou a SENHA correta no arquivo .env');
        }
    } finally {
        await localDb.destroy();
        await cloudDb.destroy();
        process.exit();
    }
}

migrateData();
