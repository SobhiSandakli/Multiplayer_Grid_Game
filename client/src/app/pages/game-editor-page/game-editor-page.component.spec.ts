/* eslint-disable import/no-deprecated */
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { ObjectContainerComponent } from '@app/components/object-container/object-container.component';
import { Game } from '@app/interfaces/game-model.interface';
import { GameFacadeService } from '@app/services/game-facade/game-facade.service';
import { GameService } from '@app/services/game/game.service';
import { SaveService } from '@app/services/save/save.service';
import { of, throwError } from 'rxjs';
import { GameEditorPageComponent } from './game-editor-page.component';

describe('GameEditorPageComponent', () => {
    let component: GameEditorPageComponent;
    let fixture: ComponentFixture<GameEditorPageComponent>;
    let gameFacadeService: jasmine.SpyObj<GameFacadeService>;
    let saveService: jasmine.SpyObj<SaveService>;
    let gameService: jasmine.SpyObj<GameService>;

    beforeEach(async () => {
        const gameFacadeSpy = jasmine.createSpyObj('GameFacadeService', ['fetchGame', 'resetDefaultGrid']);
        const saveServiceSpy = jasmine.createSpyObj('SaveService', ['onNameInput', 'onDescriptionInput', 'onSave']);
        const gameServiceSpy = jasmine.createSpyObj('GameService', ['fetchAllGames']);
        await TestBed.configureTestingModule({
            declarations: [GameEditorPageComponent, ObjectContainerComponent],
            imports: [HttpClientTestingModule],
            providers: [
                { provide: GameFacadeService, useValue: gameFacadeSpy },
                { provide: SaveService, useValue: saveServiceSpy },
                {
                    provide: ActivatedRoute,
                    useValue: {
                        queryParams: of({ gameId: '123' }),
                    },
                },
                { provide: GameService, useValue: gameServiceSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(GameEditorPageComponent);
        component = fixture.componentInstance;
        gameFacadeService = TestBed.inject(GameFacadeService) as jasmine.SpyObj<GameFacadeService>;
        saveService = TestBed.inject(SaveService) as jasmine.SpyObj<SaveService>;
        gameService = TestBed.inject(GameService) as jasmine.SpyObj<GameService>;
        fixture.detectChanges();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should reset game name and description if gameId is not set', () => {
        component.gameId = '';
        component.objectContainer = jasmine.createSpyObj('ObjectContainerComponent', ['resetDefaultContainer']);

        component.reset();

        expect(component.gameName).toBe('');
        expect(component.gameDescription).toBe('');
        expect(gameFacadeService.resetDefaultGrid).toHaveBeenCalled();
        expect(component.objectContainer.resetDefaultContainer).toHaveBeenCalled();
    });

    it('should load game if gameId is set when reset is called', () => {
        const gameId = '123';
        component.gameId = gameId;
        spyOn(component, 'loadGame');

        component.reset();

        expect(component.loadGame).toHaveBeenCalledWith(gameId);
    });

    it('should call loadGame with the correct gameId on ngOnInit', () => {
        spyOn(component, 'loadGame');
        component.ngOnInit();
        expect(component.loadGame).toHaveBeenCalledWith('123');
    });

    it('should set showCreationPopup to true when openPopup is called', () => {
        component.openPopup();
        expect(component.showCreationPopup).toBeTrue();
    });

    it('should call saveService.onNameInput when onNameInput is called', () => {
        const event = new Event('input');
        component.gameName = 'Test Game';

        component.onNameInput(event);

        expect(saveService.onNameInput).toHaveBeenCalledWith(event, 'Test Game');
    });

    it('should call saveService.onDescriptionInput when onDescriptionInput is called', () => {
        const event = new Event('input');
        component.gameDescription = 'Test Description';

        component.onDescriptionInput(event);

        expect(saveService.onDescriptionInput).toHaveBeenCalledWith(event, 'Test Description');
    });

    it('should call saveService.onSave when saveGame is called', () => {
        component.gameName = 'Test Game';
        component.gameDescription = 'Test Description';
        component.gameMode = 'Test Mode';

        component.saveGame();

        expect(saveService.onSave).toHaveBeenCalledWith('Test Mode', 'Test Game', 'Test Description');
    });

    it('should set showCreationPopup to false and call reset when confirmReset is called', () => {
        spyOn(component, 'reset');

        component.confirmReset();

        expect(component.showCreationPopup).toBeFalse();
        expect(component.reset).toHaveBeenCalled();
    });

    it('should set showCreationPopup to false when cancelReset is called', () => {
        component.cancelReset();
        expect(component.showCreationPopup).toBeFalse();
    });
    it('should load games and set the games property on success', () => {
        const mockGames: Game[] = [
            {
                _id: '1',
                name: 'Game 1',
                description: 'Description 1',
                size: '10x10',
                mode: 'single-player',
                image: 'game1.png',
                date: new Date(),
                visibility: true,
                grid: [
                    [
                        { images: ['grass'], isOccuped: false },
                        { images: ['water'], isOccuped: true },
                    ],
                    [
                        { images: ['grass'], isOccuped: false },
                        { images: ['wall'], isOccuped: true },
                    ],
                ],
            },
            {
                _id: '2',
                name: 'Game 2',
                description: 'Description 2',
                size: '15x15',
                mode: 'multi-player',
                image: 'game2.png',
                date: new Date(),
                visibility: false,
                grid: [
                    [
                        { images: ['sand'], isOccuped: false },
                        { images: ['rock'], isOccuped: true },
                    ],
                    [
                        { images: ['grass'], isOccuped: false },
                        { images: ['lava'], isOccuped: true },
                    ],
                ],
            },
        ];
        gameService.fetchAllGames.and.returnValue(of(mockGames));

        component.loadGames();

        expect(gameService.fetchAllGames).toHaveBeenCalled();
        expect(component.games).toEqual(mockGames);
    });

    it('should handle error and display a snack bar message on failure', () => {
        const error = new Error('Fetch failed');
        gameService.fetchAllGames.and.returnValue(throwError(() => error));
        spyOn(component as any, 'handleError'); 

        component.loadGames();

        expect(gameService.fetchAllGames).toHaveBeenCalled();
        expect(component['handleError']).toHaveBeenCalledWith(error, 'Failed to fetch games');
    });
    it('should call openSnackBar with the correct parameters when handleError is triggered', () => {
        const snackBarSpy = spyOn(component['snackBar'], 'open');
        const errorMessage = 'Test message';
    
        (component as any).handleError(new Error(errorMessage), 'Fallback message');
    
        expect(snackBarSpy).toHaveBeenCalledWith(errorMessage, 'OK', {
            duration: 5000,
            panelClass: ['custom-snackbar'],
        });
    });
    it('should load game and set properties when loadGame is called', () => {
        const mockGame: Game = {
            _id: '123',
            name: 'Test Game',
            description: 'Test Description',
            size: '10x10',
            mode: 'single-player',
            image: 'test-image.png',
            date: new Date(),
            visibility: true,
            grid: [
                [
                    { images: ['grass'], isOccuped: false },
                    { images: ['water'], isOccuped: true },
                ],
                [
                    { images: ['sand'], isOccuped: false },
                    { images: ['rock'], isOccuped: true },
                ],
            ],
        };
        gameFacadeService.fetchGame.and.returnValue(of(mockGame));
        const objectContainerSpy = spyOn(component.objectContainer, 'setContainerObjects');
        component.loadGame('123');
        expect(gameFacadeService.fetchGame).toHaveBeenCalledWith('123');
        expect(component.gameName).toBe(mockGame.name);
        expect(component.gameDescription).toBe(mockGame.description);
        expect(objectContainerSpy).toHaveBeenCalledWith(mockGame);
    });
});
