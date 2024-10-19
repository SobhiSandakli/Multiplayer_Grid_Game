import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

interface Attribute {
    name: string;
    description: string;
    baseValue: number;
    currentValue: number;
    dice?: string;
}

interface CharacterData {
    name: string;
    avatar: string;
    attributes: { [key: string]: Attribute };
}

interface Player {
    socketId: string;
    name: string;
    avatar: string;
    attributes: { [key: string]: Attribute };
    isOrganizer: boolean;
}

interface Session {
    organizerId: string;
    locked: boolean;
    maxPlayers: number;
    players: Player[];
    selectedGameID: string;
}

interface CharacterCreationData {
    sessionCode?: string;
    characterData: CharacterData;
}

@WebSocketGateway({ cors: true })
export class SessionsGateway {
    @WebSocketServer()
    server: Server;

    // Stockage en mémoire des sessions
    private sessions: { [key: string]: Session } = {};

    // Générer un code de session unique à 4 chiffres
    private generateUniqueSessionCode(): string {
        let code: string;
        do {
            code = Math.floor(1000 + Math.random() * 9000).toString();
        } while (this.sessions[code]);
        return code;
    }

    @SubscribeMessage('createCharacter')
    handleCreateCharacter(@ConnectedSocket() client: Socket, @MessageBody() data: CharacterCreationData): void {
        const { sessionCode, characterData } = data;

        console.log('Received createCharacter event with sessionCode:', sessionCode); // FOR TESTS - TO BE REMOVED

        if (!sessionCode) {
            client.emit('error', { message: 'Session code is required.' });
            return;
        }

        const session = this.sessions[sessionCode];
        if (!session) {
            client.emit('error', { message: 'Session introuvable.' });
            return;
        }

        // Vérifier le nom unique
        const nameExists = session.players.some((player) => player.name === characterData.name);
        let finalName = characterData.name;
        if (nameExists) {
            let suffix = 2;
            while (session.players.some((player) => player.name === `${characterData.name}-${suffix}`)) {
                suffix++;
            }
            finalName = `${characterData.name}-${suffix}`;
        }

        // Vérifier si l'avatar est déjà pris
        const avatarTaken = session.players.some((player) => player.avatar === characterData.avatar);
        if (avatarTaken) {
            client.emit('error', { message: 'Avatar déjà pris.' });
            return;
        }
        if (session.players.length >= session.maxPlayers) {
            session.locked = true; // Verrouille automatiquement
            this.server.to(sessionCode).emit('roomLocked', { locked: true });
            client.emit('error', { message: 'Le nombre maximum de joueurs est atteint.' });
            return;
        }

        // Ajouter le joueur à la session
        const newPlayer: Player = {
            socketId: client.id,
            name: finalName,
            avatar: characterData.avatar,
            attributes: characterData.attributes,
            isOrganizer: session.players.length === 0 ? true : false,
        };
        session.players.push(newPlayer);
        client.join(sessionCode);

        // Notifier le joueur du nom final et du sessionCode
        client.emit('characterCreated', { name: finalName, sessionCode });

        // Notifier les autres joueurs dans la session
        this.server.to(sessionCode).emit('playerListUpdate', { players: session.players });
        console.log(`Joueur ${finalName} a rejoint la session ${sessionCode}`); // FOR TESTS - TO BE REMOVED
    }

    @SubscribeMessage('joinGame')
    handleJoinGame(@ConnectedSocket() client: Socket, @MessageBody() data: { secretCode: string }): void {
        const session = this.sessions[data.secretCode];

        if (!session) {
            client.emit('joinGameResponse', { success: false, message: 'Code invalide' });
            return;
        }

        if (session.locked) {
            client.emit('joinGameResponse', { success: false, message: 'La salle est verrouillée.' });
            return;
        }

        client.join(data.secretCode);
        client.emit('joinGameResponse', { success: true });
        this.server.to(data.secretCode).emit('playerListUpdate', { players: session.players });
    }

    @SubscribeMessage('createNewSession')
    handleCreateNewSession(@ConnectedSocket() client: Socket, @MessageBody() data: any): void {
        const sessionCode = this.generateUniqueSessionCode();
        const session: Session = {
            organizerId: client.id,
            locked: false,
            maxPlayers: data.maxPlayers,
            players: [],
            selectedGameID: data.selectedGameID,
        };
        this.sessions[sessionCode] = session;
        client.join(sessionCode);
        client.emit('sessionCreated', { sessionCode });
        console.log(`Session ${sessionCode} créée par ${client.id} avec le jeu ${data.selectedGameID}`); // FOR TESTS - TO BE REMOVED
    }

    @SubscribeMessage('getTakenAvatars')
    handleGetTakenAvatars(@ConnectedSocket() client: Socket, @MessageBody() data: { sessionCode: string }): void {
        const session = this.sessions[data.sessionCode];
        if (session) {
            const takenAvatars = session.players.map((player) => player.avatar);
            client.emit('takenAvatars', { takenAvatars, players: session.players });
        } else {
            client.emit('error', { message: 'Session introuvable.' });
        }
    }

    @SubscribeMessage('deleteSession')
    handleDeleteSession(@ConnectedSocket() client: Socket, @MessageBody() data: { sessionCode: string }): void {
        const session = this.sessions[data.sessionCode];
        if (session && session.organizerId === client.id) {
            delete this.sessions[data.sessionCode];
            // Informer les autres joueurs que la session a été supprimée
            this.server.to(data.sessionCode).emit('sessionDeleted', { message: "La session a été supprimée par l'organisateur." });
        } else {
            client.emit('error', { message: 'Impossible de supprimer la session.' });
        }
    }

    @SubscribeMessage('leaveSession')
    handleLeaveSession(@ConnectedSocket() client: Socket, @MessageBody() data: { sessionCode: string }): void {
        const session = this.sessions[data.sessionCode];
        if (session) {
            // Retirer le joueur de la session s'il est présent
            const playerIndex = session.players.findIndex((player) => player.socketId === client.id);
            if (playerIndex !== -1) {
                session.players.splice(playerIndex, 1);
                client.leave(data.sessionCode);
                // Informer les autres joueurs que le joueur a quitté la session
                this.server.to(data.sessionCode).emit('playerListUpdate', { players: session.players });
                console.log(`Client ${client.id} a quitté la session ${data.sessionCode}`);
            } else {
                console.log(`Client ${client.id} a tenté de quitter la session ${data.sessionCode} mais n'y était pas.`);
            }
        } else {
            client.emit('error', { message: 'Session introuvable.' });
        }
    }

    @SubscribeMessage('excludePlayer')
    handleExcludePlayer(@ConnectedSocket() client: Socket, @MessageBody() data: { sessionCode: string; playerSocketId: string }): void {
        const session = this.sessions[data.sessionCode];

        if (session) {
            session.players = session.players.filter((player) => player.socketId !== data.playerSocketId);
            this.server.to(data.sessionCode).emit('playerListUpdate', { players: session.players });

            const excludedClient = this.server.sockets.sockets.get(data.playerSocketId);
            if (excludedClient) {
                excludedClient.leave(data.sessionCode);
                excludedClient.emit('excluded', { message: 'Vous avez été exclu de la session.' });
            }
        }
    }

    @SubscribeMessage('toggleLock')
    handleToggleLock(@ConnectedSocket() client: Socket, @MessageBody() data: { sessionCode: string; lock: boolean }): void {
        const session = this.sessions[data.sessionCode];

        if (!session) {
            client.emit('error', { message: 'Session introuvable.' });
            return;
        }
        session.locked = data.lock;
        this.server.to(data.sessionCode).emit('roomLocked', { locked: session.locked });
    }

    handleDisconnect(client: Socket) {
        // Parcourir toutes les sessions pour trouver si le client en fait partie
        for (const sessionCode in this.sessions) {
            const session = this.sessions[sessionCode];
            const playerIndex = session.players.findIndex((player) => player.socketId === client.id);

            if (playerIndex !== -1) {
                const player = session.players[playerIndex];
                session.players.splice(playerIndex, 1);
                client.leave(sessionCode);

                // Informer les autres joueurs que le joueur a quitté
                this.server.to(sessionCode).emit('playerListUpdate', { players: session.players });
                console.log(`Client ${client.id} (${player.name}) a été déconnecté de la session ${sessionCode}`);

                // Si c'était l'organisateur, réattribuer le rôle
                if (session.organizerId === client.id) {
                    if (session.players.length > 0) {
                        // Réattribuer l'organisateur à un autre joueur
                        const newOrganizer = session.players[0];
                        session.organizerId = newOrganizer.socketId;
                        newOrganizer.isOrganizer = true;
                        console.log(`Nouvel organisateur : ${newOrganizer.name}`);
                        this.server.to(sessionCode).emit('playerListUpdate', { players: session.players });
                    } else {
                        // S'il n'y a plus de joueurs, supprimer la session
                        delete this.sessions[sessionCode];
                        console.log(`Session ${sessionCode} supprimée car il n'y a plus de joueurs.`);
                    }
                }

                break;
            }
        }
    }
}
