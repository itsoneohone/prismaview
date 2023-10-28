import { Module } from '@nestjs/common';
import { AccessKeyController } from './access-key.controller';
import { AccessKeyService } from './access-key.service';

@Module({
  controllers: [AccessKeyController],
  providers: [AccessKeyService],
})
export class AccessKeyModule {}
