import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { WithdrawalManagement } from "@/components/admin/withdrawal-management";

export const metadata = {
    title: "Withdrawal Management",
    description: "Manage creator withdrawal requests",
};

export default async function WithdrawalsPage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    const userRole = (session.user as { role?: string }).role;

    // Only admins can access this page
    if (userRole !== "ADMIN") {
        redirect("/dashboard");
    }

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6 text-white">Withdrawal Management</h1>
            <WithdrawalManagement />
        </div>
    );
}
