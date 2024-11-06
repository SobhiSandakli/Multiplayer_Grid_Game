import { Injectable } from '@nestjs/common';
import { Session } from '@app/interfaces/session/session.interface';
import { Server } from 'socket.io';
import { Player } from '@app/interfaces/player/player.interface';
import { MovementService } from '@app/services/movement/movement.service';
import { EventsGateway } from '@app/services/events/events.service';
import { ActionService } from '@app/services/action/action.service';

const TURN_DURATION = 30;
const NEXT_TURN_NOTIFICATION_DELAY = 3;
const THOUSAND = 1000;
const THREE_THOUSAND = 3000;

@Injectable()
export class TurnService {
    constructor(
        private movementService: MovementService,
        private eventsService: EventsGateway,
        private actionService: ActionService,
    ) {}
    private isActionPossible: boolean = false;

    calculateTurnOrder(session: Session): void {
        const players = this.getSortedPlayersBySpeed(session.players);
        const groupedBySpeed = this.groupPlayersBySpeed(players);
        const sortedPlayers = this.createTurnOrderFromGroups(groupedBySpeed);

        session.turnOrder = sortedPlayers.map((player) => player.socketId);
        session.currentTurnIndex = -1;
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
            .sort((a, b) => parseInt(b) - parseInt(a))
            .forEach((speed) => {
                const group = groupedBySpeed[parseInt(speed)];
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

    startTurn(sessionCode: string, server: Server, sessions: { [key: string]: Session }, startingPlayerSocketId?: string): void {
        const session = sessions[sessionCode];
        if (!session) return;
        if (session.combat.length > 0) {
            server.to(sessionCode).emit('turnPaused', { message: 'Le tour est en pause pour le combat en cours.' });
            return;
        }
        if (startingPlayerSocketId) {
            session.currentTurnIndex = session.turnOrder.indexOf(startingPlayerSocketId);
        } else {
            this.advanceTurnIndex(session);
        }
        this.setCurrentPlayer(session);
        session.timeLeft = TURN_DURATION;

        const currentPlayer = this.getCurrentPlayer(session);
        if (currentPlayer) {
            this.resetPlayerSpeed(currentPlayer);
            this.calculateAccessibleTiles(session, currentPlayer);

            this.isActionPossible = this.actionService.checkAvailableActions(currentPlayer, session.grid);
            if (this.isMovementRestricted(currentPlayer) && !this.isActionPossible) {
                this.handleNoMovement(sessionCode, server, sessions, currentPlayer);
                return;
            }
            this.eventsService.addEventToSession(sessionCode, 'Le tour de ' + currentPlayer.name + ' commence.', ['everyone']);
            this.notifyPlayerOfAccessibleTiles(server, sessionCode, currentPlayer);
            this.notifyOthersOfRestrictedTiles(server, session, currentPlayer);
            this.notifyAllPlayersOfNextTurn(server, sessionCode, session);

            setTimeout(() => {
                this.startTurnTimer(sessionCode, server, sessions, currentPlayer);
            }, THREE_THOUSAND);
        }
    }

    // Avance l'index du tour au joueur suivant
    private advanceTurnIndex(session: Session): void {
        session.currentTurnIndex = (session.currentTurnIndex + 1) % session.turnOrder.length;
    }

    // Définit le joueur courant et met à jour son socketId dans la session
    private setCurrentPlayer(session: Session): void {
        session.currentPlayerSocketId = session.turnOrder[session.currentTurnIndex];
    }

    // Récupère le joueur courant
    private getCurrentPlayer(session: Session): Player | undefined {
        return session.players.find((p) => p.socketId === session.currentPlayerSocketId);
    }

    // Réinitialise la vitesse du joueur à sa valeur de base
    private resetPlayerSpeed(player: Player): void {
        player.attributes['speed'].currentValue = player.attributes['speed'].baseValue;
    }

    // Calcule les cases accessibles pour le joueur
    private calculateAccessibleTiles(session: Session, player: Player): void {
        this.movementService.calculateAccessibleTiles(session.grid, player, player.attributes['speed'].currentValue);
    }

    // Vérifie si le joueur n'a pas de mouvement possible
    private isMovementRestricted(player: Player): boolean {
        return player.accessibleTiles.length <= 1;
    }

    // Gère le cas où le joueur n'a pas de mouvements possibles
    private handleNoMovement(sessionCode: string, server: Server, sessions: { [key: string]: Session }, player: Player): void {
        server.to(sessionCode).emit('noMovementPossible', { playerName: player.name });
        setTimeout(() => {
            this.endTurn(sessionCode, server, sessions);
        }, THREE_THOUSAND);
    }

    // Notifie le joueur courant de ses cases accessibles
    private notifyPlayerOfAccessibleTiles(server: Server, sessionCode: string, player: Player): void {
        server.to(player.socketId).emit('accessibleTiles', { accessibleTiles: player.accessibleTiles });
    }

    // Notifie les autres joueurs que leurs cases accessibles sont vides
    private notifyOthersOfRestrictedTiles(server: Server, session: Session, currentPlayer: Player): void {
        session.players
            .filter((player) => player.socketId !== currentPlayer.socketId)
            .forEach((player) => {
                server.to(player.socketId).emit('accessibleTiles', { accessibleTiles: [] });
            });
    }

    // Notifie tous les joueurs du prochain tour
    private notifyAllPlayersOfNextTurn(server: Server, sessionCode: string, session: Session): void {
        server.to(sessionCode).emit('nextTurnNotification', {
            playerSocketId: session.currentPlayerSocketId,
            inSeconds: NEXT_TURN_NOTIFICATION_DELAY,
        });
    }

    // Démarre le minuteur du tour
    private startTurnTimer(sessionCode: string, server: Server, sessions: { [key: string]: Session }, currentPlayer: Player): void {
        const session = sessions[sessionCode];
        server.to(sessionCode).emit('turnStarted', {
            playerSocketId: session.currentPlayerSocketId,
        });
        this.sendTimeLeft(sessionCode, server, sessions);

        session.turnTimer = setInterval(() => {
            session.timeLeft--;

            this.calculateAccessibleTiles(session, currentPlayer);
            this.isActionPossible = this.actionService.checkAvailableActions(currentPlayer, session.grid);
            if (this.isMovementRestricted(currentPlayer) && !this.isActionPossible) {
                server.to(sessionCode).emit('noMovementPossible', { playerName: currentPlayer.name });
                this.endTurn(sessionCode, server, sessions);
                return;
            }

            if (session.timeLeft <= 0) {
                this.endTurn(sessionCode, server, sessions);
            } else {
                this.sendTimeLeft(sessionCode, server, sessions);
            }
        }, THOUSAND); // Mise à jour chaque seconde
    }

    endTurn(sessionCode: string, server: Server, sessions: { [key: string]: Session }): void {
        const session = sessions[sessionCode];
        if (!session) return;

        this.clearTurnTimer(session);
        // this.resetPlayerAttributes(session);
        this.notifyPlayerListUpdate(server, sessionCode, session);
        this.notifyTurnEnded(server, sessionCode, session);
        // Ne pas démarrer un nouveau tour si un combat est en cours

        if (session.combat.length <= 0) {
            this.startTurn(sessionCode, server, sessions);
        }
    }

    // Méthode pour arrêter le timer du tour
    clearTurnTimer(session: Session): void {
        if (session.turnTimer) {
            clearInterval(session.turnTimer);
            session.turnTimer = null;
        }
    }

    // Méthode pour notifier la mise à jour de la liste des joueurs
    private notifyPlayerListUpdate(server: Server, sessionCode: string, session: Session): void {
        server.to(sessionCode).emit('playerListUpdate', { players: session.players });
    }

    // Méthode pour notifier la fin du tour
    private notifyTurnEnded(server: Server, sessionCode: string, session: Session): void {
        server.to(sessionCode).emit('turnEnded', {
            playerSocketId: session.currentPlayerSocketId,
        });
    }

    sendTimeLeft(sessionCode: string, server: Server, sessions: { [key: string]: Session }): void {
        const session = sessions[sessionCode];
        if (!session) return;

        server.to(sessionCode).emit('timeLeft', {
            timeLeft: session.timeLeft,
            playerSocketId: session.currentPlayerSocketId,
        });
    }
}
