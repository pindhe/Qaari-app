import type { User } from "@prisma/client";

export function publicUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    streakCount: user.streakCount,
    lastLoginDate: user.lastLoginDate
      ? user.lastLoginDate.toISOString().slice(0, 10)
      : null,
  };
}
