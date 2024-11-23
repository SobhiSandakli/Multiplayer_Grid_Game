import { COMBAT_EVASION_TURN_DURATION, COMBAT_TIME_INTERVAL, COMBAT_TURN_DURATION } from '@app/constants/fight-constants';
import { Session } from '@app/interfaces/session/session.interface';
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { Server } from 'socket.io';
import { CombatGateway } from '@app/gateways/combat/combat.gateway';
import { CombatService } from '@app/services/combat/combat.service';

@Injectable()
export class CombatTurnService {
    private actionTaken = false;

    constructor(
        @Inject(forwardRef(() => CombatGateway))
        private readonly combatGateway: CombatGateway,
        @Inject(forwardRef(() => CombatService))
        private readonly combatService: CombatService,
    ) {}

    endCombatTurn(sessionCode: string, server: Server, session: Session): void {
        if (session.combatData.turnTimer) {
            clearInterval(session.combatData.turnTimer);
            session.combatData.turnTimer = null;
        }
    
        if (session.combatData.combatants.length > 0) {
            session.combatData.turnIndex = (session.combatData.turnIndex + 1) % session.combatData.combatants.length;
            const nextCombatant = session.combatData.combatants[session.combatData.turnIndex];
    
            server.to(sessionCode).emit('combatTurnStarted', {
                playerSocketId: nextCombatant.socketId,
            });
    
            this.startCombatTurnTimer(sessionCode, server, session);
    
            if (nextCombatant.isVirtual && nextCombatant.type === 'Défensif') {
                const lastAttackSuccess = session.combatData.lastAttackResult?.success;
                const lastTarget = session.combatData.lastAttackResult?.target;
                
                if (lastAttackSuccess && lastTarget?.socketId === nextCombatant.socketId) {
                    const randomExecutionTime = Math.floor(Math.random() * 3000) + 1000; // Random time between 1s and 4s
                    setTimeout(() => {
                        this.combatService.attemptEvasion(sessionCode, nextCombatant, server);
                }, randomExecutionTime);
                    return; 
                }
            }
    
            if (nextCombatant.isVirtual) {
                const randomExecutionTime = Math.floor(Math.random() * 3000) + 1000; // Random time between 1s and 4s
                setTimeout(() => {
                    this.combatGateway.handleAttack(null, {
                        sessionCode,
                        clientSocketId: nextCombatant.socketId,
                    });
                }, randomExecutionTime);
            }
        }
    }
    

    endCombat(sessionCode: string, server: Server, session: Session): void {
        if (session.combatData.turnTimer) {
            clearInterval(session.combatData.turnTimer);
            session.combatData.turnTimer = null;
        }

        server.to(sessionCode).emit('combatEnded', { message: 'Le combat est fini.' });
        session.combatData.combatants = [];
        session.combatData.turnIndex = -1;
    }

    markActionTaken(): void {
        this.actionTaken = true;
    }

    startCombat(sessionCode: string, server: Server, session: Session): void {
        session.combatData.turnIndex = 0;
        this.startCombatTurnTimer(sessionCode, server, session);
    }

    private startCombatTurnTimer(sessionCode: string, server: Server, session: Session): void {
        const currentCombatant = session.combatData.combatants[session.combatData.turnIndex];
        const hasEvasionAttempts = currentCombatant.attributes['nbEvasion'].currentValue > 0;
        const turnDuration = hasEvasionAttempts ? COMBAT_TURN_DURATION : COMBAT_EVASION_TURN_DURATION;

        session.combatData.timeLeft = turnDuration / COMBAT_TIME_INTERVAL;
        this.actionTaken = false;

        server.to(sessionCode).emit('combatTurnStarted', {
            playerSocketId: currentCombatant.socketId,
            timeLeft: session.combatData.timeLeft,
        });

        session.combatData.turnTimer = setInterval(() => {
            session.combatData.timeLeft--;

            server.to(sessionCode).emit('combatTimeLeft', {
                timeLeft: session.combatData.timeLeft,
                playerSocketId: currentCombatant.socketId,
            });

            if (session.combatData.timeLeft <= 0) {
                clearInterval(session.combatData.turnTimer);

                if (!this.actionTaken) {
                    this.combatGateway.handleAttack(null, {
                        sessionCode,
                        clientSocketId: currentCombatant.socketId,
                    });
                    this.actionTaken = true;
                } else if (this.actionTaken) {
                    this.endCombatTurn(sessionCode, server, session);
                }
            }
        }, COMBAT_TIME_INTERVAL);
    }
}
