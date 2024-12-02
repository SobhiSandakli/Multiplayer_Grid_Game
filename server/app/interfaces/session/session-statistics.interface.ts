export interface SessionStatistics {
    gameDuration: string; 
    totalTurns: number;
    totalTerrainTiles: number;
    visitedTerrains: Set<string>;
    totalDoors: number;
    manipulatedDoors: Set<string>; 
    uniqueFlagHolders: Set<string>; 
    visitedTerrainsArray: string[];
    manipulatedDoorsArray: string[];
    uniqueFlagHoldersArray: string[];
    startTime: Date;
    endTime: Date;
}
