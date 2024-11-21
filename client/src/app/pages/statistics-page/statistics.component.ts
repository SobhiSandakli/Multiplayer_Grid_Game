import { Component, OnInit } from '@angular/core';
import { Player } from '@app/interfaces/player.interface';
import { SessionService } from '@app/services/session/session.service';
import { SubscriptionService } from '@app/services/subscription/subscription.service';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { SessionStatistics } from '@app/interfaces/session.interface';
import { HUNDRED_PERCENT } from 'src/constants/game-constants';
import { GameSocket } from '@app/services/socket/gameSocket.service';

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
        public gameSocket: GameSocket,
    ) {}
    ngOnInit(): void {
        this.playerName = this.sessionService.playerName;
        this.sessionStatistics = this.subscriptionService.sessionStatistics;
        {this.calculateSessionDuration(this.gameSocket.startTime, this.subscriptionService.endTime)};
        this.players = this.sessionService.players.map((player) => ({
            ...player,
            statistics: {
                ...player.statistics,
            },
        }));
    }

    calculatePercentage(value: number, total: number): number {
        return parseFloat(((value / total) * HUNDRED_PERCENT).toFixed(2));
    }
    calculateSessionDuration(startTime : Date, endTime : Date): void {
        if (startTime && endTime) {
            const durationInMilliseconds = endTime.getTime() - startTime.getTime();
            const minutes = Math.floor(durationInMilliseconds / 60000);
            const seconds = Math.floor((durationInMilliseconds % 60000) / 1000);
            this.sessionDuration = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        }
    }
}
