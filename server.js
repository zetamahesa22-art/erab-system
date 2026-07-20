const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Koneksi Database PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Inisialisasi Tabel
const initDb = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS proyek (
        id SERIAL PRIMARY KEY,
        nama_proyek VARCHAR(255) NOT NULL,
        lokasi VARCHAR(255),
        pemilik VARCHAR(255),
        tanggal VARCHAR(50),
        total_rab NUMERIC DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS item_rab (
        id SERIAL PRIMARY KEY,
        proyek_id INT REFERENCES proyek(id) ON DELETE CASCADE,
        kategori VARCHAR(100),
        uraian_pekerjaan VARCHAR(255) NOT NULL,
        volume NUMERIC NOT NULL,
        satuan VARCHAR(50) NOT NULL,
        harga_satuan NUMERIC NOT NULL,
        total_harga NUMERIC NOT NULL
      );
    `);
    console.log('Tabel database PostgreSQL siap.');
  } catch (err) {
    console.error('Gagal membuat tabel:', err.message);
  }
};
initDb();

// ==========================================
// ENDPOINT API (Mendukung /proyek dan /projects)
// ==========================================

const handleGetProyek = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM proyek ORDER BY id DESC');
    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const handlePostProyek = async (req, res) => {
  const { nama_proyek, lokasi, pemilik, tanggal, name } = req.body;
  const nama = nama_proyek || name;
  try {
    const result = await pool.query(
      'INSERT INTO proyek (nama_proyek, lokasi, pemilik, tanggal) VALUES ($1, $2, $3, $4) RETURNING id',
      [nama, lokasi, pemilik, tanggal]
    );
    res.json({ message: 'Proyek berhasil ditambahkan', id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

app.get('/api/proyek', handleGetProyek);
app.get('/api/projects', handleGetProyek);

app.post('/api/proyek', handlePostProyek);
app.post('/api/projects', handlePostProyek);

// Handler RAB
app.get('/api/rab/:proyek_id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM item_rab WHERE proyek_id = $1', [req.params.proyek_id]);
    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/rab', async (req, res) => {
  const { proyek_id, project_id, kategori, uraian_pekerjaan, volume, satuan, harga_satuan } = req.body;
  const pId = proyek_id || project_id;
  const total_harga = volume * harga_satuan;

  try {
    const result = await pool.query(
      `INSERT INTO item_rab (proyek_id, kategori, uraian_pekerjaan, volume, satuan, harga_satuan, total_harga)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [pId, kategori, uraian_pekerjaan, volume, satuan, harga_satuan, total_harga]
    );

    await pool.query(
      'UPDATE proyek SET total_rab = (SELECT SUM(total_harga) FROM item_rab WHERE proyek_id = $1) WHERE id = $1',
      [pId]
    );

    res.json({ message: 'Item RAB berhasil ditambahkan', id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/rab/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM item_rab WHERE id = $1', [req.params.id]);
    res.json({ message: 'Item berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server e-RAB berjalan di port ${PORT}`);
});
