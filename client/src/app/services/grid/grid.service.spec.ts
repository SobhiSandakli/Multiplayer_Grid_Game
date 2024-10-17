import { TestBed } from '@angular/core/testing';
import { GridService } from './grid.service';

describe('GridService', () => {
    let service: GridService;
    const GRID_SIZE = 10;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(GridService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should generate a default grid with the correct size and image ', () => {
        service.generateDefaultGrid(GRID_SIZE);

        const grid = service.gridTiles;
        expect(grid.length).toBe(GRID_SIZE);
    });

    it('should replace image on a specific tile only if the tile exists', () => {
        const newImage = 'new_image.png';
        service.generateDefaultGrid(GRID_SIZE);
        service.replaceImageOnTile(1, 1, newImage);
        const grid = service.gridTiles;
        expect(grid[1][1].images[0]).toBe(newImage);
        service.replaceImageOnTile(GRID_SIZE, GRID_SIZE, newImage);
        expect(grid[1][1].images[0]).toBe(newImage);
    });

    it('should replace with the default image only if the tile exists', () => {
        const defaultImage = 'default.png';
        const newImage = 'new_image.png';
        service.generateDefaultGrid(GRID_SIZE);
        service.addObjectToTile(1, 1, newImage);
        service.replaceImageOnTile(1, 1, defaultImage);
        const grid = service.gridTiles;
        expect(grid[1][1].images[0]).toBe(defaultImage);
        service.replaceImageOnTile(GRID_SIZE, GRID_SIZE, defaultImage);
        expect(grid[1][1].images[0]).toBe(defaultImage);
    });

    it('should set the grid and notify subscribers', () => {
        const newGrid = [[{ images: ['image1.png'], isOccuped: false }], [{ images: ['image2.png'], isOccuped: true }]];

        let emittedGrid: { images: string[]; isOccuped: boolean }[][] | undefined;
        service.gridTiles$.subscribe((grid) => {
            emittedGrid = grid;
        });

        service.setGrid(newGrid);

        expect(service.gridTiles).toEqual(newGrid);
        expect(emittedGrid).toEqual(newGrid);
    });
    it('should reset the grid to the default state', () => {
        // Arrange: Create an initial grid with different values
        const initialGrid = Array.from({ length: GRID_SIZE }, () =>
            Array.from({ length: GRID_SIZE }, () => ({ images: ['initial_image.png'], isOccuped: true })),
        );

        service.setGrid(initialGrid);

        // Act: Call resetDefaultGrid to reset all tiles to their default state
        service.resetDefaultGrid();

        // Assert: Verify that all tiles are reset to the default image and are not occupied
        const resetGrid = service.gridTiles;
        resetGrid.forEach((row) => {
            row.forEach((tile) => {
                expect(tile.images).toEqual([service.defaultImage]);
                expect(tile.isOccuped).toBeFalse();
            });
        });
    });
});
