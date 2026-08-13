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
app.get('/api/dashboard', verifyToken, async (req, res) => {
    const dashboardData = {
        kpi: {
            totalSaldo: "Rp 25.785.000", pemasukan: "Rp 0", pengeluaran: "Rp 940.000",
            rasioTabungan: "0.0%", nilaiKekayaan: "Rp 25.785.000", statusKeuangan: 20
        },
        upcomingBills: [
            { id: 1, name: "Netflix", amount: "Rp 57.000", due: "Due in 2d", progress: 80, color: "bg-red-500" },
            { id: 2, name: "Cicilan Nmax", amount: "Rp 1.785.000", due: "Due in 3d", progress: 60, color: "bg-blue-500" }
        ],
        recentTransactions: [
            { id: 1, date: "10 Jul", category: "Belanja", amount: "-Rp 450.000", color: "text-red-500" },
            { id: 2, date: "Kemarin", category: "Lainnya", amount: "-Rp 210.000", color: "text-red-500" }
        ],
        accountBalances: [
            { id: 1, name: "BCA", amount: "Rp 18.060.000", logo: "bg-blue-600" },
            { id: 2, name: "Gopay", amount: "Rp 7.725.000", logo: "bg-green-500" }
        ],
        expenseDetails: [
            { label: 'Belanja', value: 50, color: '#3b82f6' },
            { label: 'Lainnya', value: 20, color: '#ef4444' }
        ]
    };
    res.status(200).json({ success: true, data: dashboardData });
});

app.listen(port, () => { console.log(`🚀 API running on port ${port}`); });
