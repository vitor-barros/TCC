import { Player } from "@/model/Player";
import { Timeline } from "@/model/Timeline";

export class Game {
  players: Player[];
  timeline: Timeline;
  currentPlayerIndex: number;

  constructor(players: Player[]) {
    this.players = players;
    this.timeline = new Timeline();
    this.currentPlayerIndex = 0;
  }

  get currentPlayer() {
    return this.players[this.currentPlayerIndex];
  }

  nextTurn() {
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
  }
}
