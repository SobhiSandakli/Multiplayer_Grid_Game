export const DEFAULT_TILES = 'assets/tiles/Grass.png';

export const TILES_LIST = [
    {
        name: 'wall',
        label: 'Mur: on ne peut pas passer à travers.',
        imgSrc: 'assets/tiles/Wall.png',
        alt: 'Wall Tile',
    },
    {
        name: 'water',
        label: 'Eau',
        imgSrc: 'assets/tiles/Water.png',
        alt: 'Water Tile',
    },
    {
        name: 'door',
        label: 'Porte: on peut franchir une porte que si elle est ouverte.',
        imgSrc: 'assets/tiles/Door.png',
        alt: 'Door Tile',
    },
    {
        name: 'ice',
        label: 'Glace: on a plus de chances de tomber sur de la glace.',
        imgSrc: 'assets/tiles/Ice.png',
        alt: 'Ice Tile',
    },
    {
        name: 'doorOpen',
        imgSrc: '../../../assets/tiles/Door-Open.png',
        alt: 'Door Open Tile',
    },
];
