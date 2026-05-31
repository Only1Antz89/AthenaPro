import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import Script from "next/script";
import { Toaster } from "sonner";
import "@/app/globals.css";
import { DeployRefresh } from "@/components/layout/deploy-refresh";
import { BRAND } from "@/lib/brand";
import { SITE_CONTACT } from "@/lib/site-content";

function getMetadataBase() {
  const deploymentUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_URL ??
    SITE_CONTACT.websiteUrl;

  return new URL(
    deploymentUrl.startsWith("http") ? deploymentUrl : `https://${deploymentUrl}`
  );
}

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap"
});

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: BRAND.name,
    template: `%s | ${BRAND.name}`
  },
  description: BRAND.metadataDescription,
  icons: {
    icon: [{ url: "/icon.png", type: "image/png" }],
    shortcut: [{ url: "/icon.png", type: "image/png" }],
    apple: [{ url: "/icon.png", type: "image/png" }]
  },
  openGraph: {
    title: BRAND.plainName,
    description: BRAND.metadataDescription,
    images: [
      {
        url: "/opengraph-image.jpeg",
        width: 800,
        height: 800,
        alt: `${BRAND.plainName} preview`
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: BRAND.plainName,
    description: BRAND.metadataDescription,
    images: ["/twitter-image.jpeg"]
  }
};

const themeScript = `
  try {
    var theme = window.localStorage.getItem("josjobs-theme");
    if (theme === "light" || theme === "dark") {
      document.documentElement.dataset.theme = theme;
    }
  } catch (error) {}
`;

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${montserrat.variable} font-sans text-ink antialiased`}>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeScript}
        </Script>
        <DeployRefresh />
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
