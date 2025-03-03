export const MAX_COUNTER_SMALL_GRID = 2;
export const MAX_COUNTER_MEDIUM_GRID = 4;
export const MAX_COUNTER_LARGE_GRID = 6;

export const OBJECTS_LIST = [
    { name: 'Shield', description: 'Le bouclier: +2 points en défense.', link: 'assets/objects/Shield.png', isDragAndDrop: false, count: 1 },
    {
        name: 'Critical Potion',
        description: 'La potion critique: +2 points sur la vie et -1 point en attaque.',
        link: 'assets/objects/Critical-Potion.png',
        isDragAndDrop: false,
        count: 1,
    },
    {
        name: 'Key',
        description: 'La clé: +1 évasion durant le combat.',
        link: 'assets/objects/Key.png',
        isDragAndDrop: false,
        count: 1,
    },
    {
        name: 'Wheel',
        description: 'La roue: +2 points en rapidité si tu te trouves sur une case gazon.',
        link: 'assets/objects/Wheel.png',
        isDragAndDrop: false,
        count: 1,
    },
    {
        name: 'Sword',
        description: "L'épée: +2 points en attaque si c'est le seul objet que tu possèdes.",
        link: 'assets/objects/Sword.png',
        isDragAndDrop: false,
        count: 1,
    },
    {
        name: 'Flying Shoe',
        description: 'Les chaussures volantes: 0% de chance de tomber sur la glace au lieu de 10%.',
        link: 'assets/objects/Flying_shoe.png',
        isDragAndDrop: false,
        count: 1,
    },
    {
        name: 'Random Items',
        description: 'Un item aléatoire représente un des objets ci-dessus.',
        link: 'assets/objects/Random_items.png',
        isDragAndDrop: false,
        count: 0,
    },
    {
        name: 'Started Points',
        description: 'Points de départ: à placer au complet sur la carte.',
        link: 'assets/objects/started-points.png',
        isDragAndDrop: false,
        count: 0,
    },
    {
        name: 'Flag',
        description: 'Drapeau: à placer sur la carte.',
        link: 'assets/objects/Flag.png',
        isDragAndDrop: false,
        count: 1,
    },
];
