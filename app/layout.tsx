import type { Metadata } from "next";
import { Manrope, Instrument_Serif, JetBrains_Mono, Noto_Serif_Devanagari } from "next/font/google";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-sans" });
const instrumentSerif = Instrument_Serif({ weight: "400", subsets: ["latin"], variable: "--font-display" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });
const notoDevanagari = Noto_Serif_Devanagari({ subsets: ["devanagari"], weight: ["400", "500", "600", "700"], variable: "--font-hindi" });

export const metadata: Metadata = {
  title: "Gyankunj IAS — UPSC CSE Prelims & CSAT Test Series, CBT Simulator & Evaluation Suite",
  description:
    "Focused UPSC Civil Services Examination (CSE) Prelims General Studies Paper I & CSAT Paper II test series, negative-marking OMR simulator, bilingual English/Hindi question bank, and syllabus analytics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="sage"
      className={`${manrope.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} ${notoDevanagari.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}