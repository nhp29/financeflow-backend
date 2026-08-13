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
        const user = { 
            id: 'mock-uuid-123', 
            email: email, 
            full_name: 'Bpk/Ibu Boss',
            password_hash: await bcrypt.hash('password123', 10) // Contoh simulasi hash di DB
        };

        // 2. Bandingkan password yang dikirim dengan hash di database
        // PERHATIAN: Di aplikasi nyata, bandingkan 'password' dengan 'user.password_hash'
        const validPassword = await bcrypt.compare(password, user.password_hash); 
        // Untuk mock agar selalu berhasil jika nembak API ini, kita bypass dulu
        // if (!validPassword) return res.status(401).json({ success: false, message: 'Password salah.' });

        // 3. Buat JWT Token
        // Token ini berisi payload (data ringan) yang akan dibawa-bawa oleh frontend
        const token = jwt.sign(
            { id: user.id, email: user.email }, // Payload
            process.env.JWT_SECRET || 'super-secret-key-development-only', // Secret Key
            { expiresIn: '24h' } // Token kadaluarsa dalam 24 jam (keamanan tambahan)
        );

        res.status(200).json({
            success: true,
            message: 'Login berhasil.',
            token: token,
            user: { id: user.id, name: user.full_name, email: user.email }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
    }
});


// 1. Health Check Endpoint (Penting untuk hosting gratisan untuk mengecek server hidup)
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString(), message: 'FinanceFlow API is running smoothly.' });
});

// 2. Dashboard Data Endpoint (Menggabungkan beberapa data untuk UI Frontend sekaligus)
// Dalam skenario nyata, endpoint ini harus dilindungi middleware Auth (misal: verifyToken)
// KINI DILINDUNGI: Menambahkan verifyToken agar hanya yang punya JWT yang bisa akses
app.get('/api/dashboard', verifyToken, async (req, res) => {
    // Sekarang userId tidak diambil dari param URL, tapi dari token JWT yang sudah diverifikasi (SANGAT AMAN)
    const targetUserId = req.user.id; 

    try {
        /*
          --- SIMULASI QUERY DATABASE ---
          Di aplikasi nyata (production), Anda akan menggunakan transaksi SQL untuk menjalankan semua query ini secara efisien
          dan aman.
        */
        
        // A. Ambil Total Saldo dari tabel Accounts
        // const accountsQuery = await pool.query('SELECT SUM(balance) as total_saldo FROM accounts WHERE user_id = $1', [targetUserId]);
        // const totalSaldoRaw = accountsQuery.rows[0]?.total_saldo || 25785000;
        
        // B. Ambil Pemasukan & Pengeluaran Bulan Ini dari tabel Transactions
        // const currentMonth = new Date().getMonth() + 1;
        // const currentYear = new Date().getFullYear();
        // const txQuery = await pool.query(`
        //     SELECT 
        //         SUM(CASE WHEN t.amount > 0 AND c.type = 'INCOME' THEN t.amount ELSE 0 END) as total_pemasukan,
        //         SUM(CASE WHEN t.amount > 0 AND c.type = 'EXPENSE' THEN t.amount ELSE 0 END) as total_pengeluaran
        //     FROM transactions t
        //     JOIN categories c ON t.category_id = c.id
        //     WHERE t.user_id = $1 AND EXTRACT(MONTH FROM t.transaction_date) = $2 AND EXTRACT(YEAR FROM t.transaction_date) = $3
        // `, [targetUserId, currentMonth, currentYear]);
        
        // Data Mock (Mengikuti desain UI yang Anda berikan)
        // Saya menggunakan data statis di sini agar API langsung jalan saat di-deploy
        // tanpa perlu menunggu Anda melakukan migrasi tabel SQL.
        const dashboardData = {
            kpi: {
                totalSaldo: "Rp 25.785.000",
                pemasukan: "Rp 0",
                pengeluaran: "Rp 940.000",
                rasioTabungan: "0.0%",
                nilaiKekayaan: "Rp 25.785.000",
                statusKeuangan: 20
            },
            upcomingBills: [
                { id: 1, name: "Netflix", amount: "Rp 57.000", due: "Due in 2d", progress: 80, color: "bg-red-500" },
                { id: 2, name: "Cicilan Nmax", amount: "Rp 1.785.000", due: "Due in 3d", progress: 60, color: "bg-blue-500" }
            ],
            recentTransactions: [
                { id: 1, date: "10 Jul", category: "Belanja", amount: "-Rp 450.000", color: "text-red-500" },
                { id: 2, date: "Kemarin", category: "Lainnya", amount: "-Rp 210.000", color: "text-red-500" },
                { id: 3, date: "1 Jul", category: "Makan & M...", amount: "-Rp 280.000", color: "text-red-500" }
            ],
            accountBalances: [
                { id: 1, name: "BCA", amount: "Rp 18.060.000", logo: "bg-blue-600" },
                { id: 2, name: "Gopay", amount: "Rp 7.725.000", logo: "bg-green-500" }
            ],
            expenseDetails: [
                { label: 'Belanja', value: 50, color: '#3b82f6' },
                { label: 'Lainnya', value: 20, color: '#ef4444' },
                { label: 'Makan & Minum', value: 30, color: '#10b981' }
            ]
        };

        res.status(200).json({ success: true, data: dashboardData });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ success: false, message: 'Internal server error fetching dashboard data.' });
    }
});

// 3. Menambahkan Transaksi Baru (Contoh endpoint POST)
app.post('/api/transactions', async (req, res) => {
    const { userId, accountId, categoryId, amount, description, type, transactionDate } = req.body;
    
    // Validasi sederhana
    if (!userId || !amount || !accountId || !categoryId) {
        return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }

    try {
        // --- LOGIKA DATABASE ---
        // 1. BEGIN TRANSACTION
        // 2. INSERT INTO transactions (user_id, account_id, category_id, amount, description, transaction_date)
        // 3. UPDATE accounts SET balance = balance + (atau -) amount WHERE id = account_id
        // 4. COMMIT TRANSACTION

        // Simulasi respon sukses
        res.status(201).json({ 
            success: true, 
            message: 'Transaction successfully added.',
            data: {
                id: 'new-uuid', // Seharusnya digenerate oleh DB
                amount: amount,
                date: transactionDate || new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error adding transaction:', error);
        // ROLLBACK TRANSACTION
        res.status(500).json({ success: false, message: 'Failed to add transaction.' });
    }
});

// Handle rute yang tidak ada
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'API Endpoint not found.' });
});

// Mulai Server
app.listen(port, () => {
    console.log(`🚀 FinanceFlow Backend Server is running on port ${port}`);
    console.log(`   Health Check: http://localhost:${port}/api/health`);
    console.log(`   Dashboard API: http://localhost:${port}/api/dashboard/demo`);
});