import { requireRole } from "../../../lib/auth-utils"
import { UserRole } from "@prisma/client"

export default async function CreatorPage() {
    const session = await requireRole([UserRole.CREATOR, UserRole.ADMIN])

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">Creator Studio</h1>
            <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Creator Dashboard</h2>
                <p>Welcome to the creator studio, {(session.user as import("../../../lib/auth-utils").SessionUser).email}!</p>
                <p>This page is accessible to creators and administrators.</p>
                <p>Your role: {(session.user as import("../../../lib/auth-utils").SessionUser).role}</p>
            </div>
        </div>
    )
}