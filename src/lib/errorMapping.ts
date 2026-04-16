/**
 * Maps raw backend errors to user-friendly messages.
 * Full technical details are always logged to console separately.
 */

export function getUserFriendlyError(source: string, errorMessage: string): string {
  const msg = errorMessage.toLowerCase();
  const label = source.toLowerCase();

  // Auth / session errors
  if (
    msg.includes("jwt") ||
    msg.includes("token") ||
    msg.includes("session") ||
    msg.includes("not authenticated") ||
    msg.includes("unauthorized")
  ) {
    return "Your session expired. Please sign in again.";
  }

  // Network errors
  if (
    msg.includes("failed to fetch") ||
    msg.includes("networkerror") ||
    msg.includes("network request failed") ||
    msg.includes("load failed") ||
    msg.includes("err_internet_disconnected")
  ) {
    return "Network error. Check your connection and try again.";
  }

  // Database / policy errors (should never leak to users)
  if (
    msg.includes("infinite recursion") ||
    msg.includes("policy") ||
    msg.includes("permission denied") ||
    msg.includes("row-level security") ||
    msg.includes("rls")
  ) {
    return `We couldn't load ${label} right now. Please try again.`;
  }

  // Constraint / validation errors
  if (
    msg.includes("duplicate key") ||
    msg.includes("unique constraint") ||
    msg.includes("violates")
  ) {
    return `We couldn't save your ${label} data. It may already exist.`;
  }

  // Timeout
  if (msg.includes("timeout") || msg.includes("timed out")) {
    return `Loading ${label} took too long. Please try again.`;
  }

  // Rate limiting
  if (msg.includes("rate limit") || msg.includes("too many requests")) {
    return "Too many requests. Please wait a moment and try again.";
  }

  // Default fallback
  return `Something went wrong loading ${label}. Please try again.`;
}
