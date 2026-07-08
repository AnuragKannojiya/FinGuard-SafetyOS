import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { SimulationProvider } from "@/providers/simulation-provider";
import { ClientProviders } from "@/providers/client-providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FinGuard SafetyOS | Autonomous Industrial Safety Intelligence Platform",
  description:
    "Real-time compound risk detection, geospatial safety analytics, and predictive intelligence for zero-harm industrial operations. Fusing IoT, SCADA, permit-to-work, and CCTV into a single intelligence layer.",
  keywords: [
    "industrial safety",
    "compound risk detection",
    "SCADA",
    "IoT safety",
    "permit-to-work",
    "geospatial safety",
    "AI safety platform",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full dark`}
    >
      <body className="min-h-screen bg-bg-primary text-text-primary antialiased">
        <SimulationProvider>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
              <Header />
              <main className="flex-1 overflow-y-auto p-6">
                <ClientProviders>{children}</ClientProviders>
              </main>
            </div>
          </div>
        </SimulationProvider>
      </body>
    </html>
  );
}
