import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { GameFacadeService } from './game-facade.service';
import { GameService } from '@app/services/game/game.service';
import { GridService } from '@app/services/grid/grid.service';
import { ImageService } from '@app/services/image/image.service';
import { ValidateGameService } from '@app/services/validate-game/validateGame.service';
import { Game } from '@app/interfaces/game-model.interface';

describe('GameFacadeService', () => {
    let service: GameFacadeService;
    let mockGameService: jasmine.SpyObj<GameService>;
    let mockGridService: jasmine.SpyObj<GridService>;
    let mockImageService: jasmine.SpyObj<ImageService>;
    let mockValidateGameService: jasmine.SpyObj<ValidateGameService>;

    beforeEach(() => {
        // Create mock services
        mockGameService = jasmine.createSpyObj('GameService', ['fetchGame', 'updateGame', 'createGame']);
        mockGridService = jasmine.createSpyObj('GridService', ['getGridTiles', 'setGrid', 'resetDefaultGrid']);
        mockImageService = jasmine.createSpyObj('ImageService', ['createCompositeImageAsBase64']);
        mockValidateGameService = jasmine.createSpyObj('ValidateGameService', ['validateAll']);

        // Provide the mocks in the TestBed
        TestBed.configureTestingModule({
            providers: [
                GameFacadeService,
                { provide: GameService, useValue: mockGameService },
                { provide: GridService, useValue: mockGridService },
                { provide: ImageService, useValue: mockImageService },
                { provide: ValidateGameService, useValue: mockValidateGameService },
            ],
        });

        // Inject the service
        service = TestBed.inject(GameFacadeService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should fetch a game and update the grid', (done) => {
        const game: Game = {
            _id: '123',
            name: 'Test Game',
            description: 'A test game description',
            size: '15x15',
            mode: 'Test Mode',
            date: new Date(),
            grid: [[{ images: [], isOccuped: false }]],
            image: '',
            visibility: false,
        };

        mockGameService.fetchGame.and.returnValue(of(game));

        service.fetchGame('123').subscribe(() => {
            expect(mockGridService.setGrid).toHaveBeenCalledWith(game.grid);
            done();
        });
    });

    it('should call updateGame on GameService when updateGame is called', (done) => {
        const partialGame: Partial<Game> = {
            _id: '123',
            grid: [[{ images: [], isOccuped: false }]],
        };

        mockGameService.updateGame.and.returnValue(of(void 0));

        service.updateGame('123', partialGame).subscribe(() => {
            expect(mockGameService.updateGame).toHaveBeenCalledWith('123', partialGame);
            done();
        });
    });

    it('should call createGame on GameService when createGame is called', (done) => {
        const newGame: Game = {
            _id: '123',
            name: 'Test Game',
            description: 'A test game description',
            size: '15x15',
            mode: 'Test Mode',
            date: new Date(),
            grid: [[{ images: [], isOccuped: false }]],
            image: '',
            visibility: false,
        };
        mockGameService.createGame.and.returnValue(of(void 0));

        service.createGame(newGame).subscribe(() => {
            expect(mockGameService.createGame).toHaveBeenCalledWith(newGame);
            done();
        });
    });

    it('should validate the entire grid', () => {
        const grid = [[{ images: ['image1'], isOccuped: true }]];
        service.validateAll(grid);
        expect(mockValidateGameService.validateAll).toHaveBeenCalledWith(grid);
    });

    it('should create a composite image from the grid', async () => {
        const grid = [[{ images: ['image1'], isOccuped: true }]];
        const base64Image = 'base64string';
        mockImageService.createCompositeImageAsBase64.and.returnValue(Promise.resolve(base64Image));

        const result = await service.createImage(grid);
        expect(result).toBe(base64Image);
        expect(mockImageService.createCompositeImageAsBase64).toHaveBeenCalledWith(grid);
    });

    it('should reset the grid to default', () => {
        service.resetDefaultGrid();
        expect(mockGridService.resetDefaultGrid).toHaveBeenCalled();
    });
});
