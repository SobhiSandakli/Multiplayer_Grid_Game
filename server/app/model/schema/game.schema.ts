import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type GameDocument = Game & Document;

@Schema({ collection: 'Games' })
export class Game {
    @Prop({ required: true, unique: true })
    name: string;

    @Prop({ required: true })
    size: string;

    @Prop({ required: true })
    mode: string;

    @Prop({ required: true })
    description: string;

    @Prop({ required: true })
    image?: string;

    @Prop({ type: Date, required: false, default: Date.now })
    date?: Date;

    @Prop({ type: Boolean, required: false, default: false })
    visibility?: boolean;
}

export const gameSchema = SchemaFactory.createForClass(Game);
