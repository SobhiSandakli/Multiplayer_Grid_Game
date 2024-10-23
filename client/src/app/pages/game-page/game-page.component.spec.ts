import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Game } from '@app/interfaces/game-model.interface';
import { GameFacadeService } from '@app/services/game-facade/game-facade.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { of } from 'rxjs';
import { GamePageComponent } from './game-page.component';

describe('GamePageComponent', () => {
    let component: GamePageComponent;
    let fixture: ComponentFixture<GamePageComponent>;
    const mockRouter = { navigate: jasmine.createSpy('navigate') };
    const mockActivatedRoute = { queryParamMap: of({ get: () => 'testValue' }) };
    const mockGameFacadeService = {
        fetchGame: jasmine.createSpy('fetchGame').and.returnValue(
            of({
                name: 'Test Game',
                description: 'Test Description',
                size: 'Test Size',
            } as Game),
        ),
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [GamePageComponent],
            imports: [FontAwesomeModule],
            providers: [
                { provide: Router, useValue: mockRouter },
                { provide: ActivatedRoute, useValue: mockActivatedRoute },
                { provide: GameFacadeService, useValue: mockGameFacadeService },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(GamePageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should set showCreationPopup to true when openPopup is called', () => {
        component.openPopup();
        expect(component.showCreationPopup).toBe(true);
    });

    it('should set showCreationPopup to false when confirmAbandoned is called', () => {
        component.confirmAbandoned();
        expect(component.showCreationPopup).toBe(false);
    });

    it('should navigate to home when confirmAbandoned is called', () => {
        component.confirmAbandoned();
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/home']);
    });

    it('should toggle isExpanded when toggleExpand is called', () => {
        const initialExpandedState = component.isExpanded;
        component.toggleExpand();
        expect(component.isExpanded).toBe(!initialExpandedState);
    });

    it('should load game details when loadGame is called', () => {
        component.loadGame('testGameId');
        expect(mockGameFacadeService.fetchGame).toHaveBeenCalledWith('testGameId');
        expect(component.gameName).toBe('Test Game');
        expect(component.gameDescription).toBe('Test Description');
        expect(component.gameSize).toBe('Test Size');
    });

    it('should set sessionCode, playerName, and gameId from query params on init', () => {
        component.ngOnInit();
        expect(component.sessionCode).toBe('testValue');
        expect(component.playerName).toBe('testValue');
        expect(component.gameId).toBe('testValue');
    });

    it('should set putTimer to false when endTurn is called', () => {
        component.putTimer = true;
        component.endTurn();
        expect(component.putTimer).toBe(false);
    });

    it('should set showCreationPopup to false when cancelAbandoned is called', () => {
        component.showCreationPopup = true;
        component.cancelAbandoned();
        expect(component.showCreationPopup).toBe(false);
    });
});
