import { TestBed } from '@angular/core/testing';
import { ImageService, Tile } from './image.service';

describe('ImageService', () => {
    let service: ImageService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(ImageService);
    });

    it('should load an image successfully', async () => {
        const src = 'assets/tiles/Grass.png';
        const img = new Image();
        img.src = src;

        spyOn(window, 'Image').and.returnValue(img);

        const result = await service.loadImage(src);
        expect(result.src.endsWith(src)).toBeTrue();
    });

    it('should throw an error if image fails to load', async () => {
        const src = 'assets/invalid.png';
        const img = new Image();
        img.src = src;

        spyOn(window, 'Image').and.returnValue(img);

        setTimeout(() => {
            if (img.onerror) {
                img.onerror(new Event('error'));
            }
        }, 0);

        try {
            await service.loadImage(src);
            fail('Expected the promise to be rejected.');
        } catch (error) {
            if (error instanceof Error) {
                expect(error.message).toContain('Failed to load image');
            } else {
                fail('Expected an Error object');
            }
        }
    });

    it('should throw an error if there is no 2D context', async () => {
        const mockGridArray: Tile[][] = [[{ images: ['assets/tiles/Grass.png'], isOccuped: false }]];

        spyOn(document, 'createElement').and.returnValue({
            getContext: () => null,
        } as unknown as HTMLCanvasElement);

        try {
            await service.createCompositeImageAsBase64(mockGridArray);
            fail('Expected the promise to be rejected.');
        } catch (error) {
            if (error instanceof Error) {
                expect(error.message).toBe('Failed to get 2D context');
            } else {
                fail('Expected an Error object');
            }
        }
    });

    it('should calculate canvas dimensions based on the grid size', async () => {
        const mockGridArray: Tile[][] = [
            [{ images: ['assets/tiles/Grass.png'], isOccuped: false }],
            [{ images: ['assets/tiles/Grass.png'], isOccuped: false }],
        ];
        const columnWidth = 144;
        const rowHeight = 288;

        const canvas = document.createElement('canvas');
        spyOn(document, 'createElement').and.returnValue(canvas);
        spyOn(canvas, 'getContext').and.returnValue({
            drawImage: jasmine.createSpy('drawImage'),
        } as unknown as CanvasRenderingContext2D);

        await service.createCompositeImageAsBase64(mockGridArray);

        expect(canvas.width).toBe(columnWidth); // 1 column * 144
        expect(canvas.height).toBe(rowHeight); // 2 rows * 144
    });

    it('should draw images on the canvas at the correct positions and create a base64 string', async () => {
        const mockGridArray: Tile[][] = [
            [{ images: ['assets/tiles/Grass.png'], isOccuped: false }],
            [{ images: ['assets/tiles/Grass.png'], isOccuped: false }],
        ];

        const canvas = document.createElement('canvas');
        const ctx = {
            drawImage: jasmine.createSpy('drawImage'),
            toDataURL: jasmine.createSpy('toDataURL').and.returnValue('data:image/png;base64,base64string'),
        } as unknown as CanvasRenderingContext2D;

        spyOn(document, 'createElement').and.returnValue(canvas);
        spyOn(canvas, 'getContext').and.returnValue(ctx);

        // Mock the loadImage method to return a dummy image element
        spyOn(service, 'loadImage').and.callFake(async (src: string) => {
            const img = new Image();
            img.src = src;
            return Promise.resolve(img);
        });

        const result = await service.createCompositeImageAsBase64(mockGridArray);

        expect(result).toMatch(/^data:image\/png;base64,/);
    });

    it('should handle errors during image loading in createCompositeImageAsBase64', async () => {
        const mockGridArray: Tile[][] = [
            [{ images: ['assets/tiles/Grass.png'], isOccuped: false }],
            [{ images: ['assets/invalid.png'], isOccuped: false }],
        ];

        const canvas = document.createElement('canvas');
        const ctx = {
            drawImage: jasmine.createSpy('drawImage'),
            toDataURL: jasmine.createSpy('toDataURL').and.returnValue('data:image/png;base64,base64string'),
        } as unknown as CanvasRenderingContext2D;

        spyOn(document, 'createElement').and.returnValue(canvas);
        spyOn(canvas, 'getContext').and.returnValue(ctx);

        // Mock the loadImage method to simulate an error for the invalid image
        spyOn(service, 'loadImage').and.callFake(async (src: string) => {
            if (src === 'assets/invalid.png') {
                return Promise.reject(new Error('Failed to load image'));
            }
            const img = new Image();
            img.src = src;
            return Promise.resolve(img);
        });

        try {
            await service.createCompositeImageAsBase64(mockGridArray);
            fail('Expected the promise to be rejected.');
        } catch (error) {
            if (error instanceof Error) {
                expect(error.message).toContain('Failed to create image');
            } else {
                fail('Expected an Error object');
            }
        }
    });

    it('should load all images for each tile in a row', async () => {
        const mockRow: Tile[] = [
            { images: ['assets/tiles/Grass.png', 'assets/water.png'], isOccuped: false },
            { images: ['assets/stone.png'], isOccuped: false },
        ];

        // Mock the loadImage method to return a dummy image element
        spyOn(service, 'loadImage').and.callFake(async (src: string) => {
            const img = new Image();
            img.src = src;
            return Promise.resolve(img);
        });

        const result = await service.loadRowImages(mockRow);

        expect(result.length).toBe(2); // Two tiles in the row
        expect(result[0].length).toBe(2); // First tile has two images
        expect(result[1].length).toBe(1); // Second tile has one image

        expect(result[0][0].src.endsWith('assets/tiles/Grass.png')).toBeTrue();
        expect(result[0][1].src.endsWith('assets/water.png')).toBeTrue();
        expect(result[1][0].src.endsWith('assets/stone.png')).toBeTrue();
    });
});
