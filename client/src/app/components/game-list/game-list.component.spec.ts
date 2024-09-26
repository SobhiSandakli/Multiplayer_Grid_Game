import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { Game } from '@app/game.model';
import { GameService } from '@app/services/game.service';
import { GameListComponent } from './game-list.component';

describe('GameListComponent', () => {
    let component: GameListComponent;
    let fixture: ComponentFixture<GameListComponent>;
    let gameServiceSpy: jasmine.SpyObj<GameService>;

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
        gameServiceSpy = jasmine.createSpyObj('GameService', ['fetchAllGames']);

        await TestBed.configureTestingModule({
            imports: [GameListComponent],
            providers: [{ provide: GameService, useValue: gameServiceSpy }],
        }).compileComponents();

        fixture = TestBed.createComponent(GameListComponent);
        component = fixture.componentInstance;
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should fetch games on init', () => {
        // Arrange: Mock the game service to return mock games
        gameServiceSpy.fetchAllGames.and.returnValue(of(mockGames));

        // Act: Trigger ngOnInit
        fixture.detectChanges();

        // Assert: Check that the games are loaded correctly
        expect(component.games.length).toBe(2);
        expect(component.games).toEqual(mockGames);
        expect(gameServiceSpy.fetchAllGames).toHaveBeenCalled();
    });

    it('should select a game and emit gameSelected event', () => {
        // Arrange: Mock the game service to return mock games
        gameServiceSpy.fetchAllGames.and.returnValue(of(mockGames));
        fixture.detectChanges();

        // Spy on the output event emitter
        spyOn(component.gameSelected, 'emit');

        // Act: Select the first game
        const firstGame = mockGames[0];
        component.selectGame(firstGame);

        // Assert: Verify that the game is selected and the event is emitted
        expect(component.selectedGame).toEqual(firstGame);
        expect(component.gameSelected.emit).toHaveBeenCalledWith(firstGame);
    });

    it('should return true when the selected game is checked with isSelected()', () => {
        // Arrange: Mock the game service to return mock games
        gameServiceSpy.fetchAllGames.and.returnValue(of(mockGames));
        fixture.detectChanges();

        // Act: Select the first game
        const firstGame = mockGames[0];
        component.selectGame(firstGame);

        // Assert: Verify that isSelected returns true for the selected game
        expect(component.isSelected(firstGame)).toBeTrue();
    });

    it('should return false when a non-selected game is checked with isSelected()', () => {
        // Arrange: Mock the game service to return mock games
        gameServiceSpy.fetchAllGames.and.returnValue(of(mockGames));
        fixture.detectChanges();

        // Act: Select the first game
        const firstGame = mockGames[0];
        component.selectGame(firstGame);

        // Assert: Verify that isSelected returns false for the second game
        const secondGame = mockGames[1];
        expect(component.isSelected(secondGame)).toBeFalse();
    });
});
