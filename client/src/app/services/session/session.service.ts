import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class SessionService {
    private sessionCode: string = '';

    setSessionCode(code: string) {
        this.sessionCode = code;
    }

    getSessionCode(): string {
        return this.sessionCode;
    }
}
