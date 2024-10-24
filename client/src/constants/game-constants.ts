import { GameOption } from '@app/interfaces/game_option';

export const NAME_MAX_LENGTH = 30;
export const DESCRIPTION_MAX_LENGTH = 100;

export const GAME_MODES: GameOption[] = [
    { value: 'classique', label: 'Classique' },
    { value: 'captureTheFlag', label: 'Capture the Flag' },
];

export const MAP_SIZES: GameOption[] = [
    { value: 'small', label: 'Petite (10x10)' },
    { value: 'medium', label: 'Moyenne (15x15)' },
    { value: 'large', label: 'Grande (20x20)' },
];
export const TIMER_DURATION = 60000;
export const TIMER_INTERVAL = 1000;
