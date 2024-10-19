import { CharacterData } from '@app/interfaces/character-data/character-data.interface';
import { Player } from '@app/interfaces/player/player.interface';
import { Session } from '@app/interfaces/session/session.interface';
import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@Injectable()
export class SessionsService {
    private sessions: { [key: string]: Session } = {};

    generateUniqueSessionCode(): string {
        let code: string;
        do {
            code = Math.floor(1000 + Math.random() * 9000).toString();
        } while (this.sessions[code]);
        return code;
    }

    createNewSession(clientId: string, maxPlayers: number, selectedGameID: string): string {
        const sessionCode = this.generateUniqueSessionCode();
        const session: Session = {
            organizerId: clientId,
            locked: false,
            maxPlayers,
            players: [],
            selectedGameID,
        };
        this.sessions[sessionCode] = session;
        return sessionCode;
    }

    validateCharacterCreation(
        sessionCode: string,
        characterData: CharacterData,
        server: Server,
    ): { session?: Session; finalName?: string; error?: string } {
        const session = this.sessions[sessionCode];
        if (!sessionCode || !session) {
            return { error: 'Session introuvable ou code de session manquant.' };
        }

        const finalName = this.getUniquePlayerName(session, characterData.name);

        if (this.isAvatarTaken(session, characterData.avatar)) {
            return { error: 'Avatar déjà pris.' };
        }

        if (this.isSessionFull(session)) {
            session.locked = true;
            server.to(sessionCode).emit('roomLocked', { locked: true });
            return { error: 'Le nombre maximum de joueurs est atteint.' };
        }

        return { session, finalName };
    }

    addPlayerToSession(session: Session, client: Socket, name: string, characterData: CharacterData): void {
        const newPlayer: Player = {
            socketId: client.id,
            name,
            avatar: characterData.avatar,
            attributes: characterData.attributes,
            isOrganizer: session.players.length === 0,
        };
        session.players.push(newPlayer);
    }

    private getUniquePlayerName(session: Session, desiredName: string): string {
        let finalName = desiredName;
        let suffix = 1;

        while (session.players.some((player) => player.name === finalName)) {
            suffix++;
            finalName = `${desiredName}-${suffix}`;
        }

        return finalName;
    }

    private isAvatarTaken(session: Session, avatar: string): boolean {
        return session.players.some((player) => player.avatar === avatar);
    }

    private isSessionFull(session: Session): boolean {
        return session.players.length >= session.maxPlayers;
    }

    getSession(sessionCode: string): Session | undefined {
        return this.sessions[sessionCode];
    }

    removePlayerFromSession(session: Session, clientId: string): boolean {
        const playerIndex = session.players.findIndex((player) => player.socketId === clientId);
        if (playerIndex !== -1) {
            session.players.splice(playerIndex, 1);
            return true;
        }
        return false;
    }

    isOrganizer(session: Session, clientId: string): boolean {
        return session.organizerId === clientId;
    }

    terminateSession(sessionCode: string): void {
        delete this.sessions[sessionCode];
    }
    toggleSessionLock(session: Session, lock: boolean): void {
        session.locked = lock;
    }

    getTakenAvatars(session: Session): string[] {
        return session.players.map((player) => player.avatar);
    }
}
