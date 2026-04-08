import type { Metadata } from "next";
import "./globals.css";

/** Long-running Groq calls (transcribe + estimate) from Server Actions. */
export const maxDuration = 120;

export const metadata: Metadata = {
  title: "VoltVocal — Field Estimating",
  description:
    "Record voice notes on site and generate professional PDF estimates instantly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans bg-[#0E0E11] text-[#E4E4F0]">
        {children}
      </body>
    </html>
  );
}
