import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';

class CustomIoAdapter extends IoAdapter {
  createIOServer(port: number, options?: any): any {
    const server = super.createIOServer(port, {
      ...options,
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true,
      },
      allowEIO3: true,
    });
    return server;
  }
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  
  app.useWebSocketAdapter(new CustomIoAdapter(app));

  // Cấu hình global prefix để hỗ trợ cả mobile và web
  app.setGlobalPrefix('api', {
    exclude: ['health'],
  });
  
  // Cấu hình CORS chi tiết hơn để cho phép kết nối từ Expo và các nguồn khác
  app.enableCors({
    origin: true, // Cho phép tất cả các nguồn
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });
  // Cấu hình validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  // Cấu hình Swagger
  const config = new DocumentBuilder()
    .setTitle('LewLew API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  // Lấy port từ biến môi trường hoặc mặc định là 3000
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0'); // Listen on all interfaces
  logger.log(`Application is running on: http://0.0.0.0:${port}`);
  logger.log(`Swagger documentation: http://localhost:${port}/api`);
}
bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
