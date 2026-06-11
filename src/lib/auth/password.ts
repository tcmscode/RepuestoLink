import bcrypt from "bcryptjs";
import { BUSINESS_RULES } from "@/lib/config/business";

export function validatePassword(password: string): string | null {
  if (password.length < BUSINESS_RULES.passwordMinLength) {
    return `La contraseña debe tener al menos ${BUSINESS_RULES.passwordMinLength} caracteres`;
  }
  if (!/[a-z]/.test(password)) return "Incluí al menos una minúscula";
  if (!/[A-Z]/.test(password)) return "Incluí al menos una mayúscula";
  if (!/[0-9]/.test(password)) return "Incluí al menos un número";
  return null;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BUSINESS_RULES.bcryptRounds);
}
