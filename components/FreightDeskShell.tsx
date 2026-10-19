"use client";

import type { ReactNode } from "react";

import { AgentPlaceholder } from "@/components/AgentPlaceholder";
import { AssemblerPanel } from "@/components/AssemblerPanel";
import { ClarificationPanel } from "@/components/ClarificationPanel";
import { SettingsPanel } from "@/components/SettingsPanel";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { type VisitSection, useVisitStore } from "@/lib/visit-store";
import {
  BotIcon,
  ClipboardCheckIcon,
  PackageIcon,
  SettingsIcon,
  TruckIcon,
} from "lucide-react";

const NAV: {
  section: VisitSection;
  label: string;
  icon: typeof BotIcon;
}[] = [
  { section: "assembler", label: "Assembler Agent", icon: BotIcon },
  {
    section: "clarification",
    label: "Clarification Agent",
    icon: ClipboardCheckIcon,
  },
  { section: "booking", label: "Booking Agent", icon: PackageIcon },
  { section: "settings", label: "Settings", icon: SettingsIcon },
];

function KeepAlivePanel({
  active,
  children,
}: {
  active: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={
        active
          ? "flex min-h-0 flex-1 flex-col overflow-hidden"
          : "hidden"
      }
      aria-hidden={!active}
      inert={!active}
    >
      {children}
    </div>
  );
}

function MainWindow() {
  const section = useVisitStore((s) => s.section);

  return (
    <>
      <KeepAlivePanel active={section === "assembler"}>
        <AssemblerPanel />
      </KeepAlivePanel>
      <KeepAlivePanel active={section === "clarification"}>
        <ClarificationPanel />
      </KeepAlivePanel>
      {section === "booking" ? (
        <AgentPlaceholder agentName="Booking Agent" />
      ) : null}
      {section === "settings" ? <SettingsPanel /> : null}
    </>
  );
}

export function FreightDeskShell() {
  const section = useVisitStore((s) => s.section);
  const setSection = useVisitStore((s) => s.setSection);

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="border-b border-sidebar-border">
          <div className="flex items-center gap-2 px-2 py-3 group-data-[collapsible=icon]:justify-center">
            <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <TruckIcon className="size-4" />
            </div>
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="truncate text-sm font-semibold">Freight Desk</p>
              <p className="truncate text-xs text-sidebar-foreground/70">POC</p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Agents</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV.map(({ section: id, label, icon: Icon }) => (
                  <SidebarMenuItem key={id}>
                    <SidebarMenuButton
                      isActive={section === id}
                      onPress={() => setSection(id)}
                      tooltip={label}
                    >
                      <Icon />
                      <span>{label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
      <SidebarInset className="flex min-h-svh flex-col">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <span className="text-sm text-muted-foreground">
            {NAV.find((n) => n.section === section)?.label}
          </span>
        </header>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <MainWindow />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
