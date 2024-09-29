import { TestBed } from '@angular/core/testing';
import { ImageService } from './image.service';

describe('ImageService', () => {
    let service: ImageService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(ImageService);
    });

    //   it('should create a composite image as a base64 string', async () => {
    //     const mockGridArray = [
    //       [{ images: ['image1.png'] }],
    //       [{ images: ['image2.png'] }],
    //     ];

    //     // Mocking the canvas and its context
    //     const canvasMock = document.createElement('canvas');
    //     const ctxMock = jasmine.createSpyObj('CanvasRenderingContext2D', ['drawImage']);

    //     // Store the original document.createElement function
    //     const originalCreateElement = document.createElement.bind(document); // Bind to avoid recursion

    //     // Spy on document.createElement and handle only specific tags (canvas, img)
    //     spyOn(document, 'createElement').and.callFake((tag: string) => {
    //       if (tag === 'canvas') {
    //         return canvasMock;
    //       } else if (tag === 'img') {
    //         return document.createElement('img'); // Allow img elements to be created normally
    //       }
    //       // For all other tags, call the original createElement method
    //       return originalCreateElement(tag); // Use bound function to avoid recursion
    //     });

    //     spyOn(canvasMock, 'getContext').and.returnValue(ctxMock || null);
    //     spyOn(canvasMock, 'toDataURL').and.returnValue('data:image/png;base64,MOCK_BASE64_STRING');

    //     // Mocking the Image constructor correctly by using createElement
    //     const originalImage = window.Image;
    //     window.Image = function () {
    //       const img = document.createElement('img') as HTMLImageElement;
    //       setTimeout(() => img.onload && img.onload(new Event('load')), 0); // Simulate image load event
    //       return img;
    //     } as unknown as typeof Image;

    //     const result = await service.createCompositeImageAsBase64(mockGridArray);

    //     // Restore the original Image constructor
    //     window.Image = originalImage;

    //     // Expectations
    //     expect(result).toBe('data:image/png;base64,MOCK_BASE64_STRING');
    //     expect(canvasMock.width).toBe(144); // 1 column * tileSize (144)
    //     expect(canvasMock.height).toBe(288); // 2 rows * tileSize (144)
    //     expect(ctxMock.drawImage).toHaveBeenCalledTimes(2); // One image for each tile
    //   });

    // it('should reject if there is no 2D context', async () => {
    //     const mockGridArray = [[{ images: ['image1.png'], isOccuped: false }]];

    //     spyOn(document, 'createElement').and.returnValue({
    //         getContext: () => null,
    //     } as unknown as HTMLCanvasElement);

    //     try {
    //         await service.createCompositeImageAsBase64(mockGridArray);
    //         fail('Expected the promise to be rejected.');
    //     } catch (error) {
    //         expect(error).toBe('Failed to get 2D context');
    //     }
    // });

    it('should reject if an image fails to load', async () => {
        const mockGridArray = [[{ images: ['image1.png'] , isOccuped: false}]];

        // Mocking the Image constructor and triggering an error
        const originalImage = window.Image;
        window.Image = function () {
            const img = document.createElement('img') as HTMLImageElement;
            setTimeout(() => img.onerror && img.onerror(new Event('error')), 0); // Simulate image error event
            return img;
        } as unknown as typeof Image;

        try {
            await service.createCompositeImageAsBase64(mockGridArray);
            fail('Expected the promise to be rejected.');
        } catch (error) {
            expect(error).toEqual(jasmine.any(Error)); // Match error in catch block
        }

        // Restore the original Image constructor
        window.Image = originalImage;
    });
});
