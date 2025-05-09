"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6">
      <Link
        href="/"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          pathname === "/" ? "text-primary" : "text-muted-foreground"
        )}
      >
        Home
      </Link>
      <Link
        href="/email"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          pathname.startsWith("/email") ? "text-primary" : "text-muted-foreground"
        )}
      >
        Email Tools
      </Link>
    </nav>
  );
}
