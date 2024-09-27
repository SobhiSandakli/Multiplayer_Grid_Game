import { TestBed } from '@angular/core/testing';
import { TileService } from './tile.service';

describe('TileService', () => {
    let service: TileService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(TileService);
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
        const tileImage = service.getTileImage('wall');
        expect(tileImage).toBe('assets/tiles/Wall.png');
    });

    it('should get image for water', () => {
        const tileImage = service.getTileImage('water');
        expect(tileImage).toBe('assets/tiles/Water.png');
    });

    it('should get image for door', () => {
        const tileImage = service.getTileImage('door');
        expect(tileImage).toBe('assets/tiles/Door.png');
    });

    it('should get image for doorOpen', () => {
        const tileImage = service.getTileImage('doorOpen');
        expect(tileImage).toBe('assets/tiles/DoorOpen.png');
    });

    it('should get image for ice', () => {
        const tileImage = service.getTileImage('ice');
        expect(tileImage).toBe('assets/tiles/Ice.png');
    });
});
