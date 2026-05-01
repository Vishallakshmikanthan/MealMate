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
} from "lucide-react";

const items = [
  { href: "/dashboard", label: "Home",      icon: LayoutDashboard },
  { href: "/menu",      label: "Menu",       icon: CalendarDays    },
  { href: "/scanner",   label: "Scan",       icon: ScanLine        },
  { href: "/log",       label: "Log",        icon: BookOpen        },
  { href: "/nutrition", label: "Stats",      icon: BarChart2       },
  { href: "/chat",      label: "Chat",       icon: MessageCircle   },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bg-white/95 backdrop-blur-md border-t border-slate-100 shadow-[0_-1px_0_rgba(0,0,0,0.04)]">
      <div className="flex items-stretch justify-around px-1 py-1">
        {items.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl flex-1 transition-colors relative"
            >
              <div
                className={`p-1.5 rounded-xl transition-all ${
                  isActive
                    ? "bg-primary-50 text-primary-500"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <Icon size={19} strokeWidth={isActive ? 2.5 : 1.8} />
              </div>
              <span
                className={`text-[10px] font-medium transition-colors ${
                  isActive ? "text-primary-600" : "text-slate-400"
                }`}
              >
                {label}
              </span>
              {isActive && (
                <motion.span
                  layoutId="bottomNavPill"
                  className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-primary-500"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

