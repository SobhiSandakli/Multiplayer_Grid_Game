import { CharacterData } from '@app/interfaces/character-data/character-data.interface';
import { Player } from '@app/interfaces/player/player.interface';
import { Session } from '@app/interfaces/session/session.interface';
import { ChangeGridService } from '@app/services/grid/changeGrid.service';
import { TurnService } from '@app/services/turn/turn.service';
import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
const SUFFIX_NAME_INITIAL = 1;
const MIN_SESSION_CODE = 1000;
const MAX_SESSION_CODE = 9000;

@Injectable()
export class SessionsService {
    private sessions: { [key: string]: Session } = {};

    constructor(
        private readonly turnService: TurnService,
        private readonly changeGridService: ChangeGridService,
    ) {}
    calculateTurnOrder(session: Session): void {
        this.turnService.calculateTurnOrder(session);
    }

    startTurn(sessionCode: string, server: Server): void {
        this.turnService.startTurn(sessionCode, server, this.sessions);
    }

    endTurn(sessionCode: string, server: Server): void {
        this.turnService.endTurn(sessionCode, server, this.sessions);
    }

    sendTimeLeft(sessionCode: string, server: Server): void {
        const session = this.sessions[sessionCode];
        if (!session) return;

        server.to(sessionCode).emit('timeLeft', {
            timeLeft: session.timeLeft,
            playerSocketId: session.currentPlayerSocketId,
        });
    }
    findPlayerBySocketId(session: Session, clientId: string): Player | undefined {
        return session.players.find((player) => player.socketId === clientId);
    }

    getSession(sessionCode: string): Session | undefined {
        return this.sessions[sessionCode];
    }

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
            turnOrder: [],
            currentTurnIndex: -1,
            currentPlayerSocketId: null,
            turnTimer: null,
            timeLeft: 0,
            combat: [],
            combatTurnIndex: 0,
            combatTurnTimer: null,
            combatTimeLeft: 0,
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
        characterData.attributes['speed'].baseValue = characterData.attributes['speed'].currentValue;
        characterData.attributes['life'].baseValue = characterData.attributes['life'].currentValue;
        const newPlayer: Player = {
            socketId: client.id,
            name,
            avatar: characterData.avatar,
            attributes: characterData.attributes,
            isOrganizer: session.players.length === 0,
            position: { row: 0, col: 0 },
            accessibleTiles: [],
        };
        session.players.push(newPlayer);
    }

    isSessionFull(session: Session): boolean {
        return session.players.length >= session.maxPlayers;
    }
    removePlayerFromSession(session: Session, clientId: string): boolean {
        const index = session.players.findIndex((p) => p.socketId === clientId);
        const player = session.players.find((p) => p.socketId === clientId);

        if (player || index !== -1) {
            player.hasLeft = true;
            session.players.splice(index, 1);
            session.turnOrder = session.turnOrder.filter((id) => id !== clientId);

            this.changeGridService.removePlayerAvatar(session.grid, player);

            if (session.currentTurnIndex >= session.turnOrder.length) {
                session.currentTurnIndex = 0;
            }
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
