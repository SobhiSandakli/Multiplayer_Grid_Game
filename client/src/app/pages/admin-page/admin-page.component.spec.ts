import { ComponentFixture, TestBed } from '@angular/core/testing';
// eslint-disable-next-line import/no-deprecated
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { Game } from '@app/game.model';
import { LoggerService } from '@app/services/LoggerService';
import { of, throwError } from 'rxjs';
import { GameService } from 'src/app/services/game.service';
import { AdminPageComponent } from './admin-page.component';

describe('AdminPageComponent', () => {
    let component: AdminPageComponent;
    let fixture: ComponentFixture<AdminPageComponent>;
    let gameService: jasmine.SpyObj<GameService>;
    let loggerService: jasmine.SpyObj<LoggerService>;
    let router: Router;

    beforeEach(async () => {
        const gameServiceSpy = jasmine.createSpyObj('GameService', ['fetchAllGames', 'deleteGame', 'toggleVisibility', 'fetchGame']);
        const loggerServiceSpy = jasmine.createSpyObj('LoggerService', ['log', 'error']);

        await TestBed.configureTestingModule({
            declarations: [AdminPageComponent],
            imports: [
                // eslint-disable-next-line import/no-deprecated
                RouterTestingModule.withRoutes([]),
            ],
            providers: [
                { provide: GameService, useValue: gameServiceSpy },
                { provide: LoggerService, useValue: loggerServiceSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(AdminPageComponent);
        component = fixture.componentInstance;
        gameService = TestBed.inject(GameService) as jasmine.SpyObj<GameService>;
        loggerService = TestBed.inject(LoggerService) as jasmine.SpyObj<LoggerService>;
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

    it('should log error if loading games fails', () => {
        const error = 'Failed to load games';
        gameService.fetchAllGames.and.returnValue(throwError(error));

        component.loadGames();

        expect(gameService.fetchAllGames).toHaveBeenCalled();
        expect(loggerService.error).toHaveBeenCalledWith('Failed to fetch games: ' + error);
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
        expect(loggerService.log).toHaveBeenCalledWith('Game deleted successfully');
    });

    it('should log error if deleting game fails', () => {
        const gameId = '1';
        const error = 'Delete game failed';

        gameService.deleteGame.and.returnValue(throwError(error));

        component.deleteGame(gameId);

        expect(gameService.deleteGame).toHaveBeenCalledWith(gameId);
        expect(loggerService.error).toHaveBeenCalledWith('Failed to delete game:' + error);
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
        expect(loggerService.log).toHaveBeenCalledWith('Visibility updated for game 1: false');
    });

    it('should log error if toggling visibility fails', () => {
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
        const errorMessage = 'Toggle visibility failed';
        gameService.toggleVisibility.and.returnValue(throwError(errorMessage));
        component.toggleVisibility(game);
        expect(gameService.toggleVisibility).toHaveBeenCalledWith('1', false);
        expect(loggerService.error).toHaveBeenCalledWith(`Failed to update visibility for game 1: ${errorMessage}`);
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });
    describe('onDeleteConfirm', () => {
        it('should set showDeletePopup to false and call deleteGame with selectedGameId', () => {
            const gameId = '1';

            component.selectedGameId = gameId;
            spyOn(component, 'deleteGame');

            component.onDeleteConfirm();

            expect(component.showDeletePopup).toBeFalse();
            expect(component.deleteGame).toHaveBeenCalledWith(gameId);
        });
    });

    describe('onDeleteCancel', () => {
        it('should set showDeletePopup to false', () => {
            component.showDeletePopup = true;

            component.onDeleteCancel();

            expect(component.showDeletePopup).toBeFalse();
        });
    });

    describe('openDeletePopup', () => {
        it('should set showDeletePopup to true', () => {
            component.showDeletePopup = false;

            component.openDeletePopup();

            expect(component.showDeletePopup).toBeTrue();
        });
    });

    describe('downloadGame', () => {
        it('should download the game as a JSON file', () => {
            const mockGame: Game = {
                _id: '1',
                name: 'Test Game',
                size: '15x15',
                mode: 'CTF',
                description: 'A test game',
                image: 'test-image.jpg',
                date: new Date(),
                visibility: true,
                grid: [],
            };
            const linkSpy = spyOn(document, 'createElement').and.callThrough();
            const urlSpy = spyOn(window.URL, 'createObjectURL').and.callThrough();
            const clickSpy = spyOn(HTMLAnchorElement.prototype, 'click').and.callFake(() => {
                // This is intentionally left blank because we do not want to perform the default click action.
            });
            component.downloadGame(mockGame);
            expect(linkSpy).toHaveBeenCalledWith('a');
            const linkElement = linkSpy.calls.mostRecent().returnValue as HTMLAnchorElement;
            expect(linkElement.download).toBe(`${mockGame.name}.json`);
            expect(urlSpy).toHaveBeenCalled();
            expect(linkElement.href).toContain('blob:');
            expect(clickSpy).toHaveBeenCalled();
        });
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

        expect(router.navigate).toHaveBeenCalledWith(['/edit-page'], { queryParams: { gameId: mockGame._id } });
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
            spyOn(component, 'openDeletePopup');

            component.validateGameBeforeDelete(mockGame._id);

            expect(gameService.fetchGame).toHaveBeenCalledWith(mockGame._id);
            expect(component.openDeletePopup).toHaveBeenCalled();
        });

        it('should alert if the game does not exist', () => {
            gameService.fetchGame.and.returnValue(of(null as unknown as Game));
            spyOn(window, 'alert');

            component.validateGameBeforeDelete('1');

            expect(gameService.fetchGame).toHaveBeenCalledWith('1');
            expect(window.alert).toHaveBeenCalledWith('Ce jeu a déjà été supprimé.');
        });

        it('should set errorMessage if fetching the game fails', () => {
            const error = 'Error occurred';
            gameService.fetchGame.and.returnValue(throwError(error));

            component.validateGameBeforeDelete('1');

            expect(gameService.fetchGame).toHaveBeenCalledWith('1');
            expect(component.errorMessage).toBe('Une erreur est survenue lors de la vérification du jeu.');
        });
    });
});
