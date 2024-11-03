import { Attribute } from '@app/interfaces/attributes.interface';

export const AVATARS: string[] = [
    'assets/avatars/av1.png',
    'assets/avatars/av2.png',
    'assets/avatars/av3.png',
    'assets/avatars/av4.png',
    'assets/avatars/av5.png',
    'assets/avatars/av6.png',
    'assets/avatars/av7.png',
    'assets/avatars/av8.png',
    'assets/avatars/av9.png',
    'assets/avatars/av10.png',
    'assets/avatars/av11.png',
    'assets/avatars/av12.png',
];
export const INITIAL_ATTRIBUTES: { [key: string]: Attribute } = {
    life: {
        name: 'Vie',
        description: 'Points de vie du personnage.',
        baseValue: 4,
        currentValue: 4,
    },
    speed: {
        name: 'Rapidité',
        description: 'Vitesse du personnage.',
        baseValue: 4,
        currentValue: 4,
    },
    attack: {
        name: 'Attaque',
        description: 'Capacité offensive du personnage.',
        baseValue: 4,
        currentValue: 4,
        dice: '',
    },
    defence: {
        name: 'Défense',
        description: 'Capacité défensive du personnage.',
        baseValue: 4,
        currentValue: 4,
        dice: '',
    },
    combatWon: {
        name: 'Combat gagné',
        description: 'Combat',
        baseValue: 0,
        currentValue: 0,
    },
    nbEvasion: {
        name: 'Nombre d\'évasions',
        description: 'Nombre d\'évasions',
        baseValue: 2,
        currentValue: 2,
    },
};
export const MAX_LENGTH_NAME = 12;

export enum BonusAttribute {
    Life = 'life',
    Speed = 'speed',
}
export enum DiceAttribute {
    Attack = 'attack',
    Defence = 'defence',
}
