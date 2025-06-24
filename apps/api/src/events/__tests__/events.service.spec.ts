import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from '@events/events.service';
import { ConfigModule } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';

describe('EventsService', () => {
  let eventsService: EventsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventsService],
      imports: [ConfigModule.forRoot()],
    }).compile();

    eventsService = module.get<EventsService>(EventsService);
    await eventsService.onModuleInit();
  });

  it('should be defined', () => {
    expect(eventsService).toBeDefined();
  });

  it('should set up the RMQ ClientProxy', () => {
    const rmqClientProxy = <ClientProxy>eventsService.client;
    expect(rmqClientProxy).toBeInstanceOf(ClientProxy);
    expect(rmqClientProxy.emit).toBeDefined();
    expect(rmqClientProxy.send).toBeDefined();
  });
});
