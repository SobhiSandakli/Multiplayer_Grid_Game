import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GameValidateService } from '@app/services/validate-game/gameValidate.service';
import { TuileValidateService } from '@app/services/validate-game/tuileValidate.service';
import { ValidateGameService } from './validateGame.service';

describe('ValidateGameService', () => {
    let service: ValidateGameService;
    let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
    let gameValidateSpy: jasmine.SpyObj<GameValidateService>;
    let tuileValidateSpy: jasmine.SpyObj<TuileValidateService>;

    beforeEach(() => {
        const snackBarMock = jasmine.createSpyObj('MatSnackBar', ['open']);
        const gameValidateMock = jasmine.createSpyObj('GameValidateService', [
            'isSurfaceAreaValid',
            'areAllTerrainTilesAccessible',
            'areStartPointsCorrect',
            'isFlagPlaced',
            'areTwoObjectsPlaced',
        ]);
        const tuileValidateMock = jasmine.createSpyObj('TuileValidateService', ['areDoorsCorrectlyPlaced']);

        TestBed.configureTestingModule({
            providers: [
                ValidateGameService,
                { provide: MatSnackBar, useValue: snackBarMock },
                { provide: GameValidateService, useValue: gameValidateMock },
                { provide: TuileValidateService, useValue: tuileValidateMock },
            ],
        });

        service = TestBed.inject(ValidateGameService);
        snackBarSpy = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
        gameValidateSpy = TestBed.inject(GameValidateService) as jasmine.SpyObj<GameValidateService>;
        tuileValidateSpy = TestBed.inject(TuileValidateService) as jasmine.SpyObj<TuileValidateService>;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('validateAll', () => {
        it('should pass validation when all checks are valid', () => {
            const gridArray = [[{ images: ['Grass'], isOccuped: false }], [{ images: ['Grass'], isOccuped: false }]];

            gameValidateSpy.isSurfaceAreaValid.and.returnValue(true);
            gameValidateSpy.areAllTerrainTilesAccessible.and.returnValue({ valid: true, errors: [] });
            tuileValidateSpy.areDoorsCorrectlyPlaced.and.returnValue({ valid: true, errors: [] });
            gameValidateSpy.areStartPointsCorrect.and.returnValue(true);
            gameValidateSpy.areTwoObjectsPlaced.and.returnValue(true);
            const result = service.validateAll('Test Mode', gridArray);

            expect(result).toBeTrue();
            expect(snackBarSpy.open).toHaveBeenCalledWith('Validation du jeu réussie. Toutes les vérifications ont été passées.', 'OK', {
                duration: 5000,
                panelClass: ['custom-snackbar'],
            });
        });

        it('should fail validation when surface area is invalid', () => {
            const gridArray = [[{ images: ['Grass'], isOccuped: false }], [{ images: ['Grass'], isOccuped: false }]];

            gameValidateSpy.isSurfaceAreaValid.and.returnValue(false);
            gameValidateSpy.areAllTerrainTilesAccessible.and.returnValue({ valid: true, errors: [] });
            tuileValidateSpy.areDoorsCorrectlyPlaced.and.returnValue({ valid: true, errors: [] });
            gameValidateSpy.areStartPointsCorrect.and.returnValue(true);
            gameValidateSpy.areTwoObjectsPlaced.and.returnValue(true);

            const result = service.validateAll('Test Mode', gridArray);

            expect(result).toBeFalse();
            expect(snackBarSpy.open).toHaveBeenCalledWith('Échec de la validation du jeu.\n• Surface de terrain insuffisante.\n', 'OK', {
                duration: 5000,
                panelClass: ['custom-snackbar'],
            });
        });

        it('should fail validation when accessibility is invalid', () => {
            const gridArray = [[{ images: ['Grass'], isOccuped: false }], [{ images: ['Grass'], isOccuped: false }]];

            gameValidateSpy.isSurfaceAreaValid.and.returnValue(true);
            gameValidateSpy.areAllTerrainTilesAccessible.and.returnValue({
                valid: false,
                errors: ['La tuile à la ligne: 2, col: 2 est inaccessible.'],
            });
            tuileValidateSpy.areDoorsCorrectlyPlaced.and.returnValue({ valid: true, errors: [] });
            gameValidateSpy.areStartPointsCorrect.and.returnValue(true);
            gameValidateSpy.areTwoObjectsPlaced.and.returnValue(true);

            const result = service.validateAll('Test Mode', gridArray);

            expect(result).toBeFalse();
            expect(snackBarSpy.open).toHaveBeenCalledWith(
                'Échec de la validation du jeu.\n• Tuile(s) inaccessibles:\n  - La tuile à la ligne: 2, col: 2 est inaccessible.\n',
                'OK',
                { duration: 5000, panelClass: ['custom-snackbar'] },
            );
        });

        it('should fail validation when door placement is invalid', () => {
            const gridArray = [[{ images: ['Grass'], isOccuped: false }], [{ images: ['Grass'], isOccuped: false }]];

            gameValidateSpy.isSurfaceAreaValid.and.returnValue(true);
            gameValidateSpy.areAllTerrainTilesAccessible.and.returnValue({ valid: true, errors: [] });
            tuileValidateSpy.areDoorsCorrectlyPlaced.and.returnValue({
                valid: false,
                errors: ["La porte à la ligne: 1, col: 2 n'est pas bien placée."],
            });
            gameValidateSpy.areStartPointsCorrect.and.returnValue(true);
            gameValidateSpy.areTwoObjectsPlaced.and.returnValue(true);

            const result = service.validateAll('Test Mode', gridArray);

            expect(result).toBeFalse();
            expect(snackBarSpy.open).toHaveBeenCalledWith(
                "Échec de la validation du jeu.\n• Problèmes de placement des portes:\n  - La porte à la ligne: 1, col: 2 n'est pas bien placée.\n",
                'OK',
                { duration: 5000, panelClass: ['custom-snackbar'] },
            );
        });

        it('should fail validation when start points are invalid', () => {
            const gridArray = [[{ images: ['Grass'], isOccuped: false }], [{ images: ['Grass'], isOccuped: false }]];

            gameValidateSpy.isSurfaceAreaValid.and.returnValue(true);
            gameValidateSpy.areAllTerrainTilesAccessible.and.returnValue({ valid: true, errors: [] });
            tuileValidateSpy.areDoorsCorrectlyPlaced.and.returnValue({ valid: true, errors: [] });
            gameValidateSpy.areStartPointsCorrect.and.returnValue(false);
            gameValidateSpy.areTwoObjectsPlaced.and.returnValue(true);

            const result = service.validateAll('Test Mode', gridArray);

            expect(result).toBeFalse();
            expect(snackBarSpy.open).toHaveBeenCalledWith('Échec de la validation du jeu.\n• Nombre incorrect de points de départ.\n', 'OK', {
                duration: 5000,
                panelClass: ['custom-snackbar'],
            });
        });
    });
});
