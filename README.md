# Activity Tracker

Uma aplicação web leve e interativa para gestão sequencial de atividades educacionais. Projetada para ambientes de sala de aula onde o professor acompanha o progresso individual dos alunos em tempo real, liberando cada etapa conforme a conclusão das atividades anteriores.

---

## Conceito

O **Activity Tracker** funciona como um hub centralizado para listas de exercícios ou conteúdos externos. O professor configura uma sequência de links (atividades), e cada aluno avança no seu próprio ritmo. O professor pode circular entre os computadores, visualizar o status de cada aluno e desbloquear as próximas etapas instantaneamente com uma senha mestra.

---

## Como Funciona

### Para o Aluno
1. Abre a aplicação no navegador.
2. Visualiza a lista de atividades disponíveis.
3. Clica na atividade atual (destacada) para abrir o exercício externo em uma nova aba.
4. Ao retornar, a atividade fica marcada como *Aguardando Revisão*.
5. Aguarda o professor validar para que a próxima atividade seja liberada.

### Para o Professor
1. Acompanha a barra de progresso de cada aluno individualmente.
2. Identifica rapidamente quem está aguardando revisão (status amarelo).
3. Insere a senha mestra no campo de liberação para aprovar a atividade.
4. O próximo exercício é desbloqueado automaticamente para o aluno.

---

## Estados das Atividades

| Estado | Cor | Significado |
|--------|-----|-------------|
| `next` | Azul/Ciano | Próxima atividade disponível para o aluno |
| `waiting_review` | Amarelo | Atividade acessada, aguardando aprovação do professor |
| `done` | Verde | Atividade concluída e aprovada |
| `locked` | Cinza | Bloqueada até que a atividade anterior seja aprovada |

---

## Funcionalidades

- **Progressão sequencial**: atividades são desbloqueadas uma a uma.
- **Barra de progresso individual**: percentual de conclusão em tempo real.
- **Sistema de aprovação por senha**: apenas o professor libera novas etapas.
- **Persistência de sessão**: o progresso do aluno é mantido durante a navegação (via `sessionStorage`).
- **Design responsivo**: funciona em desktops, notebooks e tablets.
- **Tema visual moderno**: baseado em Material Design 3 com Tailwind CSS.
- **Zero dependências de build**: funciona diretamente no navegador, sem compilação.

---

## Estrutura do Projeto

```
.
├── index.html      # Interface da aplicação e configuração de tema
├── app.js          # Lógica de interação, estados e controle de progresso
├── config.js       # Lista de atividades e hash da senha de aprovação
├── favicon.svg     # Ícone da aplicação
└── README.md       # Documentação
```

---

## Tecnologias

- **HTML5** semântico
- **Tailwind CSS** (via CDN) com tema customizado
- **JavaScript ES6+** (módulos nativos)
- **Google Fonts**: Plus Jakarta Sans e Material Symbols

---

## Personalização

### Adicionar ou alterar atividades

Edite o arquivo `config.js`:

```js
export const lessons = [
  {
    id: "atividade-1",
    href: "https://link-da-atividade.com",
    title: "Título da Atividade",
    description: "Breve descrição do que o aluno deve fazer."
  },
  // Adicione mais atividades...
];
```

### Alterar a senha de aprovação

A senha é armazenada como hash SHA-256 no `config.js`:

```js
export const TEACHER_PASSWORD_HASH = 'seu-hash-aqui';
```

Para gerar um novo hash, utilize o console do navegador ou uma ferramenta online de SHA-256.

### Adaptar para outras disciplinas

Basta alterar o título no `index.html` e substituir os links e descrições no `config.js`. A lógica de progresso, cores e fluxo de aprovação permanecem os mesmos para qualquer conteúdo.

---

## Uso em Sala de Aula

1. **Configure** a lista de atividades no `config.js` antes da aula.
2. **Distribua** o arquivo `index.html` (ou hospede em um servidor local/simples).
3. **Cada aluno** abre a aplicação em seu navegador.
4. O **professor circula** pela sala, aprova as atividades concluídas e acompanha o progresso.

> **Nota**: o progresso é armazenado no `sessionStorage` do navegador. Se o aluno fechar a aba, o progresso será reiniciado. Isso é intencional para uso em sessões de aula individuais.

---

## Licença

Este projeto é de uso educacional e pode ser adaptado livremente para qualquer disciplina, turma ou contexto de ensino.
