import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Medical Assistance MS",
  description: "medical assistance management system for insurance brokers",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
