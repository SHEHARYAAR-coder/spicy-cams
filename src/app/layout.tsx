import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth/auth-provider";
import { AgeVerificationDialog } from "@/components/age-verification-dialog";
import { Header } from "@/components/header";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "SpicyCams - Live Streaming Platform",
  description: "Credit-gated live streaming platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        <AuthProvider>
          <AgeVerificationDialog />
          <Header />
          {children}
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </body>
    </html>
  );
}
