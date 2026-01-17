import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";
import {
  checkAndUpdateExpiredRestrictions,
  getRestrictionInfo,
} from "@/lib/auto-unban";

const prisma = new PrismaClient();

// Helper function for password verification
async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// Define custom user type
interface CustomUser {
  id: string;
  email: string;
  name: string;
  username: string;
  role: string;
  emailVerified: boolean;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const { email, password } = loginSchema.parse(credentials);

          const user = await prisma.user.findUnique({
            where: { email },
            include: { profile: true },
          });

          if (!user) {
            throw new Error("Invalid email or password");
          }

          // Check if user has a password (wasn't created via OAuth only)
          if (!user.passwordHash) {
            throw new Error(
              "This account was created with Google Sign-In. Please use the 'Continue with Google' button to login."
            );
          }

          const isValidPassword = await verifyPassword(
            password,
            user.passwordHash
          );
          if (!isValidPassword) {
            throw new Error("Invalid email or password");
          }

          // Check and update expired restrictions
          const updatedUser = await checkAndUpdateExpiredRestrictions(user.id);
          const currentUser = updatedUser || user;

          // Get restriction info
          const restrictionInfo = getRestrictionInfo({
            status: currentUser.status,
            banExpiresAt: currentUser.banExpiresAt,
            suspendExpiresAt: currentUser.suspendExpiresAt,
            banReason: currentUser.banReason,
            suspendReason: currentUser.suspendReason,
          });

          // Check user account status with detailed messages
          if (restrictionInfo.restricted) {
            if (restrictionInfo.type === "SUSPENDED") {
              throw new Error(
                `Your account has been suspended for ${restrictionInfo.timeRemaining}. Reason: ${restrictionInfo.reason}`
              );
            }

            if (restrictionInfo.type === "BANNED") {
              if (restrictionInfo.isPermanent) {
                throw new Error(
                  `Your account has been permanently banned. Reason: ${restrictionInfo.reason}. Please contact support if you believe this is an error.`
                );
              } else {
                throw new Error(
                  `Your account has been banned for ${restrictionInfo.timeRemaining}. Reason: ${restrictionInfo.reason}`
                );
              }
            }
          }

          // Allow ACTIVE and PENDING_VERIFICATION users to login
          if (
            currentUser.status !== "ACTIVE" &&
            currentUser.status !== "PENDING_VERIFICATION"
          ) {
            throw new Error("Unable to sign in. Please contact support.");
          }

          // Update last login
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          });

          return {
            id: user.id,
            email: user.email,
            name: user.profile?.displayName || user.email,
            username: user.username,
            role: user.role,
            emailVerified: user.emailVerified,
          } as CustomUser;
        } catch (error) {
          console.error("Auth error:", error);
          throw error;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          // Check if user exists
          let existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
            include: { profile: true, wallet: true },
          });

          if (!existingUser) {
            // Generate username for Google OAuth user
            const baseUsername = user.email!.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
            let username = baseUsername;
            let counter = 1;
            while (await prisma.user.findUnique({ where: { username } })) {
              username = `${baseUsername}${counter}`;
              counter++;
            }

            // Create new user with Google OAuth
            existingUser = await prisma.user.create({
              data: {
                email: user.email!,
                username,
                emailVerified: true, // Google emails are pre-verified
                role: "VIEWER",
                status: "ACTIVE", // Set to ACTIVE for new Google OAuth users
                profile: {
                  create: {
                    displayName: user.name || user.email!.split("@")[0],
                    avatarUrl: user.image || null,
                  },
                },
                wallet: {
                  create: {},
                },
              },
              include: { profile: true, wallet: true },
            });
          } else {
            // Check and update expired restrictions
            const updatedUser = await checkAndUpdateExpiredRestrictions(
              existingUser.id
            );
            const currentUser = updatedUser || existingUser;

            // Get restriction info
            const restrictionInfo = getRestrictionInfo({
              status: currentUser.status,
              banExpiresAt: currentUser.banExpiresAt,
              suspendExpiresAt: currentUser.suspendExpiresAt,
              banReason: currentUser.banReason,
              suspendReason: currentUser.suspendReason,
            });

            // Check existing user's account status with detailed messages
            if (restrictionInfo.restricted) {
              if (restrictionInfo.type === "SUSPENDED") {
                return `/v/login?error=AccountSuspended&time=${encodeURIComponent(
                  restrictionInfo.timeRemaining
                )}&reason=${encodeURIComponent(restrictionInfo.reason)}`;
              }

              if (restrictionInfo.type === "BANNED") {
                if (restrictionInfo.isPermanent) {
                  return `/v/login?error=AccountBanned&permanent=true&reason=${encodeURIComponent(
                    restrictionInfo.reason
                  )}`;
                } else {
                  return `/v/login?error=AccountBanned&time=${encodeURIComponent(
                    restrictionInfo.timeRemaining
                  )}&reason=${encodeURIComponent(restrictionInfo.reason)}`;
                }
              }
            }

            // Allow ACTIVE and PENDING_VERIFICATION users to login
            if (
              currentUser.status !== "ACTIVE" &&
              currentUser.status !== "PENDING_VERIFICATION"
            ) {
              return `/v/login?error=AccountInactive`;
            }

            if (!existingUser.profile) {
              // Create profile if it doesn't exist
              await prisma.profile.create({
                data: {
                  userId: existingUser.id,
                  displayName: user.name || user.email!.split("@")[0],
                  avatarUrl: user.image || null,
                },
              });
            }

            if (!existingUser.wallet) {
              await prisma.wallet.create({
                data: {
                  userId: existingUser.id,
                },
              });
            }
          }

          // Update last login
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { lastLoginAt: new Date() },
          });

          return true;
        } catch (error) {
          console.error("Google sign-in error:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        const customUser = user as CustomUser;
        token.id = customUser.id;
        token.username = customUser.username;
        token.role = customUser.role;
        token.emailVerified = customUser.emailVerified;
      }

      // For Google OAuth, fetch user data from database
      if (account?.provider === "google" && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          include: { profile: true },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.username = dbUser.username;
          token.role = dbUser.role;
          token.emailVerified = dbUser.emailVerified;
        }
      }

      // Ensure username is always present by fetching from DB if missing
      if (!token.username && token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { username: true, role: true },
        });
        if (dbUser) {
          token.username = dbUser.username;
          // Also ensure role is up-to-date
          if (dbUser.role) {
            token.role = dbUser.role;
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.name = session.user.name || session.user.email || "";
        // Add custom fields to session user
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).username = token.username as string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).role = token.role as string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).emailVerified = token.emailVerified === true;
      }
      return session;
    },
  },
  pages: {
    signIn: "/v/login",
    error: "/v/login",
  },
  events: {
    async signIn({ user, account }) {
      // Log successful sign-ins for audit purposes
      console.log(
        `User ${user.email} signed in successfully with ${account?.provider || "credentials"
        }`
      );
    },
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  trustHost: true,
});
