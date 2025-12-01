"use client"

import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { Mail, Video } from "lucide-react"

const forgotPasswordSchema = z.object({
    email: z.string().email("Invalid email address"),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordForm() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
    })

    const onSubmit = async (data: ForgotPasswordFormData) => {
        try {
            setIsLoading(true)
            setError(null)
            setSuccess(null)

            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            })

            const responseData = await res.json()

            if (!res.ok) {
                throw new Error(responseData.message || "Something went wrong.")
            }

            setSuccess(responseData.message)
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
                        src="/forget_password.jpeg"
                        alt="Forgot Password Background"
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
                                “A lost password is just a new opportunity to secure your account.”
                            </blockquote>
                        </div>
                        <div>
                            <p className="font-semibold">Jane Doe</p>
                            <p className="text-purple-400 text-sm">
                                Security Specialist at{" "}
                                <a href="#" className="underline hover:text-purple-300">
                                    SpicyCams Security
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
                            Forgot Your Password?
                        </h1>
                        <p className="text-gray-400">
                            No worries! Enter your email and we&apos;ll send you a reset link.
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

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition ${isLoading ? "opacity-70 cursor-not-allowed" : ""
                                }`}
                        >
                            {isLoading ? "Sending..." : "Send Reset Link"}
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
