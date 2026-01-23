import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { z } from "zod";

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma) as any,
    trustHost: true,
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/admin/login",
    },
    providers: [
        Credentials({
            id: "credentials",
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const parsed = loginSchema.safeParse(credentials);
                if (!parsed.success) return null;

                const { email, password } = parsed.data;

                try {
                    const user = await prisma.adminUser.findUnique({
                        where: { email, isActive: true },
                    });

                    if (user && user.passwordHash) {
                        const isValid = await bcrypt.compare(password, user.passwordHash);
                        if (isValid) {
                            // Update last login (async, don't block)
                            prisma.adminUser.update({
                                where: { id: user.id },
                                data: { lastLoginAt: new Date() },
                            }).catch((e: Error) => console.error("Failed to update last login", e));

                            return {
                                id: user.id,
                                email: user.email,
                                name: user.name,
                                role: user.role,
                                type: "ADMIN",
                            };
                        }
                    }
                } catch (error) {
                    console.error("Database error during authorization:", error);
                    // Do not fall back to hardcoded credentials - require database connection
                    throw new Error("Database connection failed. Please try again later.");
                }

                return null;
            },
        }),
        Credentials({
            id: "university-credentials",
            name: "University Login",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const parsed = loginSchema.safeParse(credentials);
                if (!parsed.success) return null;

                const { email, password } = parsed.data;

                try {
                    const user = await prisma.universityUser.findUnique({
                        where: { email },
                    });

                    if (user && user.passwordHash) {
                        const isValid = await bcrypt.compare(password, user.passwordHash);
                        if (isValid) {
                            return {
                                id: user.id,
                                email: user.email,
                                name: user.name,
                                universityId: user.universityId,
                                role: "UNIVERSITY",
                                type: "UNIVERSITY",
                            };
                        }
                    }
                } catch (error) {
                    console.warn("University login error:", error);
                }
                return null;
            },
        }),
        Credentials({
            id: "usher-pin",
            name: "Usher Login",
            credentials: {
                accessCode: { label: "PIN", type: "text" },
            },
            async authorize(credentials) {
                const { accessCode } = credentials as { accessCode: string };
                if (!accessCode) return null;

                try {
                    const user = await prisma.adminUser.findUnique({
                        where: { accessCode },
                    });

                    if (user && user.isActive) {
                        // Update last login
                        prisma.adminUser.update({
                            where: { id: user.id },
                            data: { lastLoginAt: new Date() },
                        }).catch((e: Error) => console.error("Failed to update last login for usher", e));

                        return {
                            id: user.id,
                            email: user.email,
                            name: user.name,
                            role: user.role,
                            type: "ADMIN",
                        };
                    }
                } catch (error) {
                    console.error("Usher login error:", error);
                }
                return null;
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = (user as any).role;
                token.universityId = (user as any).universityId;
                token.type = (user as any).type;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                (session.user as any).role = token.role;
                (session.user as any).universityId = token.universityId;
                (session.user as any).type = token.type;
            }
            return session;
        },
    },
});
