import {
  OrderCurrencyEnum,
  OrderSideEnum,
  OrderStatusEnum,
  OrderTypeEnum,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import {
  IsDateString,
  IsDecimal,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateOrderDto {
  @IsString()
  @IsOptional()
  orderId: string;

  @IsNumber()
  @IsOptional()
  timestamp: number;

  @IsDateString()
  @IsNotEmpty()
  datetime: Date;

  @IsEnum(OrderStatusEnum)
  @IsNotEmpty()
  status: OrderStatusEnum;

  @IsString()
  @IsNotEmpty()
  symbol: string;

  @IsEnum(OrderTypeEnum)
  @IsNotEmpty()
  type: OrderTypeEnum;

  @IsEnum(OrderSideEnum)
  @IsNotEmpty()
  side: OrderSideEnum;

  @IsDecimal()
  @IsNotEmpty()
  price: Decimal;

  // actual order amount filled
  @IsDecimal()
  @IsNotEmpty()
  filled: Decimal;

  // filled * price
  @IsDecimal()
  @IsOptional()
  cost: Decimal;

  @IsDecimal()
  @IsNotEmpty()
  fee: Decimal;

  @IsEnum(OrderCurrencyEnum)
  @IsNotEmpty()
  currency: OrderCurrencyEnum;

  @IsNumber()
  @IsOptional()
  accessKeyId: number;

  @IsNumber()
  @IsOptional()
  userId: number;

  @IsOptional()
  rawData: string;
}

// Bitstamp
// fn: privatePostUserTransactions()
const bitstampTrade = {
  id: 69936156,
  datetime: '2018-07-11 14:31:21',
  type: '2',
  fee: '0.05000',
  btc: '0.00313743',
  usd: '-19.94997614',
  btc_usd: 6358.7,
  eur: 0,
  order_id: 1826694719,
};

// fn: fetchMyTrades()
const ccxtBitstampTrade = {
  id: '69936156',
  info: {
    id: 69936156,
    datetime: '2018-07-11 14:31:21',
    type: '2',
    fee: '0.05000',
    btc: '0.00313743',
    usd: '-19.94997614',
    btc_usd: 6358.7,
    eur: 0,
    order_id: 1826694719,
  },
  timestamp: 1531319481000,
  datetime: '2018-07-11T14:31:21.000Z',
  symbol: 'BTC/USD',
  order: '1826694719',
  side: 'buy',
  price: 6358.7,
  amount: 0.00313743,
  cost: 19.94997614,
  fee: {
    cost: 0.05,
    currency: 'USD',
  },
  fees: [
    {
      cost: 0.05,
      currency: 'USD',
    },
  ],
};

// fn: fetchClosedOrders()
const krakenOrder = {
  id: 'OH54U5-5GLIQ-VKQMLR',
  info: {
    id: 'OH54U5-5GLIQ-VKQMLR',
    refid: null,
    userref: null,
    status: 'closed',
    opentm: '1614056681.505493',
    starttm: '0',
    expiretm: '0',
    descr: {
      pair: 'XBTEUR',
      type: 'buy',
      ordertype: 'market',
      price: '0',
      price2: '0',
      leverage: 'none',
      order: 'buy 0.00090000 XBTEUR @ market',
      close: '',
    },
    vol: '0.00090000',
    vol_exec: '0.00090000',
    cost: '37.01691',
    fee: '0.09624',
    price: '41129.9',
    stopprice: '0.00000',
    limitprice: '0.00000',
    misc: '',
    oflags: 'fciq',
    trades: ['TDFLHU-XV2TN-JMS54Z'],
    reason: null,
    closetm: '1614056681.5513754',
  },
  timestamp: 1614056681505,
  datetime: '2021-02-23T05:04:41.505Z',
  status: 'closed',
  symbol: 'BTC/EUR',
  type: 'market',
  timeInForce: 'IOC',
  postOnly: false,
  side: 'buy',
  price: 41129.9,
  stopPrice: 0,
  triggerPrice: 0,
  cost: 37.01691,
  amount: 0.0009,
  filled: 0.0009,
  average: 41129.9,
  remaining: 0,
  fee: {
    cost: 0.09624,
    currency: 'EUR',
  },
  trades: [
    {
      id: 'TDFLHU-XV2TN-JMS54Z',
      orderId: 'OH54U5-5GLIQ-VKQMLR',
      symbol: 'BTC/EUR',
      info: {},
      fees: [],
      fee: {},
    },
  ],
  fees: [
    {
      cost: 0.09624,
      currency: 'EUR',
    },
  ],
};
