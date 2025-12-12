import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { UserRole } from "@prisma/client";

export default async function CreatorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    const userId = (session.user as { id: string; role?: string }).id;
    const userRole = (session.user as { id: string; role?: string }).role;

    // model routes
    if (userRole !== UserRole.MODEL && userRole !== UserRole.ADMIN) {
        redirect("/dashboard");
    }

    // Fetch user for layout props
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            role: true,
            profile: {
                select: {
                    displayName: true,
                    avatarUrl: true,
                },
            },
        },
    });

    if (!user) {
        redirect("/login");
    }

    const layoutProps = {
        userRole: user.role,
        userName: user.profile?.displayName || null,
        userEmail: user.email,
        avatarUrl: user.profile?.avatarUrl || null,
    };

    return <DashboardLayout {...layoutProps}>{children}</DashboardLayout>;
}
