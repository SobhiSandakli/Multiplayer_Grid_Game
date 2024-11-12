import { Attribute, Injectable } from '@angular/core';
import { CharacterInfo } from '@app/interfaces/attributes.interface';
import { CharacterCreatedData, Message, PlayerListUpdate, RoomLockedResponse, TakenAvatarsResponse } from '@app/interfaces/socket.interface';
import { environment } from '@environments/environment';
import { fromEvent, Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';

@Injectable({
    providedIn: 'root',
})
export class SocketService {
    public socket: Socket;

    constructor() {
        this.socket = io(environment.serverUrl);
    }
    onUpdateLifePoints(): Observable<{ playerLife: number; opponentLife: number }> {
        return fromEvent(this.socket, 'updateLifePoints');
    }
    onPlayerListUpdate(): Observable<PlayerListUpdate> {
        return fromEvent(this.socket, 'playerListUpdate');
    }
    getSocketId(): string {
        return this.socket.id ?? '';
    }
    onExcluded(): Observable<Message> {
        return fromEvent(this.socket, 'excluded');
    }

    createCharacter(sessionCode: string, characterData: CharacterInfo): void {
        this.socket.emit('createCharacter', { sessionCode, characterData });
    }
    onCharacterCreated(): Observable<CharacterCreatedData & { gameId: string } & { attributs: Attribute }> {
        return fromEvent<CharacterCreatedData & { gameId: string } & { attributs: Attribute }>(this.socket, 'characterCreated');
    }

    getTakenAvatars(sessionCode: string): Observable<TakenAvatarsResponse> {
        this.socket.emit('getTakenAvatars', { sessionCode });
        return fromEvent<TakenAvatarsResponse>(this.socket, 'takenAvatars');
    }
    excludePlayer(sessionCode: string, playerSocketId: string): void {
        this.socket.emit('excludePlayer', { sessionCode, playerSocketId });
    }
    toggleRoomLock(sessionCode: string, lock: boolean): void {
        this.socket.emit('toggleLock', { sessionCode, lock });
    }
    onRoomLocked(): Observable<RoomLockedResponse> {
        return fromEvent(this.socket, 'roomLocked');
    }

    onOrganizerLeft(): Observable<void> {
        return fromEvent(this.socket, 'organizerLeft');
    }

    emitTileInfoRequest(sessionCode: string, row: number, col: number): void {
        this.socket.emit('tileInfoRequest', { sessionCode, row, col });
    }

    emitAvatarInfoRequest(sessionCode: string, avatar: string): void {
        this.socket.emit('avatarInfoRequest', { sessionCode, avatar });
    }

    onAvatarInfo(): Observable<{ name: string; avatar: string }> {
        return fromEvent(this.socket, 'avatarInfo');
    }

    onTileInfo(): Observable<{ cost: number; effect: string }> {
        return fromEvent(this.socket, 'tileInfo');
    }

    onPlayerInfo(): Observable<{ name: string; avatar: string }> {
        return fromEvent(this.socket, 'playerInfo');
    }
}
