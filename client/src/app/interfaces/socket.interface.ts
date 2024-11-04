import { Player } from '@app/interfaces/player.interface';
import { CharacterInfo } from './attributes.interface';

export interface PlayerListUpdate {
    players: Player[];
}
export interface Message {
    message: string;
}
export interface SessionCreatedData {
    sessionCode: string;
}
export interface CharacterCreatedData extends CharacterInfo {
    name: string;
    sessionCode: string;
}
export interface GameInfo{
    name: string;
    size: string;
}
export interface JoinGameResponse {
    success: boolean;
    message: string;
}
export interface TakenAvatarsResponse {
    takenAvatars: string[];
}
export interface RoomLockedResponse {
    locked: boolean;
}

