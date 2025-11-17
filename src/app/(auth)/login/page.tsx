import { Suspense } from "react"
import LoginForm from "@/components/auth/login-form"
import { Loader2 } from "lucide-react"

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-8">
                        <div className="text-center">
                            <Loader2 className="w-8 h-8 mx-auto mb-4 text-purple-500 animate-spin" />
                            <p className="text-gray-400">Loading...</p>
                        </div>
                    </div>
                </div>
            </div>
        }>
            <LoginForm />
        </Suspense>
    )
}