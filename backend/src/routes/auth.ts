import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { signToken } from "../lib/jwt.js";
import { applyStreak } from "../lib/streak.js";
import { publicUser } from "../lib/serializers.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { HttpError } from "../middleware/error.js";

const router = Router();

const identifierSchema = z
  .string()
  .trim()
  .min(3)
  .max(120);

const registerSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    email: z.string().trim().email().optional(),
    phone: z.string().trim().min(7).max(20).optional(),
    password: z.string().min(6).max(100),
  })
  .refine((data) => Boolean(data.email || data.phone), {
    message: "Email or phone is required",
    path: ["email"],
  });

const loginSchema = z.object({
  identifier: identifierSchema,
  password: z.string().min(1),
});

function normalizePhone(phone: string): string {
  return phone.replace(/[\s-]/g, "");
}

router.post("/register", async (req, res) => {
  const body = registerSchema.parse(req.body);
  const email = body.email?.toLowerCase();
  const phone = body.phone ? normalizePhone(body.phone) : undefined;

  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        ...(email ? [{ email }] : []),
        ...(phone ? [{ phone }] : []),
      ],
    },
  });

  if (existing) {
    throw new HttpError(409, "An account already exists for this email or phone", "CONFLICT");
  }

  const user = await prisma.user.create({
    data: {
      name: body.name,
      email,
      phone,
      passwordHash: await bcrypt.hash(body.password, 12),
      role: "user",
    },
  });

  const withStreak = await applyStreak(user);
  res.status(201).json({
    token: signToken({ sub: user.id, role: "user" }),
    user: publicUser(withStreak),
  });
});

router.post("/login", async (req, res) => {
  const { identifier, password } = loginSchema.parse(req.body);
  const value = identifier.includes("@") ? identifier.toLowerCase() : normalizePhone(identifier);

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: value }, { phone: value }],
    },
  });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new HttpError(401, "Incorrect email/phone or password", "INVALID_CREDENTIALS");
  }

  if (user.role === "admin") {
    throw new HttpError(403, "This is a staff account. Use the admin panel instead.", "ADMIN_ONLY");
  }

  const withStreak = await applyStreak(user);
  res.json({
    token: signToken({ sub: user.id, role: user.role }),
    user: publicUser(withStreak),
  });
});

router.post("/admin-login", async (req, res) => {
  const { identifier, password } = loginSchema.parse(req.body);
  const value = identifier.includes("@") ? identifier.toLowerCase() : identifier.replace(/[\s-]/g, "");

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: value }, { phone: value }],
    },
  });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new HttpError(401, "Incorrect email or password", "INVALID_CREDENTIALS");
  }

  if (user.role !== "admin") {
    throw new HttpError(403, "This account is not an administrator", "FORBIDDEN");
  }

  res.json({
    token: signToken({ sub: user.id, role: user.role }),
    user: publicUser(user),
  });
});

router.get("/me", requireAuth, async (req: AuthedRequest, res) => {
  res.json({ user: publicUser(req.user!) });
});

/** Called by mobile apps on each authenticated launch to update the daily streak. */
router.post("/app-open", requireAuth, async (req: AuthedRequest, res) => {
  const withStreak = await applyStreak(req.user!);
  res.json({ user: publicUser(withStreak) });
});

export default router;
