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
export function getObjectKeyByValue(value: string): string | undefined {
    return Object.keys(ObjectsImages).find((key) => ObjectsImages[key as keyof typeof ObjectsImages] === value);
}

export const objectsProperties = {
    shield: {
        image: ObjectsImages.Shield,
        effect: (attributes: Attribute) => {
            attributes['defence'].baseValue += 2;
            attributes['defence'].currentValue += 2;
        },
        removeEffect: (attributes: Attribute) => {
            attributes['defence'].baseValue -= 2;
            attributes['defence'].currentValue -= 2;
        },
        condition: null,
    },
    potion: {
        image: ObjectsImages.Potion,
        effect: (attributes: Attribute) => {
            attributes['life'].baseValue += 2;
            attributes['life'].currentValue += 2;
            attributes['attack'].baseValue -= 1;
            attributes['attack'].currentValue -= 1;
        },
        removeEffect: (attributes: Attribute) => {
            attributes['life'].baseValue -= 2;
            attributes['life'].currentValue -= 2;
            attributes['attack'].baseValue += 1;
            attributes['attack'].currentValue += 1;
        },
        condition: null,
    },
    wheel: {
        image: ObjectsImages.Wheel,
        effect: (attributes: Attribute) => {
            attributes['speed'].baseValue += 2;
        },
        removeEffect: (attributes: Attribute) => {
            attributes['speed'].baseValue -= 2;
        },
        condition: (_player: Player, tileType: string) => tileType === 'grass',
    },
    sword: {
        image: ObjectsImages.Sword,
        effect: (attributes: Attribute) => {
            attributes['attack'].baseValue += 2;
        },
        removeEffect: (attributes: Attribute) => {
            attributes['attack'].baseValue -= 2;
        },
        condition: (player: Player) => player.inventory.length === 1,
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

export const DEFFENSIVE_PLAYER_ITEM_PRIORITIES = [
    ObjectsImages.Flag,
    ObjectsImages.Shield,
    ObjectsImages.Potion,
    ObjectsImages.Wheel,
    ObjectsImages.Sword,
    ObjectsImages.Key,
    ObjectsImages.FlyingShoe,
];
export const TERRAIN_TYPES = ['assets/tiles/Grass.png', 'assets/tiles/Ice.png', 'assets/tiles/Water.png'];
export const DOOR_TYPES = ['assets/tiles/Door.png', 'assets/tiles/Door-Open.png'];

export const OBJECT = 'assets/objects';
export const OBJECT_POSITION = 1;
