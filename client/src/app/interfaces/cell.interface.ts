export interface Cell {
    row: number;
    col: number;
    tile: string;
    object?: string;
    isOccuped: boolean;
}
