import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CharacterCreationComponent } from '@app/components/character-creation/character-creation.component';
import { GameListComponent } from '@app/components/game-list/game-list.component';
import { Game } from '@app/game.model';
import { GameService } from '@app/services/game.service';
import { of, throwError } from 'rxjs';
import { CreatePageComponent } from './create-page.component';

describe('CreatePageComponent', () => {
    let component: CreatePageComponent;
    let fixture: ComponentFixture<CreatePageComponent>;
    let gameServiceSpy: jasmine.SpyObj<GameService>;
    let router: Router;

    const mockGames: Game[] = [
        {
            _id: '1',
            name: 'Game 1',
            size: 'Large',
            mode: 'Solo',
            image: 'image1.png',
            date: new Date(),
            visibility: true,
            description: '',
        },
        {
            _id: '2',
            name: 'Game 2',
            size: 'Small',
            mode: 'Multiplayer',
            image: 'image2.png',
            date: new Date(),
            visibility: false,
            description: '',
        },
    ];

    beforeEach(async () => {
        gameServiceSpy = jasmine.createSpyObj('GameService', ['fetchAllGames', 'fetchGame']);
        gameServiceSpy.fetchAllGames.and.returnValue(of(mockGames));

        await TestBed.configureTestingModule({
            imports: [CreatePageComponent, GameListComponent, CharacterCreationComponent, CommonModule, FormsModule],
            providers: [{ provide: GameService, useValue: gameServiceSpy }],
        }).compileComponents();

        router = TestBed.inject(Router);
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CreatePageComponent);
        component = fixture.componentInstance;
    });

    it('should create the CreatePageComponent', () => {
        expect(component).toBeTruthy();
    });

    it('should load games on initialization', () => {
        gameServiceSpy.fetchAllGames.and.returnValue(of(mockGames));
        fixture.detectChanges();
        expect(gameServiceSpy.fetchAllGames).toHaveBeenCalled();
        expect(component.games).toEqual(mockGames);
    });

    it('should handle error when fetching games', () => {
        const errorMessage = 'Error fetching games';
        spyOn(console, 'error');
        gameServiceSpy.fetchAllGames.and.returnValue(throwError(errorMessage));
        fixture.detectChanges();
        expect(gameServiceSpy.fetchAllGames).toHaveBeenCalled();
        expect(component.games).toEqual([]);
    });

    it('should set selectedGame when onGameSelected is called', () => {
        const game: Game = mockGames[0];
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

        component.selectedGame = mockGame;
        component.validateGameBeforeCreation();

        expect(gameServiceSpy.fetchGame).toHaveBeenCalledWith(mockGame._id);
        expect(component.showCharacterCreation).toBeTrue();
        expect(component.errorMessage).toBe('');
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

    it('should display error if an error occurs during game validation', () => {
        const mockGame = mockGames[0];
        gameServiceSpy.fetchGame.and.returnValue(throwError('Erreur serveur'));

        component.selectedGame = mockGame;
        component.validateGameBeforeCreation();

        expect(gameServiceSpy.fetchGame).toHaveBeenCalledWith(mockGame._id);
        expect(component.showCharacterCreation).toBeFalse();
        expect(component.errorMessage).toBe('Une erreur est survenue lors de la vérification du jeu.');
    });

    it('should not call fetchGame or show character creation form if no game is selected', () => {
        component.selectedGame = null;
        component.validateGameBeforeCreation();

        expect(gameServiceSpy.fetchGame).not.toHaveBeenCalled();
        expect(component.showCharacterCreation).toBeFalse();
    });

    it('should reset state when onBackToGameSelection is called', () => {
        component.selectedGame = mockGames[0];
        component.showCharacterCreation = true;
        component.onBackToGameSelection();
        expect(component.selectedGame).toBeNull();
        expect(component.showCharacterCreation).toBeFalse();
    });

    it('should navigate to /home when goHome is called', () => {
        spyOn(router, 'navigate');
        component.goHome();
        expect(router.navigate).toHaveBeenCalledWith(['/home']);
    });
});
