export interface Statistics {
    combats: number; // Nombre de combats
    evasions: number; // Nombre d'évasions
    victories: number; // Nombre de victoires
    defeats: number; // Nombre de défaites
    totalLifeLost: number; // Total des points de vie perdus
    totalLifeRemoved: number; // Total de points de vie enlevés aux adversaires
    uniqueItems: Set<string>; // set d'objets différents ramassés
    tilesVisited: Set<string>; // Ensemble des tuiles visitées (positions uniques)
    uniqueItemsArray: string[];
    tilesVisitedArray: string[];
}
