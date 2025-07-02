import type { Metadata } from "next";
import "./globals.css";
import { AppLayout } from "@/components/app-layout";
import { Toaster } from "@/components/ui/toaster";
import { CompanyProvider } from "@/contexts/company-context";

export const metadata: Metadata = {
  title: "Samarth Furniture",
  description: "Manage your modular furniture business with ease.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
      </head>
      <body className="antialiased">
        <CompanyProvider>
          <AppLayout>{children}</AppLayout>
          <Toaster />
        </CompanyProvider>
      </body>
    </html>
  );
}
