import { Module } from '@nestjs/common';
import { PlaygroundService } from './playground.service';
import { PlaygroundController } from './playground.controller';
import { HttpModule } from '@nestjs/axios';
import { AccessKeyModule } from 'src/access-key/access-key.module';

@Module({
  imports: [HttpModule, AccessKeyModule],
  providers: [PlaygroundService],
  controllers: [PlaygroundController],
})
export class PlaygroundModule {}
