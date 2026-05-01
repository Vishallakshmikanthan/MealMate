"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  CalendarDays,
  ScanLine,
  BookOpen,
  BarChart2,
  MessageCircle,
  ShoppingBag,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/menu",      label: "Menu",       icon: CalendarDays  },
  { href: "/scanner",   label: "Scan Food",  icon: ScanLine      },
  { href: "/log",       label: "Meal Log",   icon: BookOpen      },
  { href: "/nutrition", label: "Nutrition",  icon: BarChart2     },
  { href: "/chat",      label: "Chatbot",    icon: MessageCircle },
  { href: "/preorder",  label: "Pre-order",  icon: ShoppingBag   },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full bg-white select-none">
      {/* Brand */}
      <div className="px-5 py-6 border-b border-slate-50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-soft">
            <span className="text-white text-sm font-extrabold tracking-tight">M</span>
          </div>
          <span className="text-[17px] font-extrabold text-slate-900 tracking-tight">
            Meal<span className="text-primary-500">Ops</span>
          </span>
        </div>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-none">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link key={href} href={href} className="block">
              <motion.div
                whileHover={{ x: isActive ? 0 : 2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.12 }}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-colors ${
                  isActive
                    ? "text-primary-700 bg-primary-50 shadow-glow"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r-full bg-primary-500" />
                )}
                <Icon
                  size={17}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  className={isActive ? "text-primary-500" : "text-slate-400"}
                />
                <span className="flex-1">{label}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-400" />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* User card */}
      <div className="px-3 pb-4 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gradient-to-br from-primary-50 to-green-50 border border-primary-100">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-soft">
            A
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900 truncate">Arjun</p>
            <p className="text-xs text-slate-500">2,000 kcal goal</p>
          </div>
        </div>
      </div>
    </div>
  );
}

