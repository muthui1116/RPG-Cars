// types/next-auth.d.ts
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      role: number;
    } & DefaultSession["user"];
  }

  interface User {
    role: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: number;
  }
}