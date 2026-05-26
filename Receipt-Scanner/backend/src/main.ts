import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // This tells the backend bouncer to let your Ionic frontend in!
  app.enableCors(); 
  
  await app.listen(3000);
}
bootstrap();