const HASH_PREFIX = '$pbkdf2$'
const ITERATIONS = 100_000

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), b => b.toString(16).padStart(2, '0')).join('')
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = Number.parseInt(hex.slice(i, i + 2), 16)
  }
  return bytes
}

export function isHashed(value: string): boolean {
  return value.startsWith(HASH_PREFIX)
}

export async function hashPassword(password: string, salt?: string): Promise<string> {
  const usedSalt = salt || bufferToHex(crypto.getRandomValues(new Uint8Array(16)).buffer)
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  const derived = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: hexToBytes(usedSalt) as BufferSource,
      iterations: ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  )
  return `${HASH_PREFIX}${usedSalt}$${bufferToHex(derived)}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (!stored) return false
  if (!isHashed(stored)) {
    return password === stored
  }
  const parts = stored.split('$')
  // $pbkdf2$salt$hash
  const salt = parts[2]
  const expected = parts[3]
  if (!salt || !expected) return false
  const hashed = await hashPassword(password, salt)
  return hashed === stored
}
