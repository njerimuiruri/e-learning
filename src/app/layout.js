import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/ToastProvider";
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
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
