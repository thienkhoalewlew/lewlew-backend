import { ConfigService, ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { SocketGateway } from "./socket.gateway";
import { Module } from "@nestjs/common";

@Module({
    imports: [
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: {
                    expiresIn: configService.get<string>('JWT_EXPIRES_IN', '30d'),
                },
            }),
        }),
    ],
    providers: [SocketGateway],
    exports: [SocketGateway],
})

export class SocketModule {}