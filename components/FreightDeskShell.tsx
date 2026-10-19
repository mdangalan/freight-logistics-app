"use client";

import dynamic from "next/dynamic";
import { Activity, startTransition, type ReactNode } from "react";

import { AssemblerPanel } from "@/components/AssemblerPanel";

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
import { Skeleton } from "@/components/ui/skeleton";
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

const NAV_BY_SECTION = new Map(NAV.map((item) => [item.section, item]));

const PANEL_IMPORTS = {
  assembler: () => import("@/components/AssemblerPanel"),
  clarification: () => import("@/components/ClarificationPanel"),
  booking: () => import("@/components/AgentPlaceholder"),
  settings: () => import("@/components/SettingsPanel"),
} as const;

function PanelFallback() {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center p-8">
      <Skeleton className="h-32 w-full max-w-md" />
    </div>
  );
}

const ClarificationPanel = dynamic(
  () =>
    import("@/components/ClarificationPanel").then((mod) => ({
      default: mod.ClarificationPanel,
    })),
  { loading: PanelFallback }
);
const AgentPlaceholder = dynamic(
  () =>
    import("@/components/AgentPlaceholder").then((mod) => ({
      default: mod.AgentPlaceholder,
    })),
  { loading: PanelFallback }
);
const SettingsPanel = dynamic(
  () =>
    import("@/components/SettingsPanel").then((mod) => ({
      default: mod.SettingsPanel,
    })),
  { loading: PanelFallback }
);

const SIDEBAR_BRAND = (
  <div className="flex items-center gap-2 px-2 py-3 group-data-[collapsible=icon]:justify-center">
    <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
      <TruckIcon className="size-4" />
    </div>
    <div className="min-w-0 group-data-[collapsible=icon]:hidden">
      <p className="truncate text-sm font-semibold">Freight Desk</p>
      <p className="truncate text-xs text-sidebar-foreground/70">POC</p>
    </div>
  </div>
);

function preloadPanel(section: VisitSection) {
  if (typeof window === "undefined") return;
  void PANEL_IMPORTS[section]();
}

function SectionPanel({
  id,
  children,
}: {
  id: VisitSection;
  children: ReactNode;
}) {
  const active = useVisitStore((s) => s.section === id);
  const visited = useVisitStore((s) => s.visitedSections.includes(id));
  if (!visited) return null;

  return (
    <div
      className={
        active
          ? "flex min-h-0 flex-1 flex-col overflow-hidden"
          : "hidden"
      }
      aria-hidden={!active}
    >
      <Activity mode={active ? "visible" : "hidden"}>{children}</Activity>
    </div>
  );
}

function MainWindow() {
  return (
    <>
      <SectionPanel id="assembler">
        <AssemblerPanel />
      </SectionPanel>
      <SectionPanel id="clarification">
        <ClarificationPanel />
      </SectionPanel>
      <SectionPanel id="booking">
        <AgentPlaceholder agentName="Booking Agent" />
      </SectionPanel>
      <SectionPanel id="settings">
        <SettingsPanel />
      </SectionPanel>
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
          {SIDEBAR_BRAND}
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
                      onPress={() => startTransition(() => setSection(id))}
                      onHoverStart={() => preloadPanel(id)}
                      onFocus={() => preloadPanel(id)}
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
            {NAV_BY_SECTION.get(section)?.label}
          </span>
        </header>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <MainWindow />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
