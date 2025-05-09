'use client';

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function EmailTabs() {
  const pathname = usePathname();

  return (
    <Tabs defaultValue={pathname} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <Link href="/email" passHref>
          <TabsTrigger value="/email">Email Finder</TabsTrigger>
        </Link>
        <Link href="/email/bulk-email-finder" passHref>
          <TabsTrigger value="/email/bulk-email-finder">Bulk Email Finder</TabsTrigger>
        </Link>
        <Link href="/email/history" passHref>
          <TabsTrigger value="/email/history">History</TabsTrigger>
        </Link>
      </TabsList>
    </Tabs>
  );
}