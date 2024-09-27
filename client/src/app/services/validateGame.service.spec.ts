import { TestBed } from '@angular/core/testing';
import { ValidateGameService } from './validateGame.service';
import { LoggerService } from './LoggerService'; // Import the correct path to your LoggerService

describe('ValidateGameService', () => {
    let service: ValidateGameService;
    let loggerSpy: jasmine.SpyObj<LoggerService>;

    beforeEach(() => {
        const spy = jasmine.createSpyObj('LoggerService', ['log', 'error']);
        TestBed.configureTestingModule({
            providers: [ValidateGameService, { provide: LoggerService, useValue: spy }],
        });
        service = TestBed.inject(ValidateGameService);
        loggerSpy = TestBed.inject(LoggerService) as jasmine.SpyObj<LoggerService>;
    });

    it('should return true and log success when all terrain tiles are accessible', () => {
        const grid = [
            [{ images: ['assets/grass.png'] }, { images: ['assets/grass.png'] }],
            [{ images: ['assets/grass.png'] }, { images: ['assets/grass.png'] }],
        ];
        const visited = [
            [true, true],
            [true, true],
        ];
        expect(service.verifyAllTerrainTiles(grid, visited, 2, 2)).toBeTrue();
        expect(loggerSpy.log).toHaveBeenCalledWith('All terrain tiles are accessible.');
    });

    it('should return false and log an error when some terrain tiles are not accessible', () => {
        const grid = [
            [{ images: ['assets/grass.png'] }, { images: ['assets/tiles/Wall.png'] }],
            [{ images: ['assets/tiles/Wall.png'] }, { images: ['assets/tiles/Wall.png'] }],
        ];
        const visited = [
            [false, true],
            [true, true],
        ];
        expect(service.verifyAllTerrainTiles(grid, visited, 2, 2)).toBeFalse();
        expect(loggerSpy.error).toHaveBeenCalledWith('Terrain tile at row: 1, col: 1 is not accessible.');
    });

    // Test surface area validation
    it('should return true if more than 50% of the grid is terrain', () => {
        const grid = [
            [{ images: ['assets/grass.png'] }, { images: ['assets/grass.png'] }],
            [{ images: ['assets/grass.png'] }, { images: ['some_other_image.png'] }],
        ];
        expect(service.isSurfaceAreaValid(grid)).toBeTrue();
    });

    it('should return false if less than 50% of the grid is terrain', () => {
        const grid = [
            [{ images: ['assets/grass.png'] }, { images: ['some_other_image.png'] }],
            [{ images: ['some_other_image.png'] }, { images: ['some_other_image.png'] }],
        ];
        expect(service.isSurfaceAreaValid(grid)).toBeFalse();
    });

    // Test terrain tiles accessibility
    it('should return false if no start point is found', () => {
        const grid = [
            [{ images: [] }, { images: [] }],
            [{ images: [] }, { images: [] }],
        ];
        expect(service.areAllTerrainTilesAccessible(grid)).toBeFalse();
    });

    it('should return true if all terrain tiles are accessible from start point', () => {
        const grid = [
            [{ images: ['../../../assets/objects/started-points.png'] }, { images: ['assets/grass.png'] }],
            [{ images: ['assets/grass.png'] }, { images: ['assets/grass.png'] }],
        ];
        expect(service.areAllTerrainTilesAccessible(grid)).toBeTrue();
    });

    // Test door placement
    it('should return false if doors are not correctly placed between walls', () => {
        const grid = [
            [{ images: ['assets/tiles/Door.png'] }, { images: ['assets/grass.png'] }],
            [{ images: ['assets/grass.png'] }, { images: ['assets/tiles/Wall.png'] }],
        ];
        expect(service.areDoorsCorrectlyPlaced(grid)).toBeFalse();
    });

    it('should return true if doors are correctly placed between walls', () => {
        const grid = [
            [{ images: ['assets/grass.png'] }, { images: ['assets/grass.png'] }, { images: ['assets/grass.png'] }],
            [{ images: ['assets/tiles/Wall.png'] }, { images: ['assets/tiles/Door.png'] }, { images: ['assets/tiles/Wall.png'] }],
            [{ images: ['assets/grass.png'] }, { images: ['assets/grass.png'] }, { images: ['assets/grass.png'] }],
        ];
        expect(service.areDoorsCorrectlyPlaced(grid)).toBeTrue();
    });

    // Test case for validating start points correctly based on grid size
    it('should validate start points correctly based on grid size', () => {
        const grid10 = Array.from({ length: 10 }, () => Array.from({ length: 10 }, () => ({ images: [] as string[] })));
        grid10[0][0].images.push('../../../assets/objects/started-points.png');
        grid10[0][1].images.push('../../../assets/objects/started-points.png');
        expect(service.areStartPointsCorrect(grid10)).toBeTrue();

        const grid10_2 = Array.from({ length: 10 }, () => Array.from({ length: 10 }, () => ({ images: [] as string[] })));
        grid10_2[0][0].images.push('../../../assets/objects/started-points.png'); // Only 1 start point added
        expect(service.areStartPointsCorrect(grid10_2)).toBeFalse();
        expect(loggerSpy.error).toHaveBeenCalledWith('Start points validation failed: Expected 2 start points, but found 1.');

        // Create a grid of size 15 with exactly 4 start points
        const grid15 = Array.from({ length: 15 }, () => Array.from({ length: 15 }, () => ({ images: [] as string[] }))); // Explicitly declare as string[]
        grid15[0][0].images.push('../../../assets/objects/started-points.png');
        grid15[0][1].images.push('../../../assets/objects/started-points.png');
        grid15[0][2].images.push('../../../assets/objects/started-points.png');
        grid15[0][3].images.push('../../../assets/objects/started-points.png');
        expect(service.areStartPointsCorrect(grid15)).toBeTrue();

        // Create a grid of size 20 with exactly 6 start points
        const grid20 = Array.from({ length: 20 }, () => Array.from({ length: 20 }, () => ({ images: [] as string[] }))); // Explicitly declare as string[]
        grid20[0][0].images.push('../../../assets/objects/started-points.png');
        grid20[0][1].images.push('../../../assets/objects/started-points.png');
        grid20[0][2].images.push('../../../assets/objects/started-points.png');
        grid20[0][3].images.push('../../../assets/objects/started-points.png');
        grid20[0][4].images.push('../../../assets/objects/started-points.png');
        grid20[0][5].images.push('../../../assets/objects/started-points.png');
        expect(service.areStartPointsCorrect(grid20)).toBeTrue();

        const grid8 = Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => ({ images: [] as string[] })));
        grid8[0][0].images.push('../../../assets/objects/started-points.png');
        grid8[0][1].images.push('../../../assets/objects/started-points.png');
        expect(service.areStartPointsCorrect(grid8)).toBeTrue();
    });

    // Test overall validation
    it('should return true and log success when all validation methods return true', () => {
        spyOn(service, 'isSurfaceAreaValid').and.returnValue(true);
        spyOn(service, 'areAllTerrainTilesAccessible').and.returnValue(true);
        spyOn(service, 'areDoorsCorrectlyPlaced').and.returnValue(true);
        spyOn(service, 'areStartPointsCorrect').and.returnValue(true);

        const grid = Array(10).fill(Array(10).fill({ images: ['assets/grass.png'] }));
        expect(service.validateAll(grid)).toBeTrue();
        expect(loggerSpy.log).toHaveBeenCalledWith('Game validation successful. All checks passed.');
        expect(loggerSpy.error).not.toHaveBeenCalled();
    });

    it('should return false and log an error when any validation method returns false', () => {
        spyOn(service, 'isSurfaceAreaValid').and.returnValue(true);
        spyOn(service, 'areAllTerrainTilesAccessible').and.returnValue(false); // One false makes all false
        spyOn(service, 'areDoorsCorrectlyPlaced').and.returnValue(true);
        spyOn(service, 'areStartPointsCorrect').and.returnValue(true);

        const grid = Array(10).fill(Array(10).fill({ images: ['assets/grass.png'] }));
        expect(service.validateAll(grid)).toBeFalse();
        expect(loggerSpy.error).toHaveBeenCalledWith('Game validation failed. Please review the errors above.');
        expect(loggerSpy.log).not.toHaveBeenCalled();
    });
});
