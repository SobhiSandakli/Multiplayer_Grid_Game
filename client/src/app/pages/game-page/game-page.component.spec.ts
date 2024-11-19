/* eslint-disable @typescript-eslint/no-magic-numbers*/
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
import { MovementSocket } from '@app/services/socket/movementSocket.service';

describe('GamePageComponent', () => {
    let component: GamePageComponent;
    let fixture: ComponentFixture<GamePageComponent>;
    const turnEnded$ = new Subject<{ playerSocketId: string }>();
    let mockSessionService: jasmine.SpyObj<SessionService>;
    let mockSubscriptionService: jasmine.SpyObj<SubscriptionService>;
    let mockCombatSocket: jasmine.SpyObj<CombatSocket>;
    let mockSessionSocket: jasmine.SpyObj<SessionSocket>;
    let mockTurnSocket: jasmine.SpyObj<TurnSocket>;
    let mockMovementSocket: jasmine.SpyObj<MovementSocket>;
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
        inventory: [],
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
            'getCurrentPlayer',
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
        mockMovementSocket = jasmine.createSpyObj('MovementSocket', ['discardItem', 'onInventoryFull', 'onUpdateInventory']);
        mockMovementSocket.onInventoryFull.and.returnValue(of({ items: [] }));
        mockMovementSocket.onUpdateInventory.and.returnValue(of({ inventory: [] }));

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

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should return the session code', () => {
        expect(component.sessionCode).toBe('1234');
    });

    it('should return the game name', () => {
        expect(component.gameName).toBe('Test Game');
    });

    it('should return the game description', () => {
        expect(component.gameDescription).toBe('Test Description');
    });

    it('should return the game size', () => {
        expect(component.gameSize).toBe('10x10');
    });

    it('should return the player count', () => {
        expect(component.playerCount).toBe(1);
    });

    it('should return the player name', () => {
        expect(component.playerName).toBe('Player 1');
    });

    it('should return the player avatar', () => {
        expect(component.playerAvatar).toBe('avatar1.png');
    });

    it('should return the player attributes', () => {
        expect(component.playerAttributes).toEqual(mockPlayer.attributes);
    });

    it('should return the visibility of the leave session popup', () => {
        expect(component.leaveSessionPopupVisible).toBeFalse();
    });

    it('should return the leave session message', () => {
        expect(component.leaveSessionMessage).toBe('');
    });

    it('should return if the player is the organizer', () => {
        expect(component.isOrganizer).toBeTrue();
    });

    it('should return the list of players', () => {
        expect(component.players).toEqual([mockPlayer]);
    });

    it('should unsubscribe when the component is destroyed', () => {
        const unsubscribeSpy = spyOn(component['subscriptions'], 'unsubscribe');
        component.ngOnDestroy();
        expect(unsubscribeSpy).toHaveBeenCalled();
    });

    it('should toggle the expanded state', () => {
        component.isExpanded = false;
        component.toggleExpand();
        expect(component.isExpanded).toBeTrue();

        component.toggleExpand();
        expect(component.isExpanded).toBeFalse();
    });

    it('should toggle active state', () => {
        component.isActive = false;
        component.toggleActive();
        expect(component.isActive).toBeTrue();

        component.toggleActive();
        expect(component.isActive).toBeFalse();
    });
    it('should handle child component data', () => {
        spyOn(component, 'startCombat');
        component.handleDataFromChild('avatar2.png');
        expect(component.isActive).toBeFalse();
        expect(component.opposentPlayer).toBe('avatar2.png');
        expect(component.startCombat).toHaveBeenCalled();
    });

    it('should update combat status', () => {
        component.onFightStatusChanged(true);
        expect(mockSubscriptionService.isFight).toBeTrue();

        component.onFightStatusChanged(false);
        expect(mockSubscriptionService.isFight).toBeFalse();
    });
    it('should handle action performed and reset isActive and action', () => {
        component.isActive = true;
        component.handleActionPerformed();

        expect(mockSubscriptionService.action).toBe(0);
        expect(component.isActive).toBeFalse();
        turnEnded$.next({ playerSocketId: 'socketId123' });

        expect(mockSubscriptionService.action).toBe(1);
        expect(component.isActive).toBeFalse();
    });
    it('should exit session', () => {
        component.leaveSession();
        expect(mockSessionService.leaveSession).toHaveBeenCalled();
    });

    it('should confirm session exit', () => {
        component.confirmLeaveSession();
        expect(mockSessionService.confirmLeaveSession).toHaveBeenCalled();
    });

    it('should cancel session exit', () => {
        component.cancelLeaveSession();
        expect(mockSessionService.cancelLeaveSession).toHaveBeenCalled();
    });
    it('should start a fight with the right arguments', () => {
        spyOnProperty(component, 'sessionCode', 'get').and.returnValue('1234');
        spyOnProperty(component, 'playerAvatar', 'get').and.returnValue('avatar1.png');
        component.opposentPlayer = 'avatar2.png';

        component.startCombat();

        expect(mockCombatSocket.emitStartCombat).toHaveBeenCalledWith('1234', 'avatar1.png', 'avatar2.png');
    });
    it('should initialize ngOnInit correctly', () => {
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

    // it('should discard the correct item and close the popup', () => {
    //     // Arrange
    //     const discardedItem = 'item-to-discard';
    //     const pickedUpItem = 'item-picked-up';
    //     mockPlayer.inventory = [discardedItem];
    //     component.inventoryFullItems = [pickedUpItem, discardedItem];

    //     // Act
    //     component.discardItem(discardedItem);

    //     // Assert
    //     expect(mockMovementSocket.discardItem).toHaveBeenCalledWith(
    //         mockSessionService.sessionCode,
    //         discardedItem,
    //         pickedUpItem
    //     );
    //     expect(component.inventoryFullPopupVisible).toBeFalse();
    // });

    // it('should not discard item if no player is found', () => {
    //     // Arrange
    //     const discardedItem = 'item-to-discard';
    //     mockSessionService.getCurrentPlayer.and.returnValue(undefined);

    //     // Act
    //     component.discardItem(discardedItem);

    //     // Assert
    //     expect(mockMovementSocket.discardItem).not.toHaveBeenCalled();
    //     expect(component.inventoryFullPopupVisible).toBeTrue();
    // });
});
