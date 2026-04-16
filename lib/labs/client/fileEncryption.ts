"use client";

const PBKDF2_ITERATIONS = 100_000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;

async function deriveKey(
  password: string,
  salt: Uint8Array,
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptFile(
  fileBuffer: ArrayBuffer,
  password: string,
): Promise<ArrayBuffer> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(password, salt);

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    fileBuffer,
  );

  const output = new Uint8Array(SALT_LENGTH + IV_LENGTH + ciphertext.byteLength);
  output.set(salt, 0);
  output.set(iv, SALT_LENGTH);
  output.set(new Uint8Array(ciphertext), SALT_LENGTH + IV_LENGTH);
  return output.buffer;
}

export async function decryptFile(
  encryptedBuffer: ArrayBuffer,
  password: string,
): Promise<ArrayBuffer> {
  const data = new Uint8Array(encryptedBuffer);
  const salt = data.slice(0, SALT_LENGTH);
  const iv = data.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const ciphertext = data.slice(SALT_LENGTH + IV_LENGTH);
  const key = await deriveKey(password, salt);

  return crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
}
