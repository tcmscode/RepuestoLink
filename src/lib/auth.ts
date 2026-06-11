import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import type { UserRole } from "@/lib/config/business";
import { BUSINESS_RULES } from "@/lib/config/business";
import {
  checkLoginAllowed,
  recordLoginFailure,
  recordLoginSuccess,
} from "@/lib/auth/login-security";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      companyId: string;
      kycStatus: string;
      companyName: string;
    };
  }

  interface User {
    role: UserRole;
    companyId: string;
    kycStatus: string;
    companyName: string;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role: UserRole;
    companyId: string;
    kycStatus: string;
    companyName: string;
  }
}

const useSecureCookies = process.env.NODE_ENV === "production";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = (credentials?.email as string | undefined)?.trim().toLowerCase();
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const lockCheck = await checkLoginAllowed(email);
        if (!lockCheck.allowed) return null;

        const user = await prisma.user.findUnique({
          where: { email },
          include: { company: true },
        });

        if (!user || !user.isActive) {
          await recordLoginFailure(email);
          return null;
        }

        if (user.company.kycStatus === "bloqueado") {
          await recordLoginFailure(email);
          return null;
        }

        // Solo usuarios dados de alta manualmente y aprobados
        if (user.company.kycStatus !== "aprobado") {
          await recordLoginFailure(email);
          return null;
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          await recordLoginFailure(email);
          return null;
        }

        await recordLoginSuccess(user.id, email);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.company.role as UserRole,
          companyId: user.companyId,
          kycStatus: user.company.kycStatus,
          companyName: user.company.razonSocial,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.companyId = user.companyId;
        token.kycStatus = user.kycStatus;
        token.companyName = user.companyName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as UserRole;
        session.user.companyId = token.companyId as string;
        session.user.kycStatus = token.kycStatus as string;
        session.user.companyName = token.companyName as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: BUSINESS_RULES.sessionMaxAgeSeconds,
  },
  cookies: {
    sessionToken: {
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
  },
});

export async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");
  return session;
}

export async function requireRole(...roles: UserRole[]) {
  const session = await requireSession();
  if (!roles.includes(session.user.role)) throw new Error("FORBIDDEN");
  return session;
}

export async function requireApprovedKyc() {
  const session = await requireSession();
  if (session.user.kycStatus !== "aprobado") throw new Error("KYC_PENDING");
  return session;
}
