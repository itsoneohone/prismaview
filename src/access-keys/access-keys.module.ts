import { Module } from '@nestjs/common';
import { AccessKeysController } from './access-keys.controller';
import { AccessKeysService } from './access-keys.service';

@Module({
  controllers: [AccessKeysController],
  providers: [AccessKeysService]
})
export class AccessKeysModule {}
