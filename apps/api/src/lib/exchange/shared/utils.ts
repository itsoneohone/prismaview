import { AccessKey, ExchangeNameEnum } from '@prisma/client';
import { GetExchangeDto } from 'src/lib/exchange/dto';
import { ExchangeFactory } from 'src/lib/exchange/exchange.factory';
import { CryptoExchange } from 'src/lib/exchange/types';

/**
 * Use an access key credentials to instantiate the right CryptoExchange class
 *
 * @param accessKey AccessKey
 * @returns
 */
export function getCryptoExchange(accessKey: AccessKey): CryptoExchange {
  const dto: GetExchangeDto = {
    accessKeyId: accessKey.id,
    userId: accessKey.userId,
    key: accessKey.key,
    secret: accessKey.secret,
    exchange: ExchangeNameEnum[accessKey.exchange],
  };
  return ExchangeFactory.create(dto);
}

/**
 * Use an exchange name to check if it's supported.
 *
 * @param exchangeName
 * @returns
 */
export function isSupportedExchange(exchangeName: string): boolean {
  return Object.keys(ExchangeNameEnum).indexOf(exchangeName) > -1;
}
