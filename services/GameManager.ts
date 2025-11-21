// services/GameManager.ts
import { Player } from "@/model/Player";
import { Card } from "@/model/Card";

type GuessEntry = { card: Card; guessedYear: number };
type Placement = { card: Card; playerId: string; guessedYear: number };

class GameManager {
  players: Player[] = [];
  timeline: Placement[] = [];
  roundDuration = 30;
  roundEndsAt: number | null = null;
  roundTimerHandle: NodeJS.Timeout | null = null;

  // round state
  currentGuesses: Map<string, GuessEntry> = new Map(); // playerId -> guess
  roundActive = false;
  currentRoundIndex = 0;

  // New: track whose turn it is
  currentPlayerIndex: number = 0; // index into this.players when roundActive
  // scoring config
  scoreMax = 100;
  scoreScale = 50;

  constructor() {}

  // --- players
  addPlayer(name: string) {
    const p = new Player(name);
    this.players.push(p);
    return p;
  }

  removePlayer(playerId: string) {
    this.players = this.players.filter((p) => p.id !== playerId);
  }

  // --- seed + distribution
  seedAndDistribute(cards: Card[], cardsPerPlayer = 3) {
    const pool = [...cards];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    // reset state
    for (const p of this.players) {
      p.hand = [];
      p.score = 0;
    }
    this.timeline = [];
    this.currentRoundIndex = 0;
    this.roundActive = false;
    if (this.roundTimerHandle) {
      clearTimeout(this.roundTimerHandle);
      this.roundTimerHandle = null;
    }
    this.roundEndsAt = null;
    this.currentGuesses.clear();
    this.currentPlayerIndex = 0;

    // distribute unique cards
    let idx = 0;
    for (const p of this.players) {
      for (let c = 0; c < cardsPerPlayer; c++) {
        if (idx >= pool.length) break;
        p.addCard(pool[idx]);
        idx++;
      }
    }

    return {
      ok: true,
      players: this.players.map((p) => ({ id: p.id, name: p.name, handCount: p.hand.length })),
      totalSeeded: pool.length,
    };
  }

  // --- state for frontend
  getState() {
    const now = Date.now();
    const remaining = this.roundEndsAt ? Math.max(0, Math.ceil((this.roundEndsAt - now) / 1000)) : 0;
    return {
      players: this.players.map((p) => ({
        id: p.id,
        name: p.name,
        score: p.score,
        hand: p.hand.map((c) => ({ id: c.id, title: c.title, imageUrl: c.imageUrl })),
      })),
      timeline: this.timeline,
      currentRoundIndex: this.currentRoundIndex,
      roundActive: this.roundActive,
      roundRemainingSeconds: remaining,
      currentGuesses: Array.from(this.currentGuesses.entries()).map(([pid, entry]) => ({
        playerId: pid,
        cardId: entry.card.id,
        guessedYear: entry.guessedYear,
      })),
      // New: expose who's turn it is (player id or null)
      currentPlayerId: this.players[this.currentPlayerIndex]?.id ?? null,
    };
  }

  // --- start round
  startRound(durationSec?: number) {
    if (this.roundActive) return { ok: false, error: "Round already active" };
    if (this.players.length === 0) return { ok: false, error: "No players" };

    this.currentGuesses.clear();
    this.roundDuration = durationSec ?? this.roundDuration;
    this.roundEndsAt = Date.now() + this.roundDuration * 1000;
    this.roundActive = true;

    // ensure currentPlayerIndex valid
    if (this.currentPlayerIndex >= this.players.length) this.currentPlayerIndex = 0;

    if (this.roundTimerHandle) clearTimeout(this.roundTimerHandle);
    this.roundTimerHandle = setTimeout(() => {
      this.resolveRound();
    }, this.roundDuration * 1000);

    return { ok: true, roundDuration: this.roundDuration, endsAt: this.roundEndsAt, currentPlayerId: this.players[this.currentPlayerIndex]?.id ?? null };
  }

  /**
   * placeGuess: a jogada é feita por um player com uma carta da própria mão
   * ▶ fazemos: validar -> gravar -> REMOVER carta da mão -> avançar turno -> se todos jogaram, resolveRound()
   */
  placeGuess(playerId: string, cardId: string, guessedYear: number) {
    if (!this.roundActive) return { ok: false, error: "Round not active" };
    const player = this.players.find((p) => p.id === playerId);
    if (!player) return { ok: false, error: "Player not found" };

    const card = player.hand.find((c) => c.id === cardId);
    if (!card) return { ok: false, error: "Card not found in player's hand" };

    guessedYear = Math.max(1, Math.min(2025, Math.round(guessedYear)));

    // remove card from hand (consumed)
    player.removeCard(cardId);

    // store guess
    this.currentGuesses.set(playerId, { card, guessedYear });

    // advance turn to next player who still exists
    if (this.players.length > 0) {
      this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    }

    // if all players guessed (each player has an entry) -> resolve immediately
    if (this.currentGuesses.size >= this.players.length) {
      // clear timeout and resolve synchronously
      if (this.roundTimerHandle) {
        clearTimeout(this.roundTimerHandle);
        this.roundTimerHandle = null;
      }
      this.resolveRound();
    }

    return { ok: true, nextPlayerId: this.players[this.currentPlayerIndex]?.id ?? null };
  }

  computeScore(guessed: number, actual: number) {
    const diff = Math.abs(guessed - actual);
    const score = Math.round(this.scoreMax * (1 / (1 + diff / this.scoreScale)));
    return Math.max(0, score);
  }

  resolveRound() {
    if (!this.roundActive) return;
    for (const [playerId, entry] of Array.from(this.currentGuesses.entries())) {
      const player = this.players.find((p) => p.id === playerId);
      if (!player) continue;
      const pts = this.computeScore(entry.guessedYear, entry.card.year);
      player.addScore(pts);
      this.timeline.push({ card: entry.card, playerId: player.id, guessedYear: entry.guessedYear });
    }

    // round ended
    this.roundActive = false;
    this.currentRoundIndex++;
    this.currentGuesses.clear();
    if (this.roundTimerHandle) {
      clearTimeout(this.roundTimerHandle);
      this.roundTimerHandle = null;
    }
    this.roundEndsAt = null;
    // after resolving, next round should start with same index (or you can advance)
    // keep currentPlayerIndex as is (it already advanced on placeGuess)
    if (this.currentPlayerIndex >= this.players.length) this.currentPlayerIndex = 0;
  }

  confirmRoundEarly() {
    if (!this.roundActive) return { ok: false, error: "Round not active" };
    if (this.roundTimerHandle) clearTimeout(this.roundTimerHandle);
    this.resolveRound();
    return { ok: true };
  }

  resetMatch() {
  // limpar lista de jogadores
  this.players = [];

  // limpar timeline e estado
  this.timeline = [];
  this.currentRoundIndex = 0;
  this.roundActive = false;
  this.currentGuesses.clear();

  if (this.roundTimerHandle) {
    clearTimeout(this.roundTimerHandle);
    this.roundTimerHandle = null;
  }

  this.roundEndsAt = null;
  this.currentPlayerIndex = 0;
}
}

const game = new GameManager();
export default game;
