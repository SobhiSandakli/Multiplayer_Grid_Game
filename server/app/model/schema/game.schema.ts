import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type GameDocument = Game & Document;

@Schema({ collection: 'Games' })
export class Game {
    _id?: string;
    
    @Prop({ required: true, unique: true })
    name: string;

    @Prop({ required: true })
    size: string;

    @Prop({ required: true })
    mode: string;

    @Prop({ required: true })
    description: string;

    @Prop({ required: true })
    grid: unknown[][];

    @Prop({ required: true })
    image?: string;

    @Prop({ type: Date, required: false })
    date?: Date;

    @Prop({ type: Boolean, required: false, default: false })
    visibility?: boolean;
}

// eslint-disable-next-line no-invalid-this
export const gameSchema = SchemaFactory.createForClass(Game);

// Disable linting for the 'this' keyword in the 'save' pre-hook
gameSchema.pre('save', function (next) {
    // eslint-disable-next-line no-invalid-this
    if (this.isModified()) {
        // eslint-disable-next-line no-invalid-this
        this.date = new Date();
    }
    next();
});

// Disable linting for the 'this' keyword in the 'findOneAndUpdate' pre-hook
gameSchema.pre('findOneAndUpdate', function (next) {
    // eslint-disable-next-line no-invalid-this
    this.set({ date: new Date() });
    next();
});
