/* eslint-disable @typescript-eslint/no-magic-numbers*/
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatisticsComponent } from './statistics.component';
import { SessionService } from '@app/services/session/session.service';
import { Player } from '@app/interfaces/player.interface';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

describe('StatisticsComponent', () => {
    let component: StatisticsComponent;
    let fixture: ComponentFixture<StatisticsComponent>;
    let mockSessionService: Partial<SessionService>;

    beforeEach(async () => {
        mockSessionService = {
            playerName: 'Test Player',
            players: [
                {
                    socketId: 'socket1',
                    name: 'Player1',
                    avatar: 'avatar1.png',
                    isOrganizer: true,
                    inventory: ['item1', 'item2'],
                    statistics: {
                        combats: 5,
                        evasions: 2,
                        victories: 3,
                        defeats: 2,
                        totalLifeLost: 10,
                        totalLifeRemoved: 15,
                        uniqueItems: new Set(['item1', 'item2']),
                        tilesVisited: new Set(['tile1', 'tile2']),
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
                        victories: 1,
                        defeats: 2,
                        totalLifeLost: 5,
                        totalLifeRemoved: 8,
                        uniqueItems: new Set(['item3']),
                        tilesVisited: new Set(['tile3']),
                    },
                },
            ] as Player[],
        };

        await TestBed.configureTestingModule({
            declarations: [StatisticsComponent],
            imports: [FontAwesomeModule],
            providers: [{ provide: SessionService, useValue: mockSessionService }],
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

    it('should map and augment player statistics on initialization', () => {
        expect(component.players.length).toBe(2);

        // Check Player1
        const player1 = component.players[0];
        expect(player1.name).toBe('Player1');
        expect(player1.statistics.uniqueItems.size).toBe(2); // 2 unique items
        expect(player1.statistics.tilesVisited.size).toBe(2); // 2 tiles visited
        expect(player1.statistics.combats).toBe(5);
        expect(player1.statistics.evasions).toBe(2);
        expect(player1.statistics.victories).toBe(3);
        expect(player1.statistics.defeats).toBe(2);
        expect(player1.statistics.totalLifeLost).toBe(10);
        expect(player1.statistics.totalLifeRemoved).toBe(15);

        // Check Player2
        const player2 = component.players[1];
        expect(player2.name).toBe('Player2');
        expect(player2.statistics.uniqueItems.size).toBe(1); // 1 unique item
        expect(player2.statistics.tilesVisited.size).toBe(1); // 1 tile visited
        expect(player2.statistics.combats).toBe(3);
        expect(player2.statistics.evasions).toBe(1);
        expect(player2.statistics.victories).toBe(1);
        expect(player2.statistics.defeats).toBe(2);
        expect(player2.statistics.totalLifeLost).toBe(5);
        expect(player2.statistics.totalLifeRemoved).toBe(8);
    });

    it('should handle empty players array gracefully', () => {
        mockSessionService.players = [];
        fixture = TestBed.createComponent(StatisticsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        expect(component.players.length).toBe(0);
    });

    it('should calculate the correct uniqueItems count for each player', () => {
        const player1 = component.players.find((player) => player.name === 'Player1');
        expect(player1?.statistics.uniqueItems.size).toBe(2);

        const player2 = component.players.find((player) => player.name === 'Player2');
        expect(player2?.statistics.uniqueItems.size).toBe(1);
    });

    it('should calculate the correct tilesVisited count for each player', () => {
        const player1 = component.players.find((player) => player.name === 'Player1');
        expect(player1?.statistics.tilesVisited.size).toBe(2);

        const player2 = component.players.find((player) => player.name === 'Player2');
        expect(player2?.statistics.tilesVisited.size).toBe(1);
    });
});
