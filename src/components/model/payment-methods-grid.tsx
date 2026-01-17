"use client";

import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";

interface PaymentMethod {
    id: string;
    name: string;
    logo: string;
    payoutFrequency: string;
    minimumAmount: string;
    additionalInfo?: string[];
    fee?: string;
    bonus?: {
        description: string;
        details?: string;
    };
}

const paymentMethods: PaymentMethod[] = [
    {
        id: "bank-transfer",
        name: "Bank Transfer",
        logo: "/imgs/payment-methods/bank-transfer.svg",
        payoutFrequency: "Payout every 2 weeks",
        minimumAmount: "Minimum transfer amount (EURO SEPA) 50 €/$",
        additionalInfo: ["Minimum transfer amount (non-SEPA / USD) 500 €/$"],
    },
    {
        id: "yoursafe",
        name: "YourSafe",
        logo: "/imgs/payment-methods/yoursafe.svg",
        payoutFrequency: "Payout every 2 weeks",
        minimumAmount: "Minimum transfer amount 50 €/$",
    },
    {
        id: "capitalist",
        name: "Capitalist",
        logo: "/imgs/payment-methods/capitalist.svg",
        payoutFrequency: "Payout every 2 weeks",
        minimumAmount: "Minimum transfer amount 50 $",
    },
    {
        id: "bitcoin",
        name: "Bitcoin",
        logo: "/imgs/payment-methods/bitcoin.svg",
        payoutFrequency: "Payout every 2 weeks",
        minimumAmount: "Minimum transfer amount 200 €/$",
        bonus: {
            description: "5% bonus during the first 3 months",
            details: "details",
        },
    },
    {
        id: "usdcoin",
        name: "USDCoin",
        logo: "/imgs/payment-methods/usdcoin.svg",
        payoutFrequency: "Payout every 2 weeks",
        minimumAmount: "Minimum transfer amount 200 $",
        bonus: {
            description: "5% bonus during the first 3 months",
            details: "details",
        },
        additionalInfo: ["Only ERC-20 (Ethereum) network supported"],
    },
    {
        id: "paxum",
        name: "Paxum",
        logo: "/imgs/payment-methods/paxum.svg",
        payoutFrequency: "Daily payout",
        minimumAmount: "Minimum transfer amount 50 €/$",
        fee: "2% FEE",
    },
    {
        id: "cosmopayment",
        name: "CosmoPayment",
        logo: "/imgs/payment-methods/cosmopayment.svg",
        payoutFrequency: "Daily payout",
        minimumAmount: "Minimum transfer amount 150 $",
        fee: "2% FEE",
    },
];

export function PaymentMethodsGrid() {
    const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

    const handleSelectMethod = (methodId: string) => {
        setSelectedMethod(methodId);
        toast.info(`Selected ${paymentMethods.find((m) => m.id === methodId)?.name}. Setup coming soon!`);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {paymentMethods.map((method) => (
                <Card
                    key={method.id}
                    className="bg-gray-200 border-none hover:shadow-xl transition-shadow cursor-pointer"
                    onClick={() => handleSelectMethod(method.id)}
                >
                    <CardContent className="p-8">
                        {/* Logo Container */}
                        <div className="bg-white rounded-lg p-6 mb-6 flex items-center justify-center h-32">
                            <div className="relative w-full h-full flex items-center justify-center">
                                {method.id === "bank-transfer" && (
                                    <div className="flex items-center gap-2">
                                        <svg
                                            className="w-16 h-16 text-gray-700"
                                            fill="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
                                        </svg>
                                        <span className="text-3xl font-bold text-gray-800">
                                            BANK<br />TRANSFER
                                        </span>
                                    </div>
                                )}
                                {method.id === "yoursafe" && (
                                    <div className="flex items-center gap-2">
                                        <svg
                                            className="w-16 h-16 text-blue-500"
                                            fill="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle cx="12" cy="12" r="10" />
                                            <circle cx="12" cy="12" r="6" fill="white" />
                                            <circle cx="12" cy="12" r="3" fill="currentColor" />
                                        </svg>
                                        <span className="text-3xl font-bold text-blue-600">yoursafe</span>
                                    </div>
                                )}
                                {method.id === "capitalist" && (
                                    <div className="flex items-center gap-2">
                                        <div className="flex flex-col items-center">
                                            <svg
                                                className="w-12 h-12 text-green-600"
                                                fill="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <rect x="6" y="4" width="12" height="4" />
                                                <rect x="6" y="10" width="12" height="4" />
                                                <path d="M8 16h8v2H8z" />
                                            </svg>
                                            <span className="text-2xl font-bold text-gray-800 mt-1">👔</span>
                                        </div>
                                        <span className="text-3xl font-bold text-green-600">Capitalist</span>
                                    </div>
                                )}
                                {method.id === "bitcoin" && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-16 h-16 rounded-full bg-orange-500 flex items-center justify-center">
                                            <span className="text-white text-3xl font-bold">₿</span>
                                        </div>
                                        <span className="text-3xl font-bold text-gray-800">bitcoin</span>
                                    </div>
                                )}
                                {method.id === "usdcoin" && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center">
                                            <span className="text-white text-2xl font-bold">$</span>
                                        </div>
                                        <span className="text-3xl font-bold text-gray-800">USDCoin</span>
                                    </div>
                                )}
                                {method.id === "paxum" && (
                                    <span className="text-4xl font-bold text-gray-800">paxum</span>
                                )}
                                {method.id === "cosmopayment" && (
                                    <span className="text-3xl font-bold text-gray-800">
                                        <span className="font-black">COSMO</span>PAYMENT
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Payment Details */}
                        <div className="space-y-2 text-gray-800">
                            <ul className="list-disc list-inside space-y-1.5 text-sm">
                                <li className="font-medium">{method.payoutFrequency}</li>
                                <li className="font-medium">{method.minimumAmount}</li>
                                {method.fee && <li className="font-medium">{method.fee}</li>}
                                {method.bonus && (
                                    <li className="font-medium">
                                        {method.bonus.description}{" "}
                                        {method.bonus.details && (
                                            <span className="text-blue-600 cursor-pointer hover:underline">
                                                ({method.bonus.details})
                                            </span>
                                        )}
                                    </li>
                                )}
                                {method.additionalInfo?.map((info, index) => (
                                    <li key={index} className="font-medium">
                                        {info}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
