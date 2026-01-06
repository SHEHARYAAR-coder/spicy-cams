"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, XCircle, CreditCard, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import CryptoPaymentDialog from "@/components/pricing/crypto-payment-dialog";

const PRICING_PLANS = {
  basic: {
    name: "Basic Plan",
    amount: "5.00",
    tokens: 10,
  },
  plus: {
    name: "Plus Plan",
    amount: "15.00",
    tokens: 50,
  },
  pro: {
    name: "Pro Plan",
    amount: "50.00",
    tokens: 200,
  },
};

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get("plan");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCryptoDialog, setShowCryptoDialog] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    "card" | "crypto" | null
  >(null);

  const plan = planId ? PRICING_PLANS[planId as keyof typeof PRICING_PLANS] : null;

  const handleCardPayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: unknown) {
      console.error("Checkout error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Something went wrong";
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleCryptoPayment = () => {
    setShowCryptoDialog(true);
  };

  const handleCryptoPayment = () => {
    setShowCryptoDialog(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white flex items-center justify-center p-4">
      <Card className="bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700/50 max-w-2xl w-full">
        <CardContent className="p-8">
          {!planId ? (
            <div className="text-center">
              <XCircle className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
              <h2 className="text-2xl font-bold mb-2">No Plan Selected</h2>
              <p className="text-gray-400 mb-6">
                Please select a pricing plan first
              </p>
              <Button
                onClick={() => router.push("/pricing")}
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-6 py-3"
              >
                Go to Pricing
              </Button>
            </div>
          ) : loading ? (
            <div className="text-center">
              <Loader2 className="w-16 h-16 mx-auto mb-4 text-purple-500 animate-spin" />
              <h2 className="text-2xl font-bold mb-2">
                Redirecting to checkout...
              </h2>
              <p className="text-gray-400">
                Please wait while we prepare your payment
              </p>
            </div>
          ) : error ? (
            <div className="text-center">
              <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
              <h2 className="text-2xl font-bold mb-2 text-red-400">
                Checkout Error
              </h2>
              <p className="text-gray-400 mb-6">{error}</p>
              <Button
                onClick={() => router.push("/pricing")}
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-6 py-3"
              >
                Return to Pricing
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">Choose Payment Method</h2>
                <p className="text-gray-400">
                  Select how you&apos;d like to pay for {plan?.name}
                </p>
                <div className="mt-4 inline-block bg-purple-500/10 border border-purple-500/20 rounded-lg px-4 py-2">
                  <p className="text-sm text-gray-300">
                    <span className="text-purple-400 font-semibold">{plan?.tokens} tokens</span> for{" "}
                    <span className="text-white font-semibold">${plan?.amount}</span>
                  </p>
                </div>
              </div>

              {/* Payment Method Cards */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Credit/Debit Card Option */}
                <Card
                  onClick={() => setSelectedPaymentMethod("card")}
                  className={`cursor-pointer transition-all ${selectedPaymentMethod === "card"
                      ? "bg-purple-600/20 border-purple-500 shadow-lg shadow-purple-500/20"
                      : "bg-gray-800/40 border-gray-700 hover:border-purple-500/50"
                    }`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          Credit/Debit Card
                        </h3>
                        <p className="text-sm text-gray-400">Instant payment</p>
                      </div>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-400">
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
                        Fast & secure with Stripe
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
                        Instant token delivery
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
                        All major cards accepted
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                {/* Cryptocurrency Option */}
                <Card
                  onClick={() => setSelectedPaymentMethod("crypto")}
                  className={`cursor-pointer transition-all ${selectedPaymentMethod === "crypto"
                      ? "bg-purple-600/20 border-purple-500 shadow-lg shadow-purple-500/20"
                      : "bg-gray-800/40 border-gray-700 hover:border-purple-500/50"
                    }`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <Coins className="w-6 h-6 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          Cryptocurrency
                        </h3>
                        <p className="text-sm text-gray-400">BTC, ETH, USDC & more</p>
                      </div>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-400">
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
                        Pay with Bitcoin, Ethereum
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
                        Powered by Coinbase
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
                        Secure & anonymous
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Continue Button */}
              <div className="pt-4">
                <Button
                  onClick={() => {
                    if (selectedPaymentMethod === "card") {
                      handleCardPayment();
                    } else if (selectedPaymentMethod === "crypto") {
                      handleCryptoPayment();
                    }
                  }}
                  disabled={!selectedPaymentMethod}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl py-6 font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {selectedPaymentMethod === "card"
                    ? "Continue with Card"
                    : selectedPaymentMethod === "crypto"
                      ? "Continue with Crypto"
                      : "Select Payment Method"}
                </Button>
              </div>

              <p className="text-xs text-gray-500 text-center">
                Your payment is processed securely. Tokens will be added to your wallet immediately.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Crypto Payment Dialog */}
      {showCryptoDialog && plan && (
        <CryptoPaymentDialog
          planId={planId}
          planName={plan.name}
          amount={plan.amount}
          tokens={plan.tokens}
          onClose={() => setShowCryptoDialog(false)}
        />
      )}
    </div>
  );
}
                Go to Pricing
              </Button >
            </div >
          )}
        </CardContent >
      </Card >
    </div >
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white flex items-center justify-center p-4">
        <Card className="bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700/50 max-w-md w-full">
          <CardContent className="p-8">
            <div className="text-center">
              <Loader2 className="w-16 h-16 mx-auto mb-4 text-purple-500 animate-spin" />
              <h2 className="text-2xl font-bold mb-2">Loading...</h2>
              <p className="text-gray-400">Please wait</p>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
