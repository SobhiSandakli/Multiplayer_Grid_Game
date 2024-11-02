import { Injectable } from '@nestjs/common';
import { Session } from '@app/interfaces/session/session.interface';
import { Server } from 'socket.io';
import { Player } from '@app/interfaces/player/player.interface';

const TURN_DURATION = 30; 
const NEXT_TURN_NOTIFICATION_DELAY = 3;
const THOUSAND = 1000;
const THREE_THOUSAND = 3000;

@Injectable()
export class TurnService {
  calculateTurnOrder(session: Session): void {
    const players = session.players.slice();

    // Trier les joueurs par rapidité décroissante
    players.sort((a, b) => b.attributes.speed.currentValue - a.attributes.speed.currentValue);

    // Regrouper les joueurs par rapidité égale
    const groupedBySpeed: { [key: number]: Player[] } = {};
    players.forEach(player => {
      const speed = player.attributes.speed.currentValue;
      if (!groupedBySpeed[speed]) {
        groupedBySpeed[speed] = [];
      }
      groupedBySpeed[speed].push(player);
    });

    // Pour chaque groupe de même rapidité, mélanger aléatoirement
    const sortedPlayers: Player[] = [];
    Object.keys(groupedBySpeed)
      .sort((a, b) => parseInt(b) - parseInt(a))
      .forEach(speed => {
        const group = groupedBySpeed[parseInt(speed)];
        this.shuffle(group);
        sortedPlayers.push(...group);
      });

    session.turnOrder = sortedPlayers.map(player => player.socketId);
    session.currentTurnIndex = -1; // Commencer avant le premier joueur
  }

  private shuffle<T>(array: T[]): T[] {
    // Méthode de mélange aléatoire (Fisher-Yates)
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  startTurn(sessionCode: string, server: Server, sessions: { [key: string]: Session }): void {
    const session = sessions[sessionCode];
    if (!session) return;

    session.currentTurnIndex = (session.currentTurnIndex + 1) % session.turnOrder.length;
    session.currentPlayerSocketId = session.turnOrder[session.currentTurnIndex];
    session.timeLeft = TURN_DURATION; 

    server.to(sessionCode).emit('nextTurnNotification', {
      playerSocketId: session.currentPlayerSocketId,
      inSeconds: NEXT_TURN_NOTIFICATION_DELAY,
    });

    // Démarrer le tour après 3 secondes
    setTimeout(() => {
      server.to(sessionCode).emit('turnStarted', {
        playerSocketId: session.currentPlayerSocketId,
      });

      this.sendTimeLeft(sessionCode, server, sessions);

      // Démarrer le timer du tour
      session.turnTimer = setInterval(() => {
        session.timeLeft--;

        if (session.timeLeft <= 0) {
          this.endTurn(sessionCode, server, sessions);
        } else {
          this.sendTimeLeft(sessionCode, server, sessions);
        }
      }, THOUSAND); // Mise à jour chaque seconde
    }, THREE_THOUSAND); // Délai de 3 secondes
  }

  endTurn(sessionCode: string, server: Server, sessions: { [key: string]: Session }): void {
    const session = sessions[sessionCode];
    if (!session) return;

    // Arrêter le timer du tour
    if (session.turnTimer) {
      clearInterval(session.turnTimer);
      session.turnTimer = null;
    }

    // Notifier les clients que le tour est terminé
    server.to(sessionCode).emit('turnEnded', {
      playerSocketId: session.currentPlayerSocketId,
    });

    // Passer au tour suivant
    this.startTurn(sessionCode, server, sessions);
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
