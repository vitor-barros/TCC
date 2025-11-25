// services/GameManager.ts
import { Player } from "@/model/Player";
import { Card } from "@/model/Card";

export type Placement = { 
  card: Card; 
  playerId: string; 
  guessedYear: number;
  isTemporary: boolean; // Novo: Indica se a carta ainda não foi pontuada (final da rodada)
};

export type GameStateJSON = {
  players: any[];
  timeline: Placement[];
  roundActive: boolean;
  
  // Timer agora é do TURNO, não da rodada global
  turnEndsAt: number | null; 
  turnDuration: number;

  currentRoundIndex: number;
  currentPlayerIndex: number;
  
  // Guardamos palpites pendentes de pontuação
  pendingScoring: { playerId: string; guess: { card: Card; guessedYear: number } }[];
};

export class GameManager {
  players: Player[] = [];
  timeline: Placement[] = [];
  
  roundActive = false;
  currentRoundIndex = 0;
  currentPlayerIndex = 0; // Índice de quem é a vez agora

  // Configuração de Tempo
  turnDuration = 60; // Configurado pelo lobby
  turnEndsAt: number | null = null;

  // Armazena jogadas feitas nesta rodada para pontuar no final
  pendingScoring: Map<string, { card: Card; guessedYear: number }> = new Map();

  scoreMax = 100;
  scoreScale = 50;

  constructor() {}

  // --- SERIALIZAÇÃO ---
  toJSON(): GameStateJSON {
    return {
      players: this.players,
      timeline: this.timeline,
      roundActive: this.roundActive,
      turnEndsAt: this.turnEndsAt,     // ENVIA O TEMPO DO TURNO ATUAL
      turnDuration: this.turnDuration,
      currentRoundIndex: this.currentRoundIndex,
      currentPlayerIndex: this.currentPlayerIndex,
      pendingScoring: Array.from(this.pendingScoring.entries()).map(([pid, val]) => ({
        playerId: pid,
        guess: val
      })),
    };
  }

  fromJSON(json: GameStateJSON) {
    if (!json) return;

    this.players = (json.players || []).map((p: any) => {
      const newP = new Player(p.name, p.id);
      newP.score = p.score;
      newP.hand = (p.hand || []).map((c: any) => new Card(c.id, c.title, c.imageUrl, c.year));
      return newP;
    });

    this.timeline = json.timeline || [];
    this.roundActive = json.roundActive ?? false;
    
    this.turnEndsAt = json.turnEndsAt ?? null;
    this.turnDuration = json.turnDuration ?? 60;
    
    this.currentRoundIndex = json.currentRoundIndex ?? 0;
    this.currentPlayerIndex = json.currentPlayerIndex ?? 0;

    this.pendingScoring = new Map();
    if (Array.isArray(json.pendingScoring)) {
      json.pendingScoring.forEach((item) => {
        const c = item.guess.card;
        const cardObj = new Card(c.id, c.title, c.imageUrl, c.year);
        this.pendingScoring.set(item.playerId, { card: cardObj, guessedYear: item.guess.guessedYear });
      });
    }

    // CHECK LAZY: Verifica se o tempo do JOGADOR ATUAL estourou
    this.checkTurnExpiration();
  }

  // --- LÓGICA DE TEMPO (TURNO) ---
  checkTurnExpiration() {
    if (this.roundActive && this.turnEndsAt && Date.now() > this.turnEndsAt) {
      console.log(`Tempo do jogador ${this.currentPlayerIndex} esgotado. Passando a vez...`);
      this.skipTurn();
    }
  }

  skipTurn() {
    // Jogador perde a vez, não joga carta, e passa para o próximo
    // Opcional: penalidade de pontos? Por enquanto só passa.
    this.advanceTurn();
  }

  // --- AÇÕES ---

  addPlayer(uid: string, name: string) {
    const existing = this.players.find(p => p.id === uid);
    if (existing) return existing;
    // Se o jogo já começou, não deixa entrar (ou entra como espectador, mas vamos simplificar)
    if (this.roundActive || this.timeline.length > 0) return null;

    const p = new Player(name, uid);
    this.players.push(p);
    return p;
  }

  seedAndDistribute(cards: Card[], cardsPerPlayer = 3) {
    const pool = [...cards];
    // Shuffle
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    this.players.forEach(p => { p.hand = []; p.score = 0; });
    this.timeline = [];
    this.currentRoundIndex = 0;
    this.currentPlayerIndex = 0;
    this.roundActive = false;
    this.turnEndsAt = null;
    this.pendingScoring.clear();

    let idx = 0;
    for (const p of this.players) {
        for (let c = 0; c < cardsPerPlayer; c++) {
            if (idx < pool.length) p.addCard(pool[idx++]);
        }
    }
    return { ok: true };
  }

  startRound(turnDurationSec?: number) {
    if (this.roundActive) return { ok: false, error: "Round active" };
    if (this.players.length === 0) return { ok: false, error: "No players" };

    this.pendingScoring.clear();
    this.turnDuration = turnDurationSec ?? this.turnDuration;
    
    this.roundActive = true;
    this.currentPlayerIndex = 0; // Começa pelo player 0
    
    // Inicia o timer do PRIMEIRO jogador
    this.turnEndsAt = Date.now() + this.turnDuration * 1000;

    return { ok: true };
  }

  placeGuess(playerId: string, cardId: string, guessedYear: number) {
    this.checkTurnExpiration();
    
    if (!this.roundActive) return { ok: false, error: "Round not active" };
    
    // Verifica se é a vez deste jogador
    const currentPlayer = this.players[this.currentPlayerIndex];
    if (!currentPlayer || currentPlayer.id !== playerId) {
        return { ok: false, error: "Not your turn" };
    }

    const cardIndex = currentPlayer.hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return { ok: false, error: "Card not in hand" };
    
    const card = currentPlayer.hand[cardIndex];
    
    // 1. Remove da mão
    currentPlayer.hand.splice(cardIndex, 1);

    // 2. Adiciona na Timeline IMEDIATAMENTE (Visualmente)
    // isTemporary = true significa que ainda não foi validada (cor verde/amarela no front?)
    this.timeline.push({ 
        card, 
        playerId, 
        guessedYear, 
        isTemporary: true 
    });
    // Ordena visualmente pelo ano chutado para o próximo ver a timeline montada
    this.timeline.sort((a, b) => a.guessedYear - b.guessedYear);

    // 3. Salva para pontuação futura
    this.pendingScoring.set(playerId, { card, guessedYear });

    // 4. Passa a vez
    this.advanceTurn();

    return { ok: true };
  }

  advanceTurn() {
    // Incrementa índice
    this.currentPlayerIndex++;

    // Se o índice passou do último jogador, a rodada acabou!
    if (this.currentPlayerIndex >= this.players.length) {
        this.resolveRound();
    } else {
        // Se não, reinicia o timer para o próximo jogador
        this.turnEndsAt = Date.now() + this.turnDuration * 1000;
    }
  }

  resolveRound() {
    // 1. Calcula Pontuação (Igual ao anterior)
    for (const [pid, val] of Array.from(this.pendingScoring.entries())) {
        const player = this.players.find(p => p.id === pid);
        if (!player) continue;

        const pts = this.computeScore(val.guessedYear, val.card.year);
        player.addScore(pts);
    }

    // 2. Torna as cartas da timeline permanentes
    this.timeline.forEach(t => t.isTemporary = false);

    // 3. Limpa palpites pendentes
    this.pendingScoring.clear();

    // 4. Verifica se alguém ganhou (ficou sem cartas na mão)
    const winner = this.players.find(p => p.hand.length === 0);
    if (winner) {
        this.roundActive = false;
        this.turnEndsAt = null;
        console.log(`Fim de jogo! Vencedor: ${winner.name}`);
        return; // O jogo acaba aqui
    }

    // 5. PREPARA A PRÓXIMA RODADA (Aqui está a correção!)
    this.currentRoundIndex++;
    this.currentPlayerIndex = 0; // Volta para o primeiro jogador
    
    // MANTÉM O JOGO ATIVO
    this.roundActive = true; 
    
    // REINICIA O TIMER PARA O PRIMEIRO JOGADOR IMEDIATAMENTE
    this.turnEndsAt = Date.now() + this.turnDuration * 1000;
  }

  computeScore(guessed: number, actual: number) {
    const diff = Math.abs(guessed - actual);
    const score = Math.round(this.scoreMax * (1 / (1 + diff / this.scoreScale)));
    return Math.max(0, score);
  }

  resetMatch() {
      this.players = [];
      this.timeline = [];
      this.roundActive = false;
      this.turnEndsAt = null;
      this.pendingScoring.clear();
      this.currentRoundIndex = 0;
      this.currentPlayerIndex = 0;
  }
}