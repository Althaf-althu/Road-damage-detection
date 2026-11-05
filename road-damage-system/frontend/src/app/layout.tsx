import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kerala PWD — Road Damage Detection System",
  description:
    "Citizen-to-authority road damage reporting, AI-powered defect detection, and maintenance tracking for Kerala roads.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-900 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}

