import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "UdyogaMITra — Placement Portal",
  description:
    "The official placement management platform for MITM College. Connect students with top tech companies seamlessly.",
  keywords: [
    "placement portal",
    "campus recruitment",
    "MITM College",
    "placement management",
    "internships",
  ],
  authors: [{ name: "MITM Placement Cell" }],
  openGraph: {
    title: "UdyogaMITra — Placement Portal",
    description: "The official placement management platform for MITM College. Connect students with top tech companies seamlessly.",
    url: "https://mitm-placepro.vercel.app",
    siteName: "UdyogaMITra",
    images: [
      {
        url: "https://mitm-placepro.vercel.app/udyogamitra-logo.jpg",
        width: 800,
        height: 600,
        alt: "UdyogaMITra Banner",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "UdyogaMITra",
    description: "MITM College Official Placement Portal.",
    images: ["https://mitm-placepro.vercel.app/udyogamitra-logo.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
