import { COMBAT_WIN_THRESHOLD, DELAY_BEFORE_NEXT_TURN } from '@app/constants/session-gateway-constants';
import { EventsGateway } from '@app/gateways/events/events.gateway';
import { Player } from '@app/interfaces/player/player.interface';
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

    /**
     * Initiates combat between two players, setting up the combat data,
     * notifying the players and other spectators, and starting the combat.
     */
    initiateCombat(sessionCode: string, initiatingPlayer: Player, opponentPlayer: Player, server: Server): void {
        const session = this.sessionsService.getSession(sessionCode);
        if (!session) return;
        const sessions = this.sessionsService['sessions'];
        initiatingPlayer.statistics.combats += 1;
        opponentPlayer.statistics.combats += 1;
        this.setupCombatData(session, initiatingPlayer, opponentPlayer);
        this.turnService.endTurn(sessionCode, server, sessions);
        this.fightService.notifyCombatStart(server, initiatingPlayer, opponentPlayer);
        this.notifySpectators(server, session, initiatingPlayer, opponentPlayer);
        this.fightService.startCombat(sessionCode, server, session);
        this.eventsService.addEventToSession(sessionCode, `Le combat entre ${initiatingPlayer.name} et ${opponentPlayer.name} a commencé.`, [
            'everyone',
        ]);
    }

    /**
     * Executes an attack during combat. Calculates the attack result, updates player health and life points,
     * emits events to update the UI, and potentially ends the combat if a player is defeated.
     */
    executeAttack(sessionCode: string, attacker: Player, opponent: Player, server: Server): void {
        const session = this.sessionsService.getSession(sessionCode);
        if (!session) return;

        const attackResult = this.fightService.calculateAttack(attacker, opponent, session);
        this.processAttackResult(attackResult, attacker, opponent, server, sessionCode);
    }

    /**
     * Attempts an evasion action for the player during combat. Updates evasion status and possibly ends the combat.
     */
    attemptEvasion(sessionCode: string, player: Player, server: Server): void {
        const session = this.sessionsService.getSession(sessionCode);
        if (!session) return;

        const evasionSuccess = this.fightService.calculateEvasion(player);
        this.processEvasionResult(evasionSuccess, sessionCode, player, server, session);
    }

    /**
     * Finalizes the combat scenario, either after a player wins or an evasion action succeeds.
     * Updates player attributes, notifies participants, and resets combat data.
     */
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
            this.eventsService.addEventToSession(sessionCode, `Le combat entre est terminé et ${loser.name} a réussi à s'échapper.`, ['everyone']);
        }

        this.resetCombatData(session, sessionCode, server, winner);
    }

    /**
     * Sets up initial combat data with the two combatants in the session.
     */
    private setupCombatData(session, initiatingPlayer, opponentPlayer): void {
        session.combatData.combatants = [initiatingPlayer, opponentPlayer];
    }

    /**
     * Notifies spectators (other players in the session) that combat has started between two players.
     */
    private notifySpectators(server: Server, session, initiatingPlayer: Player, opponentPlayer: Player): void {
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

    /**
     * Processes the result of an attack, updating player health and attributes.
     * If the opponent's health reaches 0, it finalizes the combat.
     */
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

    /**
     * Processes the result of an evasion attempt.
     * If successful, finalizes the combat; otherwise, ends the combat turn.
     */
    private processEvasionResult(evasionSuccess: boolean, sessionCode: string, player: Player, server: Server, session): void {
        const opponent = session.combatData.combatants.find((combatant) => combatant.socketId !== player.socketId);

        server.to(player.socketId).emit('evasionResult', { success: evasionSuccess });
        this.eventsService.addEventToSession(sessionCode, `${player.name} attempts to evade.`, [player.name, opponent?.name]);
        this.eventsService.addEventToSession(sessionCode, `Evasion result: ${evasionSuccess ? 'success' : 'failure'}`, [player.name, opponent?.name]);

        if (evasionSuccess) {
            this.finalizeCombat(sessionCode, null, player, 'evasion', server);
        } else {
            this.fightService.endCombatTurn(sessionCode, server, session);
        }
    }

    /**
     * Processes a winning condition for the combat. Updates player positions, attributes, and notifies the players and spectators.
     */
    private processWinCondition(winner: Player, loser: Player, session, server: Server, sessionCode: string): void {
        this.changeGridService.moveImage(session.grid, { row: loser.position.row, col: loser.position.col }, loser.initialPosition, loser.avatar);
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
    }

    /**
     * Processes a successful evasion condition, notifying participants and spectators that the player has escaped.
     */
    private processEvasionCondition(loser: Player, session, server: Server, sessionCode: string): void {
        server.to(loser.socketId).emit('evasionSuccessful', { message: `${loser.name} a réussi à s'échapper.`, combatEnded: true });

        const opponent = session.combatData.combatants.find((player) => player.socketId !== loser.socketId);
        if (opponent) {
            server.to(opponent.socketId).emit('opponentEvaded', { message: `${loser.name} a réussi à s'échapper.`, combatEnded: true });
        }

        this.notifySpectatorsCombatEnd(loser, null, server, sessionCode, 'evasion');
        this.eventsService.addEventToSession(sessionCode, `${loser.name} a pu s'échapper.`, ['everyone']);
    }

    /**
     * Notifies spectators that the combat has ended, updating them on the result.
     */
    private notifySpectatorsCombatEnd(player1, player2, server: Server, sessionCode: string, result: 'win' | 'evasion' = 'win'): void {
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

    /**
     * Resets combat data after combat ends. Checks if there's a winner who reached the win threshold, ends the game if so,
     * otherwise starts the next turn or ends combat.
     */
    private resetCombatData(session, sessionCode: string, server: Server, winner: Player | null): void {
        session.combatData.combatants = [];

        const winningPlayer = session.players.find((player) => player.attributes['combatWon'].currentValue >= COMBAT_WIN_THRESHOLD);
        if (winningPlayer && !session.ctf) {
            for (const player of session.players) {
                player.statistics.uniqueItemsArray = Array.from(player.statistics.uniqueItems);
                player.statistics.tilesVisitedArray = Array.from(player.statistics.tilesVisited);
            }
            session.statistics.visitedTerrainsArray = Array.from(session.statistics.visitedTerrains);
            session.statistics.uniqueFlagHoldersArray = Array.from(session.statistics.uniqueFlagHolders);
            session.statistics.manipulatedDoorsArray = Array.from(session.statistics.manipulatedDoors);
            session.players.push(...session.abandonedPlayers)
            server.to(sessionCode).emit('gameEnded', { winner: winningPlayer.name, players: session.players, sessionStatistics: session.statistics });
            this.eventsService.addEventToSession(sessionCode, `${winningPlayer.name} wins with 3 victories!`, ['everyone']);
            setTimeout(() => this.sessionsService.terminateSession(sessionCode), DELAY_BEFORE_NEXT_TURN);
            return;
        }

        setTimeout(() => {
            this.turnService.startTurn(sessionCode, server, this.sessionsService['sessions'], winner?.socketId);
        }, DELAY_BEFORE_NEXT_TURN);

        this.fightService.endCombat(sessionCode, server, session);
    }
}
