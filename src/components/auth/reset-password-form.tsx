"use client"

import React, {useState} from "react"
import {useRouter, useParams} from "next/navigation"
import {useForm} from "react-hook-form"
import {z} from "zod"
import {zodResolver} from "@hookform/resolvers/zod"
import Link from "next/link"
import {Lock, Eye, EyeOff, Video} from "lucide-react"

const resetPasswordSchema = z
    .object({
        password: z.string().min(8, "Password must be at least 8 characters"),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    })

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

export default function ResetPasswordForm() {
    const router = useRouter()
    const params = useParams()
    const token = params.token as string

    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const {
        register,
        handleSubmit,
        formState: {errors},
    } = useForm<ResetPasswordFormData>({
        resolver: zodResolver(resetPasswordSchema),
    })

    const onSubmit = async (data: ResetPasswordFormData) => {
        try {
            setIsLoading(true)
            setError(null)
            setSuccess(null)

            const res = await fetch(`/api/auth/reset-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({...data, token}),
            })

            const responseData = await res.json()

            if (!res.ok) {
                throw new Error(responseData.message || "Something went wrong.")
            }

            setSuccess(responseData.message)
            setTimeout(() => {
                router.push("/login")
            }, 3000)
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "An unknown error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex">
            {/* Left Side - Image & Branding */}
            <div
                className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-900/30 to-purple-700/10 relative overflow-hidden">
                <div className="absolute inset-0 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/reset_password.jpeg"
                        alt="Reset Password Background"
                        className="w-full h-full object-cover opacity-20"
                    />
                </div>

                <div className="relative z-10 flex flex-col justify-between p-12 text-gray-100">
                    <div className="flex items-center space-x-2">
                        <Video className="w-8 h-8 text-purple-400"/>
                        <span className="text-2xl font-bold">SpicyCams</span>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-4">
                            <div className="w-20 h-1 bg-purple-500"></div>
                            <blockquote className="text-3xl font-semibold leading-relaxed text-gray-100">
                                “The first step to a new beginning is choosing a new password.”
                            </blockquote>
                        </div>
                        <div>
                            <p className="font-semibold">Alex Johnson</p>
                            <p className="text-purple-400 text-sm">
                                Lead Developer at{" "}
                                <a href="#" className="underline hover:text-purple-300">
                                    SpicyCams Innovations
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                <div className="w-full max-w-lg p-8 ">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">
                            Reset Your Password
                        </h1>
                        <p className="text-gray-400">
                            Create a new, strong password for your account.
                        </p>
                    </div>

                    {/* Alerts */}
                    {success && (
                        <div className="mb-4 p-3 bg-green-900/40 border border-green-700 text-green-300 rounded">
                            {success}
                        </div>
                    )}
                    {error && (
                        <div className="mb-4 p-3 bg-red-900/40 border border-red-700 text-red-300 rounded">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                New Password
                            </label>
                            <div className="relative">
                                <Lock
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5"/>
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
                                        <EyeOff className="w-5 h-5"/>
                                    ) : (
                                        <Eye className="w-5 h-5"/>
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-sm text-red-400 mt-1">
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Confirm New Password
                            </label>
                            <div className="relative">
                                <Lock
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5"/>
                                <input
                                    {...register("confirmPassword")}
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    disabled={isLoading}
                                    className="w-full bg-gray-800 text-gray-100 pl-11 pr-12 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300"
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="w-5 h-5"/>
                                    ) : (
                                        <Eye className="w-5 h-5"/>
                                    )}
                                </button>
                            </div>
                            {errors.confirmPassword && (
                                <p className="text-sm text-red-400 mt-1">
                                    {errors.confirmPassword.message}
                                </p>
                            )}
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition ${
                                isLoading ? "opacity-70 cursor-not-allowed" : ""
                            }`}
                        >
                            {isLoading ? "Resetting..." : "Reset Password"}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-sm text-gray-400">
                        Remembered your password?{" "}
                        <Link
                            href="/login"
                            className="text-purple-400 hover:text-purple-300 font-semibold transition"
                        >
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
