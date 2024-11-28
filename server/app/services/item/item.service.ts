import { Player } from '@app/interfaces/player/player.interface';
import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Server } from 'socket.io';
import { Position } from '@app/interfaces/player/position.interface';
import { Grid } from '@app/interfaces/session/grid.interface';
import { ChangeGridService } from '@app/services/grid/changeGrid.service';
import { Session } from '@app/interfaces/session/session.interface';
import { SessionsService } from '@app/services/sessions/sessions.service';
import { ObjectsImages, getObjectKeyByValue, objectsProperties } from '@app/constants/objects-enums-constants';
import { EventsGateway } from '@app/gateways/events/events.gateway';

@Injectable()
export class ItemService {
    constructor(
        private readonly changeGridService: ChangeGridService,
        @Inject(forwardRef(() => SessionsService))
        private readonly sessionsService: SessionsService,
        private readonly events: EventsGateway,
    ) {}

    getTileType(images: string[]): string {
        if (images.includes('assets/tiles/Ice.png')) return 'ice';
        if (images.includes('assets/tiles/Grass.png')) return 'base';
        if (images.includes('assets/tiles/Door-Open.png')) return 'doorOpen';
        if (images.includes('assets/tiles/Water.png')) return 'water';
        if (images.includes('assets/tiles/Wall.png')) return 'wall';
        if (images.includes('assets/objects/started-points.png')) return 'started-points';
        return 'base';
    }

    updatePlayerAttributesOnTile(player: Player, tile: { images: string[]; isOccuped: boolean }): void {
        for (const itemImage of player.inventory) {
            const itemKey = getObjectKeyByValue(itemImage)?.toLowerCase();
            if (itemKey && objectsProperties[itemKey]) {
                const item = objectsProperties[itemKey];

                // Skip the Sword effect here
                if (itemKey === 'sword') {
                    continue;
                }

                const tileType = this.getTileType(tile.images);

                // Only apply effects for items with conditions
                if (item.condition) {
                    const conditionMet = item.condition(player, tileType);
                    if (conditionMet) {
                        item.effect(player.attributes);
                    }
                }
            }
        }

        const playerTile = this.getTileType(tile.images);

        if (playerTile === 'ice') {
            player.attributes['attack'].currentValue = player.attributes['attack'].baseValue - 2;
            player.attributes['defence'].currentValue = player.attributes['defence'].baseValue - 2;
        } else {
            player.attributes['attack'].currentValue = player.attributes['attack'].baseValue;
            player.attributes['defence'].currentValue = player.attributes['defence'].baseValue;
        }
    }

    handleItemDiscard(player: Player, discardedItem: ObjectsImages, pickedUpItem: ObjectsImages, server: Server, sessionCode: string): void {
        const session = this.sessionsService.getSession(sessionCode);
        const position = player.position;
        const discardedItemKey = getObjectKeyByValue(discardedItem)?.toLowerCase();
        const pickedUpItemKey = getObjectKeyByValue(pickedUpItem);

        if (discardedItemKey && objectsProperties[discardedItemKey]) {
            const item = objectsProperties[discardedItemKey];
            if (!item.condition) {
                item.removeEffect(player.attributes);
            }
            if (discardedItemKey === 'wheel') {
                this.removeWheelEffect(player, server, sessionCode, session);
            }
        }

        if (discardedItem === pickedUpItem) {
            return;
        }
        player.inventory = player.inventory.filter((item) => item !== discardedItem);
        player.inventory.push(pickedUpItem);
        this.updateUniqueItems(player, pickedUpItem, session);
        this.changeGridService.addImage(session.grid[position.row][position.col], discardedItem);
        this.changeGridService.removeObjectFromGrid(session.grid, position.row, position.col, pickedUpItem);
        server.to(sessionCode).emit('gridArray', { sessionCode, grid: session.grid });
        server.to(player.socketId).emit('updateInventory', { inventory: player.inventory });
        this.events.addEventToSession(sessionCode, `${player.name} a jeté un ${discardedItemKey} et a ramassé un ${pickedUpItemKey}`, ['everyone']);
        server.to(sessionCode).emit('playerListUpdate', { players: session.players });

        const pickedUpItemKeyLower = pickedUpItemKey?.toLowerCase();
        if (pickedUpItemKeyLower && objectsProperties[pickedUpItemKeyLower]) {
            const newItem = objectsProperties[pickedUpItemKeyLower];
            if (!newItem.condition) {
                newItem.effect(player.attributes);
            }
            if (pickedUpItemKeyLower === 'wheel') {
                this.applyWheelEffect(player, this.getTileType(session.grid[position.row][position.col].images), server, sessionCode, session);
            }
        }
        this.applySwordEffect(player, session, server, sessionCode);
        this.applyKeyEffect(player, session, server, sessionCode);

        const tile = session.grid[position.row][position.col];
        this.updatePlayerAttributesOnTile(player, tile);
    }

    removeWheelEffect(player: Player, server: Server, sessionCode: string, session: Session): void {
        player.attributes['speed'].baseValue -= 2;
        player.attributes['speed'].currentValue -= 2;
        player.attributes['speed'].hasGrassBoost = false; // Mark the effect as removed
        server.to(sessionCode).emit('playerListUpdate', { players: session.players });
    }

    applyWheelEffect(player: Player, currentTileType: string, server: Server, sessionCode: string, session: Session): void {
        const hasWheel = player.inventory.includes(ObjectsImages.Wheel);
        const isGrass = currentTileType === 'base';
        if (hasWheel && isGrass) {
            if (!player.attributes['speed'].hasGrassBoost) {
                player.attributes['speed'].baseValue += 2;
                player.attributes['speed'].currentValue += 2;
                player.attributes['speed'].hasGrassBoost = true; // Mark the effect as applied
            }
        } else if (hasWheel && !isGrass) {
            if (player.attributes['speed'].hasGrassBoost) {
                player.attributes['speed'].baseValue -= 2;
                player.attributes['speed'].currentValue -= 2;
                player.attributes['speed'].hasGrassBoost = false; // Mark the effect as removed
            }
        }
        server.to(sessionCode).emit('playerListUpdate', { players: session.players });
    }

    applySwordEffect(player: Player, session: Session, server: Server, sessionCode: string): void {
        const hasSword = player.inventory.includes(ObjectsImages.Sword);
        const isOnlyItem = player.inventory.length === 1 && hasSword;

        if (isOnlyItem) {
            // Apply the effect if not already applied
            if (!player.attributes['attack'].hasSwordBoost) {
                player.attributes['attack'].baseValue += 2;
                player.attributes['attack'].currentValue += 2;
                player.attributes['attack'].hasSwordBoost = true; // Mark the effect as applied
            }
        } else {
            // Remove the effect if another item is added
            if (player.attributes['attack'].hasSwordBoost) {
                player.attributes['attack'].baseValue -= 2;
                player.attributes['attack'].currentValue -= 2;
                player.attributes['attack'].hasSwordBoost = false; // Mark the effect as removed
            }
        }

        server.to(sessionCode).emit('playerListUpdate', { players: session.players });
    }

    applyKeyEffect(player: Player, session: Session, server: Server, sessionCode: string): void {
        const hasKey = player.inventory.includes(ObjectsImages.Key);

        if (hasKey) {
            // Apply the effect if not already applied
            if (!player.attributes['nbEvasion'].hasKeyBoost) {
                player.attributes['nbEvasion'].baseValue = 3;
                player.attributes['nbEvasion'].currentValue = 3;
                player.attributes['nbEvasion'].hasKeyBoost = true; // Mark the effect as applied
            }
        } else {
            // Remove the effect if the key is not held
            if (player.attributes['nbEvasion'].hasKeyBoost) {
                player.attributes['nbEvasion'].baseValue = 2;
                player.attributes['nbEvasion'].currentValue = 2;
                player.attributes['nbEvasion'].hasKeyBoost = false; // Mark the effect as removed
            }
        }

        server.to(sessionCode).emit('playerListUpdate', { players: session.players });
    }

    handleItemPickup(player: Player, session: Session, position: Position, server: Server, sessionCode: string): void {
        const tile = session.grid[position.row][position.col];
        const itemImage = tile.images.find((image) => Object.values(ObjectsImages).includes(image as ObjectsImages)) as ObjectsImages | undefined;

        if (itemImage) {
            if (player.inventory.length < 2) {
                player.inventory.push(itemImage);
                this.updateUniqueItems(player, itemImage, session);
                this.changeGridService.removeObjectFromGrid(session.grid, position.row, position.col, itemImage);

                const itemKey = getObjectKeyByValue(itemImage)?.toLowerCase();

                if (itemKey && objectsProperties[itemKey]) {
                    const item = objectsProperties[itemKey];
                    if (!item.condition) {
                        item.effect(player.attributes);
                    }
                    if (itemKey === 'wheel') {
                        this.applyWheelEffect(player, this.getTileType(tile.images), server, sessionCode, session);
                    }
                }
                this.applySwordEffect(player, session, server, sessionCode);
                this.applyKeyEffect(player, session, server, sessionCode);

                server.to(player.socketId).emit('itemPickedUp', { item: itemImage });
                const pickedUpItemKey = getObjectKeyByValue(itemImage);
                this.events.addEventToSession(sessionCode, `${player.name} a ramassé un ${pickedUpItemKey}`, ['everyone']);
            } else {
                const allItems = [...player.inventory, itemImage];
                server.to(player.socketId).emit('inventoryFull', { items: allItems });
            }
            server.to(sessionCode).emit('playerListUpdate', { players: session.players });
            server.to(sessionCode).emit('gridArray', { sessionCode, grid: session.grid });
            server.to(sessionCode).emit('playerListUpdate', { players: session.players });
        }
    }

    handleTileChangeEffect(player: Player, session: Session, server: Server, sessionCode: string): void {
        const previousTileType = player.previousTileType || '';

        const position = player.position;
        const currentTile = session.grid[position.row][position.col];
        const currentTileType = this.getTileType(currentTile.images);

        const isPreviousGrass = previousTileType === 'base';
        const isCurrentGrass = currentTileType === 'base';

        if (isPreviousGrass && !isCurrentGrass) {
            this.applyWheelEffect(player, currentTileType, server, sessionCode, session);
        } else if (!isPreviousGrass && isCurrentGrass) {
            this.applyWheelEffect(player, currentTileType, server, sessionCode, session);
        }
        player.previousTileType = currentTileType;
    }

    updatePlayerTileEffect(player: Player, session: Session, server: Server, sessionCode: string): void {
        const { position } = player;
        const currentTileType = this.getTileType(session.grid[position.row][position.col].images);
        this.handleTileChangeEffect(player, session, server, sessionCode);
        player.previousTileType = currentTileType;
    }

    private containsItem(tile: { images: string[] }): boolean {
        return tile.images.some((image) => Object.values(ObjectsImages).includes(image as ObjectsImages));
    }

    checkForItemsAlongPath(path: Position[], grid: Grid): { adjustedPath: Position[]; itemFound: boolean } {
        for (let i = 1; i < path.length; i++) {
            const position = path[i];
            const tile = grid[position.row][position.col];
            if (this.containsItem(tile)) {
                return { adjustedPath: path.slice(0, i + 1), itemFound: true };
            }
        }
        return { adjustedPath: path, itemFound: false };
    }

    private updateUniqueItems(player: Player, item: string, session: Session): void {
        player.statistics.uniqueItems.add(item);
        if (item === ObjectsImages.Flag) {
            session.statistics.uniqueFlagHolders.add(player.name);
        }
    }
}
