import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminPageComponent } from './admin-page.component';
import { GameService } from 'src/app/services/game.service';
import { LoggerService } from '@app/services/LoggerService';
import { of, throwError } from 'rxjs';
import { Game } from '@app/game.model';

describe('AdminPageComponent', () => {
    let component: AdminPageComponent;
    let fixture: ComponentFixture<AdminPageComponent>;
    let gameService: jasmine.SpyObj<GameService>;
    let loggerService: jasmine.SpyObj<LoggerService>;

    beforeEach(async () => {
        const gameServiceSpy = jasmine.createSpyObj('GameService', ['fetchAllGames', 'deleteGame', 'toggleVisibility']);
        const loggerServiceSpy = jasmine.createSpyObj('LoggerService', ['log', 'error']);

        await TestBed.configureTestingModule({
            declarations: [AdminPageComponent],
            providers: [
                { provide: GameService, useValue: gameServiceSpy },
                { provide: LoggerService, useValue: loggerServiceSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(AdminPageComponent);
        component = fixture.componentInstance;
        gameService = TestBed.inject(GameService) as jasmine.SpyObj<GameService>;
        loggerService = TestBed.inject(LoggerService) as jasmine.SpyObj<LoggerService>;
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
            { _id: '1', name: 'Game 1', size: '15x15', mode: 'Single Player', date: new Date(), visibility: true, image: 'image1.jpg' },
            { _id: '2', name: 'Game 2', size: '10x10', mode: 'Multiplayer', date: new Date(), visibility: false, image: 'image2.jpg' },
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
            { _id: '1', name: 'Game 1', size: '15x15', mode: 'Single Player', date: new Date(), visibility: true, image: 'image1.jpg' },
            { _id: '2', name: 'Game 2', size: '20x20', mode: 'Multiplayer', date: new Date(), visibility: false, image: 'image2.jpg' },
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
        const game: Game = { _id: '1', name: 'Game 1', size: '10x10', mode: 'Single Player', date: new Date(), visibility: true, image: 'image1.jpg' };

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
            mode: 'Survival',
            image: 'https://example.com/image.jpg',
            date: new Date(),
            visibility: true,
        };
        const errorMessage = 'Toggle visibility failed';
        gameService.toggleVisibility.and.returnValue(throwError(errorMessage));
        component.toggleVisibility(game);
        expect(gameService.toggleVisibility).toHaveBeenCalledWith('1', false);
        expect(loggerService.error).toHaveBeenCalledWith(`Failed to update visibility for game 1: ${errorMessage}`);
    });
});
