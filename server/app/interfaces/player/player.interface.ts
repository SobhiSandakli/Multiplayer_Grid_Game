import { Attribute } from '@app/interfaces/attribute/attribute.interface';
export interface Player {
    socketId: string;
    name: string;
    avatar: string;
    attributes: { [key: string]: Attribute };
    isOrganizer: boolean;
    position: { row: number; col: number };
}
