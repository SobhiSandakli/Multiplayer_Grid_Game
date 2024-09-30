import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';
import { RouterTestingModule } from '@angular/router/testing';
import { GameEditorPageComponent } from './game-editor-page.component';
import { GameFacadeService } from '@app/services/game-facade.service';
import { of, throwError } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { Game } from '@app/game.model';

describe('GameEditorPageComponent', () => {
    let component: GameEditorPageComponent;
    let fixture: ComponentFixture<GameEditorPageComponent>;
    let gameFacadeServiceMock: any;
    let activatedRouteMock: any;

    beforeEach(async () => {
        gameFacadeServiceMock = jasmine.createSpyObj('GameFacadeService', [
            'gameService', 'validateGameService', 'gridService', 'imageService'
        ]);
        gameFacadeServiceMock.gameService = jasmine.createSpyObj('gameService', ['fetchGame', 'updateGame', 'createGame']);
        gameFacadeServiceMock.gameService.fetchGame.and.returnValue(of({}));  // Mock fetchGame to return an observable
        gameFacadeServiceMock.gameService.updateGame.and.returnValue(of({})); // Mock updateGame to return an observable
        gameFacadeServiceMock.gameService.createGame.and.returnValue(of({})); // Mock createGame to return an observable
        gameFacadeServiceMock.validateGameService = jasmine.createSpyObj('validateGameService', ['validateAll']);
        gameFacadeServiceMock.gridService = jasmine.createSpyObj('gridService', ['getGridTiles', 'setGrid', 'resetGrid']);
        gameFacadeServiceMock.imageService = jasmine.createSpyObj('imageService', ['createCompositeImageAsBase64']);
    
        activatedRouteMock = {
            snapshot: {
                queryParamMap: {
                    get: jasmine.createSpy('get').and.returnValue(null)
                }
            },
            queryParams: of({}) // Initialize with an empty observable
        };
    
        await TestBed.configureTestingModule({
            imports: [
                HttpClientModule,
                RouterTestingModule.withRoutes([
                    { path: 'admin-page', component: GameEditorPageComponent }
                ]), // Provide a mock route configuration
                GameEditorPageComponent  // Now correctly placed in imports
            ],
            providers: [
                { provide: GameFacadeService, useValue: gameFacadeServiceMock },
                { provide: ActivatedRoute, useValue: activatedRouteMock },
                { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } }
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
        gameFacadeServiceMock.gridService.getGridTiles.and.returnValue([{
            images: ['path/to/image.png'],
            isOccuped: false
        }]); // Example structure
        gameFacadeServiceMock.imageService.createCompositeImageAsBase64.and.returnValue(Promise.resolve('data:image/png;base64,actualBase64string'));
        gameFacadeServiceMock.gameService.createGame.and.returnValue(of({}));
        gameFacadeServiceMock.validateGameService.validateAll.and.returnValue(true); // Mock validateAll to return true

        spyOn(window, 'alert');

        // Set the game name and description
        component.gameName = 'Test Game';
        component.gameDescription = 'Test Description';

        component.onSave();
        tick(); // Simulate time passing for promise resolution

        expect(gameFacadeServiceMock.validateGameService.validateAll).toHaveBeenCalled();
        expect(window.alert).toHaveBeenCalledWith('Le jeu a été enregistré avec succès.');
        expect(gameFacadeServiceMock.gameService.createGame).toHaveBeenCalled();
    }));

    it('should call updateGame on save if gameId is present', fakeAsync(() => {
        activatedRouteMock.snapshot.queryParamMap.get.and.returnValue('123');
        gameFacadeServiceMock.gridService.getGridTiles.and.returnValue([{
            images: ['path/to/image.png'],
            isOccuped: false
        }]); // Example structure
        gameFacadeServiceMock.imageService.createCompositeImageAsBase64.and.returnValue(Promise.resolve('data:image/png;base64,actualBase64string'));
        gameFacadeServiceMock.gameService.updateGame.and.returnValue(of({}));
        gameFacadeServiceMock.validateGameService.validateAll.and.returnValue(true); // Mock validateAll to return true

        spyOn(window, 'alert');

        // Set the game name and description
        component.gameName = 'Test Game';
        component.gameDescription = 'Test Description';

        component.onSave();
        tick(); // Simulate time passing for promise resolution

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
        gameFacadeServiceMock.gridService.getGridTiles.and.returnValue([{
            images: ['path/to/image.png'],
            isOccuped: false
        }]); // Example structure
        gameFacadeServiceMock.validateGameService.validateAll.and.returnValue(false); // Mock validateAll to return false

        spyOn(window, 'alert');

        // Set the game name and description
        component.gameName = 'Test Game';
        component.gameDescription = 'Test Description';

        component.onSave();

        expect(gameFacadeServiceMock.validateGameService.validateAll).toHaveBeenCalled();
        expect(window.alert).toHaveBeenCalledWith('Validation failed');
    });

    it('should handle image creation error', fakeAsync(() => {
        gameFacadeServiceMock.gridService.getGridTiles.and.returnValue([{
            images: ['path/to/image.png'],
            isOccuped: false
        }]); // Example structure
        gameFacadeServiceMock.imageService.createCompositeImageAsBase64.and.returnValue(Promise.reject(new Error('Image creation error')));
        gameFacadeServiceMock.validateGameService.validateAll.and.returnValue(true); // Mock validateAll to return true

        spyOn(window, 'alert');

        // Set the game name and description
        component.gameName = 'Test Game';
        component.gameDescription = 'Test Description';

        component.onSave();
        tick(); // Simulate time passing for promise resolution

        expect(window.alert).toHaveBeenCalledWith("Erreur lors de la création de l'image composite: Image creation error");
    }));

    it('should handle game creation error', fakeAsync(() => {
        gameFacadeServiceMock.gridService.getGridTiles.and.returnValue([{
            images: ['path/to/image.png'],
            isOccuped: false
        }]); // Example structure
        gameFacadeServiceMock.imageService.createCompositeImageAsBase64.and.returnValue(Promise.resolve('data:image/png;base64,actualBase64string'));
        gameFacadeServiceMock.gameService.createGame.and.returnValue(of({}));
        gameFacadeServiceMock.validateGameService.validateAll.and.returnValue(true); // Mock validateAll to return true

        spyOn(window, 'alert');

        // Set the game name and description
        component.gameName = 'Test Game';
        component.gameDescription = 'Test Description';

        component.onSave();
        tick(); // Simulate time passing for promise resolution

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
        // Mock the queryParams observable to return a gameId
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
            _id: '123'
        };
        gameFacadeServiceMock.gameService.fetchGame.and.returnValue(of(gameData));
    
        component.ngOnInit();
    
        expect(component.gameName).toEqual('Test Game');
        expect(component.gameDescription).toEqual('Test Description');
        expect(gameFacadeServiceMock.gridService.setGrid).toHaveBeenCalledWith(gameData.grid);
    });

    it('should handle update game error', fakeAsync(() => {
        activatedRouteMock.snapshot.queryParamMap.get.and.returnValue('123');
        gameFacadeServiceMock.gridService.getGridTiles.and.returnValue([{
            images: ['path/to/image.png'],
            isOccuped: false
        }]); // Example structure
        gameFacadeServiceMock.imageService.createCompositeImageAsBase64.and.returnValue(Promise.resolve('data:image/png;base64,actualBase64string'));
        gameFacadeServiceMock.gameService.updateGame.and.returnValue(throwError({ message: 'Update error' }));
        gameFacadeServiceMock.validateGameService.validateAll.and.returnValue(true); // Mock validateAll to return true

        spyOn(window, 'alert');

        // Set the game name and description
        component.gameName = 'Test Game';
        component.gameDescription = 'Test Description';

        component.onSave();
        tick(); // Simulate time passing for promise resolution

        expect(window.alert).toHaveBeenCalledWith('Échec de la mise à jour du jeu: Update error');
    }));
    
    it('should handle create game error', fakeAsync(() => {
        gameFacadeServiceMock.gridService.getGridTiles.and.returnValue([{
            images: ['path/to/image.png'],
            isOccuped: false
        }]); // Example structure
        gameFacadeServiceMock.imageService.createCompositeImageAsBase64.and.returnValue(Promise.resolve('data:image/png;base64,actualBase64string'));
        gameFacadeServiceMock.gameService.createGame.and.returnValue(throwError({ message: 'Create error' }));
        gameFacadeServiceMock.validateGameService.validateAll.and.returnValue(true); // Mock validateAll to return true

        spyOn(window, 'alert');

        // Set the game name and description
        component.gameName = 'Test Game';
        component.gameDescription = 'Test Description';

        component.onSave();
        tick(); // Simulate time passing for promise resolution

        expect(window.alert).toHaveBeenCalledWith("Échec de l'enregistrement du jeu: Create error");
    }));

    it('should reset the game editor', () => {
        // Mock the objectContainer component
        component.objectContainer = jasmine.createSpyObj('ObjectContainerComponent', ['reset']);
    
        // Call the reset method
        component.reset();
    
        // Check that the gridService.resetGrid method was called
        expect(gameFacadeServiceMock.gridService.resetGrid).toHaveBeenCalled();
    
        // Check that the objectContainer.reset method was called
        expect(component.objectContainer.reset).toHaveBeenCalled();
    
        // Check that the gameName and gameDescription properties are set to empty strings
        expect(component.gameName).toBe('');
        expect(component.gameDescription).toBe('');
    });
});