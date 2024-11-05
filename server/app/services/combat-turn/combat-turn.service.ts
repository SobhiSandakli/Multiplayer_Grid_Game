import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Server } from 'socket.io';
import { Session } from '@app/interfaces/session/session.interface';
import { Player } from '@app/interfaces/player/player.interface';
import { SessionsGateway } from '@app/gateways/sessions/sessions/sessions.gateway';

const COMBAT_TURN_DURATION = 5000; // 5 seconds per combat turn
const COMBAT_EVASION_TURN_DURATION = 3000; // 3 seconds if no evasion attempts

@Injectable()
export class CombatTurnService {
    private actionTaken = false;

    constructor(
        @Inject(forwardRef(() => SessionsGateway))
        private readonly sessionsGateway: SessionsGateway,
    ) {}

    startCombat(sessionCode: string, server: Server, session: Session): void {
        session.combatTurnIndex = 0; // Start with the first combatant
        this.startCombatTurnTimer(sessionCode, server, session);
    }

    private startCombatTurnTimer(sessionCode: string, server: Server, session: Session): void {
        const currentCombatant = session.combat[session.combatTurnIndex];
        const hasEvasionAttempts = currentCombatant.attributes['nbEvasion'].currentValue > 0;
        const turnDuration = hasEvasionAttempts ? COMBAT_TURN_DURATION : COMBAT_EVASION_TURN_DURATION;
    
        session.combatTimeLeft = turnDuration / 1000; // Set duration in seconds
        this.actionTaken = false; // Reset action taken flag at the start of the turn
    
        // Emit combat turn start with time remaining
        server.to(sessionCode).emit('combatTurnStarted', {
            playerSocketId: currentCombatant.socketId,
            timeLeft: session.combatTimeLeft,
        });
    
        session.combatTurnTimer = setInterval(() => {
            session.combatTimeLeft--;
    
            // Emit remaining time for the current player's turn
            server.to(sessionCode).emit('combatTimeLeft', {
                timeLeft: session.combatTimeLeft,
                playerSocketId: currentCombatant.socketId,
            });
    
            if (session.combatTimeLeft <= 0) {
                clearInterval(session.combatTurnTimer);
    
                if (!this.actionTaken) {
                    // Automatically trigger attack on timeout
                    server.to(currentCombatant.socketId).emit('autoAttack', {
                        message: 'Time is up! An attack was automatically chosen.',
                    });
    
                    // Call handleAttack on the SessionsGateway with the current combatant
                    this.sessionsGateway.handleAttack(
                        null,
                        {
                            sessionCode,
                            clientSocketId: currentCombatant.socketId,
                        }
                    );
    
                    // Mark action taken to avoid any re-triggering
                    this.actionTaken = true;
                }
                // Move to the next combatant's turn after the automatic action
                this.endCombatTurn(sessionCode, server, session);
            }
        }, 1000); // Update every second
    }
    

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

            // Start the next combat turn
            this.startCombatTurnTimer(sessionCode, server, session);
        }
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

    // Use this method to mark when an action has been taken within a turn
    markActionTaken(): void {
        this.actionTaken = true;
    }
}
