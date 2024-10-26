import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { GamePageComponent } from './game-page.component';
import { SessionService } from '@app/services/session/session.service';
import { SocketService } from '@app/services/socket/socket.service';

describe('GamePageComponent', () => {
    let component: GamePageComponent;
    let fixture: ComponentFixture<GamePageComponent>;
    const mockRouter = { navigate: jasmine.createSpy('navigate') };
    let mockSessionService: Partial<SessionService>;
    let mockSocketService: Partial<SocketService>;

    beforeEach(async () => {
        mockSessionService = {
            leaveSessionPopupVisible: false,
            isOrganizer: false,
            gameName: 'Test Game',
            gameDescription: 'Test Description',
            gameSize: '10x10',
            maxPlayers: 2,
            playerName: 'Test Player',
            playerAttributes: {
                life: {
                    currentValue: 10,
                    baseValue: 10,
                    name: '',
                    description: '',
                },
                speed: {
                    currentValue: 5,
                    name: '',
                    description: '',
                    baseValue: 0,
                },
            },
            leaveSession: jasmine.createSpy('leaveSession'),
            confirmLeaveSession: jasmine.createSpy('confirmLeaveSession'),
            cancelLeaveSession: jasmine.createSpy('cancelLeaveSession'),
            initializeGame: jasmine.createSpy('initializeGame'),
            initializePlayer: jasmine.createSpy('initializePlayer'),
            subscribeToOrganizerLeft: jasmine.createSpy('subscribeToOrganizerLeft'),
        };

        mockSocketService = {
            leaveSession: jasmine.createSpy('leaveSession'),
        };

        await TestBed.configureTestingModule({
            declarations: [GamePageComponent],
            imports: [FontAwesomeModule],
            providers: [
                { provide: Router, useValue: mockRouter },
                { provide: SessionService, useValue: mockSessionService },
                { provide: SocketService, useValue: mockSocketService },
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

    it('should initialize game and player on ngOnInit', () => {
        component.ngOnInit();
        expect(mockSessionService.initializeGame).toHaveBeenCalled();
        expect(mockSessionService.initializePlayer).toHaveBeenCalled();
        expect(mockSessionService.subscribeToOrganizerLeft).toHaveBeenCalled();
    });

    it('should call leaveSession when leaveSession is called', () => {
        component.leaveSession();
        expect(mockSessionService.leaveSession).toHaveBeenCalled();
    });

    it('should call confirmLeaveSession when confirmLeaveSession is called', () => {
        component.confirmLeaveSession();
        expect(mockSessionService.confirmLeaveSession).toHaveBeenCalled();
    });

    it('should call cancelLeaveSession when cancelLeaveSession is called', () => {
        component.cancelLeaveSession();
        expect(mockSessionService.cancelLeaveSession).toHaveBeenCalled();
    });

    it('should toggle isExpanded when toggleExpand is called', () => {
        const initialExpandedState = component.isExpanded;
        component.toggleExpand();
        expect(component.isExpanded).toBe(!initialExpandedState);
    });

    it('should return correct game details', () => {
        expect(component.gameName).toBe('Test Game');
        expect(component.gameDescription).toBe('Test Description');
        expect(component.gameSize).toBe('10x10');
        expect(component.maxPlayers).toBe(2);
    });

    it('should return correct player details', () => {
        expect(component.playerName).toBe('Test Player');
        expect(component.playerAttributes).toEqual(mockSessionService.playerAttributes);
    });

    it('should return leaveSessionPopupVisible from sessionService', () => {
        expect(component.leaveSessionPopupVisible).toBe(false);
        mockSessionService.leaveSessionPopupVisible = true;
        expect(component.leaveSessionPopupVisible).toBe(true);
    });

    it('should set putTimer to false when endTurn is called', () => {
        component.putTimer = true;
        component.endTurn();
        expect(component.putTimer).toBe(false);
    });

    it('should clean up subscriptions and leave session on ngOnDestroy if organizer', () => {
        mockSessionService.isOrganizer = true;
        mockSessionService.sessionCode = 'testSessionCode';
        component.ngOnDestroy();
        expect(mockSocketService.leaveSession).toHaveBeenCalledWith('testSessionCode');
    });

    it('should not leave session on ngOnDestroy if not organizer', () => {
        mockSessionService.isOrganizer = false;
        component.ngOnDestroy();
        expect(mockSocketService.leaveSession).not.toHaveBeenCalled();
    });
});
