import { Secret, TOTP } from "otpauth";

export function newMfaSecret(): string {
  return new Secret({ size: 20 }).base32;
}

export function totpFor(secret: string, email: string): TOTP {
  return new TOTP({
    issuer: "Visaed Scholarships",
    label: email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret,
  });
}

export function verifyTotp(secret: string, email: string, code: string): boolean {
  const delta = totpFor(secret, email).validate({ token: code.replace(/\s/g, ""), window: 1 });
  return delta !== null;
}
