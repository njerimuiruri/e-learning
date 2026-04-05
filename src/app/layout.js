import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/ToastProvider";
import SessionProvider from "@/components/SessionProvider";
import ScrollToTop from "@/components/ui/ScrollToTop";
import Script from "next/script";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata = {
  title: "E-Learning Platform",
  description: "Your online learning platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script src="https://accounts.google.com/gsi/client" async defer />
      </head>
      <body
        className={`${inter.className} antialiased`}
        suppressHydrationWarning
      >
        <SessionProvider>
          <ToastProvider>{children}</ToastProvider>
          <ScrollToTop />
        </SessionProvider>
      </body>
    </html>
  );
}
