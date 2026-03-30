import type { Metadata } from "next";
import { Toaster } from "sonner";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "StaffBook Demo",
  description: "Demo booking and staff recruitment platform for organisers and staff."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans text-ink antialiased">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
