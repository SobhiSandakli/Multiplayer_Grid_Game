import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SessionSocket } from '@app/services/socket/sessionSocket.service';
import { SessionService } from '../session/session.service';

@Injectable({
    providedIn: 'root',
})
export class DebugModeService {
    private debugModeSubject = new BehaviorSubject<boolean>(false);
    debugMode$ = this.debugModeSubject.asObservable();

    constructor(
        private sessionSocket: SessionSocket,
        private sessionService: SessionService,
    ) {
        this.sessionSocket.onDebugModeToggled().subscribe((data: { isDebugMode: boolean }) => {
            this.debugModeSubject.next(data.isDebugMode);
        });

        if (this.isOrganizer) {
            document.addEventListener('keydown', (event) => this.handleKeyPress(event));
        }
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
