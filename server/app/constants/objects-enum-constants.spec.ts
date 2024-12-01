/* eslint-disable */
import {
    ObjectsImages,
    getObjectKeyByValue,
    objectsProperties,
    AGGRESSIVE_PLAYER_ITEM_PRIORITIES,
    DEFFENSIVE_PLAYER_ITEM_PRIORITIES,
    TERRAIN_TYPES,
    DOOR_TYPES,
    OBJECT,
    OBJECT_POSITION,
} from './objects-enums-constants';
import { Attribute } from '@app/interfaces/attribute/attribute.interface';
import { Player } from '@app/interfaces/player/player.interface';

describe('ObjectsImages Enum', () => {
    it('should have the correct enum values', () => {
        expect(ObjectsImages.Potion).toBe('assets/objects/Critical-Potion.png');
        expect(ObjectsImages.Key).toBe('assets/objects/Key.png');
        expect(ObjectsImages.Shield).toBe('assets/objects/Shield.png');
        expect(ObjectsImages.Sword).toBe('assets/objects/Sword.png');
        expect(ObjectsImages.Wheel).toBe('assets/objects/Wheel.png');
        expect(ObjectsImages.FlyingShoe).toBe('assets/objects/Flying_shoe.png');
        expect(ObjectsImages.RandomItems).toBe('assets/objects/Random_items.png');
        expect(ObjectsImages.Flag).toBe('assets/objects/Flag.png');
    });
});

describe('getObjectKeyByValue Function', () => {
    it('should return the correct key for a given value', () => {
        expect(getObjectKeyByValue('assets/objects/Critical-Potion.png')).toBe('Potion');
        expect(getObjectKeyByValue('assets/objects/Key.png')).toBe('Key');
        expect(getObjectKeyByValue('assets/objects/Shield.png')).toBe('Shield');
        expect(getObjectKeyByValue('assets/objects/Sword.png')).toBe('Sword');
        expect(getObjectKeyByValue('assets/objects/Wheel.png')).toBe('Wheel');
        expect(getObjectKeyByValue('assets/objects/Flying_shoe.png')).toBe('FlyingShoe');
        expect(getObjectKeyByValue('assets/objects/Random_items.png')).toBe('RandomItems');
        expect(getObjectKeyByValue('assets/objects/Flag.png')).toBe('Flag');
    });

    it('should return undefined for a non-existent value', () => {
        expect(getObjectKeyByValue('non-existent-value')).toBeUndefined();
    });
});

describe('objectsProperties', () => {
    let attributes: any; // Use 'any' to match the expected structure
    let player: Player;

    beforeEach(() => {
        attributes = {
            attack: { name: 'attack', description: '', baseValue: 5, currentValue: 5 },
            defence: { name: 'defence', description: '', baseValue: 5, currentValue: 5 },
            life: { name: 'life', description: '', baseValue: 5, currentValue: 5 },
            speed: { name: 'speed', description: '', baseValue: 5, currentValue: 5 },
        };

        player = {
            socketId: 'socket1',
            name: 'Player1',
            avatar: '',
            isOrganizer: false,
            position: { row: 0, col: 0 },
            attributes: attributes,
            accessibleTiles: [],
            isVirtual: false,
            inventory: [],
            statistics: {
                combats: 0,
                evasions: 0,
                victories: 0,
                defeats: 0,
                totalLifeLost: 0,
                totalLifeRemoved: 0,
                uniqueItems: new Set(),
                tilesVisited: new Set(),
                uniqueItemsArray: [],
                tilesVisitedArray: [],
            },
        };
    });

    describe('Shield Object', () => {
        it('should apply shield effect correctly', () => {
            objectsProperties.shield.effect(attributes);
            expect(attributes.defence.baseValue).toBe(7);
            expect(attributes.defence.currentValue).toBe(7);
        });

        it('should remove shield effect correctly', () => {
            objectsProperties.shield.effect(attributes);
            objectsProperties.shield.removeEffect(attributes);
            expect(attributes.defence.baseValue).toBe(5);
            expect(attributes.defence.currentValue).toBe(5);
        });

        it('should have no condition', () => {
            expect(objectsProperties.shield.condition).toBeNull();
        });
    });

    describe('Potion Object', () => {
        it('should apply potion effect correctly', () => {
            objectsProperties.potion.effect(attributes);
            expect(attributes.life.baseValue).toBe(7);
            expect(attributes.life.currentValue).toBe(7);
            expect(attributes.attack.baseValue).toBe(4);
            expect(attributes.attack.currentValue).toBe(4);
        });

        it('should remove potion effect correctly', () => {
            objectsProperties.potion.effect(attributes);
            objectsProperties.potion.removeEffect(attributes);
            expect(attributes.life.baseValue).toBe(5);
            expect(attributes.life.currentValue).toBe(5);
            expect(attributes.attack.baseValue).toBe(5);
            expect(attributes.attack.currentValue).toBe(5);
        });

        it('should have no condition', () => {
            expect(objectsProperties.potion.condition).toBeNull();
        });
    });

    describe('Wheel Object', () => {
        it('should apply wheel effect correctly', () => {
            objectsProperties.wheel.effect(attributes);
            expect(attributes.speed.baseValue).toBe(7);
        });

        it('should remove wheel effect correctly', () => {
            objectsProperties.wheel.effect(attributes);
            objectsProperties.wheel.removeEffect(attributes);
            expect(attributes.speed.baseValue).toBe(5);
        });

        it('should return true when on grass tile', () => {
            expect(objectsProperties.wheel.condition!(player, 'grass')).toBe(true);
        });

        it('should return false when not on grass tile', () => {
            expect(objectsProperties.wheel.condition!(player, 'water')).toBe(false);
        });
    });

    describe('Sword Object', () => {
        it('should apply sword effect correctly', () => {
            objectsProperties.sword.effect(attributes);
            expect(attributes.attack.baseValue).toBe(7);
        });

        it('should remove sword effect correctly', () => {
            objectsProperties.sword.effect(attributes);
            objectsProperties.sword.removeEffect(attributes);
            expect(attributes.attack.baseValue).toBe(5);
        });

        it('should return true when player has exactly one item', () => {
            player.inventory = [ObjectsImages.Sword];
            expect(objectsProperties.sword.condition!(player)).toBe(true);
        });

        it('should return false when player has more than one item', () => {
            player.inventory = [ObjectsImages.Sword, ObjectsImages.Shield];
            expect(objectsProperties.sword.condition!(player)).toBe(false);
        });

        it('should return false when player has no items', () => {
            player.inventory = [];
            expect(objectsProperties.sword.condition!(player)).toBe(false);
        });
    });
});

describe('AGGRESSIVE_PLAYER_ITEM_PRIORITIES', () => {
    it('should have correct priorities when player has no items', () => {
        expect(AGGRESSIVE_PLAYER_ITEM_PRIORITIES.noItems).toEqual([
            ObjectsImages.Flag,
            ObjectsImages.Sword,
            ObjectsImages.Wheel,
            ObjectsImages.Shield,
            ObjectsImages.Key,
            ObjectsImages.FlyingShoe,
            ObjectsImages.Potion,
        ]);
    });

    it('should have correct priorities when player has items', () => {
        expect(AGGRESSIVE_PLAYER_ITEM_PRIORITIES.hasItems).toEqual([
            ObjectsImages.Flag,
            ObjectsImages.Wheel,
            ObjectsImages.Sword,
            ObjectsImages.Shield,
            ObjectsImages.Key,
            ObjectsImages.FlyingShoe,
            ObjectsImages.Potion,
        ]);
    });
});

describe('DEFFENSIVE_PLAYER_ITEM_PRIORITIES', () => {
    it('should have correct defensive item priorities', () => {
        expect(DEFFENSIVE_PLAYER_ITEM_PRIORITIES).toEqual([
            ObjectsImages.Flag,
            ObjectsImages.Shield,
            ObjectsImages.Potion,
            ObjectsImages.Wheel,
            ObjectsImages.Sword,
            ObjectsImages.Key,
            ObjectsImages.FlyingShoe,
        ]);
    });
});

describe('TERRAIN_TYPES', () => {
    it('should have correct terrain types', () => {
        expect(TERRAIN_TYPES).toEqual(['assets/tiles/Grass.png', 'assets/tiles/Ice.png', 'assets/tiles/Water.png']);
    });
});

describe('DOOR_TYPES', () => {
    it('should have correct door types', () => {
        expect(DOOR_TYPES).toEqual(['assets/tiles/Door.png', 'assets/tiles/Door-Open.png']);
    });
});

describe('OBJECT', () => {
    it('should have correct object path', () => {
        expect(OBJECT).toBe('assets/objects');
    });
});

describe('OBJECT_POSITION', () => {
    it('should have correct object position', () => {
        expect(OBJECT_POSITION).toBe(1);
    });
});
