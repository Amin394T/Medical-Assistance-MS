import type { Metadata } from "next";
import Link from "next/link";
import {
  Building2,
  ClipboardList,
  Headset,
  LogOut,
  Ambulance,
  Shield,
  Users,
  Activity,
  User,
} from "lucide-react";

import "./globals.css";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Medical Assistance MS",
  description: "medical assistance management system for insurance brokers",
};

const navigation = [
  {
    category: "Assistance",
    items: [
      {
        label: "Emergency Call",
        href: "/emergency-call",
        icon: Headset,
      },
      {
        label: "Medical Records",
        href: "/",
        icon: ClipboardList,
      },
    ],
  },
  {
    category: "Insurance",
    items: [
      {
        label: "Client Policies",
        href: "/client-policies",
        icon: Shield,
      },
      {
        label: "Insurance Providers",
        href: "/insurance-providers",
        icon: Building2,
      },
      {
        label: "Brokers & Agents",
        href: "/brokers-agents",
        icon: Users,
      },
    ],
  },
  {
    category: "Services",
    items: [
      {
        label: "Healthcare Providers",
        href: "/healthcare-providers",
        icon: Ambulance,
      },
      {
        label: "Service History",
        href: "/service-history",
        icon: Activity,
      },
    ],
  },
];

function Sidebar() {
  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b px-5">
        
          <Image src="/logo-icon.png" alt="Medical Assistance Logo" width={35} height={35} />

        <div>
          <div className="text-sm font-semibold text-gray-900">
            Medical Assistance
          </div>
          <div className="text-xs text-gray-500">Portal</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <div className="space-y-6">
          {navigation.map((section) => (
            <div key={section.category}>
              <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                {section.category}
              </div>

              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link key={item.href} href={item.href} className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900">
                      <Icon className="h-4 w-4 shrink-0 text-gray-400 transition-colors group-hover:text-gray-600" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* User */}
      <div className="border-t p-3">
        <div className="flex items-center gap-4 rounded-lg px-2 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-600">
            <User className="text-gray-400" />
          </div>

          <div className="min-w-0 flex-1 truncate text-sm font-medium text-gray-700">
              Admin User
          </div>

          <button type="button" title="Logout" className="rounded-md p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <div className="flex min-h-screen">
          <Sidebar />

          <main className="min-w-0 flex-1">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}