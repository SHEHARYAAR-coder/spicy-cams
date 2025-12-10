import { Suspense } from "react"
import RegisterForm from "@/components/auth/register-form"

export default function RegisterPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center"><div className="text-white">Loading...</div></div>}>
            <RegisterForm />
        </Suspense>
    )
}