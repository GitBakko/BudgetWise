
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  History,
  BrainCircuit,
  Wallet,
  Landmark,
  Shapes,
} from "lucide-react";

import { AuthGuard } from "@/components/AuthGuard";
import { UserNav } from "@/components/UserNav";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const menuItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      href: "/dashboard/accounts",
      label: "Conti",
      icon: Landmark,
    },
    {
      href: "/dashboard/history",
      label: "Cronologia",
      icon: History,
    },
    {
      href: "/dashboard/categories",
      label: "Categorie",
      icon: Shapes,
    },
    {
      href: "/dashboard/ai-advisor",
      label: "Consulente AI",
      icon: BrainCircuit,
      isAi: true,
    },
  ];

  return (
    <AuthGuard>
      <SidebarProvider>
        <div className="flex w-full min-h-screen bg-background text-foreground">
          <Sidebar>
            <SidebarHeader className="p-4">
              <Link href="/dashboard" className="flex items-center gap-2">
                <Image src="/logo.png?v=2" alt="BudgetWise Logo" width={36} height={36} />
                <span className="text-xl font-semibold group-data-[collapsible=icon]:hidden">
                  BudgetWise
                </span>
              </Link>
            </SidebarHeader>
            <SidebarContent>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      asChild
                      variant="ghost"
                      className={cn(
                        "w-full justify-start",
                        item.isAi && "group/ai transition-colors duration-300 ease-in-out hover:bg-gradient-to-r hover:from-[hsl(var(--ai-gradient-from))] hover:to-[hsl(var(--ai-gradient-to))] hover:text-ai-primary-foreground"
                      )}
                      tooltip={{
                        children: item.label,
                        side: 'right',
                        align: 'center',
                      }}
                    >
                      <Link href={item.href}>
                        <item.icon className={cn(
                          "transition-colors",
                          item.isAi && "text-ai-primary group-hover/ai:text-ai-primary-foreground"
                        )} />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarContent>
            <SidebarFooter className="mt-auto border-t border-sidebar-border p-2">
                <SidebarTrigger className="hidden md:flex mx-auto" />
            </SidebarFooter>
          </Sidebar>
          <SidebarInset>
            <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
              <SidebarTrigger className="md:hidden" />
              <div className="flex-1" />
              <UserNav />
            </header>
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
              {children}
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </AuthGuard>
  );
}
