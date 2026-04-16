// Server actions for sign-up and sign-in.
// Called from login/signup pages via useActionState; never invoked client-side directly.
// signUpAction creates the user record then immediately signs them in so they land on /dashboard.
"use server";

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { signIn } from "@/auth";
import { Role } from "@/generated/prisma/enums";
import { AuthError, CredentialsSignin } from "next-auth";

export type ActionState = {
  error?: string;
  success?: boolean;
};

export async function signUpAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as Role;

  if (!name || !email || !password || !role) {
    return { error: "All fields are required." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  // check if a user with this email already exists
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Email already in use." };
  }
  // hash the password (never store plain text passward!)
  // Cost factor 12: ~250 ms on modern hardware — slow enough to deter brute force, fast enough for sign-up UX.
  const passwordHash = await bcrypt.hash(password, 12);

  // creat the new user in the database 
  await db.user.create({
    data: { name, email, passwordHash, role },
  });

  // Sign the new user in immediately — avoids a redundant login step after registration.
  // signIn throws NEXT_REDIRECT on success, which Next.js catches and handles as a navigation.
  await signIn("credentials", { email, password, redirectTo: "/dashboard" });

  return { success: true };
}

export async function signInAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" });
  } catch (err) {
    if (err instanceof CredentialsSignin) {
      // authorize() returned null — bad email or password
      return { error: "Invalid email or password." };
    }
    if (err instanceof AuthError) {
      // MissingSecret, CallbackRouteError (DB exception), UntrustedHost, etc.
      console.error("[signInAction] unexpected AuthError:", err.constructor.name, err.message, err.cause);
      return { error: `Auth error (${err.constructor.name}). Check server logs.` };
    }
    // NEXT_REDIRECT throws here on success — let it propagate
    throw err;
  }

  return { success: true };
}
