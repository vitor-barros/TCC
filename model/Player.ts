import { Card } from "./Card";

export class Player {
    id: string;
    name: string;
    score: number;
    hand: Card[];

    constructor(name: string, id?: string) {
        // se vier um ID (do Firebase), usa ele. Se não, gera um aleatório.
        this.id = id || crypto.randomUUID(); 
        this.name = name;
        this.score = 0;
        this.hand = [];
    }

    addScore(points: number) {
        this.score += points;
    }
    
    addCard(card: Card) {
        this.hand.push(card);
    }
    
    removeCard(cardId: string) {
        this.hand = this.hand.filter(card => card.id !== cardId);
    }
}