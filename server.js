const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ------------------------------------------------------------
// 1. INISIALISASI DATABASE SQLITE
// ------------------------------------------------------------
const db = new sqlite3.Database('./erab.db', (err) => {
  if (err) console.error('Error membuka database:', err.message);
  else console.log('⚡ Connected to SQLite Database (erab.db)');
});

db.serialize(() => {
  // Buat Tabel
  db.run(`CREATE TABLE IF NOT EXISTS material (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama_material TEXT NOT NULL,
    satuan TEXT NOT NULL,
    harga_satuan REAL NOT NULL,
    kategori TEXT CHECK(kategori IN ('MATERIAL', 'UPAH', 'ALAT'))
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS pekerjaan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kategori TEXT NOT NULL,
    nama_pekerjaan TEXT NOT NULL,
    satuan_pekerjaan TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS ahs_detail (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pekerjaan_id INTEGER,
    material_id INTEGER,
    koefisien REAL NOT NULL,
    FOREIGN KEY (pekerjaan_id) REFERENCES pekerjaan(id),
    FOREIGN KEY (material_id) REFERENCES material(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS proyek (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama_proyek TEXT NOT NULL,
    lokasi TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS item_rab (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    proyek_id INTEGER,
    pekerjaan_id INTEGER,
    volume REAL NOT NULL,
    FOREIGN KEY (proyek_id) REFERENCES proyek(id),
    FOREIGN KEY (pekerjaan_id) REFERENCES pekerjaan(id)
  )`);

  // Auto-Seeding Master Data SNI Lengkap
  db.get('SELECT COUNT(*) AS count FROM material', [], (err, row) => {
    if (err) {
      console.error('Error checking material count:', err.message);
      return;
    }

    if (row && row.count === 0) {
      console.log('🌱 Seeding Master Data SNI Super Lengkap...');

      // A. Master Material & Upah
      db.run(`INSERT INTO material (id, nama_material, satuan, harga_satuan, kategori) VALUES
        (1, 'Semen Portlands (PPC 50kg)', 'Zak', 65000, 'MATERIAL'),
        (2, 'Pasir Pasang / Beton', 'm3', 250000, 'MATERIAL'),
        (3, 'Pasir Urug', 'm3', 180000, 'MATERIAL'),
        (4, 'Batu Kali', 'm3', 220000, 'MATERIAL'),
        (5, 'Kerikil / Split', 'm3', 270000, 'MATERIAL'),
        (6, 'Batako Pres 10x20x40', 'Buah', 3500, 'MATERIAL'),
        (7, 'Semen Acian', 'Zak', 75000, 'MATERIAL'),
        (8, 'Besi Beton Polos', 'Kg', 14000, 'MATERIAL'),
        (9, 'Kawat Beton', 'Kg', 22000, 'MATERIAL'),
        (10, 'Kayu Begisting / Bekisting', 'm3', 2100000, 'MATERIAL'),
        (11, 'Paku 5-10cm', 'Kg', 20000, 'MATERIAL'),
        (12, 'Rangka Atap Baja Ringan C75', 'm2', 140000, 'MATERIAL'),
        (13, 'Genteng Metal / Spandek', 'm2', 85000, 'MATERIAL'),
        (14, 'Plafon Gypsum 9mm + Rangka Hollow', 'm2', 95000, 'MATERIAL'),
        (15, 'Keramik Teraso / Polos 40x40', 'Dus', 68000, 'MATERIAL'),
        (16, 'Semen Warna / Grout Tile', 'Kg', 15000, 'MATERIAL'),
        (17, 'Cat Tembok Setara Vinilex', 'Kg', 35000, 'MATERIAL'),
        (18, 'Plamir Tembok', 'Kg', 20000, 'MATERIAL'),
        (19, 'Kayu Kaso 5/7 Bouwplank', 'm3', 2300000, 'MATERIAL'),
        (20, 'Papan Kayu 2/20 Bouwplank', 'm3', 2600000, 'MATERIAL'),
        (21, 'Pekerja / Kuli', 'OH', 100000, 'UPAH'),
        (22, 'Tukang Batu', 'OH', 130000, 'UPAH'),
        (23, 'Tukang Kayu', 'OH', 130000, 'UPAH'),
        (24, 'Tukang Besi', 'OH', 130000, 'UPAH'),
        (25, 'Tukang Cat', 'OH', 130000, 'UPAH'),
        (26, 'Kepala Tukang', 'OH', 150000, 'UPAH'),
        (27, 'Mandor', 'OH', 160000, 'UPAH')`);

      // B. Master Pekerjaan (12 Item)
      db.run(`INSERT INTO pekerjaan (id, kategori, nama_pekerjaan, satuan_pekerjaan) VALUES
        (1, 'Persiapan', 'Pembersihan Lahan / Lapangan', 'm2'),
        (2, 'Persiapan', 'Pengukuran & Pemasangan Bouwplank', 'm1'),
        (3, 'Galian & Tanah', 'Galian Tanah Pondasi Biasa', 'm3'),
        (4, 'Galian & Tanah', 'Urugan Pasir Bawah Pondasi / Lantai', 'm3'),
        (5, 'Pondasi', 'Pasangan Pondasi Batu Kali 1:4', 'm3'),
        (6, 'Beton & Struktur', 'Beton Bertulang Sloof 15/20 (K-175)', 'm3'),
        (7, 'Dinding', 'Pasangan Dinding Batako 1:4', 'm2'),
        (8, 'Finishing Dinding', 'Plesteran Dinding 1:4 (Tebal 15mm)', 'm2'),
        (9, 'Finishing Dinding', 'Acian Dinding Semen', 'm2'),
        (10, 'Atap & Plafon', 'Pasangan Rangka Atap Baja Ringan + Genteng', 'm2'),
        (11, 'Lantai', 'Pasangan Lantai Keramik 40x40', 'm2'),
        (12, 'Pengecatan', 'Pengecatan Tembok Baru (1 Lapis Plamir + 2 Lapis Cat)', 'm2')`);

      // C. Resep AHS SNI
      db.run(`INSERT INTO ahs_detail (pekerjaan_id, material_id, koefisien) VALUES (1, 21, 0.1000), (1, 27, 0.0500)`);
      db.run(`INSERT INTO ahs_detail (pekerjaan_id, material_id, koefisien) VALUES (2, 19, 0.0120), (2, 20, 0.0070), (2, 11, 0.0200), (2, 21, 0.1000), (2, 23, 0.1000), (2, 27, 0.0050)`);
      db.run(`INSERT INTO ahs_detail (pekerjaan_id, material_id, koefisien) VALUES (3, 21, 0.7500), (3, 27, 0.0250)`);
      db.run(`INSERT INTO ahs_detail (pekerjaan_id, material_id, koefisien) VALUES (4, 3, 1.2000), (4, 21, 0.3000), (4, 27, 0.0100)`);
      db.run(`INSERT INTO ahs_detail (pekerjaan_id, material_id, koefisien) VALUES (5, 4, 1.2000), (5, 1, 3.2600), (5, 2, 0.5200), (5, 21, 1.5000), (5, 22, 0.7500), (5, 26, 0.0750), (5, 27, 0.0750)`);
      db.run(`INSERT INTO ahs_detail (pekerjaan_id, material_id, koefisien) VALUES (6, 1, 6.8000), (6, 2, 0.5400), (6, 5, 0.8100), (6, 8, 120.0000), (6, 9, 2.0000), (6, 10, 0.2700), (6, 11, 2.0000), (6, 21, 1.6500), (6, 22, 0.2750), (6, 24, 0.3500), (6, 27, 0.0800)`);
      db.run(`INSERT INTO ahs_detail (pekerjaan_id, material_id, koefisien) VALUES (7, 6, 12.5000), (7, 1, 0.2500), (7, 2, 0.0350), (7, 21, 0.3000), (7, 22, 0.1000), (7, 27, 0.0150)`);
      db.run(`INSERT INTO ahs_detail (pekerjaan_id, material_id, koefisien) VALUES (8, 1, 0.1240), (8, 2, 0.0240), (8, 21, 0.3000), (8, 22, 0.1500), (8, 27, 0.0150)`);
      db.run(`INSERT INTO ahs_detail (pekerjaan_id, material_id, koefisien) VALUES (9, 7, 0.0650), (9, 21, 0.2000), (9, 22, 0.1000), (9, 27, 0.0100)`);
      db.run(`INSERT INTO ahs_detail (pekerjaan_id, material_id, koefisien) VALUES (10, 12, 1.1000), (10, 13, 1.0500), (10, 21, 0.1000), (10, 23, 0.2000), (10, 27, 0.0100)`);
      db.run(`INSERT INTO ahs_detail (pekerjaan_id, material_id, koefisien) VALUES (11, 15, 1.0500), (11, 1, 0.2000), (11, 2, 0.0450), (11, 16, 1.5000), (11, 21, 0.7000), (11, 22, 0.3500), (11, 27, 0.0350)`);
      db.run(`INSERT INTO ahs_detail (pekerjaan_id, material_id, koefisien) VALUES (12, 18, 0.1000), (12, 17, 0.2600), (12, 21, 0.0200), (12, 25, 0.0630), (12, 27, 0.0025)`);
      
      console.log('✅ Seeding Selesai!');
    }
  });
});

// ------------------------------------------------------------
// 2. ENDPOINTS REST API
// ------------------------------------------------------------

// Get Master Pekerjaan
app.get('/api/pekerjaan', (req, res) => {
  db.all('SELECT * FROM pekerjaan', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Buat Proyek Baru
app.post('/api/projects', (req, res) => {
  const { nama_proyek, lokasi } = req.body;
  db.run('INSERT INTO proyek (nama_proyek, lokasi) VALUES (?, ?)', [nama_proyek, lokasi], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, nama_proyek, lokasi });
  });
});

// Tambah Item Pekerjaan & Volume ke Proyek
app.post('/api/projects/:id/items', (req, res) => {
  const proyek_id = req.params.id;
  const { pekerjaan_id, volume } = req.body;
  db.run('INSERT INTO item_rab (proyek_id, pekerjaan_id, volume) VALUES (?, ?, ?)', [proyek_id, pekerjaan_id, volume], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Item pekerjaan berhasil ditambahkan' });
  });
});

// Get Laporan RAB & Shopping List (Kalkulasi Otomatis)
app.get('/api/projects/:id/report', (req, res) => {
  const proyek_id = req.params.id;

  const queryItems = `
    SELECT ir.id, p.nama_pekerjaan, p.satuan_pekerjaan, ir.volume
    FROM item_rab ir
    JOIN pekerjaan p ON ir.pekerjaan_id = p.id
    WHERE ir.proyek_id = ?
  `;

  const queryShoppingList = `
    SELECT 
      m.nama_material,
      m.kategori,
      m.satuan,
      ROUND(SUM(ir.volume * ahs.koefisien), 2) AS total_kebutuhan,
      m.harga_satuan,
      ROUND(SUM(ir.volume * ahs.koefisien * m.harga_satuan), 2) AS total_biaya
    FROM item_rab ir
    JOIN ahs_detail ahs ON ir.pekerjaan_id = ahs.pekerjaan_id
    JOIN material m ON ahs.material_id = m.id
    WHERE ir.proyek_id = ?
    GROUP BY m.id, m.nama_material, m.kategori, m.satuan, m.harga_satuan
    ORDER BY m.kategori ASC, total_biaya DESC
  `;

  db.all(queryItems, [proyek_id], (err, items) => {
    if (err) return res.status(500).json({ error: err.message });

    db.all(queryShoppingList, [proyek_id], (err, shoppingList) => {
      if (err) return res.status(500).json({ error: err.message });

      const grandTotal = shoppingList.reduce((acc, curr) => acc + curr.total_biaya, 0);

      res.json({
        items,
        shoppingList,
        grandTotal
      });
    });
  });
});

// ------------------------------------------------------------
// 3. JALANKAN SERVER
// ------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`🚀 Aplikasi e-RAB berjalan di http://localhost:${PORT}`);
});
