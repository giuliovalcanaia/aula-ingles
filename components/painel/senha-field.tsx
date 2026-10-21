"use client"

import { useState } from "react"
import { DicesIcon, EyeIcon, EyeOffIcon } from "lucide-react"

import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"

/**
 * Palavras sem acento e com 4 letras ou mais: fáceis de ditar em sala e já
 * dentro do mínimo exigido pela senha.
 */
const PALAVRAS = [
  "azul",
  "banana",
  "barco",
  "bolo",
  "cachorro",
  "cadeira",
  "caju",
  "caneta",
  "carro",
  "casa",
  "castelo",
  "chuva",
  "cinema",
  "copo",
  "coelho",
  "coruja",
  "dado",
  "dedo",
  "doce",
  "escola",
  "estrela",
  "faca",
  "festa",
  "flor",
  "fogo",
  "gato",
  "gelo",
  "janela",
  "jardim",
  "lapis",
  "leite",
  "livro",
  "maca",
  "mesa",
  "molho",
  "mundo",
  "nuvem",
  "olho",
  "onda",
  "ouro",
  "parque",
  "peixe",
  "praia",
  "prato",
  "queda",
  "rato",
  "roda",
  "rosa",
  "sapo",
  "sorvete",
  "tarde",
  "telha",
  "tempo",
  "tigre",
  "vento",
  "verde",
  "vidro",
]

function sortearSenha() {
  const [sorteio] = crypto.getRandomValues(new Uint32Array(1))
  return PALAVRAS[sorteio % PALAVRAS.length]
}

type SenhaFieldProps = {
  id?: string
  name?: string
}

/** Senha de liberação com sorteio de palavras e alternância de visibilidade. */
export function SenhaField({ id = "senha", name = "senha" }: SenhaFieldProps) {
  const [senha, setSenha] = useState("")
  const [visivel, setVisivel] = useState(false)

  function sortear() {
    setSenha(sortearSenha())
    setVisivel(true)
  }

  return (
    <Field>
      <FieldLabel htmlFor={id}>Senha de liberação</FieldLabel>
      <InputGroup>
        <InputGroupInput
          id={id}
          name={name}
          type={visivel ? "text" : "password"}
          value={senha}
          onChange={(event) => setSenha(event.target.value)}
          minLength={4}
          placeholder="Mínimo de 4 caracteres"
          autoComplete="new-password"
          required
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-xs"
            aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
            onClick={() => setVisivel((atual) => !atual)}
          >
            {visivel ? <EyeOffIcon /> : <EyeIcon />}
          </InputGroupButton>
          <InputGroupButton size="xs" onClick={sortear}>
            <DicesIcon data-icon="inline-start" />
            Sortear senha
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <FieldDescription>
        O aluno digita esta senha para concluir cada link. O sorteio escolhe uma
        palavra fácil de ditar.
      </FieldDescription>
    </Field>
  )
}
