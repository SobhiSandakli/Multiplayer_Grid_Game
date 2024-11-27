import { Component, OnInit } from '@angular/core';
import { Player } from '@app/interfaces/player.interface';
import { SessionStatistics } from '@app/interfaces/session.interface';
import { DebugModeService } from '@app/services/debugMode/debug-mode.service';
import { GameSocket } from '@app/services/game-socket/gameSocket.service';
import { SessionService } from '@app/services/session/session.service';
import { SubscriptionService } from '@app/services/subscription/subscription.service';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { HUNDRED_PERCENT } from 'src/constants/game-constants';
import { ONE_MINUTE, ONE_SECOND, TEN } from 'src/constants/statistics-constants';

@Component({
    selector: 'app-statistics',
    templateUrl: './statistics.component.html',
    styleUrls: ['./statistics.component.scss'],
})
export class StatisticsComponent implements OnInit {
    faArrowLeft = faArrowLeft;
    showCharacterCreation = false;
    players: Player[] = [];
    playerName: string | null = null;
    sessionStatistics: SessionStatistics;
    playerTilesVisitedPercentage: number = 0;
    sessionTilesVisitedPercentage: number = 0;
    manipulatedDoorsPercentage: number = 0;
    sessionDuration: string = '';
    constructor(
        public sessionService: SessionService,
        public subscriptionService: SubscriptionService,
        private debugMode: DebugModeService,
        public gameSocket: GameSocket,
    ) {}
    ngOnInit(): void {
        this.playerName = this.sessionService.playerName;
        this.sessionStatistics = this.subscriptionService.sessionStatistics;
        {
            this.calculateSessionDuration(this.gameSocket.startTime, this.subscriptionService.endTime);
        }
        this.players = this.sessionService.players.map((player) => ({
            ...player,
            statistics: {
                ...player.statistics,
            },
        }));
    }
    sortPlayers(column: string, direction: 'asc' | 'desc'): void {
        this.players.sort((a, b) => this.comparePlayers(a, b, column, direction));
    }
    compareValues(aValue: number, bValue: number, direction: 'asc' | 'desc'): number {
        if (aValue < bValue) {
            return direction === 'asc' ? -1 : 1;
        } else if (aValue > bValue) {
            return direction === 'asc' ? 1 : -1;
        } else {
            return 0;
        }
    }
    getColumnValue(player: Player, column: string): number {
        const columnMapping: Record<string, () => number> = {
            combats: () => player.statistics.combats,
            evasions: () => player.statistics.evasions,
            victories: () => player.statistics.victories,
            defeats: () => player.statistics.defeats,
            totalLifeLost: () => player.statistics.totalLifeLost,
            totalLifeRemoved: () => player.statistics.totalLifeRemoved,
            uniqueItemsArray: () => player.statistics.uniqueItemsArray.length,
            tilesVisitedPercentage: () =>
                this.calculatePercentage(player.statistics.tilesVisitedArray.length, this.sessionStatistics.totalTerrainTiles),
        };

        return columnMapping[column]?.() ?? '';
    }
    comparePlayers(playerA: Player, playerB: Player, column: string, direction: 'asc' | 'desc'): number {
        const aValue = this.getColumnValue(playerA, column);
        const bValue = this.getColumnValue(playerB, column);
        return this.compareValues(aValue, bValue, direction);
    }

    calculatePercentage(value: number, total: number): number {
        return parseFloat(((value / total) * HUNDRED_PERCENT).toFixed(2));
    }

    calculateSessionDuration(startTime: Date, endTime: Date): void {
        if (startTime && endTime) {
            const durationInMilliseconds = endTime.getTime() - startTime.getTime();
            const minutes = Math.floor(durationInMilliseconds / ONE_MINUTE);
            const seconds = Math.floor((durationInMilliseconds % ONE_MINUTE) / ONE_SECOND);
            this.sessionDuration = `${minutes}:${seconds < TEN ? '0' : ''}${seconds}`;
        }
    }
    reset(): void {
        this.subscriptionService.reset();
        this.sessionService.reset();
        this.debugMode.reset();
        this.playerName = '';
        this.players = [];
        this.sessionService.sessionCode = '';
    }
}
