import { TestBed } from '@angular/core/testing';
import { ValidateGameService } from './validateGame.service';
import { LoggerService } from './LoggerService'; // Import the correct path to your LoggerService
import { MatSnackBar } from '@angular/material/snack-bar';

describe('ValidateGameService', () => {
    let service: ValidateGameService;
    let loggerSpy: jasmine.SpyObj<LoggerService>;
    let snackBarMock: jasmine.SpyObj<MatSnackBar>;

    beforeEach(() => {
        const spy = jasmine.createSpyObj('LoggerService', ['log', 'error']);
        snackBarMock = jasmine.createSpyObj('MatSnackBar', ['open']);

        TestBed.configureTestingModule({
            providers: [ValidateGameService, { provide: LoggerService, useValue: spy }, { provide: MatSnackBar, useValue: snackBarMock }],
        });
        service = TestBed.inject(ValidateGameService);
        loggerSpy = TestBed.inject(LoggerService) as jasmine.SpyObj<LoggerService>;
    });

    it('should return true and log success when all terrain tiles are accessible', () => {
        const grid = [
            [
                { images: ['assets/grass.png'], isOccuped: false },
                { images: ['assets/grass.png'], isOccuped: false },
            ],
            [
                { images: ['assets/grass.png'], isOccuped: false },
                { images: ['assets/grass.png'], isOccuped: false },
            ],
        ];
        const visited = [
            [true, true],
            [true, true],
        ];
        const result = service.verifyAllTerrainTiles(grid, visited, 2, 2);
        expect(result).toEqual({ valid: true, errors: [] });
    });

    it('should return false when the cell does not contain terrain images', () => {
        const gridArray = [[{ images: ['assets/rock.png'], isOccuped: false }], [{ images: ['assets/sand.png'], isOccuped: false }]];

        const result = service.isTerrain(gridArray, 0, 0);
        expect(result).toBeFalse();
    });

    it('should return false when the cell is out of bounds', () => {
        const gridArray = [[{ images: ['assets/grass.png'], isOccuped: false }], [{ images: ['assets/tiles/Ice.png'], isOccuped: false }]];

        const result = service.isTerrain(gridArray, 2, 0); // Out of bounds
        expect(result).toBeFalse();
    });

    it('should return false and log an error when some terrain tiles are not accessible', () => {
        const grid = [
            [
                { images: ['assets/grass.png'], isOccuped: false },
                { images: ['assets/tiles/Wall.png'], isOccuped: false },
            ],
            [
                { images: ['assets/tiles/Wall.png'], isOccuped: false },
                { images: ['assets/tiles/Wall.png'], isOccuped: false },
            ],
        ];
        const visited = [
            [false, true],
            [true, true],
        ];
        const result = service.verifyAllTerrainTiles(grid, visited, 2, 2);
        expect(result).toEqual({ valid: false, errors: ["La tuile de terrain à la ligne : 1, col: 1 n'est pas accessible."] });
        expect(loggerSpy.error).toHaveBeenCalledWith("La tuile de terrain à la ligne : 1, col: 1 n'est pas accessible.");
    });

    it('should return true if more than 50% of the grid is terrain', () => {
        const grid = [
            [
                { images: ['assets/grass.png'], isOccuped: false },
                { images: ['assets/grass.png'], isOccuped: false },
            ],
            [
                { images: ['assets/grass.png'], isOccuped: false },
                { images: ['some_other_image.png'], isOccuped: false },
            ],
        ];
        expect(service.isSurfaceAreaValid(grid)).toBeTrue();
    });
    it('should return false if less than 50% of the grid is terrain', () => {
        const grid = [
            [
                { images: ['assets/grass.png'], isOccuped: false },
                { images: ['some_other_image.png'], isOccuped: false },
            ],
            [
                { images: ['some_other_image.png'], isOccuped: false },
                { images: ['some_other_image.png'], isOccuped: false },
            ],
        ];
        expect(service.isSurfaceAreaValid(grid)).toBeFalse();
    });
    it('should return false if no start point is found', () => {
        const grid = [
            [
                { images: [], isOccuped: false },
                { images: [], isOccuped: false },
            ],
            [
                { images: [], isOccuped: false },
                { images: [], isOccuped: false },
            ],
        ];
        const result = service.areAllTerrainTilesAccessible(grid);
        expect(result).toEqual({ valid: true, errors: [] });
    });

    it('should return true if all terrain tiles are accessible from start point', () => {
        const grid = [
            [
                { images: ['../../../assets/objects/started-points.png'], isOccuped: false },
                { images: ['assets/grass.png'], isOccuped: false },
            ],
            [
                { images: ['assets/grass.png'], isOccuped: false },
                { images: ['assets/grass.png'], isOccuped: false },
            ],
        ];
        const result = service.areAllTerrainTilesAccessible(grid);
        expect(result).toEqual({ valid: true, errors: [] });
    });

    it('should return false if doors are not correctly placed between walls', () => {
        const grid = [
            [
                { images: ['assets/tiles/Door.png'], isOccuped: false },
                { images: ['assets/grass.png'], isOccuped: false },
            ],
            [
                { images: ['assets/grass.png'], isOccuped: false },
                { images: ['assets/tiles/Wall.png'], isOccuped: false },
            ],
        ];
        const result = service.areDoorsCorrectlyPlaced(grid);
        expect(result).toEqual({ valid: false, errors: ["La porte à la ligne: 1, col: 1 n'est pas bien placée."] });
    });

    it('should return true if doors are correctly placed between walls', () => {
        const grid = [
            [
                { images: ['assets/grass.png'], isOccuped: false },
                { images: ['assets/grass.png'], isOccuped: false },
                { images: ['assets/grass.png'], isOccuped: false },
            ],
            [
                { images: ['assets/tiles/Wall.png'], isOccuped: false },
                { images: ['assets/tiles/Door.png'], isOccuped: false },
                { images: ['assets/tiles/Wall.png'], isOccuped: false },
            ],
            [
                { images: ['assets/grass.png'], isOccuped: false },
                { images: ['assets/grass.png'], isOccuped: false },
                { images: ['assets/grass.png'], isOccuped: false },
            ],
        ];
        const result = service.areDoorsCorrectlyPlaced(grid);
        expect(result).toEqual({ valid: true, errors: [] });
    });

    it('should validate start points correctly based on grid size', () => {
        const grid10: { images: string[]; isOccuped: boolean }[][] = Array.from({ length: 10 }, () =>
            Array.from({ length: 10 }, () => ({ images: [] as string[], isOccuped: false })),
        );
        grid10[0][0].images.push('../../../assets/objects/started-points.png');
        grid10[0][1].images.push('../../../assets/objects/started-points.png');
        expect(service.areStartPointsCorrect(grid10)).toBeTrue();

        const grid102: { images: string[]; isOccuped: boolean }[][] = Array.from({ length: 10 }, () =>
            Array.from({ length: 10 }, () => ({ images: [] as string[], isOccuped: false })),
        );
        grid102[0][0].images.push('../../../assets/objects/started-points.png'); // Only 1 start point added
        expect(service.areStartPointsCorrect(grid102)).toBeFalse();
        expect(loggerSpy.error).toHaveBeenCalledWith('La validation des points de départ a échoué : 2 points de départ attendus, mais 1 trouvés.');

        const grid15: { images: string[]; isOccuped: boolean }[][] = Array.from({ length: 15 }, () =>
            Array.from({ length: 15 }, () => ({ images: [] as string[], isOccuped: false })),
        );
        grid15[0][0].images.push('../../../assets/objects/started-points.png');
        grid15[0][1].images.push('../../../assets/objects/started-points.png');
        grid15[0][2].images.push('../../../assets/objects/started-points.png');
        grid15[0][3].images.push('../../../assets/objects/started-points.png');
        expect(service.areStartPointsCorrect(grid15)).toBeTrue();

        const grid20: { images: string[]; isOccuped: boolean }[][] = Array.from({ length: 20 }, () =>
            Array.from({ length: 20 }, () => ({ images: [] as string[], isOccuped: false })),
        );
        grid20[0][0].images.push('../../../assets/objects/started-points.png');
        grid20[0][1].images.push('../../../assets/objects/started-points.png');
        grid20[0][2].images.push('../../../assets/objects/started-points.png');
        grid20[0][3].images.push('../../../assets/objects/started-points.png');
        grid20[0][4].images.push('../../../assets/objects/started-points.png');
        grid20[0][5].images.push('../../../assets/objects/started-points.png');
        expect(service.areStartPointsCorrect(grid20)).toBeTrue();

        const grid8: { images: string[]; isOccuped: boolean }[][] = Array.from({ length: 8 }, () =>
            Array.from({ length: 8 }, () => ({ images: [] as string[], isOccuped: false })),
        );
        grid8[0][0].images.push('../../../assets/objects/started-points.png');
        grid8[0][1].images.push('../../../assets/objects/started-points.png');
        expect(service.areStartPointsCorrect(grid8)).toBeTrue();
    });

    it('should return true and log success when all validation methods return true', () => {
        const gridSize = 10;
        spyOn(service, 'isSurfaceAreaValid').and.returnValue(true);
        spyOn(service, 'areAllTerrainTilesAccessible').and.returnValue({ valid: true, errors: [] });
        spyOn(service, 'areDoorsCorrectlyPlaced').and.returnValue({ valid: true, errors: [] });
        spyOn(service, 'areStartPointsCorrect').and.returnValue(true);

        const grid = Array(gridSize).fill(Array(gridSize).fill({ images: ['assets/grass.png'] }));
        expect(service.validateAll(grid)).toBeTrue();
        expect(loggerSpy.log).toHaveBeenCalledWith('Validation du jeu réussie. Toutes les vérifications ont été passées.');
        expect(loggerSpy.error).not.toHaveBeenCalled();
    });

    it('should return false and log an error when any validation method returns false', () => {
        const gridSize = 10;
        spyOn(service, 'isSurfaceAreaValid').and.returnValue(true);
        spyOn(service, 'areAllTerrainTilesAccessible').and.returnValue({ valid: false, errors: ['Some terrain tiles are not accessible.'] });
        spyOn(service, 'areDoorsCorrectlyPlaced').and.returnValue({ valid: true, errors: [] });
        spyOn(service, 'areStartPointsCorrect').and.returnValue(true);

        const grid = Array(gridSize).fill(Array(gridSize).fill({ images: ['assets/grass.png'] }));
        expect(service.validateAll(grid)).toBeFalse();

        expect(snackBarMock.open).toHaveBeenCalledWith(
            'Échec de la validation du jeu.\n• Tuile(s) inaccessibles:\n  - Some terrain tiles are not accessible.\n',
            'OK',
            { duration: 5000, panelClass: ['custom-snackbar'] },
        );

        expect(loggerSpy.log).not.toHaveBeenCalled();
    });

    it('should return false and log an error when any validation method returns false', () => {
        const gridSize = 10;
        spyOn(service, 'isSurfaceAreaValid').and.returnValue(true);
        spyOn(service, 'areAllTerrainTilesAccessible').and.returnValue({ valid: true, errors: [] });
        spyOn(service, 'areDoorsCorrectlyPlaced').and.returnValue({ valid: false, errors: [] });
        spyOn(service, 'areStartPointsCorrect').and.returnValue(true);

        const grid = Array(gridSize).fill(Array(gridSize).fill({ images: ['assets/grass.png'] }));
        expect(service.validateAll(grid)).toBeFalse();

        expect(snackBarMock.open).toHaveBeenCalledWith(
            'Échec de la validation du jeu.\n• Problèmes de placement des portes:\n', // Ensure spaces and newline characters are correctly placed
            'OK',
            { duration: 5000, panelClass: ['custom-snackbar'] },
        );

        expect(loggerSpy.log).not.toHaveBeenCalled();
    });

    it('should return false when the cell does not contain grass image', () => {
        const grid = [
            [
                { images: ['assets/tiles/Door.png'], isOccuped: false },
                { images: ['assets/tiles/Door.png'], isOccuped: false },
            ],
            [
                { images: ['assets/tiles/Door.png'], isOccuped: false },
                { images: ['assets/tiles/Door.png'], isOccuped: false },
            ],
        ];

        const row = 0;
        const col = 1;
        expect(service.isTerrain(grid, row, col)).toBeFalse();
    });
});
