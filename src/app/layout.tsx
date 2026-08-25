import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: "Fokus Kerja",
    template: "%s · Fokus Kerja",
  },
  description:
    "Pencatat durasi browsing dan pemblokir distraksi. Atur kuota harian, lihat kebiasaan seminggu, lalu kembali ke kerja.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="scroll-smooth">
      <body className={`${sans.variable} font-sans antialiased text-slate-900 bg-slate-50 min-h-screen selection:bg-blue-100 selection:text-blue-900`}>
        {children}
      </body>
    </html>
  );
}

