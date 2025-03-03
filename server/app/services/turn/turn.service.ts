/* eslint-disable max-lines */
import {
    FIVE_THOUSAND,
    MAX_PERCENTAGE_TO_MOVE,
    MAX_WAIT_FOR_VP,
    MIN_PERCENTAGE_TO_MOVE,
    NEXT_TURN_NOTIFICATION_DELAY,
    THOUSAND,
    THREE_THOUSAND,
    TURN_DURATION,
} from '@app/constants/turn-constants';
import { EventsGateway } from '@app/gateways/events/events.gateway';
import { Player } from '@app/interfaces/player/player.interface';
import { Session } from '@app/interfaces/session/session.interface';
import { ActionService } from '@app/services/action/action.service';
import { MovementService } from '@app/services/movement/movement.service';
import { VirtualPlayerService } from '@app/services/virtual-player/virtual-player.service';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@Injectable()
export class TurnService {
    server: Server;

    private isActionPossible: boolean = false;

    constructor(
        private readonly movementService: MovementService,
        private readonly eventsService: EventsGateway,
        private readonly actionService: ActionService,
        @Inject(forwardRef(() => VirtualPlayerService))
        private readonly virtualPlayerService: VirtualPlayerService,
    ) {}

    startTurn(sessionCode: string, server: Server, sessions: { [key: string]: Session }, startingPlayerSocketId?: string): void {
        const session = sessions[sessionCode];
        if (!session) return;
        session.statistics.totalTurns++;

        this.clearTurnTimer(session);
        session.turnData.timeLeft = TURN_DURATION;
        if (this.isCombatActive(session, server, sessionCode)) return;
        this.setTurnData(session, startingPlayerSocketId);

        setTimeout(() => {
            const currentPlayer = this.getCurrentPlayer(session);
            if (!currentPlayer) return;

            this.resetPlayerSpeed(currentPlayer);
            this.calculateAccessibleTiles(session, currentPlayer);
            this.notifyOthersOfRestrictedTiles(server, session, currentPlayer);
            this.notifyAllPlayersOfNextTurn(server, sessionCode, session);
            this.eventsService.addEventToSession(sessionCode, `Le tour de ${currentPlayer.name} commence.`, ['everyone']);

            if (currentPlayer.isVirtual) {
                this.initiateVirtualPlayerTurn(sessionCode, server, sessions, currentPlayer, session);
            } else {
                this.initiateRealPlayerTurn(sessionCode, server, sessions, currentPlayer, session);
            }
        }, THREE_THOUSAND);
    }

    isCurrentPlayerTurn(session: Session, client: Socket): boolean {
        return session.turnData.currentPlayerSocketId === client.id;
    }

    endTurn(sessionCode: string, server: Server, sessions: { [key: string]: Session }): void {
        const session = sessions[sessionCode];
        const player = this.getCurrentPlayer(session);
        if (!session) return;

        this.clearTurnTimer(session);
        this.notifyPlayerListUpdate(server, sessionCode, session);
        this.notifyTurnEnded(server, sessionCode, session);
        this.resetPlayerSpeed(player);
        server.to(sessionCode).emit('playerListUpdate', { players: session.players });

        if (session.combatData.combatants.length <= 0) {
            this.startTurn(sessionCode, server, sessions);
        }
    }

    sendTimeLeft(sessionCode: string, server: Server, sessions: { [key: string]: Session }): void {
        const session = sessions[sessionCode];
        if (!session) return;
        server.to(sessionCode).emit('timeLeft', {
            timeLeft: session.turnData.timeLeft,
            playerSocketId: session.turnData.currentPlayerSocketId,
        });
    }

    calculateTurnOrder(session: Session, sessionCode: string, server: Server): void {
        const players = this.getSortedPlayersBySpeed(session.players);
        const groupedBySpeed = this.groupPlayersBySpeed(players);
        const sortedPlayers = this.createTurnOrderFromGroups(groupedBySpeed);
        session.players = sortedPlayers;

        session.turnData.turnOrder = sortedPlayers.map((player) => player.socketId);
        session.turnData.currentTurnIndex = -1;
        server.to(sessionCode).emit('playerListUpdate', { players: session.players });
    }

    resumeTurnTimer(sessionCode: string, server: Server, sessions: { [key: string]: Session }): void {
        const session = sessions[sessionCode];
        if (!session || !session.turnData.paused) return;

        session.turnData.paused = false;
        const currentPlayer = this.getCurrentPlayer(session);

        session.turnData.turnTimer = setInterval(() => {
            session.turnData.timeLeft--;

            this.calculateAccessibleTiles(session, currentPlayer);
            this.isActionPossible = this.actionService.checkAvailableActions(currentPlayer, session.grid);

            if (this.isMovementRestricted(currentPlayer) && !this.isActionPossible) {
                this.clearTurnTimer(session);
                server.to(sessionCode).emit('noMovementPossible', { playerName: currentPlayer.name });
                this.endTurn(sessionCode, server, sessions);
                return;
            }

            if (session.turnData.timeLeft <= 0) {
                this.clearTurnTimer(session);
                this.endTurn(sessionCode, server, sessions);
            } else {
                this.sendTimeLeft(sessionCode, server, sessions);
            }
        }, THOUSAND);
    }

    pauseTurnTimer(session: Session): void {
        if (session.turnData.turnTimer) {
            clearInterval(session.turnData.turnTimer);
            session.turnData.turnTimer = null;
        }
        session.turnData.paused = true;
    }

    pauseVirtualPlayerTimer(sessionCode: string, server: Server, sessions: { [key: string]: Session }): void {
        const session = sessions[sessionCode];
        if (!session || !session.turnData.turnTimer) return;

        clearInterval(session.turnData.turnTimer);
        session.turnData.turnTimer = null;
        session.turnData.paused = true;
    }

    resumeVirtualPlayerTimer(sessionCode: string, server: Server, sessions: { [key: string]: Session }): void {
        const session = sessions[sessionCode];
        if (!session || !session.turnData.paused) return;

        session.turnData.paused = false;

        session.turnData.turnTimer = setInterval(() => {
            session.turnData.timeLeft--;

            if (session.turnData.timeLeft <= 0) {
                this.clearTurnTimer(session);
                this.endTurn(sessionCode, server, sessions);
            } else {
                this.sendTimeLeft(sessionCode, server, sessions);
            }
        }, THOUSAND);

        setTimeout(() => {
            if (!session.turnData.paused) {
                this.clearTurnTimer(session);
                this.endTurn(sessionCode, server, sessions);
            }
        }, FIVE_THOUSAND);
    }

    private isCombatActive(session: Session, server: Server, sessionCode: string): boolean {
        if (session.combatData.combatants.length > 0) {
            server.to(sessionCode).emit('turnPaused', { message: 'Le tour est en pause pour le combat en cours.' });
            return true;
        }
        return false;
    }

    private setTurnData(session: Session, startingPlayerSocketId?: string): void {
        if (startingPlayerSocketId) {
            session.turnData.currentTurnIndex = session.turnData.turnOrder.indexOf(startingPlayerSocketId);
        } else {
            this.advanceTurnIndex(session);
        }
        this.setCurrentPlayer(session);
        session.turnData.timeLeft = TURN_DURATION;
    }

    private initiateRealPlayerTurn(
        sessionCode: string,
        server: Server,
        sessions: { [key: string]: Session },
        currentPlayer: Player,
        session: Session,
    ): void {
        this.isActionPossible = this.actionService.checkAvailableActions(currentPlayer, session.grid);

        if (this.isMovementRestricted(currentPlayer) && !this.isActionPossible) {
            this.handleNoMovement(sessionCode, server, sessions, currentPlayer);
            return;
        }

        this.notifyPlayerOfAccessibleTiles(server, sessionCode, currentPlayer);

        this.startTurnTimer(sessionCode, server, sessions, currentPlayer);
    }

    private startTurnTimer(sessionCode: string, server: Server, sessions: { [key: string]: Session }, currentPlayer: Player): void {
        const session = sessions[sessionCode];
        if (!session) return;

        this.clearTurnTimer(session);
        session.turnData.paused = false;

        server.to(sessionCode).emit('turnStarted', {
            playerSocketId: session.turnData.currentPlayerSocketId,
        });

        this.sendTimeLeft(sessionCode, server, sessions);

        session.turnData.turnTimer = setInterval(() => {
            session.turnData.timeLeft--;
            this.calculateAccessibleTiles(session, currentPlayer);
            this.isActionPossible = this.actionService.checkAvailableActions(currentPlayer, session.grid);

            if (this.isMovementRestricted(currentPlayer) && !this.isActionPossible) {
                this.clearTurnTimer(session);
                server.to(sessionCode).emit('noMovementPossible', { playerName: currentPlayer.name });
                this.endTurn(sessionCode, server, sessions);
                return;
            }

            if (session.turnData.timeLeft <= 0) {
                this.clearTurnTimer(session);
                this.endTurn(sessionCode, server, sessions);
            } else {
                this.sendTimeLeft(sessionCode, server, sessions);
            }
        }, THOUSAND);
    }

    private initiateVirtualPlayerTurn(
        sessionCode: string,
        server: Server,
        sessions: { [key: string]: Session },
        currentPlayer: Player,
        session: Session,
    ): void {
        this.startVirtualPlayerTimer(sessionCode, server, sessions, currentPlayer, session);
    }

    private startVirtualPlayerTimer(
        sessionCode: string,
        server: Server,
        sessions: { [key: string]: Session },
        currentPlayer: Player,
        session: Session,
    ): void {
        this.clearTurnTimer(session);

        const turnDuration = TURN_DURATION;
        session.turnData.timeLeft = turnDuration;

        const randomValue = Math.random() * MAX_PERCENTAGE_TO_MOVE + MIN_PERCENTAGE_TO_MOVE;
        const randomExecutionTime = turnDuration - Math.floor(randomValue * MAX_WAIT_FOR_VP);
        server.to(sessionCode).emit('turnStarted', {
            playerSocketId: session.turnData.currentPlayerSocketId,
        });
        this.sendTimeLeft(sessionCode, server, sessions);

        session.turnData.turnTimer = setInterval(() => {
            session.turnData.timeLeft--;
            this.sendTimeLeft(sessionCode, server, sessions);
            if (session.turnData.timeLeft === randomExecutionTime) {
                this.virtualPlayerService.handleVirtualPlayerTurn(sessionCode, server, sessions, currentPlayer, session);
            }

            if (session.turnData.timeLeft <= 0) {
                this.clearTurnTimer(session);
                this.endTurn(sessionCode, server, sessions);
            }
        }, THOUSAND);
    }

    private getSortedPlayersBySpeed(players: Player[]): Player[] {
        return players.slice().sort((a, b) => b.attributes.speed.currentValue - a.attributes.speed.currentValue);
    }

    private groupPlayersBySpeed(players: Player[]): { [key: number]: Player[] } {
        const groupedBySpeed: { [key: number]: Player[] } = {};
        players.forEach((player) => {
            const speed = player.attributes.speed.currentValue;
            if (!groupedBySpeed[speed]) {
                groupedBySpeed[speed] = [];
            }
            groupedBySpeed[speed].push(player);
        });
        return groupedBySpeed;
    }

    private createTurnOrderFromGroups(groupedBySpeed: { [key: number]: Player[] }): Player[] {
        const sortedPlayers: Player[] = [];
        Object.keys(groupedBySpeed)
            .sort((a, b) => parseInt(b, 10) - parseInt(a, 10))
            .forEach((speed) => {
                const group = groupedBySpeed[parseInt(speed, 10)];
                this.shuffle(group);
                sortedPlayers.push(...group);
            });
        return sortedPlayers;
    }

    private shuffle(array: Player[]): void {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    private advanceTurnIndex(session: Session): void {
        session.turnData.currentTurnIndex = (session.turnData.currentTurnIndex + 1) % session.turnData.turnOrder.length;
    }

    private setCurrentPlayer(session: Session): void {
        session.turnData.currentPlayerSocketId = session.turnData.turnOrder[session.turnData.currentTurnIndex];
    }

    private getCurrentPlayer(session: Session): Player | undefined {
        if (!session) return;
        return session.players.find((p) => p.socketId === session.turnData.currentPlayerSocketId);
    }

    private resetPlayerSpeed(player: Player): void {
        if (!player || !player.attributes['speed']) return;
        player.attributes['speed'].currentValue = player.attributes['speed'].baseValue;
    }

    private calculateAccessibleTiles(session: Session, player: Player): void {
        this.movementService.calculateAccessibleTiles(session.grid, player, player.attributes['speed'].currentValue);
    }

    private isMovementRestricted(player: Player): boolean {
        return player.accessibleTiles.length <= 1;
    }

    private handleNoMovement(sessionCode: string, server: Server, sessions: { [key: string]: Session }, player: Player): void {
        server.to(sessionCode).emit('noMovementPossible', { playerName: player.name });
        setTimeout(() => {
            this.endTurn(sessionCode, server, sessions);
        }, THREE_THOUSAND);
    }

    private notifyPlayerOfAccessibleTiles(server: Server, sessionCode: string, player: Player): void {
        server.to(player.socketId).emit('accessibleTiles', { accessibleTiles: player.accessibleTiles });
    }

    private notifyOthersOfRestrictedTiles(server: Server, session: Session, currentPlayer: Player): void {
        session.players
            .filter((player) => player.socketId !== currentPlayer.socketId)
            .forEach((player) => {
                server.to(player.socketId).emit('accessibleTiles', { accessibleTiles: [] });
            });
    }

    private notifyAllPlayersOfNextTurn(server: Server, sessionCode: string, session: Session): void {
        server.to(sessionCode).emit('nextTurnNotification', {
            playerSocketId: session.turnData.currentPlayerSocketId,
            inSeconds: NEXT_TURN_NOTIFICATION_DELAY,
        });
    }

    private notifyPlayerListUpdate(server: Server, sessionCode: string, session: Session): void {
        server.to(sessionCode).emit('playerListUpdate', { players: session.players });
    }

    private notifyTurnEnded(server: Server, sessionCode: string, session: Session): void {
        server.to(sessionCode).emit('turnEnded', {
            playerSocketId: session.turnData.currentPlayerSocketId,
        });
    }

    private clearTurnTimer(session: Session): void {
        if (session.turnData.turnTimer) {
            clearInterval(session.turnData.turnTimer);
            session.turnData.turnTimer = null;
        }
        session.turnData.paused = false;
    }
}
