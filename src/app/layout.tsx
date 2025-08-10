import type { Metadata } from "next";
import { Inter, Rubik } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import { AuthProvider } from "./components/useAuth";
import Footer from "./components/Footer";
import { Analytics } from "@vercel/analytics/react"

const inter = Inter({ subsets: ["latin"] });
const rubik = Rubik({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MTGN25",
  description: "Mottagningen 2025",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <Analytics/>
      <html lang="en">
        <body className={"max-w-full bg-gradient-stars " + rubik.className}>
          <Header />
          <div className="pt-16"> {/* Push everything else down so they dont render behind navbar unintentionally */}
            {children}
          </div>
          <Footer/>
        </body>
      </html>
    </AuthProvider>
  );
}
