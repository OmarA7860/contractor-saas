import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JobSite Estimate — Contractor dashboard",
  description:
    "Record voice notes from the job site and turn them into professional PDF estimates.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
