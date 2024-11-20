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
export const ObjectsProperties = {
    Shield: {
        image: ObjectsImages.Shield,
        effect: (attributes: any) => {
            attributes['defence'].currentValue += 2;
        },
        condition: null, // No condition
    },
    Potion: {
        image: ObjectsImages.Potion,
        effect: (attributes: any) => {
            attributes['life'].currentValue += 2;
            attributes['attack'].currentValue -= 1;
        },
        condition: null, // No condition
    },
    Wheel: {
        image: ObjectsImages.Wheel,
        effect: (attributes: any) => {
            attributes['speed'].currentValue += 2;
        },
        condition: (tile: string) => tile === 'assets/grass.png', // Tile condition
    },
    Sword: {
        image: ObjectsImages.Sword,
        effect: (attributes: any) => {
            attributes['attaque'].currentValue += 2;
        },
        condition: (player: any) => player.inventory.length === 1, // Player inventory condition
    },
};
