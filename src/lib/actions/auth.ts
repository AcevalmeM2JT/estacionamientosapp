"use server";

import { signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { AuthError } from "next-auth";

const registerSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  role: z.enum(["SUPER_ADMIN", "PARKING_ADMIN", "WORKER"]).default("PARKING_ADMIN"),
});

export async function registerUser(formData: FormData) {
  try {
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      role: formData.get("role") || "PARKING_ADMIN",
    };

    const parsed = registerSchema.safeParse(data);

    if (!parsed.success) {
      return { error: parsed.error.issues[0].message };
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });

    if (existingUser) {
      return { error: "Este email ya está registrado" };
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);

    const trialEnds = new Date();
    trialEnds.setDate(trialEnds.getDate() + 30);

    await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        password_hash: passwordHash,
        role: parsed.data.role,
        trial_ends_at: trialEnds,
      },
    });

    return { success: true };
  } catch (error) {
    return { error: "Error al registrar usuario" };
  }
}

export async function loginUser(_prev: unknown, formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Email o contraseña incorrectos" };
    }
    return { error: "Error al iniciar sesión" };
  }
}

export async function logoutUser() {
  await signOut({ redirectTo: "/login" });
}
