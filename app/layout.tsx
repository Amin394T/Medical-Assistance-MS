import type { Metadata } from "next";
import { Sidebar } from "./_components/side-bar";
import "./globals.css";


export const metadata: Metadata = {
  title: "Medical Assistance MS",
  description: "medical assistance management system for insurance brokers",
};


export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased border-box">
        <div className="flex min-h-screen">
          <Sidebar />

          <main className="min-w-0 flex-1 h-screen overflow-y-auto">
            {children}
          </main>
        </div>
        
      </body>
    </html>
  );
}