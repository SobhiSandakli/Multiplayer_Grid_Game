// eslint-disable-next-line import/no-deprecated
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { GameFacadeService } from '@app/services/game-facade.service';
import { GameEditorPageComponent } from './game-editor-page.component';
// eslint-disable-next-line import/no-deprecated
import { RouterTestingModule } from '@angular/router/testing';
import { Game } from '@app/interfaces/game-model.interface';
import { AppMaterialModule } from '@app/modules/material.module';
import { of, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

class GameFacadeServiceMock {
    gameService = jasmine.createSpyObj('gameService', ['fetchGame', 'updateGame', 'createGame']);
    validateGameService = jasmine.createSpyObj('validateGameService', ['validateAll']);
    gridService = jasmine.createSpyObj('gridService', ['getGridTiles', 'setGrid', 'resetDefaultGrid']);
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
    queryParams = of({});
}

describe('GameEditorPageComponent', () => {
    let component: GameEditorPageComponent;
    let fixture: ComponentFixture<GameEditorPageComponent>;
    let gameFacadeServiceMock: GameFacadeServiceMock;
    let activatedRouteMock: ActivatedRouteMock;
    let routerSpy: jasmine.SpyObj<Router>;
    let snackBarMock: jasmine.SpyObj<MatSnackBar>;

    beforeEach(() => {
        gameFacadeServiceMock = new GameFacadeServiceMock();
        activatedRouteMock = new ActivatedRouteMock();
        snackBarMock = jasmine.createSpyObj('MatSnackBar', ['open']);

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
                { provide: MatSnackBar, useValue: snackBarMock },
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
        ]);
        gameFacadeServiceMock.imageService.createCompositeImageAsBase64.and.returnValue(Promise.resolve('data:image/png;base64,actualBase64string'));
        gameFacadeServiceMock.gameService.createGame.and.returnValue(of({}));
        gameFacadeServiceMock.validateGameService.validateAll.and.returnValue(true);

        spyOn(window, 'alert');
        component.gameName = 'Test Game';
        component.gameDescription = 'Test Description';
        component.onSave();
        tick();
        expect(gameFacadeServiceMock.validateGameService.validateAll).toHaveBeenCalled();
        expect(snackBarMock.open).toHaveBeenCalledWith('Le jeu a été enregistré avec succès.', 'OK', Object({ duration: 5000 }));

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
        expect(snackBarMock.open).toHaveBeenCalledWith('Le jeu a été mis à jour avec succès.', 'OK', Object({ duration: 5000 }));
        expect(gameFacadeServiceMock.gameService.updateGame).toHaveBeenCalledWith('123', jasmine.any(Object));
    }));

    it('should alert if name or description is missing', () => {
        component.gameName = '';
        component.gameDescription = '';
        component.onSave();
        expect(snackBarMock.open).toHaveBeenCalledWith('Veuillez remplir le nom et la description du jeu.', 'OK', Object({ duration: 5000 }));
    });

    // it('should alert if validation fails', () => {
    //     gameFacadeServiceMock.gridService.getGridTiles.and.returnValue([
    //         {
    //             images: ['path/to/image.png'],
    //             isOccuped: false,
    //         },
    //     ]);
    //     gameFacadeServiceMock.validateGameService.validateAll.and.returnValue(false);
    //     spyOn(window, 'alert');
    //     component.gameName = 'Test Game';
    //     component.gameDescription = 'Test Description';

    //     component.onSave();

    //     expect(gameFacadeServiceMock.validateGameService.validateAll).toHaveBeenCalled();
    //     expect(snackBarMock.open).toHaveBeenCalledWith('Échec de la validation du jeu', 'OK', Object({ duration: 5000 }));

    // });

    it('should handle image creation error', fakeAsync(() => {
        gameFacadeServiceMock.gridService.getGridTiles.and.returnValue([
            {
                images: ['path/to/image.png'],
                isOccuped: false,
            },
        ]);
        gameFacadeServiceMock.imageService.createCompositeImageAsBase64.and.returnValue(Promise.reject(new Error('Image creation error')));
        gameFacadeServiceMock.validateGameService.validateAll.and.returnValue(true);

        spyOn(window, 'alert');
        component.gameName = 'Test Game';
        component.gameDescription = 'Test Description';
        component.onSave();
        tick();
        expect(snackBarMock.open).toHaveBeenCalledWith("Erreur lors de la création de l'image composite", 'OK', Object({ duration: 5000 }));
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
        gameFacadeServiceMock.validateGameService.validateAll.and.returnValue(true);

        spyOn(window, 'alert');
        component.gameName = 'Test Game';
        component.gameDescription = 'Test Description';
        component.onSave();
        tick();
        expect(gameFacadeServiceMock.validateGameService.validateAll).toHaveBeenCalled();
        expect(snackBarMock.open).toHaveBeenCalledWith('Le jeu a été enregistré avec succès.', 'OK', Object({ duration: 5000 }));
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

    // it('should handle update game error', fakeAsync(() => {
    //     activatedRouteMock.snapshot.queryParamMap.get.and.returnValue('123');
    //     gameFacadeServiceMock.gridService.getGridTiles.and.returnValue([
    //         {
    //             images: ['path/to/image.png'],
    //             isOccuped: false,
    //         },
    //     ]);
    //     gameFacadeServiceMock.imageService.createCompositeImageAsBase64.and.returnValue(Promise.resolve('data:image/png;base64,actualBase64string'));
    //     gameFacadeServiceMock.gameService.updateGame.and.returnValue(throwError({ message: 'Update error' }));
    //     gameFacadeServiceMock.validateGameService.validateAll.and.returnValue(true);

    //     spyOn(window, 'alert');
    //     component.gameName = 'Test Game';
    //     component.gameDescription = 'Test Description';

    //     component.onSave();
    //     tick();
    //     expect(window.alert).toHaveBeenCalledWith("Échec de l'enregistrement du jeu: Update error");
    // }));

    // it('should handle create game error', fakeAsync(() => {
    //     gameFacadeServiceMock.gridService.getGridTiles.and.returnValue([
    //         {
    //             images: ['path/to/image.png'],
    //             isOccuped: false,
    //         },
    //     ]);
    //     gameFacadeServiceMock.imageService.createCompositeImageAsBase64.and.returnValue(Promise.resolve('data:image/png;base64,actualBase64string'));
    //     gameFacadeServiceMock.gameService.createGame.and.returnValue(throwError({ message: 'Create error' }));
    //     gameFacadeServiceMock.validateGameService.validateAll.and.returnValue(true);
    //     spyOn(window, 'alert');
    //     component.gameName = 'Test Game';
    //     component.gameDescription = 'Test Description';
    //     component.onSave();
    //     tick();
    //     expect(snackBarMock.open).toHaveBeenCalledWith("Échec de l'enregistrement du jeu: Create error", 'OK', Object({ duration: 5000 }));

    // }));

    it('should handle update game error with HTTP 500 status', fakeAsync(() => {
        activatedRouteMock.snapshot.queryParamMap.get.and.returnValue('123');
        gameFacadeServiceMock.gridService.getGridTiles.and.returnValue([
            {
                images: ['path/to/image.png'],
                isOccuped: false,
            },
        ]); // Example structure
        gameFacadeServiceMock.imageService.createCompositeImageAsBase64.and.returnValue(Promise.resolve('data:image/png;base64,actualBase64string'));
        gameFacadeServiceMock.gameService.updateGame.and.returnValue(throwError({ status: 500, message: 'Update error' }));
        gameFacadeServiceMock.validateGameService.validateAll.and.returnValue(true); // Mock validateAll to return true

        spyOn(window, 'alert');

        // Set the game name and description
        component.gameName = 'Test Game';
        component.gameDescription = 'Test Description';

        component.onSave();
        tick(); // Simulate time passing for promise resolution
        expect(snackBarMock.open).toHaveBeenCalledWith(
            'Un jeu avec le même nom est déjà enregistré, veuillez choisir un autre.',
            'OK',
            Object({ duration: 5000 }),
        );
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
        expect(snackBarMock.open).toHaveBeenCalledWith(
            'Un jeu avec le même nom est déjà enregistré, veuillez choisir un autre.',
            'OK',
            Object({ duration: 5000 }),
        );
    }));

    it('should reset the component when gameId is present', () => {
        const loadGameSpy = spyOn(component, 'loadGame');
        component.gameId = '123';

        component.reset();

        expect(loadGameSpy).toHaveBeenCalledWith('123');
    });
});
