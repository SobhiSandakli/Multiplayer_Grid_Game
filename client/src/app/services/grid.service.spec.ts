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
        const defaultImage = 'default.png';
        service.generateDefaultGrid(GRID_SIZE, defaultImage);

        const grid = service.getGridTiles();
        expect(grid.length).toBe(GRID_SIZE);
        expect(grid[0][0].images[0]).toBe(defaultImage);
    });

    it('should add an image to a tile if the tile exists', () => {
        const defaultImage = 'default.png';
        const newImage = 'new_image.png';
        service.generateDefaultGrid(GRID_SIZE, defaultImage);
        service.addObjectToTile(1, 1, newImage);
        const grid = service.getGridTiles();
        expect(grid[1][1].images).toContain(newImage);
        service.addObjectToTile(GRID_SIZE, GRID_SIZE, newImage);
        expect(grid[1][1].images.length).toBe(2);
    });

    it('should replace image on a specific tile only if the tile exists', () => {
        const defaultImage = 'default.png';
        const newImage = 'new_image.png';
        service.generateDefaultGrid(GRID_SIZE, defaultImage);
        service.replaceImageOnTile(1, 1, newImage);
        const grid = service.getGridTiles();
        expect(grid[1][1].images[0]).toBe(newImage);
        service.replaceImageOnTile(GRID_SIZE, GRID_SIZE, newImage);
        expect(grid[1][1].images[0]).toBe(newImage);
    });

    it('should replace with the default image only if the tile exists', () => {
        const defaultImage = 'default.png';
        const newImage = 'new_image.png';
        service.generateDefaultGrid(GRID_SIZE, defaultImage);
        service.addObjectToTile(1, 1, newImage);
        service.replaceImageOnTile(1, 1, defaultImage);
        const grid = service.getGridTiles();
        expect(grid[1][1].images[0]).toBe(defaultImage);
        service.replaceImageOnTile(GRID_SIZE, GRID_SIZE, defaultImage);
        expect(grid[1][1].images[0]).toBe(defaultImage);
    });
});
