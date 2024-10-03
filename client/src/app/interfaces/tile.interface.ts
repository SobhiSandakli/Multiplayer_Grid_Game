export interface Tile {
    x: number;
    y: number;
    image: string[]; // URL de l'image
    isOccuped: boolean; // Si la case est occupée par une image ou non.
}

export type Row = Tile[];

export type Grid = Row[];
