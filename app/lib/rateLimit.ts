// Rate limiting is disabled. The original implementation is retained below
// as comments so it remains available without being functional code.
// import db from "../lib/db";
//
// export async function checkRateLimit(
//   identifier: string,
//   maxAttempts: number,
//   lockMinutes: number
// ) {
//   try {
//     const { rows } = await db.query(
//       `SELECT attempts, locked_until FROM rate_limits WHERE identifier = $1`,
//       [identifier]
//     );
//     const now = new Date();
//     const entry = rows[0];
//
//     if (entry?.locked_until && now < new Date(entry.locked_until)) {
//       return { allowed: false };
//     }
//
//     const attempts = entry && !entry.locked_until ? entry.attempts + 1 : 1;
//
//     if (attempts > maxAttempts) {
//       await db.query(
//         `INSERT INTO rate_limits (identifier, attempts, locked_until)
//          VALUES ($1, $2, NOW() + ($3 || ' minutes')::interval)
//          ON CONFLICT (identifier) DO UPDATE SET attempts = $2, locked_until = EXCLUDED.locked_until`,
//         [identifier, attempts, lockMinutes]
//       );
//       return { allowed: false };
//     }
//
//     await db.query(
//       `INSERT INTO rate_limits (identifier, attempts, locked_until)
//        VALUES ($1, $2, NULL)
//        ON CONFLICT (identifier) DO UPDATE SET attempts = $2, locked_until = NULL`,
//       [identifier, attempts]
//     );
//     return { allowed: true };
//   } catch (error) {
//     console.error("Rate-limit check failed; allowing request:", error);
//     return { allowed: true };
//   }
// }