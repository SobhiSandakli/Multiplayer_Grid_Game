import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { Game } from '@app/interfaces/game-model.interface';
import { GameService } from '@app/services/game/game.service';
import { SocketService } from '@app/services/socket/socket.service';
import { of, throwError } from 'rxjs';
import { CreatePageComponent } from './create-page.component';
import { SessionSocket } from '@app/services/socket/sessionSocket.service';

const mockGames: Game[] = [
    {
        _id: '1',
        name: 'Game 1',
        size: '10x10',
        mode: 'Solo',
        image: 'image1.png',
        date: new Date(),
        visibility: true,
        description: 'Description for Game 1',
        grid: [],
    },
    {
        _id: '2',
        name: 'Game 2',
        size: '20x20',
        mode: 'Multiplayer',
        image: 'image2.png',
        date: new Date(),
        visibility: false,
        description: 'Description for Game 2',
        grid: [],
    },
];

describe('CreatePageComponent', () => {
    let component: CreatePageComponent;
    let fixture: ComponentFixture<CreatePageComponent>;
    let gameServiceSpy: jasmine.SpyObj<GameService>;
    let socketServiceSpy: jasmine.SpyObj<SessionSocket>;
    let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
    let routerSpy: jasmine.SpyObj<Router>;

    beforeEach(async () => {
        gameServiceSpy = jasmine.createSpyObj('GameService', ['fetchAllGames', 'fetchGame']);
        socketServiceSpy = jasmine.createSpyObj('SocketService', ['createNewSession']);
        snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);

        await TestBed.configureTestingModule({
            declarations: [CreatePageComponent],
            providers: [
                { provide: GameService, useValue: gameServiceSpy },
                { provide: SocketService, useValue: socketServiceSpy },
                { provide: MatSnackBar, useValue: snackBarSpy },
                { provide: Router, useValue: routerSpy },
                { provide: ActivatedRoute, useValue: { params: of({}) } },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(CreatePageComponent);
        component = fixture.componentInstance;
    });

    it('should create the CreatePageComponent', () => {
        expect(component).toBeTruthy();
    });

    it('should set selectedGame when onGameSelected is called', () => {
        const game = mockGames[0];
        component.onGameSelected(game);
        expect(component.selectedGame).toEqual(game);
    });

    it('should return true from enableValidation when a game is selected', () => {
        component.selectedGame = mockGames[0];
        expect(component.enableValidation()).toBeTrue();
    });

    it('should return false from enableValidation when no game is selected', () => {
        component.selectedGame = null;
        expect(component.enableValidation()).toBeFalse();
    });

    it('should set showCharacterCreation to true when validateGameBeforeCreation is called and a valid game is selected', () => {
        const mockGame = mockGames[0];
        gameServiceSpy.fetchGame.and.returnValue(of(mockGame));
        socketServiceSpy.createNewSession.and.returnValue(of({ sessionCode: 'ABC123' }));

        component.selectedGame = mockGame;
        component.validateGameBeforeCreation();

        expect(gameServiceSpy.fetchGame).toHaveBeenCalledWith(mockGame._id);
        expect(socketServiceSpy.createNewSession).toHaveBeenCalled();
        expect(component.showCharacterCreation).toBeTrue();
        expect(component.sessionCode).toBe('ABC123');
    });

    it('should not show character creation form and display error if the game is deleted or hidden', () => {
        const hiddenGame = { ...mockGames[1], visibility: false };
        gameServiceSpy.fetchGame.and.returnValue(of(hiddenGame));

        component.selectedGame = hiddenGame;
        component.validateGameBeforeCreation();

        expect(gameServiceSpy.fetchGame).toHaveBeenCalledWith(hiddenGame._id);
        expect(component.showCharacterCreation).toBeFalse();
        expect(component.errorMessage).toBe('Le jeu sélectionné a été supprimé ou caché. Veuillez en choisir un autre.');
    });

    it('should display an error if there is an error fetching the game', () => {
        gameServiceSpy.fetchGame.and.returnValue(throwError('Erreur serveur'));

        component.selectedGame = mockGames[0];
        component.validateGameBeforeCreation();

        expect(gameServiceSpy.fetchGame).toHaveBeenCalledWith(mockGames[0]._id);
        expect(component.showCharacterCreation).toBeFalse();
        expect(component.errorMessage).toBe('Une erreur est survenue lors de la vérification du jeu.');
    });

    it('should navigate to /home when goHome is called', () => {
        component.goHome();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
    });

    it('should reset state when onBackToGameSelection is called', () => {
        component.selectedGame = mockGames[0];
        component.showCharacterCreation = true;
        component.onBackToGameSelection();
        expect(component.selectedGame).toBeNull();
        expect(component.showCharacterCreation).toBeFalse();
    });

    it('should display an error message when session creation fails', () => {
        const mockGame = mockGames[0];
        gameServiceSpy.fetchGame.and.returnValue(of(mockGame));
        socketServiceSpy.createNewSession.and.returnValue(throwError('Erreur de session'));

        component.selectedGame = mockGame;
        component.validateGameBeforeCreation();

        expect(component.errorMessage).toBe('Une erreur est survenue lors de la création de la session.Erreur de session');
    });

    it('should unsubscribe from subscriptions on destroy', () => {
        const unsubscribeSpy = spyOn(component['subscriptions'], 'unsubscribe');
        component.ngOnDestroy();
        expect(unsubscribeSpy).toHaveBeenCalled();
    });
});
