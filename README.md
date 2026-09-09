# Aula de Inglês - Exercícios de Vocabulary: Clothes

Aplicação web interativa para organizar e acompanhar o progresso de exercícios de vocabulário em inglês sobre roupas (*clothes*). O projeto utiliza uma interface moderna e gamificada, onde os alunos avançam sequencialmente entre as atividades e a professora libera cada etapa com uma senha.

---

## Funcionalidades

- **Lista sequencial de exercícios**: 6 atividades externas do [AgendaWeb](https://agendaweb.org) focadas em vocabulário de roupas.
- **Barra de progresso em tempo real**: visualiza o percentual de conclusão da aula.
- **Sistema de bloqueio e liberação**:
  - Próxima atividade destacada em azul/ciano.
  - Atividades futuras bloqueadas até que a anterior seja concluída.
  - Após o aluno acessar a atividade, o status muda para *aguardando revisão* (amarelo).
  - A professora insere a senha para aprovar e liberar a próxima etapa.
- **Persistência local**: o progresso é salvo no `sessionStorage` do navegador.
- **Design responsivo**: adaptado para desktop e mobile, com visual baseado em Material Design 3 e Tailwind CSS.

---

## Estrutura do Projeto

```
.
├── index.html      # Estrutura da página e configurações do Tailwind
├── app.js          # Lógica de interação, estados e progresso
├── config.js       # Lista de exercícios e hash da senha da professora
└── README.md       # Este arquivo
```

---

## Tecnologias Utilizadas

- **HTML5** semântico
- **Tailwind CSS** (via CDN) com tema customizado
- **JavaScript ES6+** (módulos nativos)
- **Google Fonts**: Plus Jakarta Sans e Material Symbols

---

## Como Usar

1. Clone ou baixe este repositório.
2. Abra o arquivo `index.html` em um navegador moderno.
3. O aluno clica na atividade destacada para abrir o exercício externo.
4. Ao retornar à página, a atividade ficará no estado *Aguardando Revisão*.
5. A professora digita a senha no campo amarelo e confirma para liberar a próxima atividade.

> **Nota**: como o progresso é armazenado no `sessionStorage`, ele será perdido ao fechar a aba do navegador.

---

## Estados das Atividades

| Estado | Cor | Significado |
|--------|-----|-------------|
| `next` | Azul/Ciano | Próxima atividade a ser realizada |
| `waiting_review` | Amarelo | Aguardando aprovação da professora |
| `done` | Verde | Atividade concluída e aprovada |
| `locked` | Cinza | Bloqueada até concluir a anterior |

---

## Personalização

Para adicionar novos exercícios ou alterar a senha da professora, edite o arquivo `config.js`:

```js
export const lessons = [
  {
    id: "exercicio-1",
    href: "https://link-do-exercicio.com",
    title: "Título do Exercício",
    description: "Breve descrição da atividade."
  },
  // ...
];
```

A senha é armazenada como um hash SHA-256. Para gerar um novo hash, você pode usar o console do navegador ou qualquer ferramenta online de SHA-256.

---

## Licença

Este projeto é de uso educacional e pode ser adaptado livremente para outras turmas ou conteúdos.
