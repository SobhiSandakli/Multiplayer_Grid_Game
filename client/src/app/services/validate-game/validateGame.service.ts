import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GameValidateService } from '@app/services/validate-game/gameValidate.service';
import { TuileValidateService } from '@app/services/validate-game/tuileValidate.service';

@Injectable({
    providedIn: 'root',
})
export class ValidateGameService {
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

        const allValid = surfaceAreaValid && accessibility.valid && doorPlacement.valid && startPointsValid && isFlagValid;

        if (!allValid) {
            const errorMessage = this.getErrorMessages(surfaceAreaValid, accessibility, doorPlacement, startPointsValid, isFlagValid);
            this.handleValidationFailure(errorMessage);
        } else {
            this.openSnackBar('Validation du jeu réussie. Toutes les vérifications ont été passées.');
        }

        return allValid;
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

    private getErrorMessages(
        surfaceAreaValid: boolean,
        accessibility: { valid: boolean; errors: string[] },
        doorPlacement: { valid: boolean; errors: string[] },
        startPointsValid: boolean,
        isFlagValid: boolean,
    ): string {
        let errorMessage = 'Échec de la validation du jeu.\n';

        if (!surfaceAreaValid) errorMessage += '• Surface de terrain insuffisante.\n';
        if (!accessibility.valid) {
            errorMessage += '• Tuile(s) inaccessibles:\n';
            accessibility.errors.forEach((error) => {
                errorMessage += `  - ${error}\n`;
            });
        }
        if (!doorPlacement.valid) {
            errorMessage += '• Problèmes de placement des portes:\n';
            doorPlacement.errors.forEach((error) => {
                errorMessage += `  - ${error}\n`;
            });
        }
        if (!startPointsValid) errorMessage += '• Nombre incorrect de points de départ.\n';
        if (!isFlagValid) errorMessage += '• Drapeau non placé.\n';

        return errorMessage;
    }
}
