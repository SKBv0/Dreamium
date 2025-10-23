import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Encrypted key storage for provider API keys.
// WARNING: Requires KEYRING_SECRET in environment; do NOT check encrypted blob into VCS.

const CONFIG_DIR = path.join(process.cwd(), 'config');
const STORE_FILE = path.join(CONFIG_DIR, 'keys.json.enc');

type Provider = 'openrouter' | 'ollama' | 'openrouter_model';

type StoreShape = {
  selected?: Provider;
  providers: Partial<Record<Provider, string>>; // encrypted payload holds raw keys
  ollamaModel?: string; // selected Ollama model name
};

function ensureDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

function getSecret(): Buffer {
  const secret = process.env.KEYRING_SECRET || '';
  if (!secret) throw new Error('KEYRING_SECRET is missing');
  // Derive 32 bytes key from secret using SHA-256
  return crypto.createHash('sha256').update(secret).digest();
}

function encrypt(json: any): Buffer {
  const key = getSecret();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const plaintext = Buffer.from(JSON.stringify(json), 'utf8');
  const enc = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  // format: iv(12) | tag(16) | ciphertext
  return Buffer.concat([iv, tag, enc]);
}

function decrypt(buf: Buffer): any {
  const key = getSecret();
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const ciphertext = buf.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return JSON.parse(dec.toString('utf8'));
}

function readStore(): StoreShape {
  try {
    ensureDir();
    if (!fs.existsSync(STORE_FILE)) return { providers: {} };
    const buf = fs.readFileSync(STORE_FILE);
    return decrypt(buf);
  } catch (e) {
    // On any failure, return empty store
    return { providers: {} };
  }
}

function writeStore(store: StoreShape) {
  ensureDir();
  const enc = encrypt(store);
  fs.writeFileSync(STORE_FILE, enc);
}

export function setProviderKey(provider: Provider, apiKey: string) {
  const store = readStore();
  store.providers = store.providers || {};
  store.providers[provider] = apiKey;
  writeStore(store);
}

export function setSelectedProvider(provider: Provider) {
  const store = readStore();
  store.selected = provider;
  writeStore(store);
}

export function setOllamaModel(modelName: string) {
  const store = readStore();
  store.ollamaModel = modelName;
  writeStore(store);
}

export function getOllamaModel(): string | undefined {
  const store = readStore();
  return store.ollamaModel;
}

export function getStatus(): { selected?: Provider; configured: Partial<Record<Provider, boolean>> } {
  const store = readStore();
  const configured: Partial<Record<Provider, boolean>> = {
    openrouter: !!store.providers?.openrouter,
    ollama: !!store.providers?.ollama,
  };
  return { selected: store.selected, configured };
}

// Server-only accessor (do not expose to client)
export function getProviderKey(provider: Provider): string | undefined {
  const store = readStore();
  return store.providers?.[provider];
}

