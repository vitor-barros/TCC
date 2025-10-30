import { Card } from "./Card";

export class Player {
    id: string;
    name: string;
    score: number;
    hand: Card[];

    constructor(id: string, name: string) {
        this.id = id;
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