import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
// import { Server } from 'socket.io';


@Injectable({
    providedIn: 'root',
})
export class EventsService {
    private socket: Socket;
    // private readonly server: Server;

    constructor() {
        this.socket = io(environment.serverUrl);
    }

    // Method to subscribe to the newEvent
    onNewEvent(): Observable<[string, string[]]> {
        return new Observable((observer) => {
            this.socket.on('newEvent', (event) => {
                observer.next(event);
            });

            // Cleanup when the subscription is closed
            return () => {
                this.socket.off('newEvent');
            };
        });
    }
}
