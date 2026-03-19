import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/app/providers/app-providers";

export const metadata: Metadata = {
  title: "Employee Worklog",
  description: "Worklog application for employee and admin workflows",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
