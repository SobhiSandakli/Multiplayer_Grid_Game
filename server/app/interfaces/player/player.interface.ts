import { Attribute } from '@app/interfaces/attribute/attribute.interface';
export interface Player {
    socketId: string;
    name: string;
    avatar: string;
    attributes: { [key: string]: Attribute };
    isOrganizer: boolean;
    position: { row: number; col: number };
    accessibleTiles: {
        position: { row: number; col: number };
        path: { row: number; col: number }[];
    }[];
    hasLeft?: boolean;
    initialPosition?: { row: number; col: number };
}
