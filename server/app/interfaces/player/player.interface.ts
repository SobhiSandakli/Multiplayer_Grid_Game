import { Attribute } from '@app/interfaces/attribute/attribute.interface';
import { Position } from './position.interface';
import { AccessibleTile } from './accessible-tile.interface';
import { Statistics } from './statistics.interface';
import { ObjectsImages } from '@app/constants/objects-enums-constants';

export interface Player {
    socketId: string;
    name: string;
    avatar: string;
    attributes: { [key: string]: Attribute };
    isOrganizer: boolean;
    position: Position;
    previousTileType?: string;
    accessibleTiles: AccessibleTile[];
    hasLeft?: boolean;
    initialPosition?: Position;
    isVirtual: boolean;
    type?: string;
    inventory: ObjectsImages[];
    statistics: Statistics;
}
