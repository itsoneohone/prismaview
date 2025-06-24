import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy, ClientProxyFactory } from '@nestjs/microservices';
import { getRmqOptions } from '@events/rmq.config';

@Injectable()
export class EventsService implements OnModuleInit {
  public client: ClientProxy;

  constructor(private config: ConfigService) {}

  onModuleInit() {
    this.client = ClientProxyFactory.create(getRmqOptions(this.config));
  }
}
