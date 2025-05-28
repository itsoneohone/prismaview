import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
} from '@nestjs/websockets';
import { from, Observable } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { Server, Socket } from 'socket.io';
import { sleep } from '@/shared/utils/time';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('events')
  /* eslint-disable @typescript-eslint/no-unused-vars */
  handleFindAll(@MessageBody() data: any): Observable<WsResponse<number>> {
    return from([1, 2, 3]).pipe(
      delay(1000),
      map((item) => ({ event: 'events', data: item })),
    );
  }

  @SubscribeMessage('identity')
  async asynchandleIdentity(
    @MessageBody() data: number,
    @ConnectedSocket() socket: Socket,
  ): Promise<number> {
    console.log({ socket });
    await sleep(1000);
    console.log('A second passed...');
    return data;
  }
}
