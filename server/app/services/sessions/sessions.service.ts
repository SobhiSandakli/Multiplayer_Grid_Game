import { FIFTY_PERCENT, MAX_SESSION_CODE, MIN_SESSION_CODE, SUFFIX_NAME_INITIAL } from '@app/constants/session-constants';
import { CharacterData } from '@app/interfaces/character-data/character-data.interface';
import { Player } from '@app/interfaces/player/player.interface';
import { GridCell } from '@app/interfaces/session/grid.interface';
import { Session } from '@app/interfaces/session/session.interface';
import { ChangeGridService } from '@app/services/grid/changeGrid.service';
import { TurnService } from '@app/services/turn/turn.service';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { CombatService } from '@app/services/combat/combat.service';
import { AVATARS, INITIAL_ATTRIBUTES } from '@app/constants/avatars-constants';
import { VIRTUAL_PLAYER_NAMES } from '@app/constants/virtual-players-name.constants';

@Injectable()
export class SessionsService {
    private sessions: { [key: string]: Session } = {};

    constructor(
        private readonly turnService: TurnService,
        private readonly changeGridService: ChangeGridService,
        @Inject(forwardRef(() => CombatService))
        private readonly combatService: CombatService,
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
            timeLeft: session.turnData.timeLeft,
            playerSocketId: session.turnData.currentPlayerSocketId,
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
    createNewSession(clientId: string, maxPlayers: number, selectedGameID: string, mode: string): string {
        const sessionCode = this.generateUniqueSessionCode();
        const ctf = mode === 'Classique' ? false : true;

        const session: Session = {
            organizerId: clientId,
            locked: false,
            maxPlayers,
            players: [],
            selectedGameID,

            // Initial empty grid
            grid: [] as GridCell[][],

            // Turn-related data
            turnData: {
                turnOrder: [],
                currentTurnIndex: -1,
                currentPlayerSocketId: null,
                turnTimer: null,
                timeLeft: 0,
            },

            // Combat-related data
            combatData: {
                combatants: [],
                turnIndex: 0,
                turnTimer: null,
                timeLeft: 0,
                lastAttackResult: null,
            },
            ctf,
            statistics: {
                gameDuration: '00:00',
                totalTurns: 0,
                totalTerrainTiles: 0,
                visitedTerrains: new Set<string>(),
                totalDoors: 0,
                manipulatedDoors: new Set<string>(),
                uniqueFlagHolders: new Set<string>(),
                visitedTerrainsArray: [],
                manipulatedDoorsArray: [],
                uniqueFlagHoldersArray: [],
            },
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
            isVirtual: false,
            inventory: [],
            statistics: {
                combats: 0,
                evasions: 0,
                victories: 0,
                defeats: 0,
                totalLifeLost: 0,
                totalLifeRemoved: 0,
                uniqueItems: new Set<string>(),
                tilesVisited: new Set<string>(),
                uniqueItemsArray: [],
                tilesVisitedArray: [],
            },
        };
        session.players.push(newPlayer);
    }

    isSessionFull(session: Session): boolean {
        return session.players.length >= session.maxPlayers;
    }
    removePlayerFromSession(clientId: string, sessionCode: string, server: Server): boolean {
        const session = this.getSession(sessionCode);
        const index = session.players.findIndex((p) => p.socketId === clientId);
        const player = session.players.find((p) => p.socketId === clientId);
        if (player || index !== -1) {
            player.hasLeft = true;
            session.players.splice(index, 1);
            session.turnData.turnOrder = session.turnData.turnOrder.filter((id) => id !== clientId);
            this.changeGridService.removePlayerAvatar(session.grid, player);

            if (session.turnData.currentTurnIndex >= session.turnData.turnOrder.length) {
                session.turnData.currentTurnIndex = 0;
            }
            if (session.combatData.combatants.find((combatant) => combatant.socketId === clientId)) {
                this.removePlayerFromCombat(session, clientId, sessionCode, server);
            }
            if (session.turnData.currentPlayerSocketId === clientId) {
                this.endTurn(sessionCode, server);
            }

            return true;
        }
        return false;
    }

    removePlayerFromCombat(session: Session, clientId: string, sessionCode: string, server: Server): void {
        const winner = session.combatData.combatants.find((combatant) => combatant.socketId !== clientId);
        const loser = session.combatData.combatants.find((combatant) => combatant.socketId === clientId);
        this.combatService.finalizeCombat(sessionCode, winner, loser, 'win', server);
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
    updateSessionGrid(sessionCode: string, newGrid: { images: string[]; isOccuped: boolean }[][]): void {
        const session = this.sessions[sessionCode];
        if (session) {
            session.grid = newGrid;
        }
    }

    getTakenAvatars(session: Session): string[] {
        return session.players.map((player) => player.avatar);
    }

    getAvailableAvatars(session: Session): string[] {
        const takenAvatars = this.getTakenAvatars(session);
        return AVATARS.filter((avatar) => !takenAvatars.includes(avatar));
    }

    createVirtualPlayer(sessionCode: string, playerType: 'Aggressif' | 'Défensif'): { session: Session; virtualPlayer: Player } {
        const session = this.getSession(sessionCode);
        if (!session) {
            throw new Error('Session introuvable.');
        }

        if (this.isSessionFull(session)) {
            throw new Error('La session est déjà pleine.');
        }

        const randomNameIndex = Math.floor(Math.random() * VIRTUAL_PLAYER_NAMES.length);
        const virtualPlayerName = this.getUniquePlayerName(session, VIRTUAL_PLAYER_NAMES[randomNameIndex]);
        const availableAvatar = this.getRandomAvailableAvatar(session);

        if (!availableAvatar) {
            throw new Error('Aucun avatar disponible.');
        }

        const characterAttributes = this.getCharacterAttributes(playerType);

        const virtualPlayer: Player = this.createPlayer(virtualPlayerName, availableAvatar, characterAttributes, playerType);

        session.players.push(virtualPlayer);

        return { session, virtualPlayer };
    }

    private getCharacterAttributes(playerType: 'Aggressif' | 'Défensif'): typeof INITIAL_ATTRIBUTES {
        const attributes = { ...INITIAL_ATTRIBUTES };

        if (playerType === 'Aggressif') {
            attributes.attack.dice = 'D6';
            attributes.defence.dice = 'D4';
        } else if (playerType === 'Défensif') {
            attributes.defence.dice = 'D6';
            attributes.attack.dice = 'D4';
        }

        const randomAttribute = Math.random() < FIFTY_PERCENT ? 'life' : 'speed';
        attributes[randomAttribute].currentValue += 2;
        attributes[randomAttribute].baseValue += 2;
        return attributes;
    }

    private getRandomAvailableAvatar(session: Session): string | null {
        const availableAvatars = this.getAvailableAvatars(session);
        if (availableAvatars.length === 0) {
            return null;
        }
        return availableAvatars[Math.floor(Math.random() * availableAvatars.length)];
    }

    private createPlayer(name: string, avatar: string, attributes: typeof INITIAL_ATTRIBUTES, type: string): Player {
        return {
            socketId: `virtual-${Date.now()}`,
            name,
            avatar,
            attributes,
            isOrganizer: false,
            position: { row: 0, col: 0 },
            accessibleTiles: [],
            isVirtual: true,
            type,
            inventory: [],
            statistics: {
                combats: 0,
                evasions: 0,
                victories: 0,
                defeats: 0,
                totalLifeLost: 0,
                totalLifeRemoved: 0,
                uniqueItems: new Set<string>(),
                tilesVisited: new Set<string>(),
                uniqueItemsArray: [],
                tilesVisitedArray: [],
            },
        };
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
