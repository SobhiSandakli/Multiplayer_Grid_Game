import { TestBed } from '@angular/core/testing';
import { GridService } from '@app/services/grid/grid.service';
import { TileService } from '@app/services/tile/tile.service';
interface Tile {
    images: string[];
    isOccuped: boolean;
}
describe('TileService', () => {
    let service: TileService;
    let gridServiceSpy: jasmine.SpyObj<GridService>;

    beforeEach(() => {
        const mockGridService = jasmine.createSpyObj('GridService', ['getGridTiles']);
        TestBed.configureTestingModule({ providers: [TileService, { provide: GridService, useValue: mockGridService }] });
        service = TestBed.inject(TileService);
        gridServiceSpy = TestBed.inject(GridService) as jasmine.SpyObj<GridService>;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
    it('should set selected tile', () => {
        service.setSelectedTile('ice');
        service.selectedTile$.subscribe((tile) => {
            expect(tile).toBe('ice');
        });
    });

    it('should get image for wall', () => {
        const tileImage = service.getTileImageSrc('wall');
        expect(tileImage).toBe('assets/tiles/Wall.png');
    });

    it('should get image for water', () => {
        const tileImage = service.getTileImageSrc('water');
        expect(tileImage).toBe('assets/tiles/Water.png');
    });

    it('should get image for door', () => {
        const tileImage = service.getTileImageSrc('door');
        expect(tileImage).toBe('assets/tiles/Door.png');
    });

    it('should get image for doorOpen', () => {
        const tileImage = service.getTileImageSrc('doorOpen');
        expect(tileImage).toBe('assets/tiles/Door-Open.png');
    });

    it('should get image for ice', () => {
        const tileImage = service.getTileImageSrc('ice');
        expect(tileImage).toBe('assets/tiles/Ice.png');
    });

    it('should add object to tile', () => {
        const mockGridTiles: Tile[][] = [[{ images: [], isOccuped: false }], [{ images: [], isOccuped: false }]];

        gridServiceSpy.getGridTiles.and.returnValue(mockGridTiles);

        service.addObjectToTile(0, 0, 'someObject.png');

        expect(mockGridTiles[0][0].images).toContain('someObject.png');
        expect(mockGridTiles[0][0].isOccuped).toBeTrue();
    });

    it('should remove object from tile', () => {
        const mockGridTiles = [[{ images: ['someObject.png'], isOccuped: true }], [{ images: [], isOccuped: false }]];
        gridServiceSpy.getGridTiles.and.returnValue(mockGridTiles);

        service.removeObjectFromTile(0, 0, 'someObject.png');

        expect(mockGridTiles[0][0].images).not.toContain('someObject.png');
        expect(mockGridTiles[0][0].isOccuped).toBeFalse();
    });

    it('should return correct image source for existing tile', () => {
        const tileImage = service.getTileImageSrc('wall');
        expect(tileImage).toBe('assets/tiles/Wall.png');
    });

    it('should return empty string for non-existing tile', () => {
        const tileImage = service.getTileImageSrc('nonExistingTile');
        expect(tileImage).toBe('');
    });
});
