import { COMBAT_EVASION_TURN_DURATION, COMBAT_TIME_INTERVAL, COMBAT_TURN_DURATION } from '@app/constants/fight-constants';
import { SessionsGateway } from '@app/gateways/sessions/sessions/sessions.gateway';
import { Session } from '@app/interfaces/session/session.interface';
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class CombatTurnService {
    private actionTaken = false;

    constructor(
        @Inject(forwardRef(() => SessionsGateway))
        private readonly sessionsGateway: SessionsGateway,
    ) {}
    endCombatTurn(sessionCode: string, server: Server, session: Session): void {
        if (session.combatTurnTimer) {
            clearInterval(session.combatTurnTimer);
            session.combatTurnTimer = null;
        }
        if (session.combat.length > 0) {
            session.combatTurnIndex = (session.combatTurnIndex + 1) % session.combat.length;
            const nextCombatant = session.combat[session.combatTurnIndex];

            server.to(sessionCode).emit('combatTurnEnded', {
                playerSocketId: nextCombatant.socketId,
            });

            this.startCombatTurnTimer(sessionCode, server, session);
        }
    }

    endCombat(sessionCode: string, server: Server, session: Session): void {
        if (session.combatTurnTimer) {
            clearInterval(session.combatTurnTimer);
            session.combatTurnTimer = null;
        }

        server.to(sessionCode).emit('combatEnded', { message: 'Le combat est fini.' });
        session.combat = [];
        session.combatTurnIndex = -1;
    }

    markActionTaken(): void {
        this.actionTaken = true;
    }

    startCombat(sessionCode: string, server: Server, session: Session): void {
        session.combatTurnIndex = 0;
        this.startCombatTurnTimer(sessionCode, server, session);
    }

    private startCombatTurnTimer(sessionCode: string, server: Server, session: Session): void {
        const currentCombatant = session.combat[session.combatTurnIndex];
        const hasEvasionAttempts = currentCombatant.attributes['nbEvasion'].currentValue > 0;
        const turnDuration = hasEvasionAttempts ? COMBAT_TURN_DURATION : COMBAT_EVASION_TURN_DURATION;

        session.combatTimeLeft = turnDuration / COMBAT_TIME_INTERVAL;
        this.actionTaken = false;

        server.to(sessionCode).emit('combatTurnStarted', {
            playerSocketId: currentCombatant.socketId,
            timeLeft: session.combatTimeLeft,
        });

        session.combatTurnTimer = setInterval(() => {
            session.combatTimeLeft--;

            server.to(sessionCode).emit('combatTimeLeft', {
                timeLeft: session.combatTimeLeft,
                playerSocketId: currentCombatant.socketId,
            });

            if (session.combatTimeLeft <= 0) {
                clearInterval(session.combatTurnTimer);

                if (!this.actionTaken) {
                    server.to(currentCombatant.socketId).emit('autoAttack', {
                        message: 'Time is up! An attack was automatically chosen.',
                    });

                    this.sessionsGateway.handleAttack(null, {
                        sessionCode,
                        clientSocketId: currentCombatant.socketId,
                    });
                    this.actionTaken = true;
                }
                this.endCombatTurn(sessionCode, server, session);
            }
        }, COMBAT_TIME_INTERVAL);
    }
}
