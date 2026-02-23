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

const isProduction = process.env.NODE_ENV === 'production';

const vercelUrl = process.env.VERCEL_URL;
const vercelOrigins = vercelUrl
  ? [`https://${vercelUrl}`, `https://www.${vercelUrl}`]
  : [];

function isPrivateIpv4(hostname: string): boolean {
  const match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!match) return false;
  const octets = match.slice(1).map((part) => Number(part));
  if (octets.some((octet) => Number.isNaN(octet) || octet < 0 || octet > 255)) return false;

  const [a, b] = octets;
  if (a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 169 && b === 254) return true;
  if (a === 127) return true;
  return false;
}

function isLocalHostname(hostname: string): boolean {
  if (hostname === 'localhost') return true;
  return isPrivateIpv4(hostname);
}

const extraCorsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean)
  : [];

export const config = {
  port: parseInt(process.env.PORT || '8080', 10),
  corsOrigin: isProduction
    ? ['https://tvdcontrol.tvdoutor.com.br', ...vercelOrigins, ...extraCorsOrigins]
    : (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (extraCorsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      try {
        const { hostname } = new URL(origin);
        if (isLocalHostname(hostname)) {
          callback(null, true);
          return;
        }
      } catch {
        // fallthrough to reject
      }
      callback(new Error('Not allowed by CORS'));
    },
  db: {
    host: process.env.DB_HOST || (isProduction ? 'tvdcontrol-mysql' : 'localhost'),
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || (isProduction ? 'tvdcontrol' : 'root'),
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tvdcontrol',
  },
  jwt: {
    secret: process.env.JWT_SECRET || (isProduction ? '' : 'dev-secret'),
    expiresInSeconds: parseInt(process.env.JWT_EXPIRES_IN || '86400', 10),
    refreshExpiresInSeconds: parseInt(process.env.JWT_REFRESH_EXPIRES_IN || '2592000', 10),
    refreshCookieName: process.env.JWT_REFRESH_COOKIE || 'tvdcontrol.refresh',
  },
};

if (isProduction && !config.jwt.secret) {
  throw new Error('[tvdcontrol-backend] JWT_SECRET is required in production');
}

// Log DB config (without password) for debugging
console.log(
  `[tvdcontrol-backend] db: ${config.db.user}@${config.db.host}:${config.db.port}/${config.db.database} ssl=false`
);


