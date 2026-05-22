"use client"; // 👈 Must stay Client for Mobile Toggle + Active Highlight

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Package,
  Settings,
  LogOut,
  Gem,
  CirclePlus,
} from "lucide-react";

interface SidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export function Sidebar({ isMobileOpen, setIsMobileOpen }: SidebarProps) {
  const pathname = usePathname(); // 👈 This determines active state from URL

  const menuItems = [
    {
      href: "/",
      label: "Dashboard",
      icon: LayoutDashboard,
      SecondaryIcon: CirclePlus,
    },
    {
      href: "/products",
      label: "Products",
      icon: Package,
      SecondaryIcon: CirclePlus,
    },
    {
      href: "/orders",
      label: "Orders",
      icon: ShoppingBag,
      SecondaryIcon: CirclePlus,
    },
    {
      href: "/customers",
      label: "Customers",
      icon: Users,
      SecondaryIcon: CirclePlus,
    },
    {
      href: "/settings",
      label: "Settings",
      icon: Settings,
      SecondaryIcon: CirclePlus,
    },
  ];

  // Helper to check if link is active (Exact match or Sub-path match)
  const isActive = (path: string) =>
    pathname === path || (path !== "/" && pathname.startsWith(path));

  return (
    <div key="sidebar h-full">
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col justify-center h-full">
          {/* Logo */}
          <div className="flex items-center gap-2 px-6 py-6 border-b border-gray-200">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Gem className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-gray-900">Jewelry Admin</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const Secondaryicon = item.SecondaryIcon;
              const active = isActive(item.href);

              return (
                <div key ={item.href}>
                  <div className="flex items-center " key={item.href}>
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileOpen(false)} // Close menu on mobile click
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        active
                          ? "bg-purple-50 text-purple-600"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Link>
                    

                    <Link
                      href={`${item.href}/new`} // 👈 This makes it /orders/new dynamically
                      className="p-2 m-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-all"
                      title={`Add New ${item.label}`}
                    >
                      <Secondaryicon className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="px-4 py-4 border-t border-gray-200 mt-auto">
            <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
      
    </div>
  );
}
