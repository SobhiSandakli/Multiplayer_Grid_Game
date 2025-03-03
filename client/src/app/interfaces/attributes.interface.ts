export interface Attribute {
    name: string;
    description: string;
    baseValue: number;
    currentValue: number;
    speed?: number;
    dice?: string;
}
export interface CharacterInfo {
    name: string;
    avatar: string;
    attributes: { [key: string]: Attribute };
}

export interface CharacterCreatedResponse {
    name: string;
    sessionCode: string;
}
