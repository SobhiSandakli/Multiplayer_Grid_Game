import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class GridService {
    // Liste des tuiles de la grille partagée
    private gridTiles: { images: string[]; isOccuped: boolean }[][] = [];

    // Générer une grille avec le nombre spécifié de tuiles
    generateDefaultGrid(size: number, defaultImage: string) {
        this.gridTiles = Array.from({ length: size }, () => Array.from({ length: size }, () => ({ images: [defaultImage], isOccuped: false })));
    }

    // Récupérer la liste des tuiles de la grille
    getGridTiles(): { images: string[]; isOccuped: boolean }[][] {
        return this.gridTiles;
    }

    // Ajouter une image à une tuile spécifique
    addObjectToTile(x: number, y: number, imageLink: string) {
        if (this.gridTiles[y] && this.gridTiles[y][x]) {
            this.gridTiles[y][x].images.push(imageLink);
        }
        this.gridTiles[y][x].isOccuped = true;
    }

    replaceImageOnTile(rowIndex: number, colIndex: number, imageLink: string) {
        if (this.gridTiles[rowIndex] && this.gridTiles[rowIndex][colIndex]) {
            this.gridTiles[rowIndex][colIndex].images = [imageLink];
        }
    }
    replaceWithDefault(rowIndex: number, colIndex: number, defaultImage: string) {
        if (this.gridTiles[rowIndex] && this.gridTiles[rowIndex][colIndex]) {
            this.gridTiles[rowIndex][colIndex].images = [defaultImage];
        }
    }
}
