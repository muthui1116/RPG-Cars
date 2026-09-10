// lib/rateLimit.ts
import db from "@/app/lib/db";

export async function checkRateLimit(
  identifier: string,
  maxAttempts: number,
  lockMinutes: number
) {
  const { rows } = await db.query(
    `SELECT attempts, locked_until FROM rate_limits WHERE identifier = $1`,
    [identifier]
  );
  const now = new Date();
  const entry = rows[0];

  // Still locked out? Reject right away.
  if (entry?.locked_until && now < new Date(entry.locked_until)) {
    return { allowed: false };
  }

  // No entry yet, or a previous lock just expired -> start counting at 1.
  // Otherwise -> add 1 to the existing count.
  const attempts = entry && !entry.locked_until ? entry.attempts + 1 : 1;

  if (attempts > maxAttempts) {
    await db.query(
      `INSERT INTO rate_limits (identifier, attempts, locked_until)
       VALUES ($1, $2, NOW() + ($3 || ' minutes')::interval)
       ON CONFLICT (identifier) DO UPDATE SET attempts = $2, locked_until = EXCLUDED.locked_until`,
      [identifier, attempts, lockMinutes]
    );
    return { allowed: false };
  }

  await db.query(
    `INSERT INTO rate_limits (identifier, attempts, locked_until)
     VALUES ($1, $2, NULL)
     ON CONFLICT (identifier) DO UPDATE SET attempts = $2, locked_until = NULL`,
    [identifier, attempts]
  );
  return { allowed: true };
}