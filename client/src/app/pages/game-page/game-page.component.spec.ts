import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Game } from '@app/interfaces/game-model.interface';
import { Player } from '@app/interfaces/player.interface';
import { SessionService } from '@app/services/session/session.service';
import { CombatSocket } from '@app/services/socket/combatSocket.service';
import { SessionSocket } from '@app/services/socket/sessionSocket.service';
import { TurnSocket } from '@app/services/socket/turnSocket.service';
import { SubscriptionService } from '@app/services/subscription/subscription.service';
import { of, Subject } from 'rxjs';
import { GamePageComponent } from './game-page.component';

describe('GamePageComponent', () => {
    let component: GamePageComponent;
    let fixture: ComponentFixture<GamePageComponent>;
    const turnEnded$ = new Subject<{ playerSocketId: string }>();
    let mockSessionService: jasmine.SpyObj<SessionService>;
    let mockSubscriptionService: jasmine.SpyObj<SubscriptionService>;
    let mockCombatSocket: jasmine.SpyObj<CombatSocket>;
    let mockSessionSocket: jasmine.SpyObj<SessionSocket>;
    let mockTurnSocket: jasmine.SpyObj<TurnSocket>;
    const mockGame: Game = {
        _id: '12345',
        name: 'Test Game',
        description: 'Test Description',
        size: '10x10',
        mode: 'normal',
        image: 'image-url',
        date: new Date(),
        visibility: true,
        grid: [
            [
                { images: ['grass'], isOccuped: false },
                { images: ['water'], isOccuped: true },
            ],
            [
                { images: ['wall'], isOccuped: false },
                { images: ['door'], isOccuped: true },
            ],
        ],
    };
    const mockPlayer: Player = {
        socketId: '1',
        name: 'Player 1',
        avatar: 'avatar1.png',
        isOrganizer: true,
        attributes: {
            attack: {
                name: 'Attack',
                description: 'Attaque du joueur',
                baseValue: 10,
                currentValue: 8,
                speed: 5,
                dice: '1d6',
            },
            defense: {
                name: 'Defense',
                description: 'Défense du joueur',
                baseValue: 5,
                currentValue: 5,
            },
        },
        hasLeft: false,
    };

    beforeEach(async () => {
        mockSessionService = jasmine.createSpyObj('SessionService', [
            'sessionCode',
            'selectedGame',
            'players',
            'playerName',
            'playerAvatar',
            'playerAttributes',
            'leaveSessionPopupVisible',
            'leaveSessionMessage',
            'isOrganizer',
            'leaveSession',
            'confirmLeaveSession',
            'cancelLeaveSession',
            'initializeGame', 
            'subscribeToPlayerListUpdate', 
            'subscribeToOrganizerLeft', 
        ]);

        mockSubscriptionService = jasmine.createSpyObj('SubscriptionService', [
            'gameInfo$',
            'currentPlayerSocketId$',
            'isPlayerTurn$',
            'putTimer$',
            'initSubscriptions',
        ]);
        mockSubscriptionService.unsubscribeAll = jasmine.createSpy();
        mockCombatSocket = jasmine.createSpyObj('CombatSocket', ['emitEvent', 'emitStartCombat']);
        mockSessionSocket = jasmine.createSpyObj('SessionSocket', ['joinSession', 'leaveSession']);
        mockTurnSocket = jasmine.createSpyObj('TurnSocket', ['endTurn', 'startTurn', 'onTurnEnded']);
        mockTurnSocket.onTurnEnded.and.returnValue(turnEnded$.asObservable());

        mockSessionService.sessionCode = '1234';
        mockSessionService.selectedGame = mockGame;
        mockSessionService.players = [mockPlayer];
        mockSessionService.playerName = 'Player 1';
        mockSessionService.playerAvatar = 'avatar1.png';
        mockSessionService.playerAttributes = mockPlayer.attributes;
        mockSessionService.leaveSessionPopupVisible = false;
        mockSessionService.leaveSessionMessage = '';
        mockSessionService.isOrganizer = true;

        mockSubscriptionService.gameInfo$ = of(mockGame);
        mockSubscriptionService.currentPlayerSocketId$ = of('socketId123');
        mockSubscriptionService.isPlayerTurn$ = of(true);
        mockSubscriptionService.putTimer$ = of(false);

        await TestBed.configureTestingModule({
            declarations: [GamePageComponent],
            providers: [
                { provide: SessionService, useValue: mockSessionService },
                { provide: SubscriptionService, useValue: mockSubscriptionService },
                { provide: CombatSocket, useValue: mockCombatSocket },
                { provide: SessionSocket, useValue: mockSessionSocket },
                { provide: TurnSocket, useValue: mockTurnSocket },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(GamePageComponent);
        component = fixture.componentInstance;
    });

    it('devrait créer le composant', () => {
        expect(component).toBeTruthy();
    });

    it('devrait retourner le code de session', () => {
        expect(component.sessionCode).toBe('1234');
    });

    it('devrait retourner le nom du jeu', () => {
        expect(component.gameName).toBe('Test Game');
    });

    it('devrait retourner la description du jeu', () => {
        expect(component.gameDescription).toBe('Test Description');
    });

    it('devrait retourner la taille du jeu', () => {
        expect(component.gameSize).toBe('10x10');
    });

    it('devrait retourner le nombre de joueurs', () => {
        expect(component.playerCount).toBe(1);
    });

    it('devrait retourner le nom du joueur', () => {
        expect(component.playerName).toBe('Player 1');
    });

    it('devrait retourner l\'avatar du joueur', () => {
        expect(component.playerAvatar).toBe('avatar1.png');
    });

    it('devrait retourner les attributs du joueur', () => {
        expect(component.playerAttributes).toEqual(mockPlayer.attributes);
    });

    it('devrait retourner la visibilité de la fenêtre de confirmation de départ', () => {
        expect(component.leaveSessionPopupVisible).toBeFalse();
    });

    it('devrait retourner le message de départ', () => {
        expect(component.leaveSessionMessage).toBe('');
    });

    it('devrait retourner si le joueur est l\'organisateur', () => {
        expect(component.isOrganizer).toBeTrue();
    });

    it('devrait retourner la liste des joueurs', () => {
        expect(component.players).toEqual([mockPlayer]);
    });

    it('devrait se désabonner lors de la destruction du composant', () => {
        const unsubscribeSpy = spyOn(component['subscriptions'], 'unsubscribe');
        component.ngOnDestroy();
        expect(unsubscribeSpy).toHaveBeenCalled();
    });
    it('devrait basculer l\'état étendu', () => {
        component.isExpanded = false;
        component.toggleExpand();
        expect(component.isExpanded).toBeTrue();

        component.toggleExpand();
        expect(component.isExpanded).toBeFalse();
    });

    it('devrait basculer l\'état actif', () => {
        component.isActive = false;
        component.toggleActive();
        expect(component.isActive).toBeTrue();

        component.toggleActive();
        expect(component.isActive).toBeFalse();
    });
    it('devrait gérer les données du composant enfant', () => {
        spyOn(component, 'startCombat');
        component.handleDataFromChild('avatar2.png');
        expect(component.isActive).toBeFalse();
        expect(component.opposentPlayer).toBe('avatar2.png');
        expect(component.startCombat).toHaveBeenCalled();
    });

    it('devrait mettre à jour le statut de combat', () => {
        component.onFightStatusChanged(true);
        expect(mockSubscriptionService.isFight).toBeTrue();

        component.onFightStatusChanged(false);
        expect(mockSubscriptionService.isFight).toBeFalse();
    });
    it('devrait gérer action effectuée et réinitialiser isActive et action', () => {
        component.isActive = true;
        component.handleActionPerformed();
    
        expect(mockSubscriptionService.action).toBe(0);
        expect(component.isActive).toBeFalse();
        turnEnded$.next({ playerSocketId: 'socketId123' });
    
        expect(mockSubscriptionService.action).toBe(1);
        expect(component.isActive).toBeFalse();
    });
    it('devrait quitter la session', () => {
        component.leaveSession();
        expect(mockSessionService.leaveSession).toHaveBeenCalled();
    });

    it('devrait confirmer la sortie de session', () => {
        component.confirmLeaveSession();
        expect(mockSessionService.confirmLeaveSession).toHaveBeenCalled();
    });

    it('devrait annuler la sortie de session', () => {
        component.cancelLeaveSession();
        expect(mockSessionService.cancelLeaveSession).toHaveBeenCalled();
    });
    it('devrait démarrer un combat avec les bons arguments', () => {
        spyOnProperty(component, 'sessionCode', 'get').and.returnValue('1234');
        spyOnProperty(component, 'playerAvatar', 'get').and.returnValue('avatar1.png');
        component.opposentPlayer = 'avatar2.png';
    
        component.startCombat();
    
        expect(mockCombatSocket.emitStartCombat).toHaveBeenCalledWith('1234', 'avatar1.png', 'avatar2.png');
    });
    it('devrait initialiser correctement ngOnInit', () => {
        mockSessionService.initializeGame.calls.reset();
        mockSessionService.subscribeToPlayerListUpdate.calls.reset();
        mockSessionService.subscribeToOrganizerLeft.calls.reset();
        mockSubscriptionService.initSubscriptions.calls.reset();
    
        spyOn(component, 'handleActionPerformed');
    
        spyOnProperty(component, 'playerAttributes', 'get').and.returnValue({
            speed: {
                name: 'Speed',
                description: 'Vitesse du joueur',
                baseValue: 10,
                currentValue: 5,
            },
            life: {
                name: 'Life',
                description: 'Points de vie du joueur',
                baseValue: 100,
                currentValue: 80,
            },
        });
    
        component.ngOnInit();
    
        expect(mockSessionService.leaveSessionPopupVisible).toBeFalse();
        expect(mockSessionService.initializeGame).toHaveBeenCalled();
        expect(mockSessionService.subscribeToPlayerListUpdate).toHaveBeenCalled();
        expect(mockSessionService.subscribeToOrganizerLeft).toHaveBeenCalled();
        expect(mockSubscriptionService.initSubscriptions).toHaveBeenCalled();
        expect(component.speedPoints).toBe(5);
        expect(component.remainingHealth).toBe(80);
        expect(component.handleActionPerformed).toHaveBeenCalled();
        expect(mockSubscriptionService.action).toBe(1);
    });
});