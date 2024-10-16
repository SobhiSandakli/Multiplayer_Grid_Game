import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TuileValidateService } from '@app/services/validate-game/tuileValidate.service';
import { GameValidateService } from '@app/services/validate-game/gameValidate.service';

@Injectable({
    providedIn: 'root',
})
export class ValidateGameService {
    constructor(
        private snackBar: MatSnackBar,
        private tuileValidate: TuileValidateService,
        private gameValidate: GameValidateService,
    ) {}

    openSnackBar(message: string, action: string = 'OK') {
        this.snackBar.open(message, action, {
            duration: 5000,
            panelClass: ['custom-snackbar'],
        });
    }

    handleValidationFailure(errorMessage: string) {
        this.openSnackBar(errorMessage);
    }

    validateAll(gridArray: { images: string[]; isOccuped: boolean }[][]): boolean {
        const surfaceAreaValid = this.gameValidate.isSurfaceAreaValid(gridArray);
        const accessibilityResult = this.gameValidate.areAllTerrainTilesAccessible(gridArray);
        const doorPlacementResult = this.tuileValidate.areDoorsCorrectlyPlaced(gridArray);
        const startPointsValid = this.gameValidate.areStartPointsCorrect(gridArray);

        const allValid = surfaceAreaValid && accessibilityResult.valid && doorPlacementResult.valid && startPointsValid;

        if (!allValid) {
            let errorMessage = 'Échec de la validation du jeu.\n';

            if (!surfaceAreaValid) errorMessage += '• Surface de terrain insuffisante.\n';
            if (!accessibilityResult.valid) {
                errorMessage += '• Tuile(s) inaccessibles:\n';
                accessibilityResult.errors.forEach((error) => {
                    errorMessage += '  - ' + error + '\n';
                });
            }
            if (!doorPlacementResult.valid) {
                errorMessage += '• Problèmes de placement des portes:\n';
                doorPlacementResult.errors.forEach((error) => {
                    errorMessage += '  - ' + error + '\n';
                });
            }
            if (!startPointsValid) errorMessage += '• Nombre incorrect de points de départ.\n';

            this.handleValidationFailure(errorMessage);
        } else {
            // this.loggerService.log('Validation du jeu réussie. Toutes les vérifications ont été passées.');
            this.openSnackBar('Validation du jeu réussie. Toutes les vérifications ont été passées.');
        }

        return allValid;
    }
}
