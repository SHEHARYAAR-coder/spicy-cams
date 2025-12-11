"use client"

import React, { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { Mail, Lock, Eye, EyeOff, User, Video, MessageSquare } from "lucide-react"

const registerSchema = z
    .object({
        displayName: z.string().min(3, "Full name must be at least 3 characters"),
        email: z.string().email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
    })

type RegisterFormData = z.infer<typeof registerSchema>

interface ModelFormData {
    modelName: string
    email: string
    password: string
    firstName: string
    lastName: string
    gender: 'Female' | 'Male' | 'Transgender' | ''
    day: string
    month: string
    year: string
    agreedToTerms: boolean
}

const days = Array.from({ length: 31 }, (_, i) => i + 1)
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const currentYear = new Date().getFullYear()
const years = Array.from({ length: 100 }, (_, i) => currentYear - i)

interface RegisterFormProps {
    userType?: 'viewer' | 'model'
}

export default function RegisterForm({ userType: propUserType }: RegisterFormProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [userType, setUserType] = useState<'viewer' | 'model'>(propUserType || 'viewer')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    // Model form state
    const [modelFormData, setModelFormData] = useState<ModelFormData>({
        modelName: '',
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        gender: '',
        day: '',
        month: '',
        year: '',
        agreedToTerms: false,
    })

    useEffect(() => {
        if (propUserType) {
            setUserType(propUserType)
        } else {
            const type = searchParams.get('type')
            if (type === 'model' || type === 'viewer') {
                setUserType(type)
            }
        }
    }, [searchParams, propUserType])

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    })

    const onSubmit = async (data: RegisterFormData) => {
        try {
            setIsLoading(true)
            setError(null)

            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    displayName: data.displayName,
                    email: data.email,
                    password: data.password,
                    role: "VIEWER",
                }),
            })

            const result = await res.json()
            if (!res.ok) throw new Error(result.error || "Something went wrong")

            setSuccessMessage("Account created! Please check your email to verify.")

            // ✅ Save minimal user info to localStorage
            localStorage.setItem(
                "user",
                JSON.stringify({
                    userId: result.userId,
                    email: data.email,
                    displayName: data.displayName,
                    verified: false,
                    role: "VIEWER",
                })
            )

            // Redirect to dashboard after 2 seconds
            setTimeout(() => {
                router.push("/v/login")
            }, 2000)

        } catch (err: unknown) {
            setError((err as Error).message || "Unexpected error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    const handleModelInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target
        setModelFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }))
    }

    const handleGenderClick = (gender: 'Female' | 'Male' | 'Transgender') => {
        setModelFormData(prev => ({ ...prev, gender }))
    }

    const handleModelSubmit = async () => {
        try {
            setIsLoading(true)
            setError(null)

            // Validate form
            if (!modelFormData.modelName || !modelFormData.email || !modelFormData.password) {
                throw new Error("Please fill in all required fields")
            }
            if (!modelFormData.agreedToTerms) {
                throw new Error("Please agree to the terms and conditions")
            }

            // Register model account
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    displayName: modelFormData.modelName,
                    email: modelFormData.email,
                    password: modelFormData.password,
                    role: "MODEL", // Register as model
                }),
            })

            const result = await res.json()
            if (!res.ok) throw new Error(result.error || "Something went wrong")

            setSuccessMessage("Model account created! Logging you in...")

            // Auto-login the model after registration
            const loginResult = await signIn("credentials", {
                email: modelFormData.email,
                password: modelFormData.password,
                redirect: false,
            })

            if (loginResult?.error) {
                setError("Account created but login failed. Please login manually.")
                setTimeout(() => {
                    router.push("/m/login")
                }, 2000)
                return
            }

            // Redirect to model profile setup immediately after login
            setTimeout(() => {
                router.push("/m/profile-setup")
                router.refresh()
            }, 1000)

        } catch (err: unknown) {
            setError((err as Error).message || "Unexpected error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex">
            {/* LEFT SIDE */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-900/30 to-purple-700/10 relative overflow-hidden">
                <div className="absolute inset-0 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/auth/signup.PNG"
                        alt="Signup Background"
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
                                “Join the SpicyCams model community and capture your next big moment.”
                            </blockquote>
                        </div>
                        <div>
                            <p className="font-semibold">Jane Doe</p>
                            <p className="text-purple-400 text-sm">
                                Model at{" "}
                                <a href="#" className="underline hover:text-purple-300">
                                    SpicyCams Studio
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT SIDE */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                <div className="w-full max-w-lg p-8">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center space-x-2 mb-8">
                        <MessageSquare className="w-8 h-8 text-purple-400" />
                        <span className="text-2xl font-bold text-gray-100">SpicyCams</span>
                    </div>

                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">
                            Create your SpicyCams account
                        </h1>
                        <p className="text-gray-400">
                            {userType === 'model'
                                ? 'Sign up as a model to start creating and earning.'
                                : 'Sign up to start creating, sharing, and connecting.'}
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

                    {userType === 'model' ? (
                        // Model Sign Up Form
                        <form className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Model name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                                    <input
                                        type="text"
                                        name="modelName"
                                        value={modelFormData.modelName}
                                        onChange={handleModelInputChange}
                                        disabled={isLoading}
                                        placeholder="Enter your model name"
                                        className="w-full bg-gray-800 text-gray-100 pl-11 pr-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={modelFormData.email}
                                        onChange={handleModelInputChange}
                                        disabled={isLoading}
                                        placeholder="model@example.com"
                                        className="w-full bg-gray-800 text-gray-100 pl-11 pr-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={modelFormData.password}
                                        onChange={handleModelInputChange}
                                        disabled={isLoading}
                                        placeholder="••••••••"
                                        className="w-full bg-gray-800 text-gray-100 pl-11 pr-12 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">First name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={modelFormData.firstName}
                                        onChange={handleModelInputChange}
                                        disabled={isLoading}
                                        placeholder="First name"
                                        className="w-full bg-gray-800 text-gray-100 pl-11 pr-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Last name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={modelFormData.lastName}
                                        onChange={handleModelInputChange}
                                        disabled={isLoading}
                                        placeholder="Last name"
                                        className="w-full bg-gray-800 text-gray-100 pl-11 pr-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Gender</label>
                                <div className="grid grid-cols-3 gap-0 border border-gray-700 rounded-lg overflow-hidden">
                                    <button
                                        type="button"
                                        onClick={() => handleGenderClick('Female')}
                                        disabled={isLoading}
                                        className={`px-4 py-3 text-sm font-medium border-r border-gray-700 transition-colors ${modelFormData.gender === 'Female'
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                                            }`}
                                    >
                                        Female
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleGenderClick('Male')}
                                        disabled={isLoading}
                                        className={`px-4 py-3 text-sm font-medium border-r border-gray-700 transition-colors ${modelFormData.gender === 'Male'
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                                            }`}
                                    >
                                        Male
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleGenderClick('Transgender')}
                                        disabled={isLoading}
                                        className={`px-4 py-3 text-sm font-medium transition-colors ${modelFormData.gender === 'Transgender'
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                                            }`}
                                    >
                                        Transgender
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Birthdate</label>
                                <div className="grid grid-cols-3 gap-3">
                                    <select
                                        name="day"
                                        value={modelFormData.day}
                                        onChange={handleModelInputChange}
                                        disabled={isLoading}
                                        className="px-4 py-3 bg-gray-800 text-gray-100 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                                    >
                                        <option value="">Day</option>
                                        {days.map(day => (
                                            <option key={day} value={day}>{day}</option>
                                        ))}
                                    </select>
                                    <select
                                        name="month"
                                        value={modelFormData.month}
                                        onChange={handleModelInputChange}
                                        disabled={isLoading}
                                        className="px-4 py-3 bg-gray-800 text-gray-100 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                                    >
                                        <option value="">Month</option>
                                        {months.map((month, idx) => (
                                            <option key={month} value={idx + 1}>{month}</option>
                                        ))}
                                    </select>
                                    <select
                                        name="year"
                                        value={modelFormData.year}
                                        onChange={handleModelInputChange}
                                        disabled={isLoading}
                                        className="px-4 py-3 bg-gray-800 text-gray-100 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                                    >
                                        <option value="">Year</option>
                                        {years.map(year => (
                                            <option key={year} value={year}>{year}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 pt-2">
                                <input
                                    type="checkbox"
                                    name="agreedToTerms"
                                    checked={modelFormData.agreedToTerms}
                                    onChange={handleModelInputChange}
                                    disabled={isLoading}
                                    className="mt-1 w-4 h-4 cursor-pointer accent-purple-600"
                                />
                                <label className="text-sm text-gray-400 leading-relaxed">
                                    I agree with the{' '}
                                    <span className="text-purple-400 hover:text-purple-300 underline cursor-pointer">
                                        terms and conditions
                                    </span>{' '}
                                    and the{' '}
                                    <span className="text-purple-400 hover:text-purple-300 underline cursor-pointer">
                                        privacy policy
                                    </span>{' '}
                                    of AVN Media Network.
                                </label>
                            </div>

                            <button
                                type="button"
                                onClick={handleModelSubmit}
                                disabled={isLoading}
                                className={`w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition ${isLoading ? "opacity-70 cursor-not-allowed" : ""
                                    }`}
                            >
                                {isLoading ? "Creating Account..." : "Sign Up"}
                            </button>
                        </form>
                    ) : (
                        // Viewer Sign Up Form (Original Form)
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">{/* Full Name */}
                            {/* Full Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                                    <input
                                        {...register("displayName")}
                                        type="text"
                                        placeholder="Alex Jordan"
                                        disabled={isLoading}
                                        className="w-full bg-gray-800 text-gray-100 pl-11 pr-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                                    />
                                </div>
                                {errors.displayName && <p className="text-sm text-red-400 mt-1">{errors.displayName.message}</p>}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                                    <input
                                        {...register("email")}
                                        type="email"
                                        placeholder="alex.jordan@gmail.com"
                                        disabled={isLoading}
                                        className="w-full bg-gray-800 text-gray-100 pl-11 pr-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                                    />
                                </div>
                                {errors.email && <p className="text-sm text-red-400 mt-1">{errors.email.message}</p>}
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
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
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-sm text-red-400 mt-1">{errors.password.message}</p>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
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
                                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {errors.confirmPassword && (
                                    <p className="text-sm text-red-400 mt-1">{errors.confirmPassword.message}</p>
                                )}
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition ${isLoading ? "opacity-70 cursor-not-allowed" : ""
                                    }`}
                            >
                                {isLoading ? "Creating Account..." : "Sign Up"}
                            </button>

                            {/* Divider */}
                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-700"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-4 bg-gray-900 text-gray-400">OR</span>
                                </div>
                            </div>

                            {/* Google Button */}
                            <button
                                type="button"
                                onClick={() => signIn("google", { callbackUrl: "/" })}
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
                        </form>
                    )}

                    <p className="mt-8 text-center text-sm text-gray-400">
                        Already have an account?{" "}
                        <Link
                            href={userType === 'model' ? '/m/login' : '/v/login'}
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
