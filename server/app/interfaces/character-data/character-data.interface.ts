import { Attribute } from '@app/interfaces/attribute/attribute.interface';
export interface CharacterData {
    name: string;
    avatar: string;
    attributes: { [key: string]: Attribute };
}
