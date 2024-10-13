export interface Tile {
    x: number;
    y: number;
    image: string[];
    isOccuped: boolean;
}

export type Row = Tile[];

export type Grid = Row[];
