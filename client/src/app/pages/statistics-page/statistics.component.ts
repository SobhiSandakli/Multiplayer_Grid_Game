import { Component, OnInit } from '@angular/core';
import { Player } from '@app/interfaces/player.interface';
import { SessionService } from '@app/services/session/session.service';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

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
    constructor(public sessionService: SessionService) {}
    ngOnInit(): void {
        this.playerName = this.sessionService.playerName;
        this.players = this.sessionService.players.map((player) => ({
            ...player,
            statistics: {
                ...player.statistics,
                uniqueItemsCount: player.statistics.uniqueItems.size,
                tilesVisitedCount: player.statistics.tilesVisited.size,
            },
        }));
    }
}
