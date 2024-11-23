import { Attribute } from '@app/interfaces/attribute/attribute.interface';
import { Player } from '@app/interfaces/player/player.interface';

export enum ObjectsImages {
    Potion = 'assets/objects/Critical-Potion.png',
    Key = 'assets/objects/Key.png',
    Shield = 'assets/objects/Shield.png',
    Sword = 'assets/objects/Sword.png',
    Wheel = 'assets/objects/Wheel.png',
    FlyingShoe = 'assets/objects/Flying_shoe.png',
    RandomItems = 'assets/objects/Random_items.png',
    Flag = 'assets/objects/Flag.png',
}

// Define the object properties with effects and conditions
export const objectsProperties = {
    shield: {
        image: ObjectsImages.Shield,
        effect: (attributes: Attribute) => {
            attributes['defence'].currentValue += 2;
        },
        condition: null, // No condition
    },
    potion: {
        image: ObjectsImages.Potion,
        effect: (attributes: Attribute) => {
            attributes['life'].currentValue += 2;
            attributes['attack'].currentValue -= 1;
        },
        condition: null, // No condition
    },
    wheel: {
        image: ObjectsImages.Wheel,
        effect: (attributes: Attribute) => {
            attributes['speed'].currentValue += 2;
        },
        condition: (tile: string) => tile === 'assets/grass.png', // Tile condition
    },
    sword: {
        image: ObjectsImages.Sword,
        effect: (attributes: Attribute) => {
            attributes['attaque'].currentValue += 2;
        },
        condition: (player: Player) => player.inventory.length === 1, // Player inventory condition
    },
};

export const AGGRESSIVE_PLAYER_ITEM_PRIORITIES = {
    noItems: [
        ObjectsImages.Flag,
        ObjectsImages.Sword,
        ObjectsImages.Wheel,
        ObjectsImages.Shield,
        ObjectsImages.Key,
        ObjectsImages.FlyingShoe,
        ObjectsImages.Potion,
    ],
    hasItems: [
        ObjectsImages.Flag,
        ObjectsImages.Wheel,
        ObjectsImages.Sword,
        ObjectsImages.Shield,
        ObjectsImages.Key,
        ObjectsImages.FlyingShoe,
        ObjectsImages.Potion,
    ],
};

export const DEFFENSIVE_PLAYER_ITEM_PRIORITIES = 
    [
        ObjectsImages.Flag,
        ObjectsImages.Shield,
        ObjectsImages.Potion,
        ObjectsImages.Wheel,
        ObjectsImages.Sword,
        ObjectsImages.Key,
        ObjectsImages.FlyingShoe,
    ]
;
export const TERRAIN_TYPES = ['assets/tiles/Grass.png', 'assets/tiles/Ice.png', 'assets/tiles/Water.png'];
export const DOOR = 'assets/objects/Door.png';
