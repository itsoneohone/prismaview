import { CommandFactory } from 'nest-commander';
import { AppModule } from 'src/app.module';

async function bootstrap() {
  await CommandFactory.run(AppModule, {
    errorHandler: (err) => {
      console.error(err);
      process.exit(1);
    },
    logger: ['error', 'warn', 'log', 'fatal', 'debug'],
  });
}

bootstrap();
