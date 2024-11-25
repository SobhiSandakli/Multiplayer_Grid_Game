import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GameValidateService } from '@app/services/validate-game/gameValidate.service';
import { TuileValidateService } from '@app/services/validate-game/tuileValidate.service';

@Injectable({
    providedIn: 'root',
})
export class ValidateGameService {
    allValid: boolean = false;
    gameMode: string;
    constructor(
        private snackBar: MatSnackBar,
        private tuileValidate: TuileValidateService,
        private gameValidate: GameValidateService,
    ) {}
    validateAll(gameMode: string, gridArray: { images: string[]; isOccuped: boolean }[][]): boolean {
        const surfaceAreaValid = this.surfaceAreaValid(gridArray);
        const accessibility = this.accessibilityResult(gridArray);
        const doorPlacement = this.doorPlacementResult(gridArray);
        const startPointsValid = this.startPointsValid(gridArray);
        const isFlagValid = this.isFlagValid(gameMode, gridArray);
        const areTwoObjectsPlaced = this.areTwoObjectsPlaced(gridArray);
        this.gameMode = gameMode;

        if (gameMode === 'Capture the Flag') {
            this.allValid = surfaceAreaValid && accessibility.valid && doorPlacement.valid && startPointsValid && isFlagValid && areTwoObjectsPlaced;
        } else {
            this.allValid = surfaceAreaValid && accessibility.valid && doorPlacement.valid && startPointsValid && areTwoObjectsPlaced;
        }

        const isValid = {
            surfaceArea: surfaceAreaValid,
            isAccessible: accessibility,
            isDoorPlacementCorrect: doorPlacement,
            startPoints: startPointsValid,
            isFlagPlaced: isFlagValid,
            twoObjects: areTwoObjectsPlaced,
        };

        if (!this.allValid) {
            const errorMessage = this.getErrorMessages(isValid);
            this.handleValidationFailure(errorMessage);
        } else {
            this.openSnackBar('Validation du jeu réussie. Toutes les vérifications ont été passées.');
        }

        return this.allValid;
    }

    private openSnackBar(message: string, action: string = 'OK'): void {
        this.snackBar.open(message, action, {
            duration: 5000,
            panelClass: ['custom-snackbar'],
        });
    }

    private handleValidationFailure(errorMessage: string): void {
        this.openSnackBar(errorMessage);
    }

    private surfaceAreaValid(gridArray: { images: string[]; isOccuped: boolean }[][]): boolean {
        return this.gameValidate.isSurfaceAreaValid(gridArray);
    }

    private accessibilityResult(gridArray: { images: string[]; isOccuped: boolean }[][]): { valid: boolean; errors: string[] } {
        return this.gameValidate.areAllTerrainTilesAccessible(gridArray);
    }

    private doorPlacementResult(gridArray: { images: string[]; isOccuped: boolean }[][]): { valid: boolean; errors: string[] } {
        return this.tuileValidate.areDoorsCorrectlyPlaced(gridArray);
    }

    private startPointsValid(gridArray: { images: string[]; isOccuped: boolean }[][]): boolean {
        return this.gameValidate.areStartPointsCorrect(gridArray);
    }

    private isFlagValid(gameMode: string, gridArray: { images: string[]; isOccuped: boolean }[][]): boolean {
        return this.gameValidate.isFlagPlaced(gridArray, gameMode);
    }

    private areTwoObjectsPlaced(gridArray: { images: string[]; isOccuped: boolean }[][]): boolean {
        return this.gameValidate.areTwoObjectsPlaced(gridArray);
    }

    private getErrorMessages(isValid: {
        surfaceArea: boolean;
        isAccessible: { valid: boolean; errors: string[] };
        isDoorPlacementCorrect: { valid: boolean; errors: string[] };
        startPoints: boolean;
        isFlagPlaced: boolean;
        twoObjects: boolean;
    }): string {
        let errorMessage = 'Échec de la validation du jeu.\n';

        if (!isValid.surfaceArea) errorMessage += '• Surface de terrain insuffisante.\n';
        if (!isValid.isAccessible.valid) {
            errorMessage += '• Tuile(s) inaccessibles:\n';
            isValid.isAccessible.errors.forEach((error: string) => {
                errorMessage += `  - ${error}\n`;
            });
        }
        if (!isValid.isDoorPlacementCorrect.valid) {
            errorMessage += '• Problèmes de placement des portes:\n';
            isValid.isDoorPlacementCorrect.errors.forEach((error: string) => {
                errorMessage += `  - ${error}\n`;
            });
        }
        if (!isValid.startPoints) errorMessage += '• Nombre incorrect de points de départ.\n';
        if (this.gameMode === 'Capture the Flag') {
            if (!isValid.isFlagPlaced) errorMessage += '• Drapeau non placé.\n';
        }

        if (!isValid.twoObjects) errorMessage += '• Deux objets doivent être placés au minimum.\n';

        return errorMessage;
    }
}
