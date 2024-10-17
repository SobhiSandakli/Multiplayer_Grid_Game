export interface Attribute {
    name: string;
    description: string;
    baseValue: number;
    currentValue: number;
    dice?: string;
}
export interface CharacterInfo {
    name: string;
    avatar: string;
    attributes: { [key: string]: Attribute };
}
