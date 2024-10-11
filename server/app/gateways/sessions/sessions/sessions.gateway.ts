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
}
interface CharacterCreationData {
    sessionCode?: string; // Peut être absent lors de la création d'une nouvelle session
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

    @SubscribeMessage('createSession')
    handleCreateSession(@ConnectedSocket() client: Socket, @MessageBody() data: any): void {
        const sessionCode = this.generateUniqueSessionCode();
        this.sessions[sessionCode] = {
            organizerId: client.id,
            locked: false,
            maxPlayers: data.maxPlayers || 4,
            players: [],
        };
        client.join(sessionCode);
        client.emit('sessionCreated', { sessionCode });
        console.log(`Session ${sessionCode} créée par ${client.id}`);
    }

    @SubscribeMessage('createCharacter')
    handleCreateCharacter(@ConnectedSocket() client: Socket, @MessageBody() data: CharacterCreationData): void {
        const { sessionCode, characterData } = data;

        let session: Session;
        let newSessionCode = sessionCode;

        if (sessionCode) {
            // Cas où le client fournit un sessionCode pour rejoindre une session existante
            session = this.sessions[sessionCode];
            if (!session) {
                client.emit('error', { message: 'Session introuvable.' });
                return;
            }
        } else {
            // Cas où le client ne fournit pas de sessionCode : création d'une nouvelle session
            newSessionCode = this.generateUniqueSessionCode();
            session = {
                organizerId: client.id,
                locked: false,
                maxPlayers: 4, // Ou toute autre valeur par défaut ou fournie par le client
                players: [],
            };
            this.sessions[newSessionCode] = session;
            console.log(`Session ${newSessionCode} créée par ${client.id}`);
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

        // Ajouter le joueur à la session
        const newPlayer: Player = {
            socketId: client.id,
            name: finalName,
            avatar: characterData.avatar,
            attributes: characterData.attributes,
            isOrganizer: session.organizerId === client.id,
        };
        session.players.push(newPlayer);
        client.join(newSessionCode);

        // Notifier le joueur du nom final et du sessionCode
        client.emit('characterCreated', { name: finalName, sessionCode: newSessionCode });

        // Notifier les autres joueurs dans la session
        this.server.to(newSessionCode).emit('playerListUpdate', { players: session.players });
        console.log(`Joueur ${finalName} a rejoint la session ${newSessionCode}`);
    }

    // @SubscribeMessage('disconnect')
    // handleDisconnect(@ConnectedSocket() client: Socket): void {
    //   console.log('Un utilisateur s\'est déconnecté :', client.id);
    //   // Trouver la session à laquelle le socket appartient
    //   for (const sessionCode in this.sessions) {
    //     const session = this.sessions[sessionCode];
    //     const playerIndex = session.players.findIndex((player) => player.socketId === client.id);
    //     if (playerIndex !== -1) {
    //       const [removedPlayer] = session.players.splice(playerIndex, 1);
    //       this.server.to(sessionCode).emit('playerListUpdate', { players: session.players });
    //       console.log(`Joueur ${removedPlayer.name} a quitté la session ${sessionCode}`);
    //       // Si l'organisateur est parti, terminer la session
    //       if (session.organizerId === client.id) {
    //         this.server.to(sessionCode).emit('sessionEnded', { message: 'L\'organisateur a quitté la session.' });
    //         delete this.sessions[sessionCode];
    //         console.log(`Session ${sessionCode} terminée car l'organisateur est parti`);
    //       }
    //       break;
    //     }
    //   }
    // }

    // Ajoutez d'autres gestionnaires d'événements si nécessaire
}
