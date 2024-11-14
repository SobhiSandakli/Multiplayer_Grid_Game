export const MAX_COUNTER_SMALL_GRID = 2;
export const MAX_COUNTER_MEDIUM_GRID = 4;
export const MAX_COUNTER_LARGE_GRID = 6;

export const OBJECTS_LIST = [
    { name: 'Shield', description: 'Le bouclier: +2 points en défense.', link: 'assets/objects/Shield.png', isDragAndDrop: false },
    {
        name: 'Critical Potion',
        description: 'La potion critique: +2 points sur la vie et -1 point en attaque.',
        link: 'assets/objects/Critical-Potion.png',
        isDragAndDrop: false,
    },
    {
        name: 'Key',
        description: "La clé: ouvrir ou fermer une porte peu importe l'endroit où tu te trouves.",
        link: 'assets/objects/Key.png',
        isDragAndDrop: false,
    },
    {
        name: 'Sword',
        description: 'La roue: +2 points en rapidité si tu te trouves sur une case gazon.',
        link: 'assets/objects/Wheel.png',
        isDragAndDrop: false,
    },
    { description: "L'épée: +2 points en attaque si tu fais un chiffre pair.", link: 'assets/objects/Sword.png', isDragAndDrop: false },
    {
        name: 'Flying Shoe',
        description: 'Les chaussures volantes: 0% de chance de tomber sur la glace au lieu de 10%.',
        link: 'assets/objects/Flying_shoe.png',
        isDragAndDrop: false,
    },
    {
        name: 'Random Items',
        description: 'Un item aléatoire représente un des objets si dessus.',
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
    },
];
