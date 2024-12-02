import { DICE_ROLL_OFFSET, DICE_SIDES_D4, DICE_SIDES_D6, EVASION_SUCCESS_PROBABILITY } from '@app/constants/fight-constants';
import { Player } from '@app/interfaces/player/player.interface';
import { CombatTurnService } from '@app/services/combat-turn/combat-turn.service';
import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class FightService {
    constructor(private readonly combatTurnService: CombatTurnService) {}
    notifyCombatStart(server: Server, initiatingPlayer: Player, opponentPlayer: Player): void {
        const firstAttacker = this.determineFirstAttacker(initiatingPlayer, opponentPlayer);
        server.to(initiatingPlayer.socketId).emit('combatStarted', {
            opponentPlayer,
            startsFirst: firstAttacker.socketId === initiatingPlayer.socketId,
        });
        server.to(opponentPlayer.socketId).emit('combatStarted', {
            opponentPlayer: initiatingPlayer,
            startsFirst: firstAttacker.socketId === opponentPlayer.socketId,
        });
    }

    determineFirstAttacker(initiatingPlayer: Player, opponentPlayer: Player): Player {
        const initiatorSpeed = initiatingPlayer.attributes['speed'].baseValue;
        const opponentSpeed = opponentPlayer.attributes['speed'].baseValue;

        return initiatorSpeed >= opponentSpeed ? initiatingPlayer : opponentPlayer;
    }

    calculateEvasion(player: Player): boolean {
        const evasionAttempts = player.attributes['nbEvasion']?.currentValue;

        if (evasionAttempts > 0) {
            player.attributes['nbEvasion'].currentValue -= 1;
            return Math.random() <= EVASION_SUCCESS_PROBABILITY;
        }
        return false;
    }

    calculateAttack(attacker: Player, defender: Player, session) {
        const isDebugMode = session.isDebugMode;
        const attackBase = attacker.attributes['attack'].currentValue;
        const attackRoll = isDebugMode
            ? attacker.attributes['attack'].dice === 'D6'
                ? DICE_SIDES_D6
                : DICE_SIDES_D4 
            : this.rollDice(attacker.attributes['attack'].dice);

        const defenceBase = defender.attributes['defence'].currentValue;
        const defenceRoll = isDebugMode
            ? 1 
            : this.rollDice(defender.attributes['defence'].dice);

        const success = attackBase + attackRoll > defenceBase + defenceRoll;

        return { attackBase, attackRoll, defenceBase, defenceRoll, success };
    }

    startCombat(sessionCode: string, server: Server, session): void {
        this.combatTurnService.startCombat(sessionCode, server, session);
    }

    endCombatTurn(sessionCode: string, server: Server, session): void {
        this.combatTurnService.endCombatTurn(sessionCode, server, session);
    }

    endCombat(sessionCode: string, server: Server, session): void {
        this.combatTurnService.endCombat(sessionCode, server, session);
        server.to(sessionCode).emit('gridArray', { sessionCode, grid: session.grid });
    }

    private rollDice(diceType: string): number {
        const sides = diceType === 'D6' ? DICE_SIDES_D6 : DICE_SIDES_D4;
        return Math.floor(Math.random() * sides) + DICE_ROLL_OFFSET;
    }
}
