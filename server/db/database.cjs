const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Default SQLite data directory and file path
const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}
const DB_FILE = process.env.SQLITE_DB_PATH || path.join(DATA_DIR, 'creatorhub.db');
const SCHEMA_FILE = path.join(__dirname, 'schema.sql');

let dbInstance = null;
let isPostgres = false;
let pgPool = null;

// Initialize Database Connection
function getDB() {
    if (dbInstance) return dbInstance;

    const dbUrl = process.env.DATABASE_URL || '';
    if (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://')) {
        try {
            const { Pool } = require('pg');
            pgPool = new Pool({ connectionString: dbUrl });
            isPostgres = true;
            console.log('🐘 Connected to PostgreSQL Database via DATABASE_URL');
            return pgPool;
        } catch (err) {
            console.warn('⚠️ pg client not available, falling back to built-in SQLite engine:', err.message);
        }
    }

    // Built-in SQLite in Node.js 22+
    try {
        const { DatabaseSync } = require('node:sqlite');
        dbInstance = new DatabaseSync(DB_FILE);
        // Enable foreign keys and WAL mode for high concurrency
        dbInstance.exec('PRAGMA foreign_keys = ON;');
        dbInstance.exec('PRAGMA journal_mode = WAL;');
        console.log(`🗄️ Connected to Relational SQLite database at ${DB_FILE}`);
        return dbInstance;
    } catch (sqliteErr) {
        console.error('❌ Failed to initialize SQLite database:', sqliteErr);
        throw sqliteErr;
    }
}

// Initialize tables from schema.sql
async function initDB() {
    const db = getDB();
    const schemaSql = fs.readFileSync(SCHEMA_FILE, 'utf8');

    if (isPostgres) {
        await pgPool.query(schemaSql);
        console.log('✅ PostgreSQL Schema initialized successfully');
    } else {
        db.exec(schemaSql);
        console.log('✅ SQLite Relational Schema initialized successfully');
    }
}

/**
 * Execute a query returning all rows
 * @param {string} sql 
 * @param {any[]} params 
 * @returns {any[]}
 */
function query(sql, params = []) {
    const db = getDB();
    if (isPostgres) {
        throw new Error('Use async queryAsync for PostgreSQL queries');
    }
    const stmt = db.prepare(sql);
    return stmt.all(...params);
}

/**
 * Execute a query returning a single row
 * @param {string} sql 
 * @param {any[]} params 
 * @returns {any|null}
 */
function queryOne(sql, params = []) {
    const rows = query(sql, params);
    return rows.length > 0 ? rows[0] : null;
}

/**
 * Execute INSERT, UPDATE, DELETE
 * @param {string} sql 
 * @param {any[]} params 
 * @returns {{ changes: number, lastInsertRowid: number }}
 */
function run(sql, params = []) {
    const db = getDB();
    if (isPostgres) {
        throw new Error('Use async runAsync for PostgreSQL queries');
    }
    const stmt = db.prepare(sql);
    return stmt.run(...params);
}

/**
 * Async query runner (supports both SQLite and Postgres)
 */
async function queryAsync(sql, params = []) {
    if (isPostgres) {
        const res = await pgPool.query(sql, params);
        return res.rows;
    }
    return query(sql, params);
}

async function queryOneAsync(sql, params = []) {
    const rows = await queryAsync(sql, params);
    return rows.length > 0 ? rows[0] : null;
}

async function runAsync(sql, params = []) {
    if (isPostgres) {
        const res = await pgPool.query(sql, params);
        return { changes: res.rowCount, lastInsertRowid: null };
    }
    return run(sql, params);
}

/**
 * Transaction runner
 */
function transaction(callback) {
    const db = getDB();
    db.exec('BEGIN TRANSACTION;');
    try {
        const result = callback();
        db.exec('COMMIT;');
        return result;
    } catch (err) {
        db.exec('ROLLBACK;');
        throw err;
    }
}

module.exports = {
    getDB,
    initDB,
    query,
    queryOne,
    run,
    queryAsync,
    queryOneAsync,
    runAsync,
    transaction,
    isPostgres: () => isPostgres
};
