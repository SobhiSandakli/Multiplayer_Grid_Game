import { COMBAT_WIN_THRESHOLD, DELAY_BEFORE_NEXT_TURN } from '@app/constants/session-gateway-constants';
import { EventsGateway } from '@app/gateways/events/events.gateway';
import { Player } from '@app/interfaces/player/player.interface';
import { CombatTurnService } from '@app/services/combat-turn/combat-turn.service';
import { FightService } from '@app/services/fight/fight.service';
import { ChangeGridService } from '@app/services/grid/changeGrid.service';
import { SessionsService } from '@app/services/sessions/sessions.service';
import { TurnService } from '@app/services/turn/turn.service';
import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class CombatService {
    constructor(
        private readonly sessionsService: SessionsService,
        private readonly combatTurnService: CombatTurnService,
        private readonly fightService: FightService,
        private readonly eventsService: EventsGateway,
        private readonly changeGridService: ChangeGridService,
        private readonly turnService: TurnService,
    ) {}

    initiateCombat(sessionCode: string, initiatingPlayer: Player, opponentPlayer: Player, server: Server): void {
        const session = this.sessionsService.getSession(sessionCode);
        if (!session) return;

        session.combatData.combatants = [initiatingPlayer, opponentPlayer];
        const firstAttacker = this.fightService.determineFirstAttacker(initiatingPlayer, opponentPlayer);

        server.to(initiatingPlayer.socketId).emit('combatStarted', {
            opponentAvatar: opponentPlayer.avatar,
            opponentName: opponentPlayer.name,
            opponentAttributes: opponentPlayer.attributes,
            startsFirst: firstAttacker.socketId === initiatingPlayer.socketId,
        });

        server.to(opponentPlayer.socketId).emit('combatStarted', {
            opponentAvatar: initiatingPlayer.avatar,
            opponentName: initiatingPlayer.name,
            opponentAttributes: initiatingPlayer.attributes,
            startsFirst: firstAttacker.socketId === opponentPlayer.socketId,
        });

        session.players
            .filter((player) => player.socketId !== initiatingPlayer.socketId && player.socketId !== opponentPlayer.socketId)
            .forEach((player) => {
                server.to(player.socketId).emit('combatNotification', {
                    player1: { avatar: initiatingPlayer.avatar, name: initiatingPlayer.name },
                    player2: { avatar: opponentPlayer.avatar, name: opponentPlayer.name },
                    combat: true,
                });
            });

        this.combatTurnService.startCombat(sessionCode, server, session);
    }

    executeAttack(sessionCode: string, attacker: Player, opponent: Player, server: Server): void {
        const session = this.sessionsService.getSession(sessionCode);
        if (!session) return;

        const { attackBase, attackRoll, defenceBase, defenceRoll, success } = this.fightService.calculateAttack(attacker, opponent);

        if (success) {
            opponent.attributes['life'].currentValue -= 1;

            if (opponent.attributes['life'].currentValue <= 0) {
                this.finalizeCombat(sessionCode, attacker, opponent, 'win', server);
                return;
            }
        }

        this.eventsService.addEventToSession(sessionCode, `${attacker.name} attempts an attack on ${opponent.name}`, [attacker.name, opponent.name]);
        this.eventsService.addEventToSession(sessionCode, `Attack result: ${success ? 'success' : 'failure'}`, [attacker.name, opponent.name]);

        server.to(attacker.socketId).emit('attackResult', { attackBase, attackRoll, defenceBase, defenceRoll, success });
        server.to(opponent.socketId).emit('attackResult', { attackBase, attackRoll, defenceBase, defenceRoll, success });
        server.to(sessionCode).emit('playerListUpdate', { players: session.players });

        this.combatTurnService.endCombatTurn(sessionCode, server, session);
    }

    attemptEvasion(sessionCode: string, player: Player, server: Server): void {
        const session = this.sessionsService.getSession(sessionCode);
        if (!session) return;

        const opponent = session.combatData.combatants.find((combatant) => combatant.socketId !== player.socketId);
        const evasionSuccess = this.fightService.calculateEvasion(player);

        server.to(player.socketId).emit('evasionResult', { success: evasionSuccess });
        server.to(sessionCode).emit('playerListUpdate', { players: session.players });

        this.eventsService.addEventToSession(sessionCode, `${player.name} attempts to evade.`, [player.name, opponent.name]);
        this.eventsService.addEventToSession(sessionCode, `Evasion result: ${evasionSuccess ? 'success' : 'failure'}`, [player.name, opponent.name]);

        if (evasionSuccess) {
            this.finalizeCombat(sessionCode, null, player, 'evasion', server);
        } else {
            this.combatTurnService.endCombatTurn(sessionCode, server, session);
        }
    }

    finalizeCombat(sessionCode: string, winner: Player | null, loser: Player | null, reason: 'win' | 'evasion', server: Server): void {
        const session = this.sessionsService.getSession(sessionCode);
        if (reason === 'win' && winner && loser) {
            this.changeGridService.moveImage(session.grid, { row: loser.position.row, col: loser.position.col }, loser.initialPosition, loser.avatar);
            winner.attributes['combatWon'].currentValue += 1;

            loser.position = loser.initialPosition;

            server.to(loser.socketId).emit('defeated', {
                message: 'Vous avez été vaincu.',
                winner: winner.name,
                loser: loser.name,
                combatEnded: true,
            });

            server.to(winner.socketId).emit('opponentDefeated', {
                message: 'Vous avez vaincu votre adversaire.',
                winner: winner.name,
                loser: loser.name,
                combatEnded: true,
            });

            winner.attributes['life'].currentValue = winner.attributes['life'].baseValue;
            loser.attributes['life'].currentValue = loser.attributes['life'].baseValue;
            session.players
                .filter((player) => player.socketId !== winner.socketId && player.socketId !== loser.socketId)
                .forEach((player) => {
                    server.to(player.socketId).emit('combatNotification', {
                        player1: { name: winner.name, avatar: winner.avatar },
                        player2: { name: loser.name, avatar: loser.avatar },
                        combat: false,
                        result: 'win',
                        winner: winner.name,
                        loser: loser.name,
                        combatEnded: true,
                    });
                });
            this.eventsService.addEventToSession(sessionCode, 'Fin de combat entre ' + winner.name + ' et ' + loser.name + '.', ['everyone']);
            this.eventsService.addEventToSession(sessionCode, winner.name + ' a gagné. ', ['everyone']);
        } else if (reason === 'evasion' && loser) {
            server.to(loser.socketId).emit('evasionSuccessful', {
                message: `${loser.name} a réussi à s'échapper.`,
                evader: loser.name,
                combatEnded: true,
            });

            const opponent = session.combatData.combatants.find((player) => player.socketId !== loser.socketId);
            if (opponent) {
                server.to(opponent.socketId).emit('opponentEvaded', {
                    message: `${loser.name} a réussi à s'échapper.`,
                    evader: loser.name,
                    combatEnded: true,
                });
            }

            session.players
                .filter((player) => player.socketId !== loser.socketId)
                .forEach((player) => {
                    server.to(player.socketId).emit('combatNotification', {
                        player1: { name: loser.name, avatar: loser.avatar },
                        combat: false,
                        result: 'evasion',
                        evader: loser.name,
                        combatEnded: true,
                    });
                });

            this.eventsService.addEventToSession(sessionCode, 'Fin de combat entre ' + opponent.name + ' et ' + loser.name + '.', ['everyone']);
            this.eventsService.addEventToSession(sessionCode, loser.name + " a pu s'échapper. ", ['everyone']);
        }

        session.combatData.combatants = [];

        const winningPlayer = session.players.find((player) => player.attributes['combatWon'].currentValue >= COMBAT_WIN_THRESHOLD);
        if (winningPlayer) {
            server.to(sessionCode).emit('gameEnded', {
                winner: winningPlayer.name,
            });

            this.eventsService.addEventToSession(sessionCode, `${winningPlayer.name} a remporté la partie avec 3 victoires en combat!`, ['everyone']);

            setTimeout(() => {
                this.sessionsService.terminateSession(sessionCode);
            }, DELAY_BEFORE_NEXT_TURN);
            return;
        }
        setTimeout(() => {
            if (winner) {
                this.turnService.startTurn(sessionCode, server, this.sessionsService['sessions'], winner.socketId);
            } else {
                this.turnService.startTurn(sessionCode, server, this.sessionsService['sessions']);
            }
        }, DELAY_BEFORE_NEXT_TURN);

        this.combatTurnService.endCombat(sessionCode, server, session);
        server.to(sessionCode).emit('gridArray', { sessionCode, grid: session.grid });
        this.combatTurnService.endCombat(sessionCode, server, session);
        server.to(sessionCode).emit('gridArray', { sessionCode, grid: session.grid });
    }
}
