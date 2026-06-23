"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function UserMenu({ email }: { email: string }) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3">
      <span className="hidden text-sm text-text-muted sm:inline">{email}</span>
      <Button variant="outline" size="sm" onClick={handleSignOut} className="gap-1.5">
        <LogOut className="h-4 w-4" />
        Выйти
      </Button>
    </div>
  );
}
