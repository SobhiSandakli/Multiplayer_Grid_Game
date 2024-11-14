import { Attribute } from '@app/interfaces/attribute/attribute.interface';
import { Position } from './position.interface';
import { AccessibleTile } from './accessible-tile.interface';

export interface Player {
    socketId: string;
    name: string;
    avatar: string;
    attributes: { [key: string]: Attribute };
    isOrganizer: boolean;
    position: Position;
    accessibleTiles: AccessibleTile[];
    hasLeft?: boolean;
    initialPosition?: Position;
}
