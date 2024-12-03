import { TestBed } from '@angular/core/testing';
import { TileImages } from 'src/constants/validate-constants';
import { TuileValidateService } from './tuileValidate.service';

describe('TuileValidateService', () => {
    let service: TuileValidateService;

    beforeAll(() => {
        TestBed.configureTestingModule({
            providers: [TuileValidateService],
        });
        service = TestBed.inject(TuileValidateService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('verifyAllTerrainTiles', () => {
        it('should return valid: false with an error if some terrain tiles are inaccessible', () => {
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
            const visited = [
                [true, true],
                [true, false],
            ];
            const result = service.verifyAllTerrainTiles(gridArray, visited, 2, 2);
            expect(result.valid).toBeFalse();
            expect(result.errors).toContain('La tuile à la ligne: 2, col: 2 est inaccessible.');
        });

        it('should return valid: true when all terrain tiles are accessible', () => {
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
            const visited = [
                [true, true],
                [true, true],
            ];
            const result = service.verifyAllTerrainTiles(gridArray, visited, 2, 2);
            expect(result.valid).toBeTrue();
            expect(result.errors.length).toBe(0);
        });
    });

    describe('performBFS', () => {
        it('should correctly traverse accessible terrain tiles using BFS', () => {
            const gridArray = [
                [
                    { images: [TileImages.Grass], isOccuped: false },
                    { images: [TileImages.Wall], isOccuped: false },
                ],
                [
                    { images: [TileImages.Grass], isOccuped: false },
                    { images: [TileImages.Grass], isOccuped: false },
                ],
            ];
            const visited = service.performBFS(gridArray, [0, 0], 2, 2);

            expect(visited[0][0]).toBeTrue();
            expect(visited[1][0]).toBeTrue();
            expect(visited[0][1]).toBeFalse();
            expect(visited[1][1]).toBeTrue();
        });
    });

    describe('areDoorsCorrectlyPlaced', () => {
        it('should return valid: true when all doors are correctly placed', () => {
            const gridArray = [
                [
                    { images: [TileImages.Wall], isOccuped: false },
                    { images: [TileImages.Door], isOccuped: false },
                    { images: [TileImages.Wall], isOccuped: false },
                ],
            ];
            const result = service.areDoorsCorrectlyPlaced(gridArray);
            expect(result.valid).toBeFalse();
            expect(result.errors.length).toBe(1);
        });

        it('should return valid: false with errors when doors are incorrectly placed', () => {
            const gridArray = [
                [
                    { images: [TileImages.Grass], isOccuped: false },
                    { images: [TileImages.Door], isOccuped: false },
                    { images: [TileImages.Grass], isOccuped: false },
                ],
            ];

            const result = service.areDoorsCorrectlyPlaced(gridArray);
            expect(result.valid).toBeFalse();
            expect(result.errors).toContain("La porte à la ligne: 1, col: 2 n'est pas bien placée.");
        });
    });
    describe('isTerrain', () => {
        it('should return false if the cell is out of bounds', () => {
            const gridArray = [
                [
                    { images: [TileImages.Grass], isOccuped: false },
                    { images: [TileImages.Wall], isOccuped: false },
                ],
            ];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = (service as any).isTerrain(gridArray, -1, 0);
            expect(result).toBeFalse();
        });

        it('should return true for a valid terrain tile', () => {
            const gridArray = [
                [
                    { images: [TileImages.Grass], isOccuped: false },
                    { images: [TileImages.Wall], isOccuped: false },
                ],
            ];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = (service as any).isTerrain(gridArray, 0, 0);
            expect(result).toBeTrue();
        });

        it('should return false for a non-terrain tile', () => {
            const gridArray = [[{ images: [TileImages.Wall], isOccuped: false }]];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = (service as any).isTerrain(gridArray, 0, 0);
            expect(result).toBeFalse();
        });
    });
});
