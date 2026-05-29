"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

interface MenuItem {
  href: string;
  label: string;
  icon: string;
}

interface DashboardSidebarProps {
  menuItems: MenuItem[];
  userName: string;
  userRole: string;
  onLogout: () => void;
}

export function DashboardSidebar({ menuItems, userName, userRole, onLogout }: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-full md:w-64 bg-gray-900 text-white flex flex-col shrink-0">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold">DondeEstaciono</h1>
        <p className="text-xs text-gray-400 mt-1">Panel de administración</p>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-x-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors whitespace-nowrap ${
                isActive
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-gray-100 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
            {userName?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{userName}</p>
            <p className="text-xs text-gray-400 truncate">{userRole}</p>
          </div>
        </div>
        <form action={onLogout}>
          <button
            type="submit"
            className="w-full px-3 py-2 text-sm font-medium text-gray-300 bg-gray-800 rounded-lg hover:bg-gray-700 hover:text-white transition-colors"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  );
}