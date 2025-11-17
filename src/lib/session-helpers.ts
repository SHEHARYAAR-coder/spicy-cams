// This file contains type definitions for common patterns used across the application
import { Session } from "next-auth";

// Extended session user type with additional properties
export interface ExtendedSessionUser {
  id: string;
  email?: string | null;
  name?: string | null;
  role?: string;
  emailVerified?: boolean;
  image?: string | null;
}

// Helper to get user info from session safely
export function getSessionUser(
  session: Session | null
): ExtendedSessionUser | null {
  if (!session?.user) return null;

  return session.user as ExtendedSessionUser;
}

// Helper to check authorization
export function isAdmin(session: Session | null): boolean {
  const user = getSessionUser(session);
  return user?.role === "ADMIN";
}

export function isModerator(session: Session | null): boolean {
  const user = getSessionUser(session);
  return user?.role === "MODERATOR" || user?.role === "ADMIN";
}
