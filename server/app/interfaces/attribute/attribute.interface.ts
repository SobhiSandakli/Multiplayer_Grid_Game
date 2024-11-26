export interface Attribute {
    name: string;
    description: string;
    baseValue: number;
    currentValue: number;
    dice?: string;
    hasGrassBoost?: boolean;
    hasSwordBoost?: boolean;
    hasKeyBoost?: boolean;
}
