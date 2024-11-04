import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { Session } from '@app/interfaces/session/session.interface';
import { Player } from '@app/interfaces/player/player.interface';
import { FightService } from '@app/services/fight/fight.service';

const COMBAT_TURN_DURATION = 5000; // 5 seconds per combat turn
const COMBAT_EVASION_TURN_DURATION = 3000; // 3 seconds if the player has no more evasion attempts

@Injectable()
export class CombatTurnService {
    constructor(private readonly fightService: FightService) {}

    startCombat(sessionCode: string, server: Server, session: Session): void {
        session.combatTurnIndex = 0; // Start with the first combatant
        session.combatTimeLeft = COMBAT_TURN_DURATION / 1000; // Set turn duration in seconds

        this.startCombatTurnTimer(sessionCode, server, session);
    }

    private startCombatTurnTimer(sessionCode: string, server: Server, session: Session): void {
        const currentCombatant = session.combat[session.combatTurnIndex];
        const turnDuration = currentCombatant.attributes['nbEvasion'].currentValue > 0 ? COMBAT_TURN_DURATION : COMBAT_EVASION_TURN_DURATION;
        session.combatTimeLeft = turnDuration / 1000;

        server.to(sessionCode).emit('combatTurnStarted', {
            playerSocketId: currentCombatant.socketId,
            timeLeft: session.combatTimeLeft,
        });

        session.combatTurnTimer = setInterval(() => {
            session.combatTimeLeft--;

            if (session.combatTimeLeft <= 0) {
                this.endCombatTurn(sessionCode, server, session);
            } else {
                server.to(sessionCode).emit('combatTimeLeft', {
                    timeLeft: session.combatTimeLeft,
                    playerSocketId: currentCombatant.socketId,
                });
            }
        }, 1000); 
    }

    private endCombatTurn(sessionCode: string, server: Server, session: Session): void {
        if (session.combatTurnTimer) {
            clearInterval(session.combatTurnTimer);
            session.combatTurnTimer = null;
        }

        session.combatTurnIndex = (session.combatTurnIndex + 1) % session.combat.length;
        const nextCombatant = session.combat[session.combatTurnIndex];

        server.to(sessionCode).emit('combatTurnEnded', {
            playerSocketId: nextCombatant.socketId,
        });

        this.startCombatTurnTimer(sessionCode, server, session);
    }

    endCombat(sessionCode: string, server: Server, session: Session): void {
        if (session.combatTurnTimer) {
            clearInterval(session.combatTurnTimer);
            session.combatTurnTimer = null;
        }

        server.to(sessionCode).emit('combatEnded', { message: 'Combat has ended.' });
        session.combat = []; // Clear combat participants
        session.combatTurnIndex = -1; // Reset combat turn index
    }
}
