export interface TileInfo {
    tile: { images: string[]; isOccuped: boolean };
    position: { row: number; col: number };
}
export interface GameState {
    isActive: boolean;
    accessibleTiles: { position: { row: number; col: number }; path: { row: number; col: number }[] }[];
    gridTiles: { images: string[]; isOccuped: boolean }[][],
}
