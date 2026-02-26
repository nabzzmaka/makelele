"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/deficiencies", label: "Deficiencies" },
  { href: "/deficiencies/new", label: "+ New" },
  { href: "/risikoscoring", label: "Risikoscoring" },
  { href: "/risikoscoring/partners", label: "Partnere" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="bg-blue-800 shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
        <div className="flex items-center gap-3">
          <span className="text-white font-bold text-lg tracking-tight">
            ISQM&nbsp;1
          </span>
          <span className="hidden sm:block text-blue-200 text-sm">
            Quality Deficiency Register
          </span>
        </div>
        <nav className="flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : link.href === "/risikoscoring"
                ? pathname === "/risikoscoring"
                : link.href === "/risikoscoring/partners"
                ? pathname.startsWith("/risikoscoring/partners")
                : pathname.startsWith(link.href) &&
                  !(link.href === "/deficiencies" && pathname === "/deficiencies/new");

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-900 text-white"
                    : "text-blue-100 hover:bg-blue-700 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
