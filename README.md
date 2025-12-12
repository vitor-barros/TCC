<div align="center">
  <h1>Timeline Game</h1>
  
  <p>
    <strong>Uma plataforma multiplayer em tempo real para o ensino de História através da gamificação.</strong>
  </p>

  <p>
    <a href="#sobre-o-projeto">Sobre</a> •
    <a href="#funcionalidades">Funcionalidades</a> •
    <a href="#tecnologias">Tecnologias</a> •
    <a href="#como-rodar">Como Rodar</a> •
    <a href="#contexto-acadêmico">TCC</a>
  </p>

  ![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
  ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
  ![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-38B2AC?style=for-the-badge&logo=tailwind-css)
  ![Firebase](https://img.shields.io/badge/Firebase-Realtime-FFCA28?style=for-the-badge&logo=firebase)
</div>

<br />

## Sobre o Projeto

**Timeline Game** é um jogo educativo desenvolvido para auxiliar na fixação de conteúdos históricos. O objetivo é desafiar os jogadores a posicionar eventos históricos na ordem cronológica correta ou adivinhar o ano exato do acontecimento.

O diferencial do projeto é sua arquitetura **Serverless Realtime**, que permite que múltiplos jogadores interajam simultaneamente na mesma sala, com atualizações de estado instantâneas (sem necessidade de refresh), proporcionando uma experiência competitiva e fluida.

> **Status:** MVP (Minimum Viable Product) Finalizado.

---

## Funcionalidades

### Experiência de Jogo
- **Multiplayer em Tempo Real:** Sincronização instantânea de jogadores, cartas e pontuação via WebSockets (Firebase).
- **Sistema de Lobby:** Sala de espera onde o *Host* configura o tempo da partida e aguarda os participantes.
- **Feedback Imediato:** O jogo revela o ano real e calcula a pontuação baseada na precisão do palpite (quanto mais perto, mais pontos).

### Interface Híbrida e Responsiva
O jogo adapta a mecânica de interação dependendo do dispositivo do usuário para garantir a melhor usabilidade:
- **Desktop:** Mecânica de **Drag & Drop** (Arrastar e Soltar) na linha do tempo.
- **Mobile:** Mecânica de **Toque + Modal de Input** numérico, evitando erros de precisão em telas pequenas.

---

## Screenshots

| Lobby & Sala de Espera | Gameplay (Desktop) |
|:---:|:---:|
| <img src="./public/images/print-lobby.png" alt="Lobby" width="400"> | <img src="./public/images/print-game.png" alt="Gameplay" width="400"> |

| Modal Mobile | Tela de Vitória |
|:---:|:---:|
| <img src="./public/images/print-mobile.png" alt="Mobile Input" width="400"> | <img src="./public/images/print-win.png" alt="Win Screen" width="400"> |

*(Nota: As imagens acima são ilustrativas. Certifique-se de que os arquivos existam na pasta public/images)*

---

## Tecnologias Utilizadas

Este projeto foi construído utilizando as melhores práticas de desenvolvimento web moderno:

- **Frontend:** [Next.js](https://nextjs.org/) (App Router & Server Components)
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/) (Tipagem estática para segurança do código)
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/) (Design responsivo e animações)
- **Backend & Database:** [Firebase Realtime Database](https://firebase.google.com/) (Sincronização de dados JSON em tempo real)
- **Autenticação:** Firebase Auth (Login Anônimo para acesso rápido)
- **Ícones:** Material Symbols (Google Fonts)

---

## Como Rodar o Projeto

### Pré-requisitos
Antes de começar, você precisará ter instalado em sua máquina:
- [Node.js](https://nodejs.org/en/) (v18 ou superior)
- Gerenciador de pacotes (NPM ou Yarn)

### Passo a passo

1. **Clone o repositório**
   
   ```bash
   git clone [https://github.com/vitor-barros/TCC.git](https://github.com/vitor-barros/TCC.git)
   cd TCC 
   ```
2. **Instale as dependências**
   
    ```bash
     npm install
    ```
3. **Configure as Variáveis de Ambiente**
   
   ```bash
     Crie um arquivo .env.local na raiz do projeto e adicione as credenciais do seu projeto Firebase:
      NEXT_PUBLIC_FIREBASE_API_KEY=sua_api_key
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
      NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://seu_projeto.firebaseio.com
      NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu_project_id
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu_bucket
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
      NEXT_PUBLIC_FIREBASE_APP_ID=seu_app_id
    ```
4. **Execute o projeto**
   
   ```bash
   npm run dev
   ```
5. **Acesse**
   
   ```bash
   http://localhost:3000
   ```
6. **Faça um teste! Jogue o jogo no navegador**
   
   ```bash
   https://tcc-theta-woad.vercel.app/
   ```
   
   

   

   
