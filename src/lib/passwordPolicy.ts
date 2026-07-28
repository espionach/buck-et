import { z } from "zod";

export const PASSWORD_RULES = [
  { id: "length", label: "At least 12 characters", test: (v: string) => v.length >= 12 },
  { id: "upper", label: "An uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
  { id: "lower", label: "A lowercase letter", test: (v: string) => /[a-z]/.test(v) },
  { id: "number", label: "A number", test: (v: string) => /[0-9]/.test(v) },
] as const;

export const passwordSchema = z
  .string()
  .min(12, { message: "Password must be at least 12 characters." })
  .regex(/[A-Z]/, { message: "Password must include an uppercase letter." })
  .regex(/[a-z]/, { message: "Password must include a lowercase letter." })
  .regex(/[0-9]/, { message: "Password must include a number." });

/** Returns the first user-friendly error, or null if the password passes all rules. */
export function validatePassword(value: string): string | null {
  const result = passwordSchema.safeParse(value);
  if (result.success) return null;
  return result.error.issues[0]?.message ?? "Password is invalid.";
}

/** Detects backend "leaked password" / weak-password errors from Supabase / HIBP. */
export function isLeakedPasswordError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("pwned") ||
    m.includes("compromised") ||
    m.includes("data breach") ||
    m.includes("breach") ||
    m.includes("weak_password") ||
    m.includes("weak password")
  );
}