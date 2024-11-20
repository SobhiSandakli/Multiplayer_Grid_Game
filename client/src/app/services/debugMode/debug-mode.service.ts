import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SessionSocket } from '@app/services/socket/sessionSocket.service';
import { SessionService } from '../session/session.service';
import { GameSocket } from '../socket/gameSocket.service';

@Injectable({
    providedIn: 'root',
})
export class DebugModeService {
    debugModeSubject = new BehaviorSubject<boolean>(false);
    debugMode$ = this.debugModeSubject.asObservable();

    constructor(
        private sessionSocket: SessionSocket,
        private sessionService: SessionService,
        private gameSocket: GameSocket,
    ) {
        this.sessionSocket.onDebugModeToggled().subscribe((data: { isDebugMode: boolean }) => {
            if (typeof data.isDebugMode === 'boolean') {
                this.debugModeSubject.next(data.isDebugMode);
            } else {
            }
        });

        if (this.isOrganizer) {
            document.addEventListener('keydown', (event) => this.handleKeyPress(event));
        }
        this.gameSocket.onOrganizerLeft().subscribe(() => {
            if (this.debugModeSubject.value) {
                this.debugModeSubject.next(false);
            }
        });
    }

    get sessionCode(): string | null {
        return this.sessionService.sessionCode;
    }

    get isOrganizer(): boolean {
        return this.sessionService.isOrganizer;
    }

    private handleKeyPress(event: KeyboardEvent): void {
        if (event.key === 'd' && this.sessionCode && this.isOrganizer) {
            this.sessionSocket.toggleDebugMode(this.sessionCode);
        }
    }
}
