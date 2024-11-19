import { Injectable } from '@angular/core';
import { SocketService } from './socket.service';
import { Observable, fromEvent } from 'rxjs';
import { Attribute, CharacterInfo } from '@app/interfaces/attributes.interface';
import { CharacterCreatedData, PlayerListUpdate, TakenAvatarsResponse } from '@app/interfaces/socket.interface';

@Injectable({
    providedIn: 'root',
})
export class PlayerSocket {
    constructor(private socketService: SocketService) {}
    onUpdateLifePoints(): Observable<{ playerLife: number; opponentLife: number }> {
        return fromEvent(this.socketService.socket, 'updateLifePoints');
    }
    onPlayerListUpdate(): Observable<PlayerListUpdate> {
        return fromEvent(this.socketService.socket, 'playerListUpdate');
    }
    onPlayerInfo(): Observable<{ name: string; avatar: string }> {
        return fromEvent(this.socketService.socket, 'playerInfo');
    }
    emitAvatarInfoRequest(sessionCode: string, avatar: string): void {
        this.socketService.socket.emit('avatarInfoRequest', { sessionCode, avatar });
    }

    onAvatarInfo(): Observable<{ name: string; avatar: string }> {
        return fromEvent(this.socketService.socket, 'avatarInfo');
    }
    createCharacter(sessionCode: string, characterData: CharacterInfo): void {
        this.socketService.socket.emit('createCharacter', { sessionCode, characterData });
    }
    onCharacterCreated(): Observable<CharacterCreatedData & { gameId: string; attributs: { [key: string]: Attribute } }> {
        return fromEvent(this.socketService.socket, 'characterCreated');
    }

    getTakenAvatars(sessionCode: string): Observable<TakenAvatarsResponse> {
        this.socketService.socket.emit('getTakenAvatars', { sessionCode });
        return fromEvent<TakenAvatarsResponse>(this.socketService.socket, 'takenAvatars');
    }
}
