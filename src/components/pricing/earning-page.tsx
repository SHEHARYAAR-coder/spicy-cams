"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Navigation } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    DollarSign,
    Clock,
    Users,
    MessageCircle,
    Video,
    Star,
    TrendingUp,
    Calendar,
    Calculator,
    Coins,
    Gift,
    Crown,
    Zap,
    Target,
    ArrowRight,
    CheckCircle
} from "lucide-react";

export default function EarningsPage() {
    const { data: session, status } = useSession();
    const [calculatorMinutes, setCalculatorMinutes] = useState(60);
    const [calculatorCustomers, setCalculatorCustomers] = useState(3);

    const userRole = (session?.user as { role?: string })?.role;

    if (status === "loading") {
        return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Loading...</div>;
    }
    if (!session?.user || (userRole !== "CREATOR" && userRole !== "ADMIN")) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
                <div className="bg-gray-800/80 p-8 rounded-lg shadow-lg border border-gray-700 text-center max-w-md">
                    <h2 className="text-2xl font-bold mb-4 text-red-400">Unauthorized</h2>
                    <p className="text-gray-300 mb-4">You do not have permission to view this page.</p>
                    <Link href="/" className="text-purple-400 underline">Go back to Home</Link>
                </div>
            </div>
        );
    }

    const tokenRates = {
        webcamChat: 0.22, // dollars per minute per customer
        vipChat: 0.88, // dollars per minute
        privateMessage: 0.11, // dollars per message
        tips: 0.055, // dollars per token
    };

    const earningMethods = [
        {
            title: "Webcam Chat",
            icon: Video,
            rate: "$0.22 per minute per customer",
            description: "Chat with multiple customers simultaneously. Build your audience and earn from each viewer.",
            example: "3 customers × $0.22 = $0.66/min ($39.60/hour)",
            color: "purple",
            features: ["Multiple customers", "Group shows", "Interactive chat", "Flexible schedule"]
        },
        {
            title: "VIP Webcam Chat",
            icon: Crown,
            rate: "$0.88 per minute",
            description: "Exclusive 1-on-1 private sessions with premium customers for higher earnings.",
            example: "1 customer × $0.88 = $0.88/min ($52.80/hour)",
            color: "gold",
            features: ["Private sessions", "Higher rates", "Intimate experience", "Premium customers"]
        },
        {
            title: "Private Messages",
            icon: MessageCircle,
            rate: "$0.11 per message",
            description: "Earn from text conversations and build relationships with your fans.",
            example: "50 messages = $5.50 additional income",
            color: "blue",
            features: ["Text conversations", "Fan engagement", "Additional revenue", "Flexible timing"]
        },
        {
            title: "Tips & Gifts",
            icon: Gift,
            rate: "$0.055 per token",
            description: "Receive tips and virtual gifts from satisfied customers during shows.",
            example: "100 tokens = $5.50 in tips",
            color: "green",
            features: ["Virtual gifts", "Customer appreciation", "Bonus income", "Performance rewards"]
        }
    ];

    const calculateEarnings = (method: string) => {
        switch (method) {
            case "webcam":
                return (calculatorMinutes * calculatorCustomers * tokenRates.webcamChat).toFixed(2);
            case "vip":
                return (calculatorMinutes * tokenRates.vipChat).toFixed(2);
            default:
                return "0.00";
        }
    };

    const payoutSchedule = [
        { day: "1-10", amount: "Earn & Track", icon: TrendingUp },
        { day: "11th", amount: "Payout Day", icon: Calendar },
        { day: "12-21", amount: "Earn & Track", icon: TrendingUp },
        { day: "22nd", amount: "Payout Day", icon: Calendar },
    ];

    return (
        <div className="min-h-screen bg-gray-900 text-white">


            <div className="container mx-auto px-4 py-8">
                {/* Hero Section */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 bg-purple-600/10 text-purple-400 px-4 py-2 rounded-full mb-6">
                        <Coins className="w-5 h-5" />
                        <span className="text-sm font-medium">Creator Earnings</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-600 bg-clip-text text-transparent">
                        Earn Up To $55/Hour
                    </h1>
                    <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed">
                        With our services you can quickly earn up to $55 per hour! What's more, we pay out your earnings every 10 days.
                        Check out the earnings per service below and find out how you can get started right away!
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Badge className="bg-green-600/20 text-green-400 px-4 py-2 text-sm">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Payouts Every 10 Days
                        </Badge>
                        <Badge className="bg-purple-600/20 text-purple-400 px-4 py-2 text-sm">
                            <Clock className="w-4 h-4 mr-2" />
                            Work Your Own Hours
                        </Badge>
                        <Badge className="bg-blue-600/20 text-blue-400 px-4 py-2 text-sm">
                            <Target className="w-4 h-4 mr-2" />
                            Be Your Own Boss
                        </Badge>
                    </div>
                </div>

                {/* Key Benefits */}
                <Card className="bg-gray-800/50 border-gray-700 mb-12 backdrop-blur-sm">
                    <CardContent className="p-8">
                        <h2 className="text-2xl font-bold text-center mb-8 text-white">Why Choose SpicyCams?</h2>
                        <p className="text-gray-300 text-center text-lg leading-relaxed max-w-4xl mx-auto">
                            At SpicyCams we offer various ways to earn money. You can chat, cam and message clients, all from the comfort of your own home.
                            You decide when and where you work – you are the boss of your own time! All you need is a computer or phone and a stable internet connection.
                        </p>
                    </CardContent>
                </Card>

                {/* Token Pricing */}
                <Card className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-sm border border-purple-500/30 mb-12">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center">
                                <Coins className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl text-white">Token Exchange Rate</CardTitle>
                                <p className="text-purple-300">Current market value</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-yellow-400">1 Token</div>
                                    <div className="text-gray-300">=</div>
                                    <div className="text-lg font-semibold text-white">$0.22</div>
                                </div>
                            </div>
                            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-yellow-400">100 Tokens</div>
                                    <div className="text-gray-300">=</div>
                                    <div className="text-lg font-semibold text-white">$22.00</div>
                                </div>
                            </div>
                            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-yellow-400">500 Tokens</div>
                                    <div className="text-gray-300">=</div>
                                    <div className="text-lg font-semibold text-white">$110.00</div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Earning Methods */}
                <div className="grid md:grid-cols-2 gap-6 mb-12">
                    {earningMethods.map((method, index) => {
                        const IconComponent = method.icon;
                        const colorClasses = {
                            purple: "from-purple-600 to-purple-700 border-purple-500/30",
                            gold: "from-yellow-600 to-yellow-700 border-yellow-500/30",
                            blue: "from-blue-600 to-blue-700 border-blue-500/30",
                            green: "from-green-600 to-green-700 border-green-500/30"
                        };

                        return (
                            <Card key={index} className="bg-gray-800/50 border-gray-700 hover:border-purple-500/40 transition-all duration-300 backdrop-blur-sm">
                                <CardHeader>
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[method.color as keyof typeof colorClasses]} flex items-center justify-center border`}>
                                            <IconComponent className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl text-white">{method.title}</CardTitle>
                                            <p className="text-sm font-semibold text-purple-400">{method.rate}</p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-300 mb-4 leading-relaxed">{method.description}</p>
                                    <div className="bg-gray-700/50 rounded-lg p-3 mb-4">
                                        <p className="text-sm text-green-400 font-semibold">Example: {method.example}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {method.features.map((feature, i) => (
                                            <Badge key={i} variant="outline" className="text-xs border-gray-600 text-gray-300">
                                                {feature}
                                            </Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Earnings Calculator */}
                <Card className="bg-gray-800/50 border-gray-700 mb-12 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-2xl text-white flex items-center gap-3">
                            <Calculator className="w-6 h-6 text-purple-400" />
                            Earnings Calculator
                        </CardTitle>
                        <p className="text-gray-400">Calculate your potential earnings based on your activity</p>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Webcam Chat Calculator */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-white">Webcam Chat</h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-2">Minutes online</label>
                                        <input
                                            type="number"
                                            value={calculatorMinutes}
                                            onChange={(e) => setCalculatorMinutes(Number(e.target.value))}
                                            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            min="1"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-2">Average customers</label>
                                        <input
                                            type="number"
                                            value={calculatorCustomers}
                                            onChange={(e) => setCalculatorCustomers(Number(e.target.value))}
                                            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            min="1"
                                        />
                                    </div>
                                    <div className="bg-purple-600/10 border border-purple-500/30 rounded-lg p-4">
                                        <p className="text-sm text-gray-300">Potential Earnings:</p>
                                        <p className="text-2xl font-bold text-purple-400">${calculateEarnings("webcam")}</p>
                                    </div>
                                </div>
                            </div>

                            {/* VIP Chat Calculator */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-white">VIP Webcam Chat</h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-2">Minutes in VIP</label>
                                        <input
                                            type="number"
                                            value={calculatorMinutes}
                                            onChange={(e) => setCalculatorMinutes(Number(e.target.value))}
                                            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            min="1"
                                        />
                                    </div>
                                    <div className="bg-yellow-600/10 border border-yellow-500/30 rounded-lg p-4">
                                        <p className="text-sm text-gray-300">Potential Earnings:</p>
                                        <p className="text-2xl font-bold text-yellow-400">${calculateEarnings("vip")}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Payout Schedule */}
                <Card className="bg-gray-800/50 border-gray-700 mb-12 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-2xl text-white flex items-center gap-3">
                            <Calendar className="w-6 h-6 text-green-400" />
                            Payout Schedule
                        </CardTitle>
                        <p className="text-gray-400">Regular payouts every 10 days - reliable income you can count on</p>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-4 gap-4">
                            {payoutSchedule.map((period, index) => {
                                const IconComponent = period.icon;
                                return (
                                    <div key={index} className="text-center p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                                        <IconComponent className="w-8 h-8 mx-auto mb-2 text-green-400" />
                                        <p className="text-sm text-gray-400 mb-1">Days {period.day}</p>
                                        <p className="font-semibold text-white">{period.amount}</p>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-6 p-4 bg-green-600/10 border border-green-500/30 rounded-lg text-center">
                            <p className="text-green-400 font-semibold">💰 Minimum payout: $55 • Fast & secure payments</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Call to Action */}
                <Card className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/30 backdrop-blur-sm">
                    <CardContent className="p-8 text-center">
                        <h2 className="text-3xl font-bold mb-4 text-white">Ready to Start Earning?</h2>
                        <p className="text-gray-300 mb-6 text-lg">Join thousands of creators who are already making money on SpicyCams</p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <Button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 text-lg">
                                <Zap className="w-5 h-5 mr-2" />
                                Start Broadcasting
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                            <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700 px-8 py-3 text-lg">
                                <MessageCircle className="w-5 h-5 mr-2" />
                                Learn More
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
