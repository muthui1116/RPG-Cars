import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import db from "../../lib/db";
import { checkRateLimit } from "../../lib/rateLimit"; // ← NEW: import the function

const LOGIN_ATTEMPT_LIMIT = 30;   // ← NEW: how many tries allowed
const LOGIN_LOCK_MINUTES = 5;     // ← NEW: how long the lockout lasts

const nextAuth = NextAuth({
	providers: [
		Google({
			clientId: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
		}),
		Credentials({
			credentials: {
				email: { label: "Email", type: "email" },
				password: { label: "Password", type: "password" },
			},
			authorize: async (credentials) => {
				const { email, password } = credentials as { email: string; password: string };

				// ↓ NEW: rate limit check, BEFORE the database/password check
				const loginCheck = await checkRateLimit(
					`login:${email}`,
					LOGIN_ATTEMPT_LIMIT,
					LOGIN_LOCK_MINUTES
				);
				if (!loginCheck.allowed) {
					throw new Error("RateLimited");
				}
				// ↑ NEW block ends here

				const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
				const user = result.rows[0];

				if (!user || !user.password) return null;

				const valid = await bcrypt.compare(password, user.password);
				if (!valid) return null;

				return {
					id: String(user.id),
					name: user.name,
					email: user.email,
					role: Number(user.role),
				};
			},
		}),
	],
	callbacks: {
		async jwt({ token, user }) {
			if (user?.role !== undefined) {
				token.role = Number(user.role);
			} else if (token.role === undefined && token.email) {
				const result = await db.query<{ role: number | string }>(
					"SELECT role FROM users WHERE email = $1",
					[token.email]
				);
				if (result.rows[0]) token.role = Number(result.rows[0].role);
			}
			return token;
		},
		async session({ session, token }) {
			if (session.user) session.user.role = Number(token.role);
			return session;
		},
		async signIn({ user, account }) {
			if (account?.provider === "google") {
				if (!user?.email) {
					console.warn("Google signIn: missing user.email — allowing sign-in for debugging.", { account });
				} else {
					try {
						const existing = await db.query("SELECT * FROM users WHERE email = $1", [user.email]);

						if (existing.rows.length === 0) {
							await db.query(
								`INSERT INTO users (name, email, password, provider)
								 VALUES ($1, $2, NULL, 'google')`,
								[user.name ?? user.email, user.email]
							);
						}
					} catch (err) {
						console.error("Error ensuring google user exists:", err);
					}
				}
			}
			return true;
		},
	},
	pages: {
		signIn: "/login",
	},
	secret: process.env.AUTH_SECRET,
});

export const GET = nextAuth.handlers.GET;
export const POST = nextAuth.handlers.POST;
export const auth = nextAuth.auth;