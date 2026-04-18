import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Facebook } from "lucide-react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "আবাসিক ম্যানেজমেন্ট",
  description: "অফিস আবাসিক এলাকার রুম, ভাড়াটে, মালামাল ও ট্রাবল রিপোর্ট ম্যানেজমেন্ট",
  keywords: ["Z.ai", "Next.js", "TypeScript", "Tailwind CSS", "shadcn/ui", "AI development", "React"],
  authors: [{ name: "Z.ai Team" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Z.ai Code Scaffold",
    description: "AI-powered development with modern React stack",
    url: "https://chat.z.ai",
    siteName: "Z.ai",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Z.ai Code Scaffold",
    description: "AI-powered development with modern React stack",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <div className="min-h-screen flex flex-col">
          <main className="flex-1">{children}</main>
          <footer className="border-t pt-6 pb-8 text-center mt-auto">
            <p className="text-sm text-muted-foreground">
              আবাসিক ম্যানেজমেন্ট @২০২৬
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Md. Mehedi Hasan
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Caretaker, EGB PLC.
            </p>
            <a
              href="https://www.facebook.com/mehedi.stk"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center mt-2 text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Facebook className="h-5 w-5" />
            </a>
          </footer>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
