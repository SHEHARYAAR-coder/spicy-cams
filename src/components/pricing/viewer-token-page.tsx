"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Crown, Zap } from "lucide-react";

export default function ViewerTokenPage() {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState("personal");
  const [selectedPlan, setSelectedPlan] = useState("plus");

  const handlePlanPurchase = (planId: string) => {
    if (planId === "free") return; // Don't allow purchase of free plan
    router.push(`/checkout?plan=${planId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      {/* Navigation would go here */}
      <div className="container mx-auto px-4 py-16 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-purple-300">
              Premium Token Packages
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight bg-gradient-to-r from-white via-purple-100 to-white bg-clip-text text-transparent">
            Upgrade your plan
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Unlock premium features with our token packages. Get exclusive
            access to streams, private messaging, and special perks.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-16">
          {/* Basic Plan */}
          <Card
            onClick={() => setSelectedPlan("basic")}
            className={`cursor-pointer bg-gray-800/40 backdrop-blur-sm rounded-2xl overflow-hidden transition-all group ${
              selectedPlan === "basic"
                ? "border-purple-500/50 shadow-2xl shadow-purple-500/20 scale-105"
                : "border-gray-700/50 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10"
            }`}
          >
            <CardHeader className="pb-8 pt-8">
              <div className="flex items-center justify-between mb-6">
                <CardTitle className="text-2xl font-semibold text-white">
                  Basic
                </CardTitle>
                <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                </div>
              </div>
              <div className="mb-2">
                <span className="text-5xl font-bold text-white">$5</span>
                <span className="text-base text-gray-400 ml-2">
                  USD / month
                </span>
              </div>
              <div className="text-sm text-gray-500 mb-6">
                <span className="text-purple-400 font-medium">10 tokens</span>{" "}
                included
              </div>
              <Button
                onClick={() => handlePlanPurchase("basic")}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl py-6 font-semibold shadow-lg shadow-purple-500/20 transition-all group-hover:shadow-purple-500/30"
              >
                Get Basic
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 pb-8">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 mt-0.5 flex-shrink-0 text-purple-400" />
                <span className="text-sm text-gray-300">
                  Access to all public streams
                </span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 mt-0.5 flex-shrink-0 text-purple-400" />
                <span className="text-sm text-gray-300">
                  Send private messages
                </span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 mt-0.5 flex-shrink-0 text-purple-400" />
                <span className="text-sm text-gray-300">
                  Tip creators & buy gifts
                </span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 mt-0.5 flex-shrink-0 text-purple-400" />
                <span className="text-sm text-gray-300">Priority support</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 mt-0.5 flex-shrink-0 text-purple-400" />
                <span className="text-sm text-gray-300">
                  Custom profile badge
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Plus Plan - Most Popular */}
          <Card
            onClick={() => setSelectedPlan("plus")}
            className={`cursor-pointer bg-gradient-to-br from-purple-900/20 via-gray-800/40 to-gray-800/40 backdrop-blur-sm rounded-2xl overflow-hidden relative transition-all group ${
              selectedPlan === "plus"
                ? "border-purple-400 shadow-2xl shadow-purple-500/30 scale-110"
                : "border-purple-500/30 hover:border-purple-400 hover:shadow-xl hover:shadow-purple-500/20"
            }`}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-purple-400 to-purple-500"></div>
            <div className="absolute top-4 right-4">
              <Badge className="bg-purple-600 hover:bg-purple-600 text-white text-xs px-3 py-1.5 shadow-lg">
                Most Popular
              </Badge>
            </div>
            <CardHeader className="pb-8 pt-8">
              <div className="flex items-center justify-between mb-6">
                <CardTitle className="text-2xl font-semibold text-white">
                  Plus
                </CardTitle>
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/40">
                  <Crown className="w-5 h-5 text-purple-300" />
                </div>
              </div>
              <div className="mb-2">
                <span className="text-5xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                  $15
                </span>
                <span className="text-base text-gray-400 ml-2">
                  USD / month
                </span>
              </div>
              <div className="text-sm text-gray-500 mb-6">
                <span className="text-purple-300 font-medium">50 tokens</span>{" "}
                included
              </div>
              <Button
                onClick={() => handlePlanPurchase("plus")}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl py-6 font-semibold shadow-xl shadow-purple-500/30 transition-all group-hover:shadow-purple-500/40"
              >
                Get Plus
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 pb-8">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 mt-0.5 flex-shrink-0 text-purple-300" />
                <span className="text-sm text-white font-medium">
                  Everything in Basic
                </span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 mt-0.5 flex-shrink-0 text-purple-300" />
                <span className="text-sm text-gray-300">
                  Exclusive GOLD show access
                </span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 mt-0.5 flex-shrink-0 text-purple-300" />
                <span className="text-sm text-gray-300">Higher tip limits</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 mt-0.5 flex-shrink-0 text-purple-300" />
                <span className="text-sm text-gray-300">
                  Special badges & rewards
                </span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 mt-0.5 flex-shrink-0 text-purple-300" />
                <span className="text-sm text-gray-300">
                  Ad-free experience
                </span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 mt-0.5 flex-shrink-0 text-purple-300" />
                <span className="text-sm text-gray-300">
                  Priority queue access
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card
            onClick={() => setSelectedPlan("pro")}
            className={`cursor-pointer bg-gray-800/40 backdrop-blur-sm rounded-2xl overflow-hidden transition-all group ${
              selectedPlan === "pro"
                ? "border-purple-500/50 shadow-2xl shadow-purple-500/20 scale-105"
                : "border-gray-700/50 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10"
            }`}
          >
            <CardHeader className="pb-8 pt-8">
              <div className="flex items-center justify-between mb-6">
                <CardTitle className="text-2xl font-semibold text-white">
                  Pro
                </CardTitle>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/30">
                  <Crown className="w-5 h-5 text-purple-300" />
                </div>
              </div>
              <div className="mb-2">
                <span className="text-5xl font-bold text-white">$50</span>
                <span className="text-base text-gray-400 ml-2">
                  USD / month
                </span>
              </div>
              <div className="text-sm text-gray-500 mb-6">
                <span className="text-purple-400 font-medium">200 tokens</span>{" "}
                included
              </div>
              <Button
                onClick={() => handlePlanPurchase("pro")}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl py-6 font-semibold shadow-lg shadow-purple-500/20 transition-all group-hover:shadow-purple-500/30"
              >
                Get Pro
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 pb-8">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 mt-0.5 flex-shrink-0 text-purple-400" />
                <span className="text-sm text-white font-medium">
                  Everything in Plus
                </span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 mt-0.5 flex-shrink-0 text-purple-400" />
                <span className="text-sm text-gray-300">
                  Unlimited private messages
                </span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 mt-0.5 flex-shrink-0 text-purple-400" />
                <span className="text-sm text-gray-300">VIP support 24/7</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 mt-0.5 flex-shrink-0 text-purple-400" />
                <span className="text-sm text-gray-300">
                  Early access to features
                </span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 mt-0.5 flex-shrink-0 text-purple-400" />
                <span className="text-sm text-gray-300">
                  Exclusive Pro badge
                </span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 mt-0.5 flex-shrink-0 text-purple-400" />
                <span className="text-sm text-gray-300">
                  Custom chat colors
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Token Usage Table */}
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-10 border border-gray-700/50 max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-white via-purple-100 to-white bg-clip-text text-transparent">
              Using your tokens
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Tokens are consumed based on the features and services you use.
              Here's a breakdown of token costs for different actions.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700/50">
                  <th className="text-left py-4 px-4 font-semibold text-purple-300">
                    Model
                  </th>
                  <th className="text-left py-4 px-4 font-semibold text-purple-300">
                    Rendering
                  </th>
                  <th className="text-left py-4 px-4 font-semibold text-purple-300">
                    Credits
                  </th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                <tr className="border-b border-gray-700/30 hover:bg-gray-700/20 transition-colors">
                  <td className="py-4 px-4 font-medium text-white" rowSpan={3}>
                    Private Message
                  </td>
                  <td className="py-4 px-4 text-gray-400">Standard</td>
                  <td className="py-4 px-4">
                    <span className="text-purple-400 font-medium">1 token</span>
                    <span className="text-gray-500 text-sm ml-2">
                      / message
                    </span>
                  </td>
                </tr>
                <tr className="border-b border-gray-700/30 hover:bg-gray-700/20 transition-colors">
                  <td className="py-4 px-4 text-gray-400">With media</td>
                  <td className="py-4 px-4">
                    <span className="text-purple-400 font-medium">
                      2 tokens
                    </span>
                    <span className="text-gray-500 text-sm ml-2">
                      / message
                    </span>
                  </td>
                </tr>
                <tr className="border-b border-gray-700/30 hover:bg-gray-700/20 transition-colors">
                  <td className="py-4 px-4 text-gray-400">Priority</td>
                  <td className="py-4 px-4">
                    <span className="text-purple-400 font-medium">
                      3 tokens
                    </span>
                    <span className="text-gray-500 text-sm ml-2">
                      / message
                    </span>
                  </td>
                </tr>

                <tr className="border-b border-gray-700/30 hover:bg-gray-700/20 transition-colors">
                  <td className="py-4 px-4 font-medium text-white" rowSpan={2}>
                    Tip Creator
                  </td>
                  <td className="py-4 px-4 text-gray-400">Small</td>
                  <td className="py-4 px-4">
                    <span className="text-purple-400 font-medium">1 token</span>
                    <span className="text-gray-500 text-sm ml-2">/ tip</span>
                  </td>
                </tr>
                <tr className="border-b border-gray-700/30 hover:bg-gray-700/20 transition-colors">
                  <td className="py-4 px-4 text-gray-400">Large</td>
                  <td className="py-4 px-4">
                    <span className="text-purple-400 font-medium">
                      5 tokens
                    </span>
                    <span className="text-gray-500 text-sm ml-2">/ tip</span>
                  </td>
                </tr>

                <tr className="border-b border-gray-700/30 hover:bg-gray-700/20 transition-colors">
                  <td className="py-4 px-4 font-medium text-white">Buy Gift</td>
                  <td className="py-4 px-4 text-gray-400">Any</td>
                  <td className="py-4 px-4">
                    <span className="text-purple-400 font-medium">
                      2 tokens
                    </span>
                    <span className="text-gray-500 text-sm ml-2">/ gift</span>
                  </td>
                </tr>

                <tr className="border-b border-gray-700/30 hover:bg-gray-700/20 transition-colors">
                  <td className="py-4 px-4 font-medium text-white">
                    GOLD Show
                  </td>
                  <td className="py-4 px-4 text-gray-400">Premium access</td>
                  <td className="py-4 px-4">
                    <span className="text-purple-400 font-medium">
                      5 tokens
                    </span>
                    <span className="text-gray-500 text-sm ml-2">/ show</span>
                  </td>
                </tr>

                <tr className="hover:bg-gray-700/20 transition-colors">
                  <td className="py-4 px-4 font-medium text-white">
                    VIP Support
                  </td>
                  <td className="py-4 px-4 text-gray-400">24/7 Priority</td>
                  <td className="py-4 px-4">
                    <span className="text-green-400 font-medium">
                      Included in Pro
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-8 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
            <p className="text-sm text-gray-400 text-center">
              <span className="text-purple-300 font-medium">Pro Tip:</span>{" "}
              Tokens never expire and can be used across all features. Buy more
              to unlock better value!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
