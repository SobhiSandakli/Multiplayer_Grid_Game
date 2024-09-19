// import { Logger, Module } from '@nestjs/common';
// import { MongooseModule } from '@nestjs/mongoose';
// import { ConfigModule, ConfigService } from '@nestjs/config';
// import { Course, courseSchema } from '@app/model/database/course';
// import { CourseController } from '@app/controllers/course/course.controller';
// import { CourseService } from '@app/services/course/course.service';
// import { DateController } from '@app/controllers/date/date.controller';
// import { DateService } from '@app/services/date/date.service';
// import { ChatGateway } from '@app/gateways/chat/chat.gateway';
// import { ExampleService } from '@app/services/example/example.service';
// import { ExampleController } from '@app/controllers/example/example.controller';
// import { GameModule } from '@app/game.module'; // Import GameModule

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GameModule } from '@app/game.module';
@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (config: ConfigService) => ({
                uri: config.get<string>('DATABASE_CONNECTION_STRING'),
            }),
        }),
        GameModule,
    ],
})
export class AppModule {}
