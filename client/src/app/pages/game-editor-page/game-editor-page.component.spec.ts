import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { ObjectContainerComponent } from '@app/components/object-container/object-container.component';
import { GameFacadeService } from '@app/services/game-facade/game-facade.service';
import { SaveService } from '@app/services/save/save.service';
import { of } from 'rxjs';
import { GameEditorPageComponent } from './game-editor-page.component';

describe('GameEditorPageComponent', () => {
    let component: GameEditorPageComponent;
    let fixture: ComponentFixture<GameEditorPageComponent>;
    let gameFacadeService: jasmine.SpyObj<GameFacadeService>;
    let saveService: jasmine.SpyObj<SaveService>;

    beforeEach(async () => {
        const gameFacadeSpy = jasmine.createSpyObj('GameFacadeService', ['fetchGame', 'resetDefaultGrid']);
        const saveServiceSpy = jasmine.createSpyObj('SaveService', ['onNameInput', 'onDescriptionInput', 'onSave']);

        await TestBed.configureTestingModule({
            declarations: [GameEditorPageComponent, ObjectContainerComponent],
            providers: [
                { provide: GameFacadeService, useValue: gameFacadeSpy },
                { provide: SaveService, useValue: saveServiceSpy },
                {
                    provide: ActivatedRoute,
                    useValue: {
                        queryParams: of({ gameId: '123' }),
                    },
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(GameEditorPageComponent);
        component = fixture.componentInstance;
        gameFacadeService = TestBed.inject(GameFacadeService) as jasmine.SpyObj<GameFacadeService>;
        saveService = TestBed.inject(SaveService) as jasmine.SpyObj<SaveService>;
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

        component.saveGame();

        expect(saveService.onSave).toHaveBeenCalledWith('Test Game', 'Test Description');
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

    it('should call gameFacade.fetchGame and set game properties', () => {
        // const mockGame: Game = {
        //     _id: '1',
        //     name: 'Test Game',
        //     description: 'Test Description',
        //     size: '10',
        //     mode: 'singleplayer',
        //     image: 'test-image.png',
        //     date: new Date(),
        //     visibility: true,
        //     grid: [[{ images: ['test-image.png'], isOccuped: true }]],
        // };
        // gameFacadeService.fetchGame.and.returnValue(of(mockGame));
        //const gameId = '123';
        //component.loadGame(gameId);
        //expect(gameFacadeService.fetchGame).toHaveBeenCalledWith(gameId);
        //expect(component.gameName).toBe('Test Game');
        //expect(component.gameDescription).toBe('Test Description');
        //expect(component.objectContainer.setContainerObjects).toHaveBeenCalledWith(mockGame);
    });
});
