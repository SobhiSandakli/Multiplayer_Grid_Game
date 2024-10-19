import { CharacterData } from '@app/interfaces/character-data/character-data.interface';
export interface CharacterCreationData {
    sessionCode?: string;
    characterData: CharacterData;
}
