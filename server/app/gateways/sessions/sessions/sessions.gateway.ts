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
        console.log(`Joueur ${finalName} a rejoint la session ${sessionCode}`);
    }

    @SubscribeMessage('joinGame')
    handleJoinGame(@ConnectedSocket() client: Socket, @MessageBody() data: { secretCode: string }): void {
        const session = this.sessions[data.secretCode];

        if (session) {
            client.join(data.secretCode);
            client.emit('joinGameResponse', { success: true });
            console.log(`Client ${client.id} a rejoint la session ${data.secretCode}`);
        } else {
            client.emit('joinGameResponse', { success: false, message: 'Code invalide' }); // Réponse en cas de code invalide
            console.log(`Tentative de rejoindre une session avec un code invalide : ${data.secretCode}`);
        }
    }

    @SubscribeMessage('createNewSession')
    handleCreateNewSession(@ConnectedSocket() client: Socket, @MessageBody() data: any): void {
        const sessionCode = this.generateUniqueSessionCode();
        const session: Session = {
            organizerId: client.id,
            locked: false,
            maxPlayers: data.maxPlayers,
            players: [],
        };
        this.sessions[sessionCode] = session;
        client.join(sessionCode);
        client.emit('sessionCreated', { sessionCode });
        console.log(`Session ${sessionCode} créée par ${client.id}`);
    }
    @SubscribeMessage('getTakenAvatars')
    handleGetTakenAvatars(@ConnectedSocket() client: Socket, @MessageBody() data: { sessionCode: string }): void {
        const session = this.sessions[data.sessionCode];
        if (session) {
            const takenAvatars = session.players.map((player) => player.avatar);
            client.emit('takenAvatars', { takenAvatars, players: session.players });
            console.log(`Avatars déjà pris pour la session ${data.sessionCode}:`, takenAvatars);
        } else {
            client.emit('error', { message: 'Session introuvable.' });
        }
    }
}
