import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/app/providers/app-providers";

export const metadata: Metadata = {
  title: "TaskTrackPro",
  description: "TaskTrackPro — work tracking for employees and admins",
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
