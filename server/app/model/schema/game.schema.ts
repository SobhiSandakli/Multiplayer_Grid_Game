import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type GameDocument = Game & Document;

@Schema({ collection: 'Games' }) 
export class Game {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    size: string;

    @Prop({ required: true })
    mode: string; 

    @Prop({ required: false }) 
    image?: string;

    @Prop({ type: Date, required: false }) 
    date?: Date;

    @Prop({ required: true })
    visibility: boolean;
}

export const gameSchema = SchemaFactory.createForClass(Game);
