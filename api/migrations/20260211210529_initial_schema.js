/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema
        .createTable('employees', function (table) {
            table.increments('id').primary();
            table.string('name').unique().notNullable();
            table.string('sector');
            table.boolean('active').defaultTo(true);
            table.timestamps(true, true);
        })
        .createTable('performance_metrics', function (table) {
            table.increments('id').primary();
            table.integer('employee_id').unsigned().references('id').inTable('employees').onDelete('CASCADE');
            table.string('month_year');
            table.integer('tickets_assumed');
            table.integer('tickets_transferred');
            table.integer('tickets_finished');
            table.float('score');
            table.integer('grade_1');
            table.integer('grade_2');
            table.integer('grade_3');
            table.integer('total_grade');
            table.string('goal_text');
            table.timestamps(true, true);
        })
        .createTable('feedbacks', function (table) {
            table.increments('id').primary();
            table.integer('employee_id').unsigned().references('id').inTable('employees').onDelete('CASCADE');
            table.text('observation');
            table.string('type');
            table.string('status');
            table.string('category');
            table.text('actions_taken');
            table.string('responsible');
            table.string('sector'); // Included in source data
            table.timestamps(true, true);
        });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema
        .dropTableIfExists('feedbacks')
        .dropTableIfExists('performance_metrics')
        .dropTableIfExists('employees');
};
