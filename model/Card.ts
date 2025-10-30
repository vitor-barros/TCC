export class Card {
    id: string;
    title: string;
    imageUrl: string;
    year: number;

    constructor(id: string, title: string, imageUrl: string, year: number) {
        this.id = id;
        this.title = title;
        this.imageUrl = imageUrl;
        this.year = year;
    }
}