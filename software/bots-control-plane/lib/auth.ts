import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";

const authSecret =
  process.env.AUTH_SECRET ??
  process.env.NEXTAUTH_SECRET ??
  (process.env.NODE_ENV === "development" ? "dev-secret-change-me" : undefined);

if (!authSecret) {
  console.warn("[AUTH] Missing AUTH_SECRET/NEXTAUTH_SECRET. Set one in .env(.local).");
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: authSecret,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("[AUTH] Authorize called with:", { email: credentials?.email });
        
        const email = String(credentials?.email || "").toLowerCase();
        const password = String(credentials?.password || "");
        
        if (!email || !password) {
          console.log("[AUTH] Missing email or password");
          return null;
        }

        try {
          const user = await prisma.user.findUnique({ where: { email } });
          console.log("[AUTH] User found:", user ? { id: user.id, email: user.email, role: user.role } : null);
          
          if (!user || !user.passwordHash) {
            console.log("[AUTH] No user found or no password hash");
            return null;
          }

          const isValidPassword = await compare(password, user.passwordHash);
          console.log("[AUTH] Password valid:", isValidPassword);
          
          if (!isValidPassword) {
            console.log("[AUTH] Invalid password");
            return null;
          }

          // Return user object for NextAuth
          const authUser = {
            id: user.id,
            email: user.email,
            name: user.email,
            role: user.role,
          };
          
          console.log("[AUTH] Returning user:", authUser);
          return authUser;
        } catch (error) {
          console.error("[AUTH] Database error:", error);
          return null;
        }
      },
    }),
  ],
  session: { 
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        console.log("[AUTH] JWT callback - user:", user);
        token.role = (user as any).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      console.log("[AUTH] Session callback - token:", token);
      if (token) {
        (session.user as any).role = token.role ?? "creator";
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
  debug: process.env.NODE_ENV === "development",
});

export type Session = {
  user: {
    id: string;
    email: string;
    role: "creator" | "agency" | "admin";
  };
} | null;
