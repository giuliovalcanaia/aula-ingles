"use client"

import * as React from "react"

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
import {
  FolderIcon,
  GalleryVerticalEndIcon,
  LayoutListIcon,
  MapIcon,
  Plus,
} from "lucide-react"

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

  const projects = [
    {
      name: "Atividades",
      url: "/painel",
      icon: <LayoutListIcon />,
    },
    {
      name: "Nova atividade",
      url: "/painel/atividades/nova",
      icon: <Plus />,
    },
    {
      name: "Turmas",
      url: "/painel/turmas",
      icon: <MapIcon />,
    },
    {
      name: "Pastas",
      url: "/painel/pastas",
      icon: <FolderIcon />,
    },
  ]

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavProjects items={projects} />
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
