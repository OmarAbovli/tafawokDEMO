"use client"

import type React from "react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Gauge, Grid2X2, Radio, Upload, Users, QrCode, Settings } from "lucide-react"

const items = [
  { title: "Dashboard", href: "/teacher", icon: Gauge },
  { title: "Go Live", href: "/teacher#live", icon: Radio },
  { title: "Upload Video", href: "/teacher#upload", icon: Upload },
  { title: "Your Videos", href: "/teacher#my-videos", icon: Grid2X2 },
  { title: "Your Students", href: "/teacher/students", icon: Users },
  { title: "Access", href: "/teacher#access", icon: Grid2X2 },
  { title: "QR Login", href: "/teacher#qr", icon: QrCode },
  { title: "Settings", href: "/teacher#settings", icon: Settings },
]

export function TeacherAppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <div className="px-2 py-1.5 text-sm font-semibold flex items-center gap-2">
          <span>Teacher Studio</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
