export interface SessionStatistics {
    gameDuration: string; // Durée de la partie au format MM:SS
    totalTurns: number; // Nombre de tours de jeu (somme des tours de tous les joueurs)
    totalTerrainTiles: number; // Nombre total de terrains dans la grille
    visitedTerrains: Set<string>; // Ensemble des terrains visités
    totalDoors: number; // Nombre total de portes dans la grille
    manipulatedDoors: Set<string>; // Ensemble des portes manipulées (positions uniques)
    uniqueFlagHolders: Set<string>; // Ensemble des joueurs ayant détenu le drapeau
}
