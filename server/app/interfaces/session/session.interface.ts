import { Player } from '../player/player.interface';
import { Grid } from './grid.interface';
import { TurnData } from './turn-data.interface';
import { CombatData } from './combat-data.interface';

export interface Session {
    organizerId: string;
    locked: boolean;
    maxPlayers: number;
    players: Player[];
    selectedGameID: string;
    grid: Grid;
    turnData: TurnData;
    combatData: CombatData;
}
