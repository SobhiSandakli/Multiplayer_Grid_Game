import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type GameDocument = Game & Document;

@Schema({ collection: 'Games' }) // Ensure collection name matches
export class Game {
    @Prop({ required: true })
    nom: string;

    @Prop({ required: true })
    taille: string;

    @Prop({ required: true })
    mode: string; // Ensure type matches your data

    @Prop({ required: false }) // Ensure optional field
    image?: string;

    @Prop({ type: Date, required: false }) // Ensure date is correct
    date?: Date;
}

export const GameSchema = SchemaFactory.createForClass(Game);
