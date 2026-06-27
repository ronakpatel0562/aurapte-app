const encoder = new TextEncoder();

async function getSigningKey(secret: string): Promise<CryptoKey> {
  const keyData = encoder.encode(secret);
  return crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/**
 * Signs a session UUID with HMAC SHA-256.
 * Returns `${sessionId}.${signature}`.
 */
export async function signSessionId(
  sessionId: string,
  secret: string
): Promise<string> {
  const key = await getSigningKey(secret);
  const data = encoder.encode(sessionId);
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, data);
  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  const signatureB64 = btoa(String.fromCharCode(...signatureArray))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `${sessionId}.${signatureB64}`;
}

/**
 * Verifies a signed session ID cookie and returns the clean sessionId if valid,
 * or null if invalid or tampered with.
 */
export async function verifySessionId(
  signedValue: string,
  secret: string
): Promise<string | null> {
  if (!signedValue) return null;
  const parts = signedValue.split(".");
  if (parts.length !== 2) return null;

  const [sessionId, signatureB64] = parts;
  const key = await getSigningKey(secret);
  const data = encoder.encode(sessionId);
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, data);
  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  const expectedSignatureB64 = btoa(String.fromCharCode(...signatureArray))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  if (signatureB64 === expectedSignatureB64) {
    return sessionId;
  }
  return null;
}
