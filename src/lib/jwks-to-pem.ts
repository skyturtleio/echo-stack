/**
 * JWKS to PEM Conversion Utility
 *
 * Converts JWK (JSON Web Key) format to PEM format for Triplit integration.
 * Supports Ed25519 keys used by BetterAuth.
 */

import { Buffer } from "buffer"

export interface JWK {
  kty: string
  crv: string
  x: string
  use?: string
  alg?: string
  kid?: string
}

export interface JWKS {
  keys: JWK[]
}

/**
 * Convert base64url to buffer
 */
function base64urlToBuffer(base64url: string): Buffer {
  // Add padding if needed
  const padding = "=".repeat((4 - (base64url.length % 4)) % 4)
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/") + padding
  return Buffer.from(base64, "base64")
}

/**
 * Convert Ed25519 JWK to PEM format
 */
function ed25519JwkToPem(jwk: JWK): string {
  if (jwk.kty !== "OKP" || jwk.crv !== "Ed25519") {
    throw new Error("Only Ed25519 OKP keys are supported")
  }

  if (!jwk.x) {
    throw new Error("Missing x parameter in JWK")
  }

  // Decode the x parameter (public key)
  const publicKeyBytes = base64urlToBuffer(jwk.x)

  // Ed25519 public key ASN.1 DER encoding
  // OID for Ed25519: 1.3.101.112
  const oid = Buffer.from([
    0x30, 0x2a, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x03, 0x21, 0x00,
  ])
  const derEncoded = Buffer.concat([oid, publicKeyBytes])

  // Convert to PEM format
  const base64Der = derEncoded.toString("base64")
  const pem = `-----BEGIN PUBLIC KEY-----\n${base64Der.match(/.{1,64}/g)?.join("\n")}\n-----END PUBLIC KEY-----`

  return pem
}

/**
 * Convert JWKS response to PEM format
 * Returns the first Ed25519 key found
 */
export function jwksToPem(jwks: JWKS): string {
  const ed25519Key = jwks.keys.find(
    (key) => key.kty === "OKP" && key.crv === "Ed25519",
  )

  if (!ed25519Key) {
    throw new Error("No Ed25519 key found in JWKS")
  }

  return ed25519JwkToPem(ed25519Key)
}

/**
 * Fetch JWKS from URL and convert to PEM
 */
export async function fetchJwksAsPem(jwksUrl: string): Promise<string> {
  const response = await fetch(jwksUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch JWKS: ${response.statusText}`)
  }

  const jwks = (await response.json()) as JWKS
  return jwksToPem(jwks)
}

/**
 * Extract PEM from local BetterAuth instance
 */
export async function extractPemFromBetterAuth(
  baseUrl: string,
): Promise<string> {
  const jwksUrl = `${baseUrl}/api/auth/jwks`
  return fetchJwksAsPem(jwksUrl)
}
