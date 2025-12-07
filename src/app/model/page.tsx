import { requireRole, SessionUser } from "../../../lib/auth-utils"
import { UserRole } from "@prisma/client"

export default async function CreatorPage() {
    const session = await requireRole([UserRole.MODEL, UserRole.ADMIN])

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">Model Studio</h1>
            <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Model Dashboard</h2>
                <p>Welcome to the model studio, {(session.user as SessionUser).email}!</p>
                <p>This page is accessible to models and administrators.</p>
                <p>Your role: {(session.user as SessionUser).role}</p>
            </div>
        </div>
    )
}