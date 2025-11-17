"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get("plan");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!planId) {
      setError("No plan selected");
      return;
    }

    handleCheckout();
  }, [planId]);

  const handleCheckout = async () => {
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
    } catch (err: any) {
      console.error("Checkout error:", err);
      setError(err.message || "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white flex items-center justify-center p-4">
      <Card className="bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700/50 max-w-md w-full">
        <CardContent className="p-8">
          {loading && !error && (
            <div className="text-center">
              <Loader2 className="w-16 h-16 mx-auto mb-4 text-purple-500 animate-spin" />
              <h2 className="text-2xl font-bold mb-2">
                Redirecting to checkout...
              </h2>
              <p className="text-gray-400">
                Please wait while we prepare your payment
              </p>
            </div>
          )}

          {error && (
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
          )}

          {!planId && !loading && (
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
          )}
        </CardContent>
      </Card>
    </div>
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
