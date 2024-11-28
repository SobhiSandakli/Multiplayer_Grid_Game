export interface TileDetails {
    type: string;
    label: string;
    imgSrc?: string;
    alt?: string;
    cost: number;
    effect: string;
    objectInfo?: {
        name: string;
        effectSummary: string;
        image: string;
    };
}
