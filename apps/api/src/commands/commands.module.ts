import { Module } from '@nestjs/common';
import { StartDateQuestions } from 'src/commands/inquirer/price.inquirer.start';
import { ExchangeQuestions } from 'src/commands/inquirer/price.inquirer.exchange';
import { TaskQuestions } from 'src/commands/inquirer/price.inquirer.task';
import { PriceService } from 'src/price/price.service';
import { PriceCommand } from 'src/commands/price.command';
import { CommandRunnerModule } from 'nest-commander';
import { PriceModule } from 'src/price/price.module';

@Module({
  imports: [CommandRunnerModule, PriceModule],
  providers: [
    PriceCommand,
    ExchangeQuestions,
    TaskQuestions,
    StartDateQuestions,
    PriceService,
  ],
})
export class CommandsModule {}
