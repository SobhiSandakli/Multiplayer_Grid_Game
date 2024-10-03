import { TestBed } from '@angular/core/testing';
import { GameFacadeService } from './game-facade.service';
import { GameService } from './game.service';
import { ValidateGameService } from './validateGame.service';
import { GridService } from './grid.service';
import { ImageService } from './image.service';

describe('GameFacadeService', () => {
    let service: GameFacadeService;
    let gameService: GameService;
    let validateGameService: ValidateGameService;
    let gridService: GridService;
    let imageService: ImageService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                GameFacadeService,
                { provide: GameService, useValue: jasmine.createSpyObj('GameService', ['fetchGame', 'updateGame', 'createGame']) },
                { provide: ValidateGameService, useValue: jasmine.createSpyObj('ValidateGameService', ['validateAll']) },
                { provide: GridService, useValue: jasmine.createSpyObj('GridService', ['getGridTiles', 'setGrid', 'resetGrid']) },
                { provide: ImageService, useValue: jasmine.createSpyObj('ImageService', ['createCompositeImageAsBase64']) },
            ],
        });

        service = TestBed.inject(GameFacadeService);
        gameService = TestBed.inject(GameService);
        validateGameService = TestBed.inject(ValidateGameService);
        gridService = TestBed.inject(GridService);
        imageService = TestBed.inject(ImageService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should inject GameService', () => {
        expect(service.gameService).toBe(gameService);
    });

    it('should inject ValidateGameService', () => {
        expect(service.validateGameService).toBe(validateGameService);
    });

    it('should inject GridService', () => {
        expect(service.gridService).toBe(gridService);
    });

    it('should inject ImageService', () => {
        expect(service.imageService).toBe(imageService);
    });
});
