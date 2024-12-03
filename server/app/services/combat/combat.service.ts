import { COMBAT_WIN_THRESHOLD, DELAY_BEFORE_NEXT_TURN } from '@app/constants/session-gateway-constants';
import { EventsGateway } from '@app/gateways/events/events.gateway';
import { Player } from '@app/interfaces/player/player.interface';
import { Session } from '@app/interfaces/session/session.interface';
import { FightService } from '@app/services/fight/fight.service';
import { ChangeGridService } from '@app/services/grid/changeGrid.service';
import { SessionsService } from '@app/services/sessions/sessions.service';
import { TurnService } from '@app/services/turn/turn.service';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class CombatService {
    constructor(
        @Inject(forwardRef(() => SessionsService))
        private readonly sessionsService: SessionsService,
        private readonly fightService: FightService,
        private readonly eventsService: EventsGateway,
        private readonly changeGridService: ChangeGridService,
        @Inject(forwardRef(() => TurnService))
        private readonly turnService: TurnService,
    ) {}

    initiateCombat(sessionCode: string, initiatingPlayer: Player, opponentPlayer: Player, server: Server): void {
        const session = this.sessionsService.getSession(sessionCode);
        if (!session) return;
        initiatingPlayer.statistics.combats += 1;
        opponentPlayer.statistics.combats += 1;
        this.setupCombatData(session, initiatingPlayer, opponentPlayer);
        this.fightService.notifyCombatStart(server, initiatingPlayer, opponentPlayer);
        this.notifySpectators(server, session, initiatingPlayer, opponentPlayer);
        this.fightService.startCombat(sessionCode, server, session);
        this.eventsService.addEventToSession(sessionCode, `Le combat entre ${initiatingPlayer.name} et ${opponentPlayer.name} a commencé.`, [
            'everyone',
        ]);
        if (session.turnData.currentPlayerSocketId === initiatingPlayer.socketId) {
            if (initiatingPlayer.isVirtual) {
                this.turnService.pauseVirtualPlayerTimer(sessionCode, server, this.sessionsService['sessions']);
            } else {
                this.turnService.pauseTurnTimer(session);
            }
        }
    }

    executeAttack(sessionCode: string, attacker: Player, opponent: Player, server: Server): void {
        const session = this.sessionsService.getSession(sessionCode);
        if (!session) return;

        const attackResult = this.fightService.calculateAttack(attacker, opponent, session);
        this.processAttackResult(attackResult, attacker, opponent, server, sessionCode);
    }

    attemptEvasion(sessionCode: string, player: Player, server: Server): void {
        const session = this.sessionsService.getSession(sessionCode);
        if (!session) return;

        const evasionSuccess = this.fightService.calculateEvasion(player);
        this.processEvasionResult(evasionSuccess, sessionCode, player, server, session);
    }

    finalizeCombat(sessionCode: string, winner: Player | null, loser: Player | null, reason: 'win' | 'evasion', server: Server): void {
        const session = this.sessionsService.getSession(sessionCode);
        if (!session) return;

        if (reason === 'win' && winner && loser) {
            this.processWinCondition(winner, loser, session, server, sessionCode);
            this.eventsService.addEventToSession(
                sessionCode,
                `Le combat entre ${winner.name} et ${loser.name} est terminé et ${winner.name} a gagné.`,
                ['everyone'],
            );
        } else if (reason === 'evasion' && loser) {
            loser.statistics.evasions += 1;
            this.processEvasionCondition(loser, session, server, sessionCode);
            this.eventsService.addEventToSession(sessionCode, `Le combat est terminé et ${loser.name} a réussi à s'échapper.`, ['everyone']);
        }

        this.resetCombatData(session, sessionCode, server, winner, loser);

        const currentPlayer = winner || loser;
        if (currentPlayer?.isVirtual) {
            if (currentPlayer === winner) {
                this.turnService.resumeVirtualPlayerTimer(sessionCode, server, this.sessionsService['sessions']);
            } else {
                this.turnService.endTurn(sessionCode, server, this.sessionsService['sessions']);
            }
        } else {
            if (currentPlayer === winner) {
                this.turnService.resumeTurnTimer(sessionCode, server, this.sessionsService['sessions']);
            } else {
                this.turnService.endTurn(sessionCode, server, this.sessionsService['sessions']);
            }
        }
    }

    private setupCombatData(session: Session, initiatingPlayer: Player, opponentPlayer: Player): void {
        session.combatData.combatants = [initiatingPlayer, opponentPlayer];
    }

    private notifySpectators(server: Server, session: Session, initiatingPlayer: Player, opponentPlayer: Player): void {
        session.players
            .filter((player) => player.socketId !== initiatingPlayer.socketId && player.socketId !== opponentPlayer.socketId)
            .forEach((player) => {
                server.to(player.socketId).emit('combatNotification', {
                    player1: { avatar: initiatingPlayer.avatar, name: initiatingPlayer.name },
                    player2: { avatar: opponentPlayer.avatar, name: opponentPlayer.name },
                    combat: true,
                });
            });
    }

    private processAttackResult(attackResult, attacker: Player, opponent: Player, server: Server, sessionCode: string): void {
        const session = this.sessionsService.getSession(sessionCode);
        if (!session) return;
        const { success } = attackResult;

        session.combatData.lastAttackResult = {
            success,
            target: opponent,
            attacker,
        };
        if (success) {
            opponent.attributes['life'].currentValue -= 1;
            opponent.statistics.totalLifeLost += 1;
            attacker.statistics.totalLifeRemoved += 1;
            if (opponent.attributes['life'].currentValue <= 0) {
                this.finalizeCombat(sessionCode, attacker, opponent, 'win', server);
                return;
            }
        }

        server.to(attacker.socketId).emit('updateLifePoints', {
            playerLife: attacker.attributes['life'].currentValue,
            opponentLife: opponent.attributes['life'].currentValue,
        });
        server.to(opponent.socketId).emit('updateLifePoints', {
            playerLife: opponent.attributes['life'].currentValue,
            opponentLife: attacker.attributes['life'].currentValue,
        });

        this.eventsService.addEventToSession(sessionCode, `${attacker.name} attempts an attack on ${opponent.name}`, [attacker.name, opponent.name]);
        this.eventsService.addEventToSession(sessionCode, `Attack result: ${success ? 'success' : 'failure'}`, [attacker.name, opponent.name]);

        server.to(attacker.socketId).emit('attackResult', attackResult);
        server.to(opponent.socketId).emit('attackResult', attackResult);
        server.to(sessionCode).emit('playerListUpdate', { players: session.players });

        this.fightService.endCombatTurn(sessionCode, server, session);
    }

    private processEvasionResult(evasionSuccess: boolean, sessionCode: string, player: Player, server: Server, session): void {
        const opponent = session.combatData.combatants.find((combatant) => combatant.socketId !== player.socketId);

        server.to(player.socketId).emit('evasionResult', { success: evasionSuccess });
        server.to(sessionCode).emit('playerListUpdate', { players: session.players });
        this.eventsService.addEventToSession(sessionCode, `${player.name} attempts to evade.`, [player.name, opponent?.name]);
        this.eventsService.addEventToSession(sessionCode, `Evasion result: ${evasionSuccess ? 'success' : 'failure'}`, [player.name, opponent?.name]);

        if (evasionSuccess) {
            this.finalizeCombat(sessionCode, null, player, 'evasion', server);
        } else {
            this.fightService.endCombatTurn(sessionCode, server, session);
        }
    }

    private processWinCondition(winner: Player, loser: Player, session, server: Server, sessionCode: string): void {
        const targetPosition = loser.initialPosition;
        this.changeGridService.moveImage(session.grid, { row: loser.position.row, col: loser.position.col }, targetPosition, loser.avatar);
        if (loser.inventory.length > 0) {
            const itemsToDrop = [...loser.inventory];
            loser.inventory = [];

            const nearestPositions = this.changeGridService.findNearestTerrainTiles(loser.position, session.grid, itemsToDrop.length);

            this.changeGridService.addItemsToGrid(session.grid, nearestPositions, itemsToDrop);
            server.to(sessionCode).emit('gridArray', { sessionCode, grid: session.grid });
            server.to(loser.socketId).emit('updateInventory', { inventory: loser.inventory });
        }
        winner.attributes['combatWon'].currentValue += 1;
        winner.statistics.victories += 1;
        loser.statistics.defeats += 1;
        loser.position = loser.initialPosition;

        server.to(loser.socketId).emit('defeated', { message: 'Vous avez été vaincu.', winner: winner.name, combatEnded: true });
        server.to(winner.socketId).emit('opponentDefeated', { message: 'Vous avez vaincu votre adversaire.', loser: loser.name, combatEnded: true });

        winner.attributes['life'].currentValue = winner.attributes['life'].baseValue;
        loser.attributes['life'].currentValue = loser.attributes['life'].baseValue;

        this.notifySpectatorsCombatEnd(winner, loser, server, sessionCode);
        this.eventsService.addEventToSession(sessionCode, `Combat between ${winner.name} and ${loser.name} ended.`, ['everyone']);
        this.eventsService.addEventToSession(sessionCode, `${winner.name} a gagné.`, ['everyone']);
        server.to(sessionCode).emit('playerListUpdate', { players: session.players });
    }

    private processEvasionCondition(loser: Player, session, server: Server, sessionCode: string): void {
        server.to(loser.socketId).emit('evasionSuccessful', { message: `${loser.name} a réussi à s'échapper.`, combatEnded: true });

        const opponent = session.combatData.combatants.find((player) => player.socketId !== loser.socketId);
        if (opponent) {
            server.to(opponent.socketId).emit('opponentEvaded', { message: `${loser.name} a réussi à s'échapper.`, combatEnded: true });
        }

        this.notifySpectatorsCombatEnd(loser, null, server, sessionCode, 'evasion');
        this.eventsService.addEventToSession(sessionCode, `${loser.name} a pu s'échapper.`, ['everyone']);
    }

    private notifySpectatorsCombatEnd(
        player1: Player,
        player2: Player,
        server: Server,
        sessionCode: string,
        result: 'win' | 'evasion' = 'win',
    ): void {
        const session = this.sessionsService.getSession(sessionCode);
        if (!session) return;
        session.players
            .filter((player) => player.socketId !== player1.socketId && (player2 ? player.socketId !== player2.socketId : true))
            .forEach((player) => {
                server.to(player.socketId).emit('combatNotification', {
                    player1: { name: player1.name, avatar: player1.avatar },
                    player2: player2 ? { name: player2.name, avatar: player2.avatar } : undefined,
                    combat: false,
                    result,
                    combatEnded: true,
                });
            });
    }

    private resetCombatData(session: Session, sessionCode: string, server: Server, winner: Player | null, loser: Player | null): void {
        session.combatData.combatants = [];
        if (winner) {
            winner.attributes['nbEvasion'].currentValue = winner.attributes['nbEvasion'].baseValue;
        }
        if (loser) {
            loser.attributes['nbEvasion'].currentValue = loser.attributes['nbEvasion'].baseValue;
        }
        const winningPlayer = session.players.find((player) => player.attributes['combatWon'].currentValue >= COMBAT_WIN_THRESHOLD);
        if (winningPlayer && !session.ctf) {
            for (const player of session.players) {
                player.statistics.uniqueItemsArray = Array.from(player.statistics.uniqueItems);
                player.statistics.tilesVisitedArray = Array.from(player.statistics.tilesVisited);
            }
            session.statistics.visitedTerrainsArray = Array.from(session.statistics.visitedTerrains);
            session.statistics.uniqueFlagHoldersArray = Array.from(session.statistics.uniqueFlagHolders);
            session.statistics.manipulatedDoorsArray = Array.from(session.statistics.manipulatedDoors);
            session.statistics.endTime = new Date();
            session.players.push(...session.abandonedPlayers);
            server.to(sessionCode).emit('gameEnded', { winner: winningPlayer.name, players: session.players, sessionStatistics: session.statistics });
            this.eventsService.addEventToSession(sessionCode, `${winningPlayer.name} wins with 3 victories!`, ['everyone']);
            setTimeout(() => this.sessionsService.terminateSession(sessionCode), DELAY_BEFORE_NEXT_TURN);
            return;
        }
        this.fightService.endCombat(sessionCode, server, session);
    }
}
