"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./LoginForm.module.css";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  async function handleCredentialsLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!EMAIL_REGEX.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error === "RateLimited") {
        setError("Too many login attempts. Please try again in a few minutes.");
      } else if (res?.error) {
        setError("Invalid email or password.");
      } else {
        router.push("/");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>Welcome back</p>
        <h1 className={styles.title}>Sign in to your account</h1>
        <p className={styles.subtitle}>
          Log in with email/password or continue with Google for faster access.
        </p>
      </div>

      <form onSubmit={handleCredentialsLogin} className={styles.form}>
        <label className={styles.field}>
          <span className={styles.label}>Email</span>
          <input
            type="email"
            className={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Password</span>
          <input
            type="password"
            className={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {error ? <p className={styles.error}>{error}</p> : null}

        <button type="submit" disabled={loading} className={styles.submitButton}>
          {loading ? "Signing in..." : "Log in"}
        </button>
      </form>

      <div className={styles.registerRow}>
        <span>Don&apos;t have an account?</span>
        <Link href="/register" className={styles.registerLink}>
          Create account
        </Link>
      </div>

      <div className={styles.divider}>
        <span className={styles.dividerLine} />
        <span>or continue with</span>
        <span className={styles.dividerLine} />
      </div>

      <button
        type="button"
        onClick={async () => {
          await signIn("google", { callbackUrl: "/" });
        }}
        className={styles.googleButton}
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M22.5 12.24c0-.74-.07-1.45-.2-2.15H12v4.07h5.92c-.26 1.4-1.02 2.58-2.16 3.38v2.8h3.49c2.04-1.88 3.22-4.65 3.22-7.9Z" fill="#4285F4" />
          <path d="M12 23c2.92 0 5.38-.96 7.17-2.6l-3.49-2.8c-.97.65-2.22 1.03-3.68 1.03-2.84 0-5.24-1.92-6.1-4.51H2.26v2.83C3.99 20.9 7.72 23 12 23Z" fill="#34A853" />
          <path d="M5.9 14.15c-.22-.65-.35-1.35-.35-2.15 0-.8.13-1.5.35-2.15V7.02H2.26A9.974 9.974 0 0 0 1 12c0 1.6.38 3.12 1.26 4.48l2.64-2.33Z" fill="#FBBC05" />
          <path d="M12 4.5c1.6 0 3.05.55 4.19 1.63l3.14-3.14C17.38 1.21 14.92 0 12 0 7.72 0 3.99 2.1 2.26 5.02l2.64 2.83C6.76 6.42 9.16 4.5 12 4.5Z" fill="#EA4335" />
        </svg>
        Sign in with Google
      </button>
    </div>
  );
}