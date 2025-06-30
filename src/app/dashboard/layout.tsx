import Link from "next/link";
import {
  LayoutDashboard,
  History,
  BrainCircuit,
  Wallet,
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
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

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
      href: "/dashboard/history",
      label: "Cronologia",
      icon: History,
    },
    {
      href: "/dashboard/ai-advisor",
      label: "Consulente AI",
      icon: BrainCircuit,
    },
  ];

  return (
    <AuthGuard>
      <SidebarProvider>
        <div className="flex min-h-screen bg-background text-foreground">
          <Sidebar>
            <SidebarHeader className="p-4">
              <Link href="/dashboard" className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground rounded-full">
                  <Wallet className="h-5 w-5" />
                </Button>
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
                      className="w-full justify-start"
                      tooltip={{
                        children: item.label,
                        side: 'right',
                        align: 'center',
                      }}
                    >
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarContent>
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
