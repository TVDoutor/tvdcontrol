import crypto from 'crypto';
import { config } from '../config';

export type TokenPayload = {
  sub: string;
  email: string;
  exp: number;
};

function base64UrlEncode(buffer: Buffer): string {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function base64UrlDecode(input: string): Buffer {
  let normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  while (normalized.length % 4) {
    normalized += '=';
  }
  return Buffer.from(normalized, 'base64');
}

function createSignature(segment: string): string {
  const hmac = crypto.createHmac('sha256', config.jwt.secret);
  hmac.update(segment);
  return base64UrlEncode(hmac.digest());
}

export function createAuthToken(params: { userId: string; email: string }): string {
  const payload: TokenPayload = {
    sub: params.userId,
    email: params.email,
    exp: Math.floor(Date.now() / 1000) + config.jwt.expiresInSeconds,
  };

  const payloadSegment = base64UrlEncode(Buffer.from(JSON.stringify(payload), 'utf8'));
  const signature = createSignature(payloadSegment);
  return `${payloadSegment}.${signature}`;
}

export function verifyAuthToken(token: string): TokenPayload | null {
  if (!token) return null;
  const [payloadSegment, signature] = token.split('.');
  if (!payloadSegment || !signature) {
    return null;
  }

  const expectedSignature = createSignature(payloadSegment);
  const provided = Buffer.from(signature, 'utf8');
  const expected = Buffer.from(expectedSignature, 'utf8');

  if (provided.length !== expected.length) {
    return null;
  }

  if (!crypto.timingSafeEqual(provided, expected)) {
    return null;
  }

  try {
    const payloadJson = base64UrlDecode(payloadSegment).toString('utf8');
    const payload = JSON.parse(payloadJson) as TokenPayload;
    if (!payload.sub || !payload.email || typeof payload.exp !== 'number') {
      return null;
    }
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp <= now) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function createRefreshToken(): string {
  return base64UrlEncode(crypto.randomBytes(48));
}

export function hashRefreshToken(refreshToken: string): string {
  const hmac = crypto.createHmac('sha256', config.jwt.secret);
  hmac.update('refresh:');
  hmac.update(refreshToken);
  return hmac.digest('hex');
}

export function getRefreshTokenExpiresAt(): Date {
  return new Date(Date.now() + config.jwt.refreshExpiresInSeconds * 1000);
}
