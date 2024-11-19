import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, { Model } from 'mongoose';
import { Game, GameDocument, gameSchema } from './game.schema';

describe('Game Schema', () => {
    let mongoServer: MongoMemoryServer;
    let gameModel: Model<GameDocument>;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri);

        const module: TestingModule = await Test.createTestingModule({
            imports: [MongooseModule.forRoot(uri), MongooseModule.forFeature([{ name: Game.name, schema: gameSchema }])],
        }).compile();

        gameModel = module.get<Model<GameDocument>>(getModelToken(Game.name));
    });

    afterAll(async () => {
        await mongoose.disconnect();
        if (mongoServer) {
            await mongoServer.stop();
        }
    });

    it('should update the date when a new game is saved', async () => {
        const game = new gameModel({
            name: 'Test Game',
            size: '15x15',
            mode: 'Classic',
            description: 'A test game description',
            grid: [[{ images: [], isOccuped: false }]],
            image: 'test-image-url',
        });

        await game.save();
        expect(game.date).toBeDefined();
        expect(game.date).toBeInstanceOf(Date);
    });

    it('should update the date when a game is modified using findOneAndUpdate', async () => {
        const game = await gameModel.create({
            name: 'Game to Update',
            size: '10x10',
            mode: 'Adventure',
            description: 'Description before update',
            grid: [[{ images: [], isOccuped: false }]],
            image: 'test-image-url',
        });

        const updatedGame = await gameModel.findOneAndUpdate({ _id: game._id }, { description: 'Updated description' }, { new: true });

        expect(updatedGame.date).toBeDefined();
        expect(updatedGame.date).toBeInstanceOf(Date);
        expect(updatedGame.description).toBe('Updated description');
    });
});
