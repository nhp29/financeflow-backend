const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken'); 
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Konfigurasi Database PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Penting: Mengizinkan Vercel mengakses API ini
app.use(cors({
    origin: ['https://financeflow-frontend-sigma.vercel.app', 'http://localhost:5173'], // Ganti dengan URL Vercel asli Anda
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));


// Middleware Otentikasi (JWT)
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: 'Akses ditolak. Token tidak ditemukan.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super-secret-key-development-only');
        req.user = decoded;
        next(); 
    } catch (error) {
        return res.status(403).json({ success: false, message: 'Token tidak valid atau sudah kedaluwarsa.' });
    }
};

// --- ENDPOINTS ---

// Register (Mockup)
app.post('/api/auth/register', async (req, res) => {
    const { email, password, fullName } = req.body;
    if (!email || !password || !fullName) return res.status(400).json({ success: false, message: 'Lengkapi data.' });

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        res.status(201).json({ success: true, message: 'Registrasi berhasil.', data: { id: 'mock-uuid-123', email, fullName } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
    }
});

// Login (Mockup)
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    
    try {
        // Simulasi query user dari database
        const user = { 
            id: 'mock-uuid-123', email: email, full_name: 'Bpk/Ibu Boss',
            password_hash: await bcrypt.hash('password123', 10) 
        };
        const token = jwt.sign(
            { id: user.id, email: user.email }, 
            process.env.JWT_SECRET || 'super-secret-key-development-only', 
            { expiresIn: '24h' } 
        );
        res.status(200).json({ success: true, message: 'Login berhasil.', token: token, user: { id: user.id, name: user.full_name, email: user.email }});
    } catch (error) {
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
    }
});

// Health Check Endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString(), message: 'FinanceFlow API is running smoothly.' });
});

// Dashboard Data Endpoint
// Endpoint untuk mengambil data Dashboard dari Database
app.get('/api/dashboard', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id; // Diambil dari JWT Token yang valid

        // 1. Query Total Saldo (Dari tabel accounts)
        const accountsResult = await pool.query(
            'SELECT SUM(balance) as total_saldo FROM accounts WHERE user_id = $1 AND is_active = true', 
            [userId]
        );
        const totalSaldo = accountsResult.rows[0].total_saldo || 0;

        // 2. Query Pemasukan & Pengeluaran Bulan Ini (Dari tabel transactions)
        // (Contoh query sederhana, Anda bisa menyesuaikan dengan tanggal)
        const incomeResult = await pool.query(`
            SELECT SUM(t.amount) as total 
            FROM transactions t 
            JOIN categories c ON t.category_id = c.id 
            WHERE t.user_id = $1 AND c.type = 'INCOME'
        `, [userId]);
        const totalPemasukan = incomeResult.rows[0].total || 0;

        const expenseResult = await pool.query(`
            SELECT SUM(t.amount) as total 
            FROM transactions t 
            JOIN categories c ON t.category_id = c.id 
            WHERE t.user_id = $1 AND c.type = 'EXPENSE'
        `, [userId]);
        const totalPengeluaran = expenseResult.rows[0].total || 0;

        // 3. Susun data untuk dikirim ke React (format JSON)
        const dashboardData = {
            kpi: {
                totalSaldo: `Rp ${Number(totalSaldo).toLocaleString('id-ID')}`,
                pemasukan: `Rp ${Number(totalPemasukan).toLocaleString('id-ID')}`,
                pengeluaran: `Rp ${Number(totalPengeluaran).toLocaleString('id-ID')}`,
                // ... hitung rasio dll
            },
            // ... tambahkan query untuk upcomingBills, recentTransactions, dll
        };

        res.status(200).json({ success: true, data: dashboardData });

    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data dari database.' });
    }
});

app.listen(port, () => { console.log(`🚀 API running on port ${port}`); });
