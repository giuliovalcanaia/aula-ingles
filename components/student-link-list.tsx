"use client"

import { markLinkAsStarted } from "@/app/atividade/actions"
import { ClickableCard, type ActivityStatus } from "@/components/clickable-card"
import { ConcludeLinkDialog } from "@/components/conclude-link-dialog"

export type StudentLink = {
  id: number
  titulo: string
  descricao: string | null
  href: string
  status: ActivityStatus
}

export function StudentLinkList({ links }: { links: StudentLink[] }) {
  return (
    <div className="space-y-4">
      {links.map((link) => (
        <ClickableCard
          key={link.id}
          href={link.href}
          title={link.titulo}
          status={link.status}
          footer={
            link.status === "fazendo" ? (
              <ConcludeLinkDialog linkId={link.id} titulo={link.titulo} />
            ) : undefined
          }
          onBeforeNavigate={
            link.status === "aberta" || link.status === "fazendo"
              ? async () => {
                  await markLinkAsStarted(link.id)
                }
              : undefined
          }
        >
          {link.descricao && (
            <p className="text-sm text-muted-foreground">{link.descricao}</p>
          )}
        </ClickableCard>
      ))}
    </div>
  )
}
