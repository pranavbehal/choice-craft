"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Home, Award, Settings } from "lucide-react";

const links = [
  { name: "Home", href: "/", icon: Home },

  { name: "Results", href: "/results", icon: Award },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="flex justify-between items-center p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Link href="/" className="text-xl font-bold">
        StoryQuest
      </Link>
      <div className="flex space-x-1">
        {links.map((link) => {
          const LinkIcon = link.icon;
          return (
            <Button
              key={link.name}
              variant="ghost"
              size="sm"
              className={cn(
                "flex flex-col items-center justify-center h-16 w-16 text-xs",
                pathname === link.href && "bg-muted"
              )}
              asChild
            >
              <Link href={link.href}>
                <LinkIcon className="h-5 w-5 mb-1" />
                {link.name}
              </Link>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
