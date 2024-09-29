import { MongoMemoryServer } from 'mongodb-memory-server';
import { connect, Connection, Model } from 'mongoose';
import { GameDocument, gameSchema } from './game.schema';

describe('Game Schema', () => {
    let mongod: MongoMemoryServer;
    let mongoConnection: Connection;
    let gameModel: Model<GameDocument>;

    beforeAll(async () => {
        mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();
        mongoConnection = (await connect(uri)).connection;
        gameModel = mongoConnection.model<GameDocument>('Game', gameSchema);
    });

    afterAll(async () => {
        await mongoConnection.dropDatabase();
        await mongoConnection.close();
        await mongod.stop();
    });

    beforeEach(async () => {
        // Clear the 'Games' collection before each test -> needed to pass the tests
        await gameModel.deleteMany({});
    });

    it('should set the date field before saving the game if modified', async () => {
        const game = new gameModel({
            name: 'Test Game 1',
            size: 'medium',
            mode: 'classique',
            description: 'Test Description',
            image: 'test-image.png',
            grid: [[]],
        });
        game.isModified = jest.fn().mockReturnValue(true);
        await game.save();
        expect(game.date).toBeDefined();
        expect(game.date).toBeInstanceOf(Date);
    });

    it('should not set the date field before saving the game if not modified', async () => {
        const game = new gameModel({
            name: 'Test Game 2',
            size: 'medium',
            mode: 'classique',
            description: 'Test Description',
            image: 'test-image.png',
            grid: [[]],
        });

        game.isModified = jest.fn().mockReturnValue(false);
        await game.save();
        expect(game.date).toBeUndefined();
    });

    it('should set the date field before updating the game', async () => {
        const game = new gameModel({
            name: 'Test Game 3',
            size: 'medium',
            mode: 'classique',
            description: 'Test Description',
            image: 'test-image.png',
            grid: [[]],
        });
        await game.save();

        const updateData = { description: 'Updated Description' };
        const updatedGame = await gameModel.findOneAndUpdate({ name: 'Test Game 3' }, updateData, { new: true });

        expect(updatedGame?.date).toBeDefined();
        expect(updatedGame?.date).toBeInstanceOf(Date);
    });
});
