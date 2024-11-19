import { Attribute } from '@app/interfaces/attributes.interface';
export interface Player {
    socketId: string;
    name: string;
    avatar: string;
    isOrganizer: boolean;
    attributes?: { [key: string]: Attribute };
    hasLeft?: boolean;
    inventory: string[];
}
