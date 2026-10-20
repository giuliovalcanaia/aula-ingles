"use client"

import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { GalleryVerticalEndIcon, List, MapIcon, Plus } from "lucide-react"

type Professor = {
  id: number
  nome: string
}

export function AppSidebar({
  professor,
  email,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  professor: Professor
  email?: string
}) {
  const teams = [
    {
      name: "GV Sistemas",
      logo: <GalleryVerticalEndIcon />,
      plan: "Professor",
    },
  ]

  const navMain: React.ComponentProps<typeof NavMain>["items"] = []

  const projects = [
    {
      name: "Histórico",
      url: "#",
      icon: <List />,
    },
    {
      name: "Criar nova atividade",
      url: "#",
      icon: <Plus />,
    },
    {
      name: "Turmas",
      url: "#",
      icon: <MapIcon />,
    },
  ]

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavProjects projects={projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: professor.nome,
            email: email ?? "sem e-mail",
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
