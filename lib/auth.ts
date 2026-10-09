/**
 * Client-side auth utilities for Convex Auth with email/password.
 *
 * These functions wrap the Convex Auth signIn/signOut actions
 * for use in React components via useAuthActions().
 *
 * Usage (inside a component rendered within ConvexAuthNextjsProvider):
 *
 *   import { useAuthActions } from "@convex-dev/auth/react";
 *   import { register, login, logout } from "@/lib/auth";
 *
 *   const { signIn, signOut } = useAuthActions();
 *   await register(signIn, { email, password, name, role: "parent" });
 *   await login(signIn, { email, password });
 *   await logout(signOut);
 */


type SignIn = (
  provider: string,
  params?: Record<string, unknown>,
) => Promise<{ signingIn: boolean }>;

type SignOut = () => Promise<void>;

// ── Registration ────────────────────────────────────────────────────────────

export interface RegisterParams {
  email: string;
  password: string;
  name: string;
  // Les seuls rôles qu'un formulaire public crée (`convex/openAccessRules.ts`).
  // Un compte élève est créé par un parent ou un professeur.
  role: "parent" | "professeur" | "directeur";
}

/**
 * Register a new user with email and password.
 * A profile row (with the given role) is created automatically on the backend.
 */
export async function register(
  signIn: SignIn,
  params: RegisterParams,
): Promise<{ signingIn: boolean }> {
  return signIn("password", {
    flow: "signUp",
    email: params.email,
    password: params.password,
    name: params.name,
    role: params.role,
  });
}

// ── Login ───────────────────────────────────────────────────────────────────

export interface LoginParams {
  email: string;
  password: string;
}

/**
 * Sign in an existing user with email and password.
 */
export async function login(
  signIn: SignIn,
  params: LoginParams,
): Promise<{ signingIn: boolean }> {
  return signIn("password", {
    flow: "signIn",
    email: params.email,
    password: params.password,
  });
}

// ── Logout ──────────────────────────────────────────────────────────────────

/**
 * Sign out the current user (invalidates the session).
 */
export async function logout(signOut: SignOut): Promise<void> {
  return signOut();
}

// ── Clear cached tokens ────────────────────────────────────────────────────

/**
 * Remove all Convex Auth tokens from localStorage.
 * Call this on logout so the next sign-in starts clean — prevents the
 * ConvexReactClient from re-using a stale JWT from the previous session.
 */
export function clearConvexAuthTokens(): void {
  if (typeof window === "undefined") return;
  const keys = Object.keys(localStorage);
  for (const key of keys) {
    if (key.startsWith("__convexAuth")) {
      localStorage.removeItem(key);
    }
  }
}

// ── Role-based home path ────────────────────────────────────────────────────

export type Role = "admin" | "parent" | "student" | "professeur" | "directeur";

/**
 * Returns the default landing path for a given profile role.
 * Used by /post-auth to route users after login or signup.
 */
export function roleHomePath(role: Role | null | undefined): string {
  switch (role) {
    case "admin":
      return "/admin/dashboard";
    case "parent":
      return "/parent/dashboard";
    case "professeur":
      return "/teacher/dashboard";
    case "directeur":
      return "/school/dashboard";
    case "student":
      return "/student/home";
    default:
      return "/login";
  }
}
