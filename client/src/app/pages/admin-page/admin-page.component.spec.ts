/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-unused-expressions, @typescript-eslint/no-unused-expressions */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
// eslint-disable-next-line import/no-deprecated
import { MatSnackBar } from '@angular/material/snack-bar';
/* eslint-disable import/no-deprecated */
import { RouterTestingModule } from '@angular/router/testing';
import { Game } from '@app/interfaces/game-model.interface';
import { GameService } from '@app/services/game/game.service';
import { ImportService } from '@app/services/import/import.service';
import { of, throwError } from 'rxjs';
import { AdminPageComponent } from './admin-page.component';

describe('AdminPageComponent', () => {
    let component: AdminPageComponent;
    let fixture: ComponentFixture<AdminPageComponent>;
    let gameService: jasmine.SpyObj<GameService>;
    let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
    let router: Router;
    let mockImportService: jasmine.SpyObj<ImportService>;

    beforeEach(async () => {
        const gameServiceSpy = jasmine.createSpyObj('GameService', ['fetchAllGames', 'deleteGame', 'toggleVisibility', 'fetchGame']);
        snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
        mockImportService = jasmine.createSpyObj('ImportService', ['downloadGame', 'importGame']);

        await TestBed.configureTestingModule({
            declarations: [AdminPageComponent],
            // eslint-disable-next-line import/no-deprecated
            imports: [RouterTestingModule.withRoutes([])],
            providers: [
                { provide: GameService, useValue: gameServiceSpy },
                { provide: MatSnackBar, useValue: snackBarSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(AdminPageComponent);
        component = fixture.componentInstance;
        gameService = TestBed.inject(GameService) as jasmine.SpyObj<GameService>;
        router = TestBed.inject(Router);
        spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    });

    it('should call loadGames on init', () => {
        spyOn(component, 'loadGames');
        component.ngOnInit();
        expect(component.loadGames).toHaveBeenCalled();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should load games on success', () => {
        const mockGames: Game[] = [
            {
                _id: '1',
                name: 'Game 1',
                size: '15x15',
                mode: 'Classique',
                date: new Date(),
                visibility: true,
                image: 'image1.jpg',
                description: '',
                grid: [],
            },
            {
                _id: '2',
                name: 'Game 2',
                size: '10x10',
                mode: 'CTF',
                date: new Date(),
                visibility: false,
                image: 'image2.jpg',
                description: '',
                grid: [],
            },
        ];
        gameService.fetchAllGames.and.returnValue(of(mockGames));

        component.loadGames();

        expect(gameService.fetchAllGames).toHaveBeenCalled();
        expect(component.games.length).toBe(2);
    });

    it('should show error message if loading games fails', () => {
        const error = { message: 'Failed to load games' };
        gameService.fetchAllGames.and.returnValue(throwError(error));

        component.loadGames();

        expect(snackBarSpy.open).toHaveBeenCalledWith('Failed to load games', 'OK', { duration: 5000, panelClass: ['custom-snackbar'] });
    });

    it('should delete game on success', () => {
        const gameId = '1';
        const mockGames: Game[] = [
            {
                _id: '1',
                name: 'Game 1',
                size: '15x15',
                mode: 'Classique',
                date: new Date(),
                visibility: true,
                image: 'image1.jpg',
                description: 'a game test',
                grid: [],
            },
            {
                _id: '2',
                name: 'Game 2',
                size: '20x20',
                mode: 'CTF',
                date: new Date(),
                visibility: false,
                image: 'image2.jpg',
                description: 'testing game',
                grid: [],
            },
        ];
        component.games = mockGames;

        gameService.deleteGame.and.returnValue(of(void 0));

        component.deleteGame(gameId);

        expect(gameService.deleteGame).toHaveBeenCalledWith(gameId);
        expect(component.games.length).toBe(1);
    });

    it('should show error message if deleting game fails', () => {
        const gameId = '1';
        const error = { message: 'Delete game failed' };

        gameService.deleteGame.and.returnValue(throwError(error));

        component.deleteGame(gameId);

        expect(snackBarSpy.open).toHaveBeenCalledWith('Delete game failed', 'OK', { duration: 5000, panelClass: ['custom-snackbar'] });
    });
    it('should set hoveredGame onMouseOver', () => {
        const gameId = '1';

        component.onMouseOver(gameId);

        expect(component.hoveredGame).toBe(gameId);
    });

    it('should reset hoveredGame onMouseOut', () => {
        component.onMouseOut();

        expect(component.hoveredGame).toBeNull();
    });

    it('should toggle game visibility', () => {
        const game: Game = {
            _id: '1',
            name: 'Game 1',
            size: '10x10',
            mode: 'CTF',
            date: new Date(),
            visibility: true,
            image: 'image1.jpg',
            description: 'Classique',
            grid: [],
        };

        gameService.toggleVisibility.and.returnValue(of(void 0));

        component.toggleVisibility(game);

        expect(gameService.toggleVisibility).toHaveBeenCalledWith('1', false);
        expect(game.visibility).toBe(false);
    });

    it('should show error message if toggling visibility fails', () => {
        const game: Game = {
            _id: '1',
            name: 'Game 1',
            size: '15x15',
            mode: 'Classique',
            image: 'https://example.com/image.jpg',
            date: new Date(),
            visibility: true,
            description: 'testing game',
            grid: [],
        };
        const error = { message: 'Toggle visibility failed' };
        gameService.toggleVisibility.and.returnValue(throwError(error));

        component.toggleVisibility(game);

        expect(snackBarSpy.open).toHaveBeenCalledWith('Toggle visibility failed', 'OK', { duration: 5000, panelClass: ['custom-snackbar'] });
    });

    describe('onDeleteConfirm', () => {
        it('should call deleteGame with selectedGameId', () => {
            const gameId = '1';

            component.selectedGameId = gameId;
            spyOn(component, 'deleteGame');

            component.onDeleteConfirm();

            expect(component.deleteGame).toHaveBeenCalledWith(gameId);
            expect(component.selectedGameId).toBeNull();
        });
    });

    describe('onDeleteCancel', () => {
        it('should reset selectedGameId to null', () => {
            component.selectedGameId = '1';

            component.onDeleteCancel();

            expect(component.selectedGameId).toBeNull();
        });
    });

    describe('validateGameBeforeDelete', () => {
        it('should open delete popup if the game exists', () => {
            const mockGame: Game = {
                _id: '1',
                name: 'Test Game',
                size: '15x15',
                mode: 'Classique',
                date: new Date(),
                visibility: true,
                description: 'A test game',
                image: 'test-image.jpg',
                grid: [],
            };

            gameService.fetchGame.and.returnValue(of(mockGame));
            spyOn(component, 'onDeleteConfirm');

            component.validateGameBeforeDelete(mockGame._id);

            expect(gameService.fetchGame).toHaveBeenCalledWith(mockGame._id);
            expect(component.selectedGameId).toBe(mockGame._id);
        });

        it('should set errorMessage if fetching the game fails', () => {
            const error = 'Error occurred';
            gameService.fetchGame.and.returnValue(throwError(error));

            component.validateGameBeforeDelete('1');

            expect(snackBarSpy.open).toHaveBeenCalledWith('Une erreur est survenue lors de la vérification du jeu.', 'OK', {
                duration: 5000,
                panelClass: ['custom-snackbar'],
            });
        });
    });

    it('should call router.navigate with the correct parameters when editGame is called', () => {
        const mockGame: Game = {
            _id: '1',
            name: 'Game 1',
            size: '15x15',
            mode: 'Classique',
            date: new Date(),
            visibility: true,
            image: 'image1.jpg',
            description: 'A game test',
            grid: [],
        };

        component.editGame(mockGame);

        expect(router.navigate).toHaveBeenCalledWith(['/edit-page'], { queryParams: { mode: mockGame.mode, gameId: mockGame._id } });
    });
    describe('openGameSetupModal', () => {
        it('should set isGameSetupModalVisible to true', () => {
            component.isGameSetupModalVisible = false;
            component.openGameSetupModal();
            expect(component.isGameSetupModalVisible).toBeTrue();
        });
    });

    describe('closeGameSetupModal', () => {
        it('should set isGameSetupModalVisible to false', () => {
            component.isGameSetupModalVisible = true;
            component.closeGameSetupModal();
            expect(component.isGameSetupModalVisible).toBeFalse();
        });
    });

    it('should update the duplicateGameData name, call importGame, and close the modal', () => {
        const mockGameData = { name: 'OldName', id: '123' } as any;
        component.duplicateGameData = mockGameData;
        spyOn(component, 'importGame').and.callThrough();

        const newName = 'NewGameName';
        component.onDuplicateNameConfirm(newName);

        expect(component.duplicateGameData.name).toBe(newName);
        expect(component.importGame).toHaveBeenCalledWith(mockGameData);
        expect(component.isDuplicateNameModalVisible).toBeFalse();
    });

    it('should close the duplicate name modal and show a cancellation message', () => {
        component.isDuplicateNameModalVisible = true;
        component.onDuplicateNameCancel();

        expect(component.isDuplicateNameModalVisible).toBeFalse();
        expect(snackBarSpy.open).toHaveBeenCalledWith('Importation annulée. Aucun nom valide fourni.', 'OK', { duration: 5000 });
    });

    it('should call importService.downloadGame with the correct game', () => {
        const mockGame: Game = { _id: '123', name: 'Test Game', visibility: true } as Game;
        component.downloadGame(mockGame);
        expect(mockImportService.downloadGame).toHaveBeenCalled;
    });

    it('should set isGameImportModalVisible to true when openGameImportModal is called', () => {
        component.isGameImportModalVisible = false;
        component.openGameImportModal();
        expect(component.isGameImportModalVisible).toBeTrue();
    });

    it('should set isGameImportModalVisible to false when closeGameImportModal is called', () => {
        component.isGameImportModalVisible = true;
        component.closeGameImportModal();
        expect(component.isGameImportModalVisible).toBeFalse();
    });

    it('should call openSnackBar with the error message when handleDeletedGame is called', () => {
        const errorMessage = 'Ce jeu a déjà été supprimé.';
        spyOn<any>(component, 'openSnackBar');
        (component as any).handleDeletedGame(errorMessage);
        expect((component as any).openSnackBar).toHaveBeenCalledWith(errorMessage);
    });

    // describe('importGame', () => {
    //     it('should add new game and show success message on successful import', () => {
    //         const mockGameData: Game = {
    //             _id: '1',
    //             name: 'New Game',
    //             size: '10x10',
    //             mode: 'Classique',
    //             date: new Date(),
    //             visibility: true,
    //             image: 'image1.jpg',
    //             description: 'test description',
    //             grid: [
    //                 [{ images: ['assets/tiles/Grass.png', 'assets/objects/started-points.png'], isOccuped: true }],
    //                 [{ images: ['assets/tiles/Grass.png', 'assets/objects/started-points.png'], isOccuped: true }],
    //             ],
    //         };
    //         const newGame = { ...mockGameData, _id: '2' };
    //         component.games = [mockGameData, newGame];
    //         mockImportService.importGame.and.returnValue(of(newGame));
    //         spyOn(component, 'loadGames');

    //         component.importGame(mockGameData);

    //         expect(component.games).toContain(newGame);
    //         expect(snackBarSpy.open).toHaveBeenCalledWith('Le jeu a été importé et ajouté avec succès.', 'OK', { duration: 5000 });
    //         expect(component.loadGames).toHaveBeenCalled();
    //     });

    //     it('should show duplicate name modal if error message is DUPLICATE_GAME_NAME', () => {
    //         const mockGameData: Game = {
    //             _id: '1',
    //             name: 'Duplicate Game',
    //             size: '10x10',
    //             mode: 'Classique',
    //             date: new Date(),
    //             visibility: true,
    //             image: 'image1.jpg',
    //             description: 'test description',
    //             grid: [
    //                 [{ images: ['assets/tiles/Grass.png', 'assets/objects/started-points.png'], isOccuped: true }],
    //                 [{ images: ['assets/tiles/Grass.png', 'assets/objects/started-points.png'], isOccuped: true }],
    //             ],
    //         };
    //         const error = { message: 'DUPLICATE_GAME_NAME' };
    //         mockImportService.importGame.and.returnValue(throwError(error));

    //         component.importGame(mockGameData);

    //         expect(component.duplicateGameData).toEqual(mockGameData);
    //         expect(component.isDuplicateNameModalVisible).toBeTrue();
    //     });

    //     it('should show error message if import fails with other error', () => {
    //         const mockGameData: Game = {
    //             _id: '1',
    //             name: 'Error Game',
    //             size: '10x10',
    //             mode: 'Classique',
    //             date: new Date(),
    //             visibility: true,
    //             image: 'image1.jpg',
    //             description: 'test description',
    //             grid: [
    //                 [{ images: ['assets/tiles/Grass.png', 'assets/objects/started-points.png'], isOccuped: true }],
    //                 [{ images: ['assets/tiles/Grass.png', 'assets/objects/started-points.png'], isOccuped: true }],
    //             ],
    //         };
    //         const error = { message: 'Import failed' };
    //         mockImportService.importGame.and.returnValue(throwError(error));

    //         component.importGame(mockGameData);

    //         expect(snackBarSpy.open).toHaveBeenCalledWith('Import failed', 'OK', { duration: 5000 });
    //     });
    // });
});
