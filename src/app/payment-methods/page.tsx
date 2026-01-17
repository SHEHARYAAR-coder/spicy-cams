import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PaymentMethodsGrid } from "@/components/model/payment-methods-grid";

export const metadata = {
    title: "Payment Methods",
    description: "Add a new payout method",
};

export default async function PaymentMethodsPage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/v/login");
    }

    const userRole = (session.user as { id: string; role?: string }).role;

    // Only models can access payment methods
    if (userRole !== "MODEL") {
        redirect("/unauthorized");
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
            <div className="container mx-auto px-4 mt-21 py-12">
                <h1 className="text-4xl font-bold text-center mb-12 text-purple-600">
                    Add a new payout method
                </h1>
                <PaymentMethodsGrid />
            </div>
        </div>
    );
}
