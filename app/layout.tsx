import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ClerkProvider } from "@clerk/nextjs";
import { ReactQueryProvider } from "@/components/providers/ReactQueryProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Billy",
  description: "Accounts payable manager",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}>
        <body className="min-h-full flex flex-col">
          <ReactQueryProvider>{children}</ReactQueryProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
