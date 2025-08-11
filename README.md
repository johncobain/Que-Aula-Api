# Que Aula API 📚

API REST para o site [que-aula.vercel.app](https://que-aula.vercel.app), uma aplicação dedicada aos estudantes de **Análise e Desenvolvimento de Sistemas (ADS) do IFBA - Campus Salvador** para consultar horários de aulas, calendário semanal e fluxograma do curso.

## 📋 Sobre o Projeto

A **Que Aula API** é uma API simples e eficiente que fornece dados essenciais para estudantes de ADS, incluindo:

- **Horários das aulas do dia**: Consulte quais disciplinas você tem hoje
- **Calendário semanal completo**: Visualize sua grade horária da semana
- **Fluxograma do curso**: Navegue pelas disciplinas e seus pré-requisitos

## 🚀 Tecnologias Utilizadas

- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web minimalista
- **Nodemon** - Auto-reload durante desenvolvimento
- **JSON** - Armazenamento de dados estático

## 📁 Estrutura do Projeto

```bash
que-aula-api/
├── package.json
├── README.md
└── src/
    ├── app.js                 # Configuração principal do servidor
    ├── controllers/           # Lógica de negócio
    │   ├── classes.js         # Controller para disciplinas/horários
    │   └── flowchart.js       # Controller para fluxograma
    ├── data/                  # Dados estáticos em JSON
    │   ├── classes.json       # Dados das disciplinas e horários
    │   └── flowchart.json     # Dados do fluxograma do curso
    └── routes/                # Definição das rotas
        ├── classes.js         # Rotas para disciplinas
        └── flowchart.js       # Rotas para fluxograma
```

## 🛠️ Instalação e Execução

### Pré-requisitos

- Node.js (versão 14 ou superior)
- npm ou yarn

### Passos para executar

1. **Clone o repositório**

   ```bash
   git clone https://github.com/johncobain/Que-Aula-Api.git
   cd Que-Aula-Api
   ```

2. **Instale as dependências**

   ```bash
   npm install
   ```

3. **Execute o servidor**

   ```bash
   npm start
   ```

O servidor estará rodando em `http://localhost:3000`

## 📚 Documentação da API

### 🔍 Health Check

#### `GET /`

Endpoint para verificar se a API está funcionando.

**Resposta:**

```json
{
  "message": "Que Aula API está funcionando!",
  "version": "1.0.0",
  "endpoints": {
    "classes": "/classes",
    "flowchart": "/flowchart"
  }
}
```

### 🎯 Endpoints de Disciplinas

#### `GET /classes`

Retorna todas as disciplinas com seus horários completos.

**Resposta:**

```json
[
  {
    "name": "ADM504",
    "description": "Contabilidade Geral",
    "semester": "0",
    "multiClass": false,
    "greve": false,
    "classes": [
      {
        "weekDay": "4",
        "period": ["4", "5"],
        "teacher": "Emerson Gibaut",
        "classroom": "BLOCO O - Sala 2 (1º Andar)"
      }
    ]
  },
  ...
]
```

#### `GET /classes/:className`

Retorna os detalhes de uma disciplina específica.

**Parâmetros:**

- `className` - Nome/código da disciplina (ex: "ADM504")

**Exemplo:**

```bash
GET /classes/ADM504
```

**Resposta de sucesso:**

```json
{
  "name": "ADM504",
  "description": "Contabilidade Geral",
  "semester": "0",
  "multiClass": false,
  "greve": false,
  "classes": [...]
}
```

**Resposta de erro:**

```json
{
  "error": "Class not found"
}
```

### 📊 Endpoints do Fluxograma

#### `GET /flowchart`

Retorna o fluxograma completo do curso organizado por semestres.

**Resposta:**

```json
[
  [
    {
      "name": "INF027",
      "description": "Introdução à Lógica",
      "requiredFor": ["INF029", "INF006"],
      "credit": "60 - 3",
      "state": "default",
      "semester": 0
    },
    ...
  ],
  ...
]
```

#### `GET /flowchart/:classFlowchartName`

Retorna informações específicas de uma disciplina no fluxograma.

**Parâmetros:**

- `classFlowchartName` - Nome/código da disciplina no fluxograma

**Exemplo:**

```bash
GET /flowchart/INF027
```

**Resposta de sucesso (200):**

```json
{
  "name": "INF027",
  "description": "Introdução à Lógica",
  "requiredFor": ["INF029", "INF006"],
  "credit": "60 - 3",
  "state": "default",
  "semester": 0
}
```

**Resposta de erro (404):**

```json
{
  "error": "Class not found"
}
```

## 🏗️ Arquitetura

A API segue uma arquitetura **MVC simplificada**:

- **Models**: Dados armazenados em arquivos JSON estáticos
- **Views**: Respostas JSON da API
- **Controllers**: Lógica de negócio para processamento dos dados
- **Routes**: Mapeamento de URLs para controllers

### Controllers

#### Classes Controller (`controllers/classes.js`)

- `list()` - Lista todas as disciplinas
- `get(className)` - Busca disciplina por nome

#### Flowchart Controller (`controllers/flowchart.js`)

- `list()` - Lista todo o fluxograma
- `get(classFlowchartName)` - Busca disciplina no fluxograma com busca otimizada (para quando encontra)

### Estrutura dos Dados

#### Classes JSON

Cada disciplina contém:

- `name`: Código da disciplina
- `description`: Nome completo da disciplina
- `semester`: Semestre da disciplina
- `multiClass`: Se possui múltiplas turmas
- `greve`: Status de greve
- `classes`: Array com horários (dia da semana, período, professor, sala)

#### Flowchart JSON

Organizado como array de semestres, cada disciplina contém:

- `name`: Código da disciplina
- `description`: Nome completo
- `requiredFor`: Disciplinas que dependem desta
- `credit`: Carga horária e créditos
- `state`: Status no fluxograma
- `semester`: Semestre da disciplina

## 🎯 Casos de Uso

### Para o Frontend (que-aula.vercel.app)

1. **Visualizar aulas do dia**: Filtra disciplinas por dia da semana
2. **Calendário semanal**: Exibe grade horária completa
3. **Navegação no fluxograma**: Mostra pré-requisitos e dependências

### Exemplos de Integração

```javascript
// Buscar todas as disciplinas
const classes = await fetch("/classes").then((res) => res.json());

// Buscar disciplina específica
const subject = await fetch("/classes/INF027").then((res) => res.json());

// Buscar fluxograma completo
const flowchart = await fetch("/flowchart").then((res) => res.json());

// Buscar disciplina no fluxograma
const flowchartSubject = await fetch("/flowchart/INF027").then((res) =>
  res.json()
);
```

## 🔧 Desenvolvimento

### Scripts Disponíveis

- `npm start` - Inicia o servidor com nodemon (auto-reload)

### Adicionando Novas Funcionalidades

1. **Novos endpoints**: Adicione rotas em `/routes`
2. **Nova lógica**: Implemente controllers em `/controllers`
3. **Novos dados**: Atualize arquivos JSON em `/data`

## 📝 Notas Importantes

- **Dados estáticos**: Os dados são armazenados em arquivos JSON e devem ser atualizados manualmente
- **CORS**: Pode ser necessário configurar CORS para produção
- **Validação**: Atualmente não há validação de entrada robusta

## 🚀 Deploy

### Vercel

Esta API está configurada para deploy no [**Vercel**](https://vercel.com).

#### Deploy automático

- Conecte o repositório GitHub ao Vercel
- Cada push para a branch main será automaticamente deployed

#### Deploy manual

```bash
npm install -g vercel
vercel login
vercel --prod
```

### Configurações de Produção

- ✅ **CORS configurado** para permitir acesso do frontend
- ✅ **Health check** disponível em `/`
- ✅ **Serverless functions** otimizadas para Vercel

## 📞 Suporte

Esta API foi desenvolvida especificamente para estudantes de ADS do IFBA - Salvador. Para sugestões ou problemas, consulte o repositório do projeto no GitHub.

---

**Desenvolvido para a comunidade acadêmica do IFBA Salvador** 🎓
