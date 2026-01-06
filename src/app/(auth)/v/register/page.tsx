import { Suspense } from "react"
import RegisterForm from "@/components/auth/register-form"

export const dynamic = 'force-dynamic'

function LoadingFallback() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
        </div>
    )
}

export default function ViewerRegisterPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <RegisterForm userType="viewer" />
        </Suspense>
    )
}
