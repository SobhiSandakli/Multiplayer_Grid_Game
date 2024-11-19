import { Injectable } from '@angular/core';

export interface Tile {
    images: string[];
    isOccuped: boolean;
}

type Row = Tile[];
type Grid = Row[];

@Injectable({
    providedIn: 'root',
})
export class ImageService {
    async loadImage(src: string): Promise<HTMLImageElement> {
        return new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => resolve(img);
            img.onerror = (e) => {
                window.alert('Error loading image');
                reject(new Error(`Failed to load image: ${src}; Error event: ${e}`));
            };
            img.src = src;
        });
    }

    async loadRowImages(row: Row): Promise<HTMLImageElement[][]> {
        return Promise.all(row.map(async (tile) => Promise.all(tile.images.map(async (src) => this.loadImage(src)))));
    }

    async createCompositeImageAsBase64(grid: Grid): Promise<string> {
        const tileSize = 14;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Failed to get 2D context');
        }

        canvas.width = grid[0].length * tileSize;
        canvas.height = grid.length * tileSize;

        const imagePromises = grid.flatMap((row, rowIndex) =>
            row.flatMap((tile, colIndex) =>
                tile.images.map(async (src) => ({
                    img: await this.loadImage(src),
                    x: colIndex * tileSize,
                    y: rowIndex * tileSize,
                })),
            ),
        );

        return Promise.all(imagePromises)
            .then((images) => {
                images.forEach(({ img, x, y }) => {
                    ctx.drawImage(img, x, y, tileSize, tileSize);
                });
                return canvas.toDataURL('image/png');
            })
            .catch((error) => {
                throw new Error(`Failed to create image: ${error.message}`);
            });
    }
}
