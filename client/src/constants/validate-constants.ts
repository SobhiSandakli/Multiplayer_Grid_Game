import { Game } from '@app/interfaces/game-model.interface';
import { ValidateGameService } from '@app/services/validate-game/validateGame.service';
import { DESCRIPTION_MAX_LENGTH, NAME_MAX_LENGTH } from './game-constants';
export enum GridSize {
    Small = 10,
    Medium = 15,
    Large = 20,
}
export enum ExpectedPoints {
    Small = 2,
    Medium = 4,
    Large = 6,
}
export enum MaxPlayers {
    SmallMaxPlayers = 2,
    MeduimMaxPlayers = 4,
    LargeMaxPlayers = 6,
}
export enum ValidationErrorType {
    EmptyName = 'EmptyName',
    WhitespaceOnlyName = 'WhitespaceOnlyName',
    Other = 'Other',
}

export const MINIMUM_TERRAIN_PERCENTAGE = 0.5;
export enum TileImages {
    Grass = 'assets/tiles/Grass.png',
    Ice = 'assets/tiles/Ice.png',
    Water = 'assets/tiles/Water.png',
    Door = 'assets/tiles/Door.png',
    OpenDoor = 'assets/tiles/Door-Open.png',
    Wall = 'assets/tiles/Wall.png',
}
export enum ObjectsImages {
    StartPoint = 'assets/objects/started-points.png',
    Potion = 'assets/objects/Critical-Potion.png',
    Key = 'assets/objects/Key.png',
    Shield = 'assets/objects/Shield.png',
    Sword = 'assets/objects/Sword.png',
    Wheel = 'assets/objects/Wheel.png',
    FlyingShoe = 'assets/objects/Flying_shoe.png',
    RandomItems = 'assets/objects/Random_items.png',
    Flag = 'assets/objects/Flag.png',
}
export const VALIDATION_RULES = (gameData: Game, validateGameService: ValidateGameService) => [
    { condition: !gameData.name, message: 'Erreur : le nom du jeu est manquant dans le fichier JSON.' },
    { condition: gameData.name && gameData.name.length > NAME_MAX_LENGTH, message: 'Erreur : le nom du jeu est trop long.' },
    { condition: !gameData.size, message: 'Erreur : la taille du jeu est manquante dans le fichier JSON.' },
    { condition: !gameData.mode, message: 'Erreur : le mode du jeu est manquant dans le fichier JSON.' },
    { condition: !gameData.description, message: 'Erreur : la description du jeu est manquante dans le fichier JSON.' },
    {
        condition: gameData.description && gameData.description.length > DESCRIPTION_MAX_LENGTH,
        message: 'Erreur : la description du jeu est trop longue.',
    },
    { condition: !gameData.grid, message: 'Erreur : la grid du jeu est manquante dans le fichier JSON.' },
    { condition: gameData.grid && !validateGameService.validateAll(gameData.mode , gameData.grid), message: 'Erreur : la grille du jeu est invalide.' },
];
