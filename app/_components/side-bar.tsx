
import Link from "next/link";
import Image from "next/image";
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


const navigation = [
  {
    category: "Assistance",
    items: [
      {
        label: "Emergency Call",
        href: "/assistance/call",
        icon: Headset,
      },
      {
        label: "Medical Records",
        href: "/assistance/records",
        icon: ClipboardList,
      },
    ],
  },
  {
    category: "Insurance",
    items: [
      {
        label: "Client Policies",
        href: "/insurance/policies",
        icon: Shield,
      },
      {
        label: "Insurance Companies",
        href: "/insurance/companies",
        icon: Building2,
      },
      {
        label: "Brokers & Agents",
        href: "/insurance/intermeiaries",
        icon: Users,
      },
    ],
  },
  {
    category: "Services",
    items: [
      {
        label: "Healthcare Providers",
        href: "/services/providers",
        icon: Ambulance,
      },
      {
        label: "Service History",
        href: "/services/history",
        icon: Activity,
      },
    ],
  },
];

export function Sidebar() {
  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-slate-200 shadow-md bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-5">        
        <Image src="/logo-icon.png" alt="Medical Assistance Logo" width={30} height={30} />

        <div className="text-lg font-semibold text-teal-800"> Medical Assistance </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <div className="space-y-6">
          {navigation.map((section) => (
            <div key={section.category}>
              <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-teal-700">
                {section.category}
              </div>

              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link key={item.href} href={item.href} className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-md font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900">
                      <Icon className="h-5 w-5 shrink-0 text-gray-400 transition-colors group-hover:text-gray-600" />
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
      <div className="border-t border-slate-100 px-2 py-1">
        <div className="flex items-center gap-4 px-2 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-sm font-semibold text-gray-600">
            <User className="text-gray-400" />
          </div>

          <div className="min-w-0 flex-1 truncate text-md font-medium text-gray-700">
              Amin Hassan
          </div>

          <button type="button" title="Logout" className="rounded-md p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};