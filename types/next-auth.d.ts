import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: number;
    } & DefaultSession["user"];
  }

  interface User {
    role?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: number;
  }
}