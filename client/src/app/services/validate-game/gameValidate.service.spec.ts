import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Game } from '@app/interfaces/game-model.interface';
import { DragDropService } from '@app/services/drag-and-drop/drag-and-drop.service';
import { GameValidateService } from '@app/services/validate-game/gameValidate.service';
import { TuileValidateService } from '@app/services/validate-game/tuileValidate.service';
import { ExpectedPoints, GridSize, MaxPlayers, ObjectsImages, TileImages } from 'src/constants/validate-constants';

describe('GameValidateService', () => {
    let service: GameValidateService;
    let snackBarMock: jasmine.SpyObj<MatSnackBar>;
    let tuileValidateSpy: jasmine.SpyObj<TuileValidateService>;
    let dragAndDropService: jasmine.SpyObj<DragDropService>;
    beforeEach(() => {
        const tuileSpy = jasmine.createSpyObj('TuileValidateService', ['performBFS', 'verifyAllTerrainTiles']);
        snackBarMock = jasmine.createSpyObj('MatSnackBar', ['open']);
        const dragAndDropSpy = jasmine.createSpyObj('DragDropService', ['objectsList']);

        TestBed.configureTestingModule({
            providers: [
                GameValidateService,
                { provide: TuileValidateService, useValue: tuileSpy },
                { provide: MatSnackBar, useValue: snackBarMock },
                { provide: DragDropService, useValue: dragAndDropSpy },
            ],
        });

        service = TestBed.inject(GameValidateService);
        tuileValidateSpy = TestBed.inject(TuileValidateService) as jasmine.SpyObj<TuileValidateService>;
        dragAndDropService = TestBed.inject(DragDropService) as jasmine.SpyObj<DragDropService>;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('isSurfaceAreaValid', () => {
        it('should return true if terrain area is greater than minimum terrain percentage', () => {
            const gridArray = [
                [
                    { images: [TileImages.Grass], isOccuped: false },
                    { images: [TileImages.Water], isOccuped: false },
                ],
                [
                    { images: [TileImages.Ice], isOccuped: false },
                    { images: [TileImages.Wall], isOccuped: false },
                ],
            ];

            const result = service.isSurfaceAreaValid(gridArray);
            expect(result).toBeTrue();
        });

        it('should return false if terrain area is less than minimum terrain percentage', () => {
            const gridArray = [
                [
                    { images: [TileImages.Wall], isOccuped: false },
                    { images: [TileImages.Wall], isOccuped: false },
                ],
                [
                    { images: [TileImages.Wall], isOccuped: false },
                    { images: [TileImages.Wall], isOccuped: false },
                ],
            ];

            const result = service.isSurfaceAreaValid(gridArray);
            expect(result).toBeFalse();
        });
    });

    describe('areStartPointsCorrect', () => {
        it('should return true if the correct number of start points is present for a grid size', () => {
            const gridArray = [
                [
                    { images: [ObjectsImages.StartPoint], isOccuped: false },
                    { images: [], isOccuped: false },
                ],
                [
                    { images: [ObjectsImages.StartPoint], isOccuped: false },
                    { images: [], isOccuped: false },
                ],
            ];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            spyOn(service as any, 'getExpectedStartPoints').and.returnValue(ExpectedPoints.Small);
            const result = service.areStartPointsCorrect(gridArray);
            expect(result).toBeTrue();
        });

        it('should return false if the number of start points is incorrect', () => {
            const gridArray = [
                [
                    { images: [ObjectsImages.StartPoint], isOccuped: false },
                    { images: [], isOccuped: false },
                ],
                [
                    { images: [], isOccuped: false },
                    { images: [], isOccuped: false },
                ],
            ];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            spyOn(service as any, 'getExpectedStartPoints').and.returnValue(ExpectedPoints.Small);
            const result = service.areStartPointsCorrect(gridArray);
            expect(result).toBeFalse();
        });
    });
    it('should return false if no terrain image is present in any cell', () => {
        const gridArray = [
            [
                { images: [], isOccuped: false },
                { images: [], isOccuped: false },
            ],
            [
                { images: [], isOccuped: false },
                { images: [], isOccuped: false },
            ],
        ];

        const result = service.isSurfaceAreaValid(gridArray);
        expect(result).toBeFalse();
    });
    it('should return valid: true when no start point is found', () => {
        const gridArray = [
            [
                { images: [], isOccuped: false },
                { images: [], isOccuped: false },
            ],
            [
                { images: [], isOccuped: false },
                { images: [], isOccuped: false },
            ],
        ];

        const result = service.areAllTerrainTilesAccessible(gridArray);
        expect(result.valid).toBeTrue();
        expect(result.errors).toEqual([]);
    });
    it('should handle an empty grid correctly', () => {
        const gridArray: { images: string[]; isOccuped: boolean }[][] = [];
        expect(service.isSurfaceAreaValid(gridArray)).toBeFalse();
        expect(service.areAllTerrainTilesAccessible(gridArray).valid).toBeTrue();
    });

    it('should properly call BFS and return the visited tiles', () => {
        const gridArray = [
            [
                { images: [TileImages.Grass], isOccuped: false },
                { images: [TileImages.Grass], isOccuped: false },
            ],
            [
                { images: [TileImages.Grass], isOccuped: false },
                { images: [TileImages.Grass], isOccuped: false },
            ],
        ];

        tuileValidateSpy.performBFS.and.returnValue([
            [true, true],
            [true, true],
        ]);

        const result = service.areAllTerrainTilesAccessible(gridArray);
        expect(result.valid).toBeTrue();
        expect(result.errors.length).toBe(0);
    });
    it('should return a valid start point if one exists in the grid', () => {
        const gridArray = [
            [
                { images: [ObjectsImages.StartPoint], isOccuped: false },
                { images: [], isOccuped: false },
            ],
            [
                { images: [], isOccuped: false },
                { images: [], isOccuped: false },
            ],
        ];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const startPoint = (service as any).findStartPoint(gridArray);
        expect(startPoint).toEqual([0, 0]);
    });
    it('should return the correct number of start points for a small grid', () => {
        const gridSize = GridSize.Small;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const expectedPoints = (service as any).getExpectedStartPoints(gridSize);
        expect(expectedPoints).toBe(ExpectedPoints.Small);
    });

    it('should return the correct number of start points for a medium grid', () => {
        const gridSize = GridSize.Medium;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const expectedPoints = (service as any).getExpectedStartPoints(gridSize);
        expect(expectedPoints).toBe(ExpectedPoints.Medium);
    });

    it('should return the correct number of start points for a large grid', () => {
        const gridSize = GridSize.Large;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const expectedPoints = (service as any).getExpectedStartPoints(gridSize);
        expect(expectedPoints).toBe(ExpectedPoints.Large);
    });

    it('should return the default number of start points for an unknown grid size', () => {
        const gridSize = 5;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const expectedPoints = (service as any).getExpectedStartPoints(gridSize);
        expect(expectedPoints).toBe(ExpectedPoints.Small);
    });
    describe('areAllTerrainTilesAccessible', () => {
        it('should call performBFS and verifyAllTerrainTiles when start point exists', () => {
            const gridArray = [
                [
                    { images: [ObjectsImages.StartPoint], isOccuped: false },
                    { images: [TileImages.Grass], isOccuped: false },
                ],
                [
                    { images: [TileImages.Grass], isOccuped: false },
                    { images: [TileImages.Grass], isOccuped: false },
                ],
            ];

            const visitedMock = [
                [true, true],
                [true, true],
            ];
            tuileValidateSpy.performBFS.and.returnValue(visitedMock);
            tuileValidateSpy.verifyAllTerrainTiles.and.returnValue({ valid: true, errors: [] });

            const result = service.areAllTerrainTilesAccessible(gridArray);

            expect(tuileValidateSpy.performBFS).toHaveBeenCalledWith(gridArray, [0, 0], 2, 2);
            expect(tuileValidateSpy.verifyAllTerrainTiles).toHaveBeenCalledWith(gridArray, visitedMock, 2, 2);
            expect(result.valid).toBeTrue();
            expect(result.errors).toEqual([]);
        });
    });

    describe('gridMaxPlayers', () => {
        it('should return correct max players for 15x15 grid', () => {
            const game: Game = { size: '15x15' } as Game;
            const result = service.gridMaxPlayers(game);
            expect(result).toBe(MaxPlayers.MeduimMaxPlayers);
        });

        it('should return correct max players for 20x20 grid', () => {
            const game: Game = { size: '20x20' } as Game;
            const result = service.gridMaxPlayers(game);
            expect(result).toBe(MaxPlayers.LargeMaxPlayers);
        });

        it('should return default max players for unknown grid size', () => {
            const game: Game = { size: 'unknown' } as Game;
            const result = service.gridMaxPlayers(game);
            expect(result).toBe(MaxPlayers.MeduimMaxPlayers);
        });
    });

    describe('areTwoObjectsPlaced', () => {
        it('should return true if two objects are placed', () => {
            dragAndDropService.objectsList = [
                {
                    name: 'Test',
                    count: 0,
                    description: '',
                    link: '',
                    isDragAndDrop: false,
                },
                {
                    name: 'Test',
                    count: 0,
                    description: '',
                    link: '',
                    isDragAndDrop: false,
                },
            ];
            const gridArray = [
                [
                    { images: [ObjectsImages.StartPoint], isOccuped: false },
                    { images: [ObjectsImages.Flag], isOccuped: false },
                ],
                [
                    { images: [], isOccuped: false },
                    { images: [], isOccuped: false },
                ],
            ];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (service as any).getExpectedStartPoints(GridSize.Medium);
            const result = service.areTwoObjectsPlaced(gridArray);
            expect(result).toBeTrue();
        });
        it('should return false if no objects are placed', () => {
            dragAndDropService.objectsList = [
                {
                    name: 'Random Items',
                    count: 4,
                    description: '',
                    link: '',
                    isDragAndDrop: false,
                },
                {
                    name: 'Random Items',
                    count: 4,
                    description: '',
                    link: '',
                    isDragAndDrop: false,
                },
            ];
            const gridArray = [
                [
                    { images: [], isOccuped: false },
                    { images: [], isOccuped: false },
                ],
                [
                    { images: [], isOccuped: false },
                    { images: [], isOccuped: false },
                ],
            ];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (service as any).getExpectedStartPoints(GridSize.Medium);
            const result = service.areTwoObjectsPlaced(gridArray);
            expect(result).toBeFalse();
        });
    });

    describe('isFlagPlaced', () => {
        it('should return true if a flag is placed', () => {
            const gridArray = [
                [
                    { images: [ObjectsImages.StartPoint], isOccuped: false },
                    { images: [ObjectsImages.Flag], isOccuped: false },
                ],
                [
                    { images: [], isOccuped: false },
                    { images: [], isOccuped: false },
                ],
            ];
            const result = service.isFlagPlaced(gridArray, 'Capture the Flag');
            expect(result).toBeTrue();
        });

        it('should return false if no flag is placed', () => {
            const gridArray = [
                [
                    { images: [ObjectsImages.StartPoint], isOccuped: false },
                    { images: [], isOccuped: false },
                ],
                [
                    { images: [], isOccuped: false },
                    { images: [], isOccuped: false },
                ],
            ];
            const result = service.isFlagPlaced(gridArray, 'Classique');
            expect(result).toBeFalse();
        });
    });
});
