import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "admin" | "coach" | "participant";
    } & DefaultSession["user"];
  }

  interface User {
    role: "admin" | "coach" | "participant";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "admin" | "coach" | "participant";
  }
}
