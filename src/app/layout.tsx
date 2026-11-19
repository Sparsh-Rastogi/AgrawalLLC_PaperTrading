import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StreetCred · Paper Trading for IIT BHU",
  description: "Mobile-first institutional paper trading platform with Cred Score and hostel leagues.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "StreetCred",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#090a10",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/globe.svg" type="image/svg+xml" />
      </head>
      <body className="antialiased min-h-screen bg-[#090a10] text-[#f1f2f8]" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
