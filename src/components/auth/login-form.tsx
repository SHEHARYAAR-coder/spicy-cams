"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { Mail, Lock, Eye, EyeOff, MessageSquare, Video } from "lucide-react"

const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
})

type LoginFormData = z.infer<typeof loginSchema>

interface LoginFormProps {
    userType?: 'viewer' | 'model'
    compact?: boolean
}

export default function LoginForm({ userType, compact = false }: LoginFormProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showPassword, setShowPassword] = useState(false)
    const [_rememberMe, _setRememberMe] = useState(false)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    const callbackUrl = searchParams.get("callbackUrl") || "/"
    const verified = searchParams.get("verified")
    const authError = searchParams.get("error")
    const errorTime = searchParams.get("time")
    const errorReason = searchParams.get("reason")
    const isPermanent = searchParams.get("permanent")

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    })

    useEffect(() => {
        if (verified === "true") {
            setSuccessMessage("Email verified successfully! You can now sign in.")
        }

        // Handle OAuth errors (e.g., from Google sign-in)
        if (authError) {
            let errorMessage = "";

            if (authError === "AccountSuspended" && errorTime && errorReason) {
                errorMessage = `Your account has been suspended for ${decodeURIComponent(errorTime)}. Reason: ${decodeURIComponent(errorReason)}`;
            } else if (authError === "AccountBanned") {
                if (isPermanent === "true" && errorReason) {
                    errorMessage = `Your account has been permanently banned. Reason: ${decodeURIComponent(errorReason)}. Please contact support if you believe this is an error.`;
                } else if (errorTime && errorReason) {
                    errorMessage = `Your account has been banned for ${decodeURIComponent(errorTime)}. Reason: ${decodeURIComponent(errorReason)}`;
                } else {
                    errorMessage = "Your account has been banned. Please contact support.";
                }
            } else {
                const errorMessages: Record<string, string> = {
                    AccountSuspended: "Your account has been suspended. Please contact support for assistance.",
                    AccountBanned: "Your account has been banned. Please contact support.",
                    AccountInactive: "Your account is inactive. Please contact support for assistance.",
                    OAuthSignin: "Error occurred during OAuth sign-in. Please try again.",
                    OAuthCallback: "Error occurred during OAuth callback. Please try again.",
                    OAuthCreateAccount: "Could not create OAuth account. Please try again.",
                    EmailCreateAccount: "Could not create email account. Please try again.",
                    Callback: "Error occurred during callback. Please try again.",
                    OAuthAccountNotLinked: "This email is already associated with another account. Please sign in using your original method.",
                    EmailSignin: "Could not send sign-in email. Please try again.",
                    CredentialsSignin: "Sign in failed. Please check your credentials.",
                    Default: "An error occurred during authentication. Please try again.",
                };

                errorMessage = errorMessages[authError] || errorMessages.Default;
            }

            setError(errorMessage);
        }
    }, [verified, authError, errorTime, errorReason, isPermanent])

    const onSubmit = async (data: LoginFormData) => {
        try {
            setIsLoading(true)
            setError(null)
            const result = await signIn("credentials", {
                email: data.email,
                password: data.password,
                redirect: false,
            })

            if (result?.error) {
                // Display the specific error message from the auth provider
                setError(result.error)
            } else if (result?.ok) {
                // Fetch user data to determine role-based redirect
                const response = await fetch('/api/users/me')
                if (response.ok) {
                    const userData = await response.json()

                    // Check if model needs to complete profile
                    if (userData.role === 'MODEL') {
                        const profileResponse = await fetch('/api/profile', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ userId: userData.id }),
                        })

                        if (profileResponse.ok) {
                            const profileData = await profileResponse.json()

                            // Redirect to profile setup if not completed
                            if (!profileData.profile?.profileCompleted) {
                                router.push('/m/profile-setup')
                                router.refresh()
                                return
                            }
                        }

                        router.push('/')
                    } else {
                        router.push(callbackUrl)
                    }
                } else {
                    // Fallback to callback URL if user data fetch fails
                    router.push(callbackUrl)
                }
                router.refresh()
            }
        } catch (err) {
            console.error(err)
            setError("An unexpected error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className={compact ? "w-full" : "min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex"}>
            {/* Left Side - Image & Branding - Hidden in compact mode */}
            {!compact && (
                <div
                    className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-900/30 to-purple-700/10 relative overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src="/auth/login.PNG"
                            alt="Login Background"
                            className="w-full h-full object-cover opacity-60"
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
                                    “Capture, create, and connect — all in one seamless experience.”
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
            )}

            {/* Right Side - Form */}
            <div className={compact ? "w-full" : "w-full lg:w-1/2 flex items-center justify-center p-8"}>
                <div className={compact ? "w-full" : "w-full max-w-lg p-8"}>
                    {/* Mobile Logo - Hidden in compact mode */}
                    {!compact && (
                        <div className="lg:hidden flex items-center space-x-2 mb-8">
                            <MessageSquare className="w-8 h-8 text-purple-400" />
                            <span className="text-2xl font-bold text-gray-100">SpicyCams</span>
                        </div>
                    )}

                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">
                            Welcome back to SpicyCams
                        </h1>
                        <p className="text-gray-400">
                            Sign in to continue creating amazing experiences.
                        </p>
                    </div>

                    {/* Alerts */}
                    {successMessage && (
                        <div className="mb-4 p-3 bg-green-900/40 border border-green-700 text-green-300 rounded">
                            {successMessage}
                        </div>
                    )}
                    {error && (
                        <div className="mb-4 p-3 bg-red-900/40 border border-red-700 text-red-300 rounded">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Email
                            </label>
                            <div className="relative">
                                <Mail
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                                <input
                                    {...register("email")}
                                    type="email"
                                    placeholder="alex.jordan@gmail.com"
                                    disabled={isLoading}
                                    className="w-full bg-gray-800 text-gray-100 pl-11 pr-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                                />
                            </div>
                            {errors.email && (
                                <p className="text-sm text-red-400 mt-1">
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Lock
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                                <input
                                    {...register("password")}
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    disabled={isLoading}
                                    className="w-full bg-gray-800 text-gray-100 pl-11 pr-12 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-sm text-red-400 mt-1">
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        {/* Forget Password */}
                        <div className="flex items-center justify-end">
                            <Link href={'/forgot-password'} className="text-sm text-purple-300">
                                Forget Password
                            </Link>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition ${isLoading ? "opacity-70 cursor-not-allowed" : ""
                                }`}
                        >
                            {isLoading ? "Signing in..." : "Sign in"}
                        </button>

                        {/* Google Button */}
                        {
                            userType === "model" ? "" :
                                <div>
                                    {/* Divider */}
                                    <div className="relative my-6">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-gray-700"></div>
                                        </div>
                                        <div className="relative flex justify-center text-sm">
                                            <span className="px-4 bg-gray-900 text-gray-400">OR</span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => signIn("google", { callbackUrl })}
                                        disabled={isLoading}
                                        className={`w-full flex items-center justify-center space-x-3 bg-gray-800 border border-gray-700 hover:bg-gray-700 text-gray-200 font-medium py-3 rounded-lg transition ${isLoading ? "opacity-70 cursor-not-allowed" : ""
                                            }`}
                                    >
                                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                                            <path
                                                fill="#4285F4"
                                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                            />
                                            <path
                                                fill="#34A853"
                                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                            />
                                            <path
                                                fill="#FBBC05"
                                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                            />
                                            <path
                                                fill="#EA4335"
                                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                            />
                                        </svg>
                                        <span>Continue with Google</span>
                                    </button>
                                </div>
                        }
                    </form>

                    <p className="mt-8 text-center text-sm text-gray-400">
                        Don&apos;t have an account?{" "}
                        <Link
                            href={userType === 'model' ? '/m/register' : '/v/register'}
                            className="text-purple-400 hover:text-purple-300 font-semibold transition"
                        >
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
