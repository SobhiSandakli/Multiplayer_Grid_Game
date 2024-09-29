export interface Game {
    _id: string;
    name: string;
    description: string;
    size: string;
    mode: string;
    image: string;
    date: Date;
    visibility: boolean;
    grid: unknown[][];
}
