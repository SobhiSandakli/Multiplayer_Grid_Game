import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';

@Injectable({
    providedIn: 'root',
})
export class EventsService {
    private socket: Socket;

    constructor() {
        this.socket = io(environment.serverUrl + '/events');
    }

    onNewEvent(): Observable<[string, string[]]> {
        return new Observable((observer) => {
            this.socket.on('newEvent', (event) => {
                observer.next(event);
            });

            return () => {
                this.socket.off('newEvent');
            };
        });
    }
}
