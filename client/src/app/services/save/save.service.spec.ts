import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { GameFacadeService } from '@app/services/game-facade/game-facade.service';
import { of, throwError } from 'rxjs';
import { DESCRIPTION_MAX_LENGTH, NAME_MAX_LENGTH } from 'src/constants/game-constants';
import { SaveService } from './save.service';

describe('SaveService', () => {
    let service: SaveService;
    let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
    let gameFacadeSpy: jasmine.SpyObj<GameFacadeService>;
    let routerSpy: jasmine.SpyObj<Router>;
    let routeMock: Partial<ActivatedRoute>;

    const gridArray = [[{ images: ['grass'], isOccuped: false }], [{ images: ['grass'], isOccuped: false }]];

    beforeEach(() => {
        snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
        gameFacadeSpy = jasmine.createSpyObj('GameFacadeService', ['validateAll', 'createImage', 'createGame', 'updateGame'], {
            gridTiles: gridArray,
        });
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);

        routeMock = {
            snapshot: {
                queryParamMap: {
                    get: jasmine.createSpy('get').and.returnValue(null),
                    has: () => true,
                    getAll: () => [],
                    keys: [],
                },
                url: [],
                params: {},
                queryParams: {},
                fragment: null,
                data: {},
                outlet: '',
                component: null,
                routeConfig: null,
                parent: null,
                firstChild: null,
                children: [],
                pathFromRoot: [],
                paramMap: {
                    get: jasmine.createSpy('get').and.returnValue(null),
                    has: () => false,
                    getAll: () => [],
                    keys: [],
                },
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                root: {} as any,
                title: 'Test title',
            },
        };

        TestBed.configureTestingModule({
            providers: [
                SaveService,
                { provide: MatSnackBar, useValue: snackBarSpy },
                { provide: GameFacadeService, useValue: gameFacadeSpy },
                { provide: Router, useValue: routerSpy },
                { provide: ActivatedRoute, useValue: routeMock },
            ],
        });

        service = TestBed.inject(SaveService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should call gameFacade.createGame when there is no gameId', async () => {
        gameFacadeSpy.validateAll.and.returnValue(true);
        gameFacadeSpy.createImage.and.returnValue(Promise.resolve('base64image'));
        gameFacadeSpy.createGame.and.returnValue(of<void>(undefined));

        service.onSave('Test Game', 'Test Description');

        await Promise.resolve();

        expect(gameFacadeSpy.createGame).toHaveBeenCalled();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/admin-page']);
    });

    it('should handle error during game creation', async () => {
        gameFacadeSpy.validateAll.and.returnValue(true);
        gameFacadeSpy.createImage.and.returnValue(Promise.resolve('base64image'));
        gameFacadeSpy.createGame.and.returnValue(throwError({ status: 500 }));

        service.onSave('Test Game', 'Test Description');

        await Promise.resolve();
        expect(snackBarSpy.open).toHaveBeenCalledWith('Un jeu avec le même nom est déjà enregistré.', 'OK', { duration: 5000 });
    });

    it('should call gameFacade.updateGame when gameId exists', async () => {
        (routeMock.snapshot?.queryParamMap.get as jasmine.Spy).and.returnValue('123');
        gameFacadeSpy.validateAll.and.returnValue(true);
        gameFacadeSpy.createImage.and.returnValue(Promise.resolve('base64image'));
        gameFacadeSpy.updateGame.and.returnValue(of<void>(undefined));

        service.onSave('Test Game', 'Test Description');

        await Promise.resolve();

        expect(gameFacadeSpy.updateGame).toHaveBeenCalled();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/admin-page']);
    });

    it('should handle error during game update', async () => {
        (routeMock.snapshot?.queryParamMap.get as jasmine.Spy).and.returnValue('123');
        gameFacadeSpy.validateAll.and.returnValue(true);
        gameFacadeSpy.createImage.and.returnValue(Promise.resolve('base64image'));
        gameFacadeSpy.updateGame.and.returnValue(throwError({ status: 500 }));

        service.onSave('Test Game', 'Test Description');

        await Promise.resolve();

        expect(snackBarSpy.open).toHaveBeenCalledWith('Un jeu avec le même nom est déjà enregistré.', 'OK', { duration: 5000 });
    });

    it('should show snack bar when game name exceeds max length', () => {
        const event = { target: { value: 'A'.repeat(NAME_MAX_LENGTH + 1) } } as unknown as Event;
        const result = service.onNameInput(event, 'A'.repeat(NAME_MAX_LENGTH + 1));

        expect(result.length).toBeGreaterThan(NAME_MAX_LENGTH);
        expect(snackBarSpy.open).toHaveBeenCalledWith('Le nom ne doit pas dépasser 30 caractères.', 'OK', { duration: 5000 });
    });

    it('should show snack bar when game description exceeds max length', () => {
        const event = { target: { value: 'A'.repeat(DESCRIPTION_MAX_LENGTH + 1) } } as unknown as Event;
        const result = service.onDescriptionInput(event, 'A'.repeat(DESCRIPTION_MAX_LENGTH + 1));

        expect(result.length).toBeGreaterThan(DESCRIPTION_MAX_LENGTH);
        expect(snackBarSpy.open).toHaveBeenCalledWith('La description ne doit pas dépasser 100 caractères.', 'OK', { duration: 5000 });
    });

    it('should show snack bar when game name or description is missing', () => {
        service.onSave('', 'Test Description');
        expect(snackBarSpy.open).toHaveBeenCalledWith('Veuillez remplir le nom et la description du jeu.', 'OK', { duration: 5000 });

        service.onSave('Test Game', '');
        expect(snackBarSpy.open).toHaveBeenCalledWith('Veuillez remplir le nom et la description du jeu.', 'OK', { duration: 5000 });
    });

    it('should handle successful image creation and saving game', async () => {
        gameFacadeSpy.validateAll.and.returnValue(true);
        gameFacadeSpy.createImage.and.returnValue(Promise.resolve('base64image'));
        gameFacadeSpy.createGame.and.returnValue(of<void>(undefined));

        service.onSave('Test Game', 'Test Description');

        await Promise.resolve();

        expect(gameFacadeSpy.createGame).toHaveBeenCalled();
        expect(snackBarSpy.open).toHaveBeenCalledWith('Le jeu a été enregistré avec succès.', 'OK', { duration: 5000 });
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/admin-page']);
    });
    it('should not proceed with saving if game name or description is missing', () => {
        service.onSave('', 'Test Description');
        expect(snackBarSpy.open).toHaveBeenCalledWith('Veuillez remplir le nom et la description du jeu.', 'OK', { duration: 5000 });

        service.onSave('Test Game', '');
        expect(snackBarSpy.open).toHaveBeenCalledWith('Veuillez remplir le nom et la description du jeu.', 'OK', { duration: 5000 });

        service.onSave('', '');
        expect(snackBarSpy.open).toHaveBeenCalledWith('Veuillez remplir le nom et la description du jeu.', 'OK', { duration: 5000 });
    });
    it('should create a game object and save it after image creation', async () => {
        gameFacadeSpy.createImage.and.returnValue(Promise.resolve('base64image'));
        gameFacadeSpy.createGame.and.returnValue(of<void>(undefined));

        service.handleImageCreation('Test Game', 'Test Description', gridArray);

        await Promise.resolve();

        expect(gameFacadeSpy.createGame).toHaveBeenCalled();
        expect(snackBarSpy.open).toHaveBeenCalledWith('Le jeu a été enregistré avec succès.', 'OK', { duration: 5000 });
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/admin-page']);
    });

    it('should show error when game name is already registered', async () => {
        gameFacadeSpy.validateAll.and.returnValue(true);
        gameFacadeSpy.createImage.and.returnValue(Promise.resolve('base64image'));
        gameFacadeSpy.createGame.and.returnValue(throwError({ status: 500 }));

        service.onSave('Test Game', 'Test Description');

        await Promise.resolve();

        expect(snackBarSpy.open).toHaveBeenCalledWith('Un jeu avec le même nom est déjà enregistré.', 'OK', { duration: 5000 });
    });
});
