import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Serve JSON and form data with high size limits for base64 KTP/KK image uploads
  app.use(express.json({ limit: '60mb' }));
  app.use(express.urlencoded({ limit: '60mb', extended: true }));

  const dbPath = path.join(process.cwd(), 'local-db.json');

  // Helper to read JSON database safely
  const readDb = () => {
    try {
      if (fs.existsSync(dbPath)) {
        const fileContent = fs.readFileSync(dbPath, 'utf8');
        if (fileContent.trim()) {
          return JSON.parse(fileContent);
        }
      }
    } catch (err) {
      console.error('Error reading offline storage file:', err);
    }
    return {};
  };

  // Helper to write JSON database safely
  const writeDb = (data: any) => {
    try {
      fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
      return true;
    } catch (err) {
      console.error('Error writing offline storage file:', err);
      return false;
    }
  };

  // Helper to get non-internal IPv4 addresses for easy local network connections
  const getLocalIps = () => {
    const interfaces = os.networkInterfaces();
    const ips: string[] = [];
    for (const name of Object.keys(interfaces)) {
      const ifaceList = interfaces[name];
      if (ifaceList) {
        for (const iface of ifaceList) {
          if (iface.family === 'IPv4' && !iface.internal) {
            ips.push(iface.address);
          }
        }
      }
    }
    return ips;
  };

  // Enable CORS headers to allow connection from separate local IP addresses or browsers
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // REST API Endpoints

  // 1. Check local sync status and retrieve host machine IPs
  app.get('/api/local-sync/status', (req, res) => {
    res.json({
      status: 'online',
      message: 'Server Penyimpanan Bersama RT 08 Sidoarjo Aktif',
      localIps: getLocalIps(),
      port: PORT,
      dbExists: fs.existsSync(dbPath),
      lastUpdated: readDb().lastUpdated || null
    });
  });

  // 2. Fetch full stored data
  app.get('/api/local-sync/data', (req, res) => {
    const dbData = readDb();
    res.json({
      success: true,
      data: dbData
    });
  });

  // 3. Save/Update full synchronized dataset
  app.post('/api/local-sync/save', (req, res) => {
    const clientPayload = req.body;
    const dbData = readDb();

    const timestamp = new Date().toISOString();
    const updatedDb = {
      ...dbData,
      ...clientPayload,
      lastUpdated: timestamp
    };

    const success = writeDb(updatedDb);
    res.json({
      success,
      timestamp,
      message: success ? 'Data tersimpan di penyimpanan bersama HP/PC Server' : 'Gagal menulis berkas database lokal'
    });
  });

  // Vite middleware setup based on environment
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server Penyimpanan Bersama berjalan di http://0.0.0.0:${PORT}`);
    console.log(`Dapat diakses perangkat lain melalui IP lokal:`);
    getLocalIps().forEach((ip) => {
      console.log(`  http://${ip}:${PORT}`);
    });
  });
}

startServer();
