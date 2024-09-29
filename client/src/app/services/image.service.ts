import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'  
})
export class ImageService {
  constructor() {}

  createCompositeImageAsBase64(gridArray: any[][]): Promise<string> {
    return new Promise((resolve, reject) => {
      const tileSize = 144;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject('Failed to get 2D context');
        return;
      }
      canvas.width = gridArray[0].length * tileSize;
      canvas.height = gridArray.length * tileSize;
  
      // Helper function to load an image
      const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
  
      const loadRowImages = (row: any[]) => Promise.all(row.map(tile => Promise.all(tile.images.map(loadImage))));
  
      Promise.all(gridArray.map(loadRowImages)).then(rows => {
        rows.forEach((row, rowIndex) => {
          row.forEach((images, colIndex) => {
            images.forEach(img => {
              ctx.drawImage(img, colIndex * tileSize, rowIndex * tileSize, tileSize, tileSize);
            });
          });
        });
        resolve(canvas.toDataURL('image/png'));
      }).catch(reject);
    });
  }
  
}
