"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import Link from "next/link";
import Image from "next/image";
import { Sparkles, Eye, Camera, ArrowRight } from "lucide-react";

interface AuthModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    userType: "viewer" | "model";
    initialTab?: "login" | "signup";
}

export default function AuthModal({
    open,
    onOpenChange,
    userType: _userType,
    initialTab = "login",
}: AuthModalProps) {
    const [activeTab, setActiveTab] = useState<"login" | "signup">(initialTab);

    const handleOpenChange = (newOpen: boolean) => {
        onOpenChange(newOpen);
        if (newOpen) {
            setActiveTab(initialTab);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border border-gray-700/50 text-white !max-w-3xl p-0 overflow-hidden rounded-2xl shadow-2xl">
                <VisuallyHidden>
                    <DialogTitle>
                        {activeTab === "login" ? "Login to SpicyCams" : "Sign Up for SpicyCams"}
                    </DialogTitle>
                </VisuallyHidden>
                <div className="flex">
                    {activeTab === "login" ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 w-full min-h-[450px]">
                            {/* Left Side - Image */}
                            <div className="relative hidden lg:block">
                                <Image
                                    src="/auth/forget.PNG"
                                    alt="Login Background"
                                    fill
                                    className="object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-gray-900/90" />
                                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent" />
                                <div className="absolute bottom-6 left-6 right-6">
                                    <div className="flex items-center gap-2 text-pink-400 mb-2">
                                        <Sparkles className="w-4 h-4" />
                                        <span className="text-sm font-medium">Premium Content</span>
                                    </div>
                                    <p className="text-gray-300 text-sm">Access exclusive live streams from your favorite creators</p>
                                </div>
                            </div>

                            {/* Right Side - Login Options */}
                            <div className="flex flex-col justify-center items-center p-8 lg:p-12">
                                <div className="w-full max-w-sm">
                                    {/* Logo/Icon */}
                                    <div className="flex justify-center mb-6">
                                        <Image
                                            src="/logo/logo.png"
                                            alt="SpicyCams Logo"
                                            width={100}
                                            height={100}
                                            className="object-contain"
                                        />
                                    </div>

                                    <h2 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                                        Welcome Back!
                                    </h2>
                                    <p className="text-gray-400 text-center mb-8">
                                        Choose your account type to continue
                                    </p>

                                    <div className="flex flex-col gap-4">
                                        <Link
                                            href={'/v/login'}
                                            className="group relative flex items-center justify-between px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:scale-[1.02]"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                                                    <Eye className="w-5 h-5" />
                                                </div>
                                                <div className="text-left">
                                                    <div className="font-semibold">Login as Viewer</div>
                                                    <div className="text-xs text-purple-200/80">Watch live streams</div>
                                                </div>
                                            </div>
                                            <ArrowRight className="w-5 h-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                        </Link>

                                        <Link
                                            href={'/m/login'}
                                            className="group relative flex items-center justify-between px-6 py-4 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40 hover:scale-[1.02]"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                                                    <Camera className="w-5 h-5" />
                                                </div>
                                                <div className="text-left">
                                                    <div className="font-semibold">Login as Model</div>
                                                    <div className="text-xs text-pink-200/80">Start streaming</div>
                                                </div>
                                            </div>
                                            <ArrowRight className="w-5 h-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                        </Link>
                                    </div>

                                    <div className="mt-8 text-center">
                                        <p className="text-gray-500 text-sm">
                                            Don&apos;t have an account?{" "}
                                            <button
                                                onClick={() => setActiveTab("signup")}
                                                className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
                                            >
                                                Sign up
                                            </button>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 w-full min-h-[450px]">
                            {/* Left Side - Signup Options */}
                            <div className="flex flex-col justify-center items-center p-8 lg:p-12">
                                <div className="w-full max-w-sm">
                                    {/* Logo/Icon */}
                                    <div className="flex justify-center mb-6">
                                        <Image
                                            src="/logo/logo.png"
                                            alt="SpicyCams Logo"
                                            width={100}
                                            height={100}
                                            className="object-contain"
                                        />
                                    </div>

                                    <h2 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                                        Join Us Today!
                                    </h2>
                                    <p className="text-gray-400 text-center mb-8">
                                        Choose your account type to get started
                                    </p>

                                    <div className="flex flex-col gap-4">
                                        <Link
                                            href={'/v/register'}
                                            className="group relative flex items-center justify-between px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:scale-[1.02]"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                                                    <Eye className="w-5 h-5" />
                                                </div>
                                                <div className="text-left">
                                                    <div className="font-semibold">Sign up as Viewer</div>
                                                    <div className="text-xs text-purple-200/80">Explore content</div>
                                                </div>
                                            </div>
                                            <ArrowRight className="w-5 h-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                        </Link>

                                        <Link
                                            href={'/m/register'}
                                            className="group relative flex items-center justify-between px-6 py-4 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40 hover:scale-[1.02]"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                                                    <Camera className="w-5 h-5" />
                                                </div>
                                                <div className="text-left">
                                                    <div className="font-semibold">Sign up as Model</div>
                                                    <div className="text-xs text-pink-200/80">Start earning</div>
                                                </div>
                                            </div>
                                            <ArrowRight className="w-5 h-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                        </Link>
                                    </div>

                                    <div className="mt-8 text-center">
                                        <p className="text-gray-500 text-sm">
                                            Already have an account?{" "}
                                            <button
                                                onClick={() => setActiveTab("login")}
                                                className="text-pink-400 hover:text-pink-300 font-medium transition-colors"
                                            >
                                                Log in
                                            </button>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side - Image */}
                            <div className="relative hidden lg:block">
                                <Image
                                    src="/auth/login.PNG"
                                    alt="Signup Background"
                                    fill
                                    className="object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-gray-900/90" />
                                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent" />
                                <div className="absolute bottom-6 left-6 right-6">
                                    <div className="flex items-center gap-2 text-purple-400 mb-2">
                                        <Camera className="w-4 h-4" />
                                        <span className="text-sm font-medium">Become a Creator</span>
                                    </div>
                                    <p className="text-gray-300 text-sm">Share your content and connect with fans worldwide</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
