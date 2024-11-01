import { CharacterData } from '@app/interfaces/character-data/character-data.interface';
import { Player } from '@app/interfaces/player/player.interface';
import { Session } from '@app/interfaces/session/session.interface';
import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
const SUFFIX_NAME_INITIAL = 1;
const MIN_SESSION_CODE = 1000;
const MAX_SESSION_CODE = 9000;

@Injectable()
export class SessionsService {
    private sessions: { [key: string]: Session } = {};

    generateUniqueSessionCode(): string {
        let code: string;
        do {
            code = Math.floor(MIN_SESSION_CODE + Math.random() * MAX_SESSION_CODE).toString();
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
            grid: [],
        };
        this.sessions[sessionCode] = session;
        return sessionCode;
    }

    validateCharacterCreation(
        sessionCode: string,
        characterData: CharacterData,
        server: Server,
    ): { session?: Session; finalName?: string; error?: string; gameId?: string } {
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
        return { session, finalName, gameId: session.selectedGameID };
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

    isSessionFull(session: Session): boolean {
        return session.players.length >= session.maxPlayers;
    }

    getSession(sessionCode: string): Session | undefined {
        return this.sessions[sessionCode];
    }

    removePlayerFromSession(session: Session, clientId: string): boolean {
        
        const player = session.players.find((player) => player.socketId === clientId);

        if (player) {
            player.hasLeft = true; 
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

    // Add this method to your SessionsService class
    updateSessionGrid(sessionCode: string, newGrid: { images: string[]; isOccuped: boolean }[][]): void {
        const session = this.sessions[sessionCode];
        if (session) {
            session.grid = newGrid;
        }
    }

    updateSessionGridForPlayerLeft(session: Session, clientId: string): void {
        const player = session.players.find((player) => player.socketId === clientId);
        if (player) {
            for (const row of session.grid) {
                for (const cell of row) {
                    if (cell.images && cell.images.includes(player.avatar)) {
                        // Retirer l'avatar du joueur de la cellule
                        cell.images = cell.images.filter((image) => image !== player.avatar);
    
                        // Vérifier s'il reste d'autres avatars de joueurs sur cette cellule
                        const otherPlayerAvatars = session.players
                            .filter(p => p.socketId !== clientId)
                            .map(p => p.avatar);
    
                        const cellHasOtherPlayerAvatar = cell.images.some(image => otherPlayerAvatars.includes(image));
    
                        // Si aucun autre joueur n'est sur cette cellule, supprimer le point de départ
                        if (!cellHasOtherPlayerAvatar) {
                            cell.images = cell.images.filter(image => image !== 'assets/objects/started-points.png');
                            cell.isOccuped = false;
                        }
                    }
                }
            }
        }
    }
  

    getTakenAvatars(session: Session): string[] {
        return session.players.map((player) => player.avatar);
    }
    private isAvatarTaken(session: Session, avatar: string): boolean {
        return session.players.some((player) => player.avatar === avatar);
    }
    private getUniquePlayerName(session: Session, desiredName: string): string {
        let finalName = desiredName;
        let suffix = SUFFIX_NAME_INITIAL;

        while (session.players.some((player) => player.name === finalName)) {
            suffix++;
            finalName = `${desiredName}-${suffix}`;
        }

        return finalName;
    }
}
