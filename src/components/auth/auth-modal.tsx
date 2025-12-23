"use client";

import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import LoginForm from "./login-form";
import RegisterForm from "./register-form";
import { X } from "lucide-react";

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
            <DialogContent className="bg-gray-900 border-gray-700 text-white !max-w-7xl sm:!max-w-7xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
                {/* Close button */}
                <div className="absolute top-4 right-4 z-50">
                    {/* <button
                        onClick={() => handleOpenChange(false)}
                        className="text-gray-400 hover:text-white transition-colors"
                        aria-label="Close dialog"
                    >
                        <X className="w-6 h-6" />
                    </button> */}
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-700 flex-shrink-0">
                    <button
                        onClick={() => setActiveTab("login")}
                        className={`flex-1 py-4 px-6 text-center font-semibold transition-all ${activeTab === "login"
                            ? "border-b-2 border-purple-500 text-white"
                            : "text-gray-400 hover:text-gray-300"
                            }`}
                    >
                        Sign In
                    </button>
                    <button
                        onClick={() => setActiveTab("signup")}
                        className={`flex-1 py-4 px-6 text-center font-semibold transition-all ${activeTab === "signup"
                            ? "border-b-2 border-purple-500 text-white"
                            : "text-gray-400 hover:text-gray-300"
                            }`}
                    >
                        Sign Up
                    </button>
                </div>

                {/* Content - scrollable with full two-column layout */}
                <div className="overflow-y-auto flex-1">
                    {activeTab === "login" ? (
                        <LoginForm userType={userType} compact={false} />
                    ) : (
                        <RegisterForm userType={userType} compact={false} />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
