import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import os from 'os';

// Try to load .env.local from project root first, then backend/.env
const rootEnvPath = path.join(__dirname, '../../.env.local');
const backendEnvPath = path.join(__dirname, '../.env');

if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
  console.log(`[tvdcontrol-backend] env file: ${rootEnvPath}`);
} else if (fs.existsSync(backendEnvPath)) {
  dotenv.config({ path: backendEnvPath });
  console.log(`[tvdcontrol-backend] env file: ${backendEnvPath}`);
} else {
  dotenv.config();
}

function getIpAddress(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const iface = interfaces[name];
    if (!iface) continue;
    for (const addr of iface) {
      if (addr.family === 'IPv4' && !addr.internal) {
        return addr.address;
      }
    }
  }
  return 'localhost';
}

export const config = {
  port: parseInt(process.env.PORT || '8080', 10),
  corsOrigin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim())
    : [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:5173',
        `http://${os.hostname()}:3000`,
        `http://${os.hostname()}:3001`,
        `http://${os.hostname()}:5173`,
        `http://${getIpAddress()}:3000`,
        `http://${getIpAddress()}:3001`,
        `http://${getIpAddress()}:5173`,
      ],
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tvdcontrol',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret',
    expiresInSeconds: parseInt(process.env.JWT_EXPIRES_IN || '86400', 10),
    refreshExpiresInSeconds: parseInt(process.env.JWT_REFRESH_EXPIRES_IN || '2592000', 10),
    refreshCookieName: process.env.JWT_REFRESH_COOKIE || 'tvdcontrol.refresh',
  },
};

// Log DB config (without password) for debugging
console.log(
  `[tvdcontrol-backend] db: ${config.db.user}@${config.db.host}:${config.db.port}/${config.db.database} ssl=false`
);


