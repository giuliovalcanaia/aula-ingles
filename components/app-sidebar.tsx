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
import { GalleryVerticalEndIcon } from "lucide-react"

import { type PastaRow } from "@/lib/pastas"

type Professor = {
  id: number
  nome: string
}

export function AppSidebar({
  professor,
  email,
  pastas,
  trashCount,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  professor: Professor
  email?: string
  pastas: PastaRow[]
  trashCount: number
}) {
  const teams = [
    {
      name: "GV Sistemas",
      logo: <GalleryVerticalEndIcon />,
      plan: "Professor",
    },
  ]

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavProjects pastas={pastas} trashCount={trashCount} />
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
