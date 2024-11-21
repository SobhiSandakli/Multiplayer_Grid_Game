import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SessionSocket } from '@app/services/socket/sessionSocket.service';
import { SessionService } from '@app/services/session/session.service';
import { GameSocket } from '@app/services/socket/gameSocket.service';

@Injectable({
    providedIn: 'root',
})
export class DebugModeService implements OnDestroy {
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
    ngOnDestroy(): void {
        document.removeEventListener('keydown', (event) => this.handleKeyPress(event));
        this.debugModeSubject.unsubscribe();
    }
    reset(): void {
        this.debugModeSubject.next(false);
    }
    private handleKeyPress(event: KeyboardEvent): void {
        if (event.key === 'd' && this.sessionCode && this.isOrganizer) {
            this.sessionSocket.toggleDebugMode(this.sessionCode);
        }
    }
}
