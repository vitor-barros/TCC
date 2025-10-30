import { Card } from "./Card";
import { Player } from "./Player";

export class Timeline {
    placements: { card: Card; player: Player; guessedYear: number }[] = [];

    addPlacement(card: Card, player: Player, guessedYear: number) {
        this.placements.push({ card, player, guessedYear });
    }
    getPlayerPlacements(playerId: string) {
        return this.placements.filter(p => p.player.id === playerId);
    }
}