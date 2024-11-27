/* eslint-disable @typescript-eslint/no-magic-numbers*/
/* eslint-disable @typescript-eslint/no-magic-numbers*/
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Player } from '@app/interfaces/player.interface';
import { DebugModeService } from '@app/services/debugMode/debug-mode.service';
import { SessionService } from '@app/services/session/session.service';
import { SubscriptionService } from '@app/services/subscription/subscription.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { StatisticsComponent } from './statistics.component';

describe('StatisticsComponent', () => {
    let component: StatisticsComponent;
    let fixture: ComponentFixture<StatisticsComponent>;
    let mockSessionService: Partial<SessionService>;
    let mockSubscriptionService: Partial<SubscriptionService>;
    let mockDebugModeService: Partial<DebugModeService>;

    beforeEach(async () => {
        mockSessionService = {
            reset: jasmine.createSpy('reset'),
            playerName: 'Test Player',
            players: [
                {
                    socketId: 'socket1',
                    name: 'Player1',
                    avatar: 'avatar1.png',
                    isOrganizer: true,
                    inventory: ['item1', 'item2'],
                    statistics: {
                        combats: 2,
                        evasions: 1,
                        victories: 1,
                        defeats: 1,
                        totalLifeLost: 5,
                        totalLifeRemoved: 10,
                        uniqueItems: new Set(['item1', 'item2']),
                        tilesVisited: new Set(['tile1', 'tile2']),
                        uniqueItemsArray: ['item1', 'item2'],
                        tilesVisitedArray: ['tile1', 'tile2'],
                    },
                },
                {
                    socketId: 'socket2',
                    name: 'Player2',
                    avatar: 'avatar2.png',
                    isOrganizer: false,
                    inventory: ['item3'],
                    statistics: {
                        combats: 3,
                        evasions: 1,
                        victories: 2,
                        defeats: 1,
                        totalLifeLost: 8,
                        totalLifeRemoved: 12,
                        uniqueItems: new Set(['item3']),
                        tilesVisited: new Set(['tile3']),
                        uniqueItemsArray: ['item3'],
                        tilesVisitedArray: ['tile3'],
                    },
                },
            ] as Player[],
        };

        mockSubscriptionService = {
            reset: jasmine.createSpy('reset'),
            sessionStatistics: {
                gameDuration: '10:00',
                totalTurns: 20,
                totalTerrainTiles: 100,
                visitedTerrains: new Set(['tile1', 'tile2', 'tile3']),
                totalDoors: 5,
                manipulatedDoors: new Set(['door1']),
                uniqueFlagHolders: new Set(['Player1']),
                visitedTerrainsArray: ['tile1', 'tile2', 'tile3'],
                manipulatedDoorsArray: ['door1'],
                uniqueFlagHoldersArray: ['Player1'],
            },
        };
        mockDebugModeService = {
            reset: jasmine.createSpy('reset'),
        };

        await TestBed.configureTestingModule({
            declarations: [StatisticsComponent],
            imports: [FontAwesomeModule],
            providers: [
                { provide: SessionService, useValue: mockSessionService },
                { provide: SubscriptionService, useValue: mockSubscriptionService },
                { provide: DebugModeService, useValue: mockDebugModeService },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(StatisticsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize playerName from SessionService', () => {
        expect(component.playerName).toBe('Test Player');
    });

    it('should map and augment players with statistics on initialization', () => {
        expect(component.players.length).toBe(2);

        const player1 = component.players[0];
        expect(player1.name).toBe('Player1');
        expect(player1.statistics.combats).toBe(2);
        expect(player1.statistics.evasions).toBe(1);
        expect(player1.statistics.uniqueItems.size).toBe(2);

        const player2 = component.players[1];
        expect(player2.name).toBe('Player2');
        expect(player2.statistics.combats).toBe(3);
        expect(player2.statistics.tilesVisited.size).toBe(1);
    });

    it('should handle empty players array gracefully', () => {
        mockSessionService.players = [];
        fixture = TestBed.createComponent(StatisticsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        expect(component.players.length).toBe(0);
    });

    it('should calculate percentages correctly', () => {
        const percentage = component.calculatePercentage(50, 100);
        expect(percentage).toBe(50);
    });

    it('should initialize sessionStatistics from SubscriptionService', () => {
        expect(component.sessionStatistics.gameDuration).toBe('10:00');
        expect(component.sessionStatistics.totalTurns).toBe(20);
        expect(component.sessionStatistics.totalTerrainTiles).toBe(100);
    });
    it('should sort players by column in ascending order', () => {
        component.sortPlayers('combats', 'asc');
        expect(component.players[0].name).toBe('Player1');
        expect(component.players[1].name).toBe('Player2');
    });
    it('should sort players by column in descending order', () => {
        component.sortPlayers('combats', 'desc');
        expect(component.players[0].name).toBe('Player2');
        expect(component.players[1].name).toBe('Player1');
    });
    it('should return the correct value for a given column', () => {
        const player = component.players[0];
        expect(component.getColumnValue(player, 'name')).toBe('Player1');
        expect(component.getColumnValue(player, 'combats')).toBe(2);
        expect(component.getColumnValue(player, 'evasions')).toBe(1);
        expect(component.getColumnValue(player, 'victories')).toBe(1);
        expect(component.getColumnValue(player, 'defeats')).toBe(1);
        expect(component.getColumnValue(player, 'totalLifeLost')).toBe(5);
        expect(component.getColumnValue(player, 'totalLifeRemoved')).toBe(10);
        expect(component.getColumnValue(player, 'uniqueItemsArray')).toBe(2);
        expect(component.getColumnValue(player, 'tilesVisitedPercentage')).toBe(component.calculatePercentage(2, 100));
    });
    it('should reset all services and component properties', () => {
        component.reset();
        expect(mockSubscriptionService.reset).toHaveBeenCalled();
        expect(mockSessionService.reset).toHaveBeenCalled();
        expect(mockDebugModeService.reset).toHaveBeenCalled();
        expect(component.playerName).toBe('');
        expect(component.players.length).toBe(0);
        expect(mockSessionService.sessionCode).toBe('');
    });
    it('should return -1 when aValue < bValue in ascending order', () => {
        const result = component.compareValues(1, 2, 'asc');
        expect(result).toBe(-1);
    });
    it('should return -1 when aValue > bValue in descending order', () => {
        const result = component.compareValues(2, 1, 'desc');
        expect(result).toBe(-1);
    });
    it('should return 0 when aValue equals bValue in ascending order', () => {
        expect(component.compareValues(5, 5, 'asc')).toBe(0);
        expect(component.compareValues(null, null, 'asc')).toBe(0);
        expect(component.compareValues(undefined, undefined, 'asc')).toBe(0);
    });
});
