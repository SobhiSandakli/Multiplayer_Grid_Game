import { Component, OnInit } from '@angular/core';
import { Player } from '@app/interfaces/player.interface';
import { SessionService } from '@app/services/session/session.service';
import { SubscriptionService } from '@app/services/subscription/subscription.service';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { SessionStatistics } from '@app/interfaces/session.interface';
import { HUNDRED_PERCENT } from 'src/constants/game-constants';

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
    constructor(
        public sessionService: SessionService,
        public subscriptionService: SubscriptionService,
    ) {}
    ngOnInit(): void {
        this.playerName = this.sessionService.playerName;
        this.sessionStatistics = this.subscriptionService.sessionSatistics;
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
}
