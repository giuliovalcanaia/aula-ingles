"use client"

import { useState } from "react"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

const formatoIso = "yyyy-MM-dd"

type DatePickerProps = {
  /** Data no formato do banco (`yyyy-MM-dd`) ou string vazia. */
  value: string
  onChange: (value: string) => void
  id?: string
  placeholder?: string
  clearable?: boolean
  className?: string
  "aria-label"?: string
}

/** Seletor de data controlado, com o valor exposto como `yyyy-MM-dd`. */
export function DatePicker({
  value,
  onChange,
  id,
  placeholder = "Selecionar data",
  clearable = true,
  className,
  "aria-label": ariaLabel,
}: DatePickerProps) {
  const [aberto, setAberto] = useState(false)
  const selecionada = value ? parseISO(value) : undefined

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            aria-label={ariaLabel}
            data-empty={!selecionada}
            className={cn(
              "w-full justify-start font-normal data-[empty=true]:text-muted-foreground",
              className
            )}
          />
        }
      >
        <CalendarIcon data-icon="inline-start" />
        {selecionada ? format(selecionada, "P", { locale: ptBR }) : placeholder}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto gap-0 p-0">
        <Calendar
          mode="single"
          locale={ptBR}
          selected={selecionada}
          defaultMonth={selecionada}
          onSelect={(data) => {
            onChange(data ? format(data, formatoIso) : "")
            setAberto(false)
          }}
        />
        {clearable && selecionada && (
          <>
            <Separator />
            <div className="p-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => {
                  onChange("")
                  setAberto(false)
                }}
              >
                Limpar data
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}

/**
 * Variante para formulários com server action: guarda a data em estado local
 * e envia `yyyy-MM-dd` por um input oculto.
 */
export function DateField({
  name,
  defaultValue = "",
  id,
  placeholder,
  className,
}: {
  name: string
  defaultValue?: string | null
  id?: string
  placeholder?: string
  className?: string
}) {
  const [value, setValue] = useState(defaultValue ?? "")

  return (
    <>
      <input type="hidden" name={name} value={value} />
      <DatePicker
        id={id}
        value={value}
        onChange={setValue}
        placeholder={placeholder}
        className={className}
      />
    </>
  )
}
