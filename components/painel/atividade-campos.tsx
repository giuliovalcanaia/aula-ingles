import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type AtividadeCamposProps = {
  titulo?: string
  subtitulo?: string | null
  autoFocus?: boolean
}

/** Título e subtítulo: os campos de identificação da atividade. */
export function AtividadeCampos({
  titulo,
  subtitulo,
  autoFocus = false,
}: AtividadeCamposProps) {
  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="titulo">Título</FieldLabel>
        <Input
          id="titulo"
          name="titulo"
          placeholder="Ex.: Can / Can't"
          defaultValue={titulo}
          autoFocus={autoFocus}
          required
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="subtitulo">Subtítulo</FieldLabel>
        <Textarea
          id="subtitulo"
          name="subtitulo"
          placeholder="Ex.: Exercícios de can / can't"
          defaultValue={subtitulo ?? ""}
          rows={2}
        />
        <FieldDescription>
          Opcional. Aparece para o aluno logo acima dos links.
        </FieldDescription>
      </Field>
    </FieldGroup>
  )
}
