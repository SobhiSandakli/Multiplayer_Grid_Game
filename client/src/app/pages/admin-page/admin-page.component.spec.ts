import { of } from 'rxjs';
import { AdminPageComponent } from './admin-page.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameService } from '@app/services/game.service';
import { LoggerService } from '@app/services/LoggerService';
import { RouterTestingModule } from '@angular/router/testing';
import { By } from '@angular/platform-browser';

describe('AdminPageComponent', () => {
    let component: AdminPageComponent;
    let fixture: ComponentFixture<AdminPageComponent>;
    let gameService: jasmine.SpyObj<GameService>;
    let loggerService: jasmine.SpyObj<LoggerService>;

    beforeEach(async () => {
        const gameServiceSpy = jasmine.createSpyObj('GameService', ['fetchAllGames', 'deleteGame', 'createGame']);
        const loggerServiceSpy = jasmine.createSpyObj('LoggerService', ['log', 'error']);

        await TestBed.configureTestingModule({
            declarations: [AdminPageComponent],
            providers: [
                { provide: GameService, useValue: gameServiceSpy },
                { provide: LoggerService, useValue: loggerServiceSpy },
            ],
            imports: [RouterTestingModule],
        }).compileComponents();

        fixture = TestBed.createComponent(AdminPageComponent);
        component = fixture.componentInstance;
        gameService = TestBed.inject(GameService) as jasmine.SpyObj<GameService>;
        loggerService = TestBed.inject(LoggerService) as jasmine.SpyObj<LoggerService>;

        // Mocking fetchAllGames to return an Observable with mock data
        gameService.fetchAllGames.and.returnValue(
            of([
                { _id: '1', name: 'Game 1', size: '50MB', mode: 'Single Player', date: new Date(), visibility: true, image: 'image1.jpg' },
                { _id: '2', name: 'Game 2', size: '100MB', mode: 'Multiplayer', date: new Date(), visibility: false, image: 'image2.jpg' },
            ]),
        );
    });

    it('should fetch and display games on initialization', () => {
        const mockGames = [
            { _id: '1', name: 'Game 1', size: '50MB', mode: 'Single Player', date: new Date(), visibility: true, image: 'image1.jpg' },
            { _id: '2', name: 'Game 2', size: '100MB', mode: 'Multiplayer', date: new Date(), visibility: false, image: 'image2.jpg' },
        ];
        gameService.fetchAllGames.and.returnValue(of(mockGames)); // Ensure fetchAllGames returns an observable

        fixture.detectChanges(); // Triggers ngOnInit

        expect(gameService.fetchAllGames).toHaveBeenCalled();
        expect(component.games.length).toBe(2);
        const gameElements = fixture.debugElement.queryAll(By.css('.game-item'));
        expect(gameElements.length).toBe(2); // Ensure games are rendered
    });

    it('should call deleteGame on clicking Delete button', () => {
        const mockGame = { _id: '1', name: 'Game 1', size: '50MB', mode: 'Single Player', date: new Date(), visibility: true, image: 'image1.jpg' };
        component.games = [mockGame];
        gameService.deleteGame.and.returnValue(of(void 0)); // Ensure deleteGame returns Observable<void>

        fixture.detectChanges();
        const deleteButton = fixture.debugElement.query(By.css('.game-actions button:first-child')).nativeElement;
        deleteButton.click();

        expect(gameService.deleteGame).toHaveBeenCalledWith('1');
        expect(loggerService.log).toHaveBeenCalledWith('Game deleted successfully');
    });
});
