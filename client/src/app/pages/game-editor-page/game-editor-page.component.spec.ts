// eslint-disable-next-line import/no-deprecated
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { GameFacadeService } from '@app/services/game-facade.service';
import { GameEditorPageComponent } from './game-editor-page.component';
import { ActivatedRoute, Router } from '@angular/router';
// eslint-disable-next-line import/no-deprecated
import { RouterTestingModule } from '@angular/router/testing';
import { Game } from '@app/interfaces/game-model.interface';
import { AppMaterialModule } from '@app/modules/material.module';
import { of, throwError } from 'rxjs';

class GameFacadeServiceMock {
    gameService = jasmine.createSpyObj('gameService', ['fetchGame', 'updateGame', 'createGame']);
    validateGameService = jasmine.createSpyObj('validateGameService', ['validateAll']);
    gridService = jasmine.createSpyObj('gridService', ['getGridTiles', 'setGrid', 'resetDefaultGrid']); // Update here
    imageService = jasmine.createSpyObj('imageService', ['createCompositeImageAsBase64']);

    constructor() {
        this.gameService.fetchGame.and.returnValue(of({}));
        this.gameService.updateGame.and.returnValue(of({}));
        this.gameService.createGame.and.returnValue(of({}));
    }
}

class ActivatedRouteMock {
    snapshot = {
        queryParamMap: {
            get: jasmine.createSpy('get').and.returnValue(null),
        },
    };
    queryParams = of({
        // Initialize with an empty observable
    });
}

describe('GameEditorPageComponent', () => {
    let component: GameEditorPageComponent;
    let fixture: ComponentFixture<GameEditorPageComponent>;
    let gameFacadeServiceMock: GameFacadeServiceMock;
    let activatedRouteMock: ActivatedRouteMock;
    let routerSpy: jasmine.SpyObj<Router>;

    beforeEach(() => {
        gameFacadeServiceMock = new GameFacadeServiceMock();
        activatedRouteMock = new ActivatedRouteMock();

        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        routerSpy.navigate.and.returnValue(Promise.resolve(true));

        TestBed.configureTestingModule({
            imports: [
                AppMaterialModule,
                // eslint-disable-next-line import/no-deprecated
                HttpClientTestingModule,
                // eslint-disable-next-line import/no-deprecated
                RouterTestingModule.withRoutes([{ path: 'admin-page' }]),
            ],
            declarations: [GameEditorPageComponent],
            providers: [
                { provide: GameFacadeService, useValue: gameFacadeServiceMock },
                { provide: ActivatedRoute, useValue: activatedRouteMock },
                { provide: Router, useValue: routerSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(GameEditorPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should set isNameExceeded to true if name exceeds maxLengthName', () => {
        const textarea = fixture.nativeElement.querySelector('#name') as HTMLTextAreaElement;
        textarea.value = 'a'.repeat(component.maxLengthName + 1);
        textarea.dispatchEvent(new Event('input'));

        fixture.detectChanges();

        expect(component.isNameExceeded).toBeTrue();
    });

    it('should set isNameExceeded to false if name does not exceed maxLengthName', () => {
        const textarea = fixture.nativeElement.querySelector('#name') as HTMLTextAreaElement;
        textarea.value = 'a'.repeat(component.maxLengthName - 1);
        textarea.dispatchEvent(new Event('input'));

        fixture.detectChanges();

        expect(component.isNameExceeded).toBeFalse();
    });

    it('should set isDescriptionExceeded to true if description exceeds maxLengthDescription', () => {
        const textarea = fixture.nativeElement.querySelector('#description') as HTMLTextAreaElement;
        textarea.value = 'a'.repeat(component.maxLengthDescription + 1);
        textarea.dispatchEvent(new Event('input'));

        fixture.detectChanges();

        expect(component.isDescriptionExceeded).toBeTrue();
    });

    it('should set isDescriptionExceeded to false if description does not exceed maxLengthDescription', () => {
        const textarea = fixture.nativeElement.querySelector('#description') as HTMLTextAreaElement;
        textarea.value = 'a'.repeat(component.maxLengthDescription - 1);
        textarea.dispatchEvent(new Event('input'));

        fixture.detectChanges();

        expect(component.isDescriptionExceeded).toBeFalse();
    });

    it('should call createGame on save', fakeAsync(() => {
        gameFacadeServiceMock.gridService.getGridTiles.and.returnValue([
            {
                images: ['path/to/image.png'],
                isOccuped: false,
            },
        ]); // Example structure
        gameFacadeServiceMock.imageService.createCompositeImageAsBase64.and.returnValue(Promise.resolve('data:image/png;base64,actualBase64string'));
        gameFacadeServiceMock.gameService.createGame.and.returnValue(of({}));
        gameFacadeServiceMock.validateGameService.validateAll.and.returnValue(true); // Mock validateAll to return true

        spyOn(window, 'alert');
        component.gameName = 'Test Game';
        component.gameDescription = 'Test Description';
        component.onSave();
        tick();
        expect(gameFacadeServiceMock.validateGameService.validateAll).toHaveBeenCalled();
        expect(window.alert).toHaveBeenCalledWith('Le jeu a été enregistré avec succès.');
        expect(gameFacadeServiceMock.gameService.createGame).toHaveBeenCalled();
    }));

    it('should call updateGame on save if gameId is present', fakeAsync(() => {
        activatedRouteMock.snapshot.queryParamMap.get.and.returnValue('123');
        gameFacadeServiceMock.gridService.getGridTiles.and.returnValue([
            {
                images: ['path/to/image.png'],
                isOccuped: false,
            },
        ]);
        gameFacadeServiceMock.imageService.createCompositeImageAsBase64.and.returnValue(Promise.resolve('data:image/png;base64,actualBase64string'));
        gameFacadeServiceMock.gameService.updateGame.and.returnValue(of({}));
        gameFacadeServiceMock.validateGameService.validateAll.and.returnValue(true);
        spyOn(window, 'alert');
        component.gameName = 'Test Game';
        component.gameDescription = 'Test Description';
        component.onSave();
        tick();
        expect(gameFacadeServiceMock.validateGameService.validateAll).toHaveBeenCalled();
        expect(window.alert).toHaveBeenCalledWith('Le jeu a été mis à jour avec succès.');
        expect(gameFacadeServiceMock.gameService.updateGame).toHaveBeenCalledWith('123', jasmine.any(Object));
    }));

    it('should alert if name or description is missing', () => {
        spyOn(window, 'alert');
        component.gameName = '';
        component.gameDescription = '';
        component.onSave();
        expect(window.alert).toHaveBeenCalledWith('Veuillez remplir le nom et la description du jeu.');
    });

    it('should alert if validation fails', () => {
        gameFacadeServiceMock.gridService.getGridTiles.and.returnValue([
            {
                images: ['path/to/image.png'],
                isOccuped: false,
            },
        ]);
        gameFacadeServiceMock.validateGameService.validateAll.and.returnValue(false);
        spyOn(window, 'alert');
        component.gameName = 'Test Game';
        component.gameDescription = 'Test Description';

        component.onSave();

        expect(gameFacadeServiceMock.validateGameService.validateAll).toHaveBeenCalled();
        expect(window.alert).toHaveBeenCalledWith('Échec de la validation du jeu');
    });

    it('should handle image creation error', fakeAsync(() => {
        gameFacadeServiceMock.gridService.getGridTiles.and.returnValue([
            {
                images: ['path/to/image.png'],
                isOccuped: false,
            },
        ]);
        gameFacadeServiceMock.imageService.createCompositeImageAsBase64.and.returnValue(Promise.reject(new Error('Image creation error')));
        gameFacadeServiceMock.validateGameService.validateAll.and.returnValue(true); // Mock validateAll to return true

        spyOn(window, 'alert');
        component.gameName = 'Test Game';
        component.gameDescription = 'Test Description';
        component.onSave();
        tick();
        expect(window.alert).toHaveBeenCalledWith("Erreur lors de la création de l'image composite: Image creation error");
    }));

    it('should handle game creation error', fakeAsync(() => {
        gameFacadeServiceMock.gridService.getGridTiles.and.returnValue([
            {
                images: ['path/to/image.png'],
                isOccuped: false,
            },
        ]);
        gameFacadeServiceMock.imageService.createCompositeImageAsBase64.and.returnValue(Promise.resolve('data:image/png;base64,actualBase64string'));
        gameFacadeServiceMock.gameService.createGame.and.returnValue(of({}));
        gameFacadeServiceMock.validateGameService.validateAll.and.returnValue(true); // Mock validateAll to return true

        spyOn(window, 'alert');
        component.gameName = 'Test Game';
        component.gameDescription = 'Test Description';
        component.onSave();
        tick();
        expect(gameFacadeServiceMock.validateGameService.validateAll).toHaveBeenCalled();
        expect(window.alert).toHaveBeenCalledWith('Le jeu a été enregistré avec succès.');
        expect(gameFacadeServiceMock.gameService.createGame).toHaveBeenCalled();
    }));

    it('should call reset on confirmReset', () => {
        spyOn(component, 'reset');
        component.confirmReset();
        expect(component.showCreationPopup).toBeFalse();
        expect(component.reset).toHaveBeenCalled();
    });

    it('should set showCreationPopup to false on cancelReset', () => {
        component.cancelReset();
        expect(component.showCreationPopup).toBeFalse();
    });

    it('should set showCreationPopup to true on openPopup', () => {
        component.openPopup();
        expect(component.showCreationPopup).toBeTrue();
    });

    it('should load game on init if gameId is present', () => {
        activatedRouteMock.queryParams = of({ gameId: '123' });
        const gameData: Game = {
            name: 'Test Game',
            description: 'Test Description',
            size: '10x10',
            mode: 'Classique',
            image: 'data:image/png;base64,actualBase64string',
            date: new Date(),
            visibility: false,
            grid: [[{ images: ['path/to/image.png'], isOccuped: false }]],
            _id: '123',
        };
        gameFacadeServiceMock.gameService.fetchGame.and.returnValue(of(gameData));
        component.ngOnInit();
        expect(component.gameName).toEqual('Test Game');
        expect(component.gameDescription).toEqual('Test Description');
        expect(gameFacadeServiceMock.gridService.setGrid).toHaveBeenCalledWith(gameData.grid);
    });

    it('should handle update game error', fakeAsync(() => {
        activatedRouteMock.snapshot.queryParamMap.get.and.returnValue('123');
        gameFacadeServiceMock.gridService.getGridTiles.and.returnValue([
            {
                images: ['path/to/image.png'],
                isOccuped: false,
            },
        ]);
        gameFacadeServiceMock.imageService.createCompositeImageAsBase64.and.returnValue(Promise.resolve('data:image/png;base64,actualBase64string'));
        gameFacadeServiceMock.gameService.updateGame.and.returnValue(throwError({ message: 'Update error' }));
        gameFacadeServiceMock.validateGameService.validateAll.and.returnValue(true); // Mock validateAll to return true

        spyOn(window, 'alert');
        component.gameName = 'Test Game';
        component.gameDescription = 'Test Description';

        component.onSave();
        tick();
        expect(window.alert).toHaveBeenCalledWith('Échec de la mise à jour du jeu: Update error');
    }));

    it('should handle create game error', fakeAsync(() => {
        gameFacadeServiceMock.gridService.getGridTiles.and.returnValue([
            {
                images: ['path/to/image.png'],
                isOccuped: false,
            },
        ]);
        gameFacadeServiceMock.imageService.createCompositeImageAsBase64.and.returnValue(Promise.resolve('data:image/png;base64,actualBase64string'));
        gameFacadeServiceMock.gameService.createGame.and.returnValue(throwError({ message: 'Create error' }));
        gameFacadeServiceMock.validateGameService.validateAll.and.returnValue(true); // Mock validateAll to return true
        spyOn(window, 'alert');
        component.gameName = 'Test Game';
        component.gameDescription = 'Test Description';
        component.onSave();
        tick();
        expect(window.alert).toHaveBeenCalledWith("Échec de l'enregistrement du jeu: Create error");
    }));

    it('should handle create game error with HTTP 500 status', fakeAsync(() => {
        gameFacadeServiceMock.gridService.getGridTiles.and.returnValue([
            {
                images: ['path/to/image.png'],
                isOccuped: false,
            },
        ]);
        gameFacadeServiceMock.imageService.createCompositeImageAsBase64.and.returnValue(Promise.resolve('data:image/png;base64,actualBase64string'));
        gameFacadeServiceMock.gameService.createGame.and.returnValue(throwError({ status: 500, message: 'Create error' }));
        gameFacadeServiceMock.validateGameService.validateAll.and.returnValue(true);
        spyOn(window, 'alert');
        component.gameName = 'Test Game';
        component.gameDescription = 'Test Description';
        component.onSave();
        tick();
        expect(window.alert).toHaveBeenCalledWith('Un jeu avec le même nom est déjà enregistré, veuillez choisir un autre.');
    }));

    it('should reset the game editor', () => {
        // Mock the objectContainer component
        component.objectContainer = jasmine.createSpyObj('ObjectContainerComponent', ['resetDefault']);

        // Case 1: When gameId is present
        spyOn(component, 'loadGame');
        component.gameId = '1234'; // Simulate a valid gameId
        component.reset();
        expect(component.loadGame).toHaveBeenCalledWith('1234'); // It should reload the game
        expect(gameFacadeServiceMock.gridService.resetDefaultGrid).not.toHaveBeenCalled();
        expect(component.objectContainer.resetDefault).not.toHaveBeenCalled();

        // Case 2: When gameId is not present
        component.gameId = ''; // No gameId
        component.reset();
        expect(gameFacadeServiceMock.gridService.resetDefaultGrid).toHaveBeenCalled(); // Should reset the grid
        expect(component.objectContainer.resetDefault).toHaveBeenCalled(); // Should reset the object container
        expect(component.gameName).toBe(''); // gameName should be reset to empty
        expect(component.gameDescription).toBe(''); // gameDescription should be reset to empty
    });
});
