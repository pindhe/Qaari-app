import type { User } from "@prisma/client";
import { config } from "../config.js";
import { prisma } from "./prisma.js";

/** Calendar date YYYY-MM-DD in Somaliland (UTC+3 / East Africa). */
export function calendarDate(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: config.timeZone }).format(date);
}

function shiftDate(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d + days));
  return utc.toISOString().slice(0, 10);
}

function toDateOnly(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00.000Z`);
}

export async function applyStreak(user: User): Promise<User> {
  const today = calendarDate();
  const last = user.lastLoginDate
    ? user.lastLoginDate.toISOString().slice(0, 10)
    : null;

  let streakCount = user.streakCount;

  if (last === today) {
    return user;
  }

  if (last === shiftDate(today, -1)) {
    streakCount += 1;
  } else {
    streakCount = 1;
  }

  return prisma.user.update({
    where: { id: user.id },
    data: {
      streakCount,
      lastLoginDate: toDateOnly(today),
    },
  });
}
