export interface Statistics {
    combats: number; 
    evasions: number; 
    victories: number;
    defeats: number; 
    totalLifeLost: number; 
    totalLifeRemoved: number; 
    uniqueItems: Set<string>; 
    tilesVisited: Set<string>; 
    uniqueItemsArray: string[];
    tilesVisitedArray: string[];
}
