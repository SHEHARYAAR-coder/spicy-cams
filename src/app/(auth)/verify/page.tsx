"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import { MailCheck, MailX, Loader2, MessageSquare, Video } from "lucide-react"

function VerifyEmailContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const token = searchParams.get("token")

    const [status, setStatus] = useState<"verifying" | "success" | "error" | "idle">("verifying")
    const [error, setError] = useState<string | null>(null)
    const [isResending, setIsResending] = useState(false)
    const [resendMessage, setResendMessage] = useState<string | null>(null)

    useEffect(() => {
        if (token) {
            fetch(`/api/auth/verify-token?token=${token}`)
                .then(async (res) => {
                    if (res.ok) {
                        setStatus("success")
                        setTimeout(() => {
                            router.push("/login?verified=true")
                        }, 3000)
                    } else {
                        const data = await res.json()
                        setStatus("error")
                        setError(data.error || "Invalid or expired token.")
                    }
                })
                .catch(() => {
                    setStatus("error")
                    setError("An unexpected error occurred.")
                })
        } else {
            setStatus("idle")
        }
    }, [token, router])

    const resendVerificationEmail = async () => {
        setIsResending(true)
        setResendMessage(null)
        try {
            const res = await fetch("/api/auth/resend-verification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    data: localStorage.getItem("user"),
                }),
            })

            const data = await res.json()
            if (res.ok) {
                setResendMessage("A new verification link has been sent to your email.")
            } else {
                setResendMessage(data.error || "Failed to resend verification email.")
            }
        } catch (_error) {
            setResendMessage("An unexpected error occurred.")
        } finally {
            setIsResending(false)
        }
    }

    const renderContent = () => {
        switch (status) {
            case "verifying":
                return (
                    <div className="text-center space-y-4">
                        <Loader2 className="w-10 h-10 mx-auto animate-spin text-purple-400" />
                        <h2 className="text-2xl font-bold text-white">Verifying your email...</h2>
                        <p className="text-gray-400">Please wait a moment while we verify your account.</p>
                    </div>
                )
            case "success":
                return (
                    <div className="text-center space-y-4">
                        <MailCheck className="w-12 h-12 mx-auto text-green-400" />
                        <h2 className="text-2xl font-bold text-white">Email Verified!</h2>
                        <p className="text-gray-400">
                            Redirecting you to the login page...
                        </p>
                    </div>
                )
            case "error":
                return (
                    <div className="text-center space-y-4">
                        <MailX className="w-12 h-12 mx-auto text-red-400" />
                        <h2 className="text-2xl font-bold text-white">Verification Failed</h2>
                        <p className="text-gray-400">{error}</p>

                        <button
                            onClick={resendVerificationEmail}
                            disabled={isResending}
                            className={`w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition ${isResending ? "opacity-70 cursor-not-allowed" : ""
                                }`}
                        >
                            {isResending ? "Sending..." : "Resend Verification Email"}
                        </button>

                        {resendMessage && (
                            <p className="text-sm text-gray-400 mt-2">{resendMessage}</p>
                        )}
                    </div>
                )
            case "idle":
                return (
                    <div className="text-center space-y-4">
                        <MailCheck className="w-10 h-10 mx-auto text-purple-400" />
                        <h2 className="text-2xl font-bold text-white">Verify Your Email</h2>
                        <p className="text-gray-400">
                            Check your inbox and click the verification link to continue.
                        </p>
                        <button
                            onClick={resendVerificationEmail}
                            disabled={isResending}
                            className={`w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition ${isResending ? "opacity-70 cursor-not-allowed" : ""
                                }`}
                        >
                            {isResending ? "Sending..." : "Resend Verification Email"}
                        </button>

                        {resendMessage && (
                            <p className="text-sm text-gray-400 mt-2">{resendMessage}</p>
                        )}
                    </div>
                )
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex">
            {/* Left Side - Image & Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-900/30 to-purple-700/10 relative overflow-hidden">
                <div className="absolute inset-0 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/verify.jpeg"
                        alt="Verify Background"
                        className="w-full h-full object-cover opacity-20"
                    />
                </div>

                <div className="relative z-10 flex flex-col justify-between p-12 text-gray-100">
                    <div className="flex items-center space-x-2">
                        <Video className="w-8 h-8 text-purple-400" />
                        <span className="text-2xl font-bold">SpicyCams</span>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-4">
                            <div className="w-20 h-1 bg-purple-500"></div>
                            <blockquote className="text-3xl font-semibold leading-relaxed text-gray-100">
                                “Secure your journey — verify and join the community.”
                            </blockquote>
                        </div>
                        <div>
                            <p className="font-semibold">John Doe</p>
                            <p className="text-purple-400 text-sm">
                                Founder of{" "}
                                <a href="#" className="underline hover:text-purple-300">
                                    SpicyCams Studio
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Verification Content */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                <div className="w-full max-w-md bg-gray-900/40 backdrop-blur-lg p-8 rounded-2xl border border-gray-800 shadow-xl">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center space-x-2 mb-8 justify-center">
                        <MessageSquare className="w-8 h-8 text-purple-400" />
                        <span className="text-2xl font-bold text-gray-100">SpicyCams</span>
                    </div>

                    {renderContent()}
                </div>
            </div>
        </div>
    )
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
                <div className="flex items-center gap-2 text-white">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Loading...</span>
                </div>
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    )
}
