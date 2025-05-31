import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Pacifico } from "next/font/google";
import "@/styles/globals.css";
import "remixicon/fonts/remixicon.css";
import { UserProvider } from "@/contexts/UserContext";
import QueryProvider from "@/providers/QueryProvider";
import { Toaster } from "@/components/ui/toaster";
import { AutoFix } from "@/components/AutoFix";
import Script from "next/script";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

const pacifico = Pacifico({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pacifico",
});

export const metadata: Metadata = {
  title: "QAPT - Property Management Software",
  description: "Modern property management software for landlords and property managers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Add the content-fix script with the highest priority */}
        <Script src="/content-fix.js" strategy="beforeInteractive" />
      </head>
      <body className={`${jakarta.variable} ${pacifico.variable} font-sans`}>
        <QueryProvider>
          <UserProvider>
            <AutoFix />
            {children}
            <Toaster />
          </UserProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
