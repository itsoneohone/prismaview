import { CommandFactory } from 'nest-commander';
import { AppClientModule } from 'src/app.client.module';

async function bootstrap() {
  await CommandFactory.run(AppClientModule, {
    errorHandler: (err) => {
      console.error(err);
      process.exit(1);
    },
    logger: ['error', 'warn', 'log', 'fatal', 'debug'],
  });
}

bootstrap();
