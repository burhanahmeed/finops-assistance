import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FinanceOps AI - CFO Virtual untuk UMKM",
  description: "AI CFO untuk UMKM Indonesia. Monitor keuangan, deteksi anomali, dan dapatkan rekomendasi bisnis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
