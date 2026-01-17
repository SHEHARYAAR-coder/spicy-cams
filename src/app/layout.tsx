import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthProvider } from "@/components/auth/auth-provider";
import { AgeVerificationDialog } from "@/components/age-verification-dialog";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { StreamProvider } from "@/contexts/StreamContext";
import { CategoryProvider } from "@/contexts/CategoryContext";
import { BalanceNotificationProvider } from "@/components/notifications/balance-notification-provider";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "SpicyCams - Live Streaming Platform",
  description: "Credit-gated live streaming platform",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="antialiased font-sans bg-gray-950 text-white" suppressHydrationWarning>
        <AuthProvider>
          <StreamProvider>
            <CategoryProvider>
              <Suspense fallback={null}>
                <AgeVerificationDialog />
                <Header />
              </Suspense>
              {children}
              <Suspense fallback={null}>
                <Footer />
              </Suspense>
              <BalanceNotificationProvider />
              <Toaster position="top-right" richColors />
            </CategoryProvider>
          </StreamProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
