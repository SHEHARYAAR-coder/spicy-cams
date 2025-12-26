"use client";

import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import LoginForm from "./login-form";
import RegisterForm from "./register-form";
import { X } from "lucide-react";
import { DialogTitle } from "@radix-ui/react-dialog";
import Link from "next/link";

interface AuthModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    userType: "viewer" | "model";
    initialTab?: "login" | "signup";
}

export default function AuthModal({
    open,
    onOpenChange,
    userType,
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
            <DialogContent className="bg-gray-900 border-gray-700 text-white !max-w-2xl p-0 overflow-hidden max-h-[40vh] flex flex-col">
                <div className="flex-1 flex">
                    {activeTab === "login" ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 w-full">
                            <div className="flex flex-col justify-center items-center text-center overflow-hidden">
                                <img
                                    src="/auth/forget.PNG"
                                    alt="Login Background"
                                    className="w-full h-full object-cover opacity-80"
                                />
                            </div>
                            <div className="flex justify-center items-start pt-20">
                                <div className="text-center">
                                    <h2 className="text-3xl font-bold mb-3">Welcome Back!</h2>
                                    <p className="text-gray-400 mb-8">Choose your account type to continue</p>

                                    <div className="flex flex-col gap-4">
                                        <Link
                                            href={'/v/login'}
                                            className="px-8 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-colors"
                                        >
                                            Login as Viewer
                                        </Link>

                                        <Link
                                            href={'/m/login'}
                                            className="px-8 py-3 bg-pink-600 hover:bg-pink-700 rounded-lg font-semibold transition-colors"
                                        >
                                            Login as Model
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 w-full">
                            <div className="flex justify-center items-start pt-20">
                                <div className="text-center">
                                    <h2 className="text-3xl font-bold mb-3">Join Us Today!</h2>
                                    <p className="text-gray-400 mb-8">Choose your account type to get started</p>
                                    <div className="flex flex-col gap-4">
                                        <Link
                                            href={'/v/register'}
                                            className="px-8 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-colors"
                                        >
                                            Sign up as Viewer
                                        </Link>
                                        <Link
                                            href={'/m/register'}
                                            className="px-8 py-3 bg-pink-600 hover:bg-pink-700 rounded-lg font-semibold transition-colors"
                                        >
                                            Sign up as Model
                                        </Link>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col justify-center items-center text-center overflow-hidden">
                                <img
                                    src="/auth/login.PNG"
                                    alt="Login Background"
                                    className="w-full h-full object-cover opacity-80"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
