'use strict';

// ---------------------------------------------------------------------------

const bitfinex = require ('./bitfinex.js');
const { ExchangeError, NotSupported, InsufficientFunds } = require ('./base/errors');

// ---------------------------------------------------------------------------

module.exports = class bitfinex2 extends bitfinex {
    describe () {
        return this.deepExtend (super.describe (), {
            'id': 'bitfinex2',
            'name': 'Bitfinex v2',
            'countries': 'VG',
            'version': 'v2',
            // new metainfo interface
            'has': {
                'CORS': true,
                'createLimitOrder': false,
                'createMarketOrder': false,
                'createOrder': false,
                'deposit': false,
                'editOrder': false,
                'fetchDepositAddress': false,
                'fetchClosedOrders': false,
                'fetchFundingFees': false,
                'fetchMyTrades': false,
                'fetchOHLCV': true,
                'fetchOpenOrders': false,
                'fetchOrder': true,
                'fetchTickers': true,
                'fetchTradingFees': false,
                'withdraw': true,
            },
            'timeframes': {
                '1m': '1m',
                '5m': '5m',
                '15m': '15m',
                '30m': '30m',
                '1h': '1h',
                '3h': '3h',
                '6h': '6h',
                '12h': '12h',
                '1d': '1D',
                '1w': '7D',
                '2w': '14D',
                '1M': '1M',
            },
            'rateLimit': 1500,
            'urls': {
                'logo': 'https://user-images.githubusercontent.com/1294454/27766244-e328a50c-5ed2-11e7-947b-041416579bb3.jpg',
                'api': 'https://api.bitfinex.com',
                'www': 'https://www.bitfinex.com',
                'doc': [
                    'https://bitfinex.readme.io/v2/docs',
                    'https://github.com/bitfinexcom/bitfinex-api-node',
                ],
                'fees': 'https://www.bitfinex.com/fees',
            },
            'api': {
                'v1': {
                    'get': [
                        'symbols',
                        'symbols_details',
                    ],
                },
                'public': {
                    'get': [
                        'platform/status',
                        'tickers',
                        'ticker/{symbol}',
                        'trades/{symbol}/hist',
                        'book/{symbol}/{precision}',
                        'book/{symbol}/P0',
                        'book/{symbol}/P1',
                        'book/{symbol}/P2',
                        'book/{symbol}/P3',
                        'book/{symbol}/R0',
                        'stats1/{key}:{size}:{symbol}/{side}/{section}',
                        'stats1/{key}:{size}:{symbol}/long/last',
                        'stats1/{key}:{size}:{symbol}/long/hist',
                        'stats1/{key}:{size}:{symbol}/short/last',
                        'stats1/{key}:{size}:{symbol}/short/hist',
                        'candles/trade:{timeframe}:{symbol}/{section}',
                        'candles/trade:{timeframe}:{symbol}/last',
                        'candles/trade:{timeframe}:{symbol}/hist',
                    ],
                    'post': [
                        'calc/trade/avg',
                    ],
                },
                'private': {
                    'post': [
                        'auth/r/wallets',
                        'auth/r/orders/{symbol}',
                        'auth/r/orders/{symbol}/new',
                        'auth/r/orders/{symbol}/hist',
                        'auth/r/order/{symbol}:{id}/trades',
                        'auth/r/trades/{symbol}/hist',
                        'auth/r/positions',
                        'auth/r/funding/offers/{symbol}',
                        'auth/r/funding/offers/{symbol}/hist',
                        'auth/r/funding/loans/{symbol}',
                        'auth/r/funding/loans/{symbol}/hist',
                        'auth/r/funding/credits/{symbol}',
                        'auth/r/funding/credits/{symbol}/hist',
                        'auth/r/funding/trades/{symbol}/hist',
                        'auth/r/info/margin/{key}',
                        'auth/r/info/funding/{key}',
                        'auth/r/movements/{currency}/hist',
                        'auth/r/stats/perf:{timeframe}/hist',
                        'auth/r/alerts',
                        'auth/w/alert/set',
                        'auth/w/alert/{type}:{symbol}:{price}/del',
                        'auth/calc/order/avail',
                        'auth/r/ledgers/{symbol}/hist',
                    ],
                },
            },
            'fees': {
                'trading': {
                    'maker': 0.1 / 100,
                    'taker': 0.2 / 100,
                },
                'funding': {
                    'withdraw': {
                        'BTC': 0.0005,
                        'BCH': 0.0005,
                        'ETH': 0.01,
                        'EOS': 0.1,
                        'LTC': 0.001,
                        'OMG': 0.1,
                        'IOT': 0.0,
                        'NEO': 0.0,
                        'ETC': 0.01,
                        'XRP': 0.02,
                        'ETP': 0.01,
                        'ZEC': 0.001,
                        'BTG': 0.0,
                        'DASH': 0.01,
                        'XMR': 0.04,
                        'QTM': 0.01,
                        'EDO': 0.5,
                        'DAT': 1.0,
                        'AVT': 0.5,
                        'SAN': 0.1,
                        'USDT': 5.0,
                        'SPK': 9.2784,
                        'BAT': 9.0883,
                        'GNT': 8.2881,
                        'SNT': 14.303,
                        'QASH': 3.2428,
                        'YYW': 18.055,
                    },
                },
            },
        });
    }

    isFiat (code) {
        let fiat = {
            'USD': 'USD',
            'EUR': 'EUR',
        };
        return (code in fiat);
    }

    getCurrencyId (code) {
        return 'f' + code;
    }

    async fetchMarkets () {
        let markets = await this.v1GetSymbolsDetails ();
        let result = [];
        for (let p = 0; p < markets.length; p++) {
            let market = markets[p];
            let id = market['pair'].toUpperCase ();
            let baseId = id.slice (0, 3);
            let quoteId = id.slice (3, 6);
            let base = this.commonCurrencyCode (baseId);
            let quote = this.commonCurrencyCode (quoteId);
            let symbol = base + '/' + quote;
            id = 't' + id;
            baseId = this.getCurrencyId (baseId);
            quoteId = this.getCurrencyId (quoteId);
            let precision = {
                'price': market['price_precision'],
                'amount': market['price_precision'],
            };
            let limits = {
                'amount': {
                    'min': this.safeFloat (market, 'minimum_order_size'),
                    'max': this.safeFloat (market, 'maximum_order_size'),
                },
                'price': {
                    'min': Math.pow (10, -precision['price']),
                    'max': Math.pow (10, precision['price']),
                },
            };
            limits['cost'] = {
                'min': limits['amount']['min'] * limits['price']['min'],
                'max': undefined,
            };
            result.push ({
                'id': id,
                'symbol': symbol,
                'base': base,
                'quote': quote,
                'baseId': baseId,
                'quoteId': quoteId,
                'active': true,
                'precision': precision,
                'limits': limits,
                'lot': Math.pow (10, -precision['amount']),
                'info': market,
            });
        }
        return result;
    }

    async fetchBalance (params = {}) {
        await this.loadMarkets ();
        let response = await this.privatePostAuthRWallets ();
        let balanceType = this.safeString (params, 'type', 'exchange');
        let result = { 'info': response };
        for (let b = 0; b < response.length; b++) {
            let balance = response[b];
            let accountType = balance[0];
            let currency = balance[1];
            let total = balance[2];
            let available = balance[4];
            if (accountType === balanceType) {
                let code = currency;
                if (currency in this.currencies_by_id) {
                    code = this.currencies_by_id[currency]['code'];
                } else if (currency[0] === 't') {
                    currency = currency.slice (1);
                    code = currency.toUpperCase ();
                    code = this.commonCurrencyCode (code);
                }
                let account = this.account ();
                account['total'] = total;
                if (!available) {
                    if (available === 0) {
                        account['free'] = 0;
                        account['used'] = total;
                    } else {
                        account['free'] = undefined;
                    }
                } else {
                    account['free'] = available;
                    account['used'] = account['total'] - account['free'];
                }
                result[code] = account;
            }
        }
        return this.parseBalance (result);
    }

    async fetchOrderBook (symbol, limit = undefined, params = {}) {
        await this.loadMarkets ();
        let orderbook = await this.publicGetBookSymbolPrecision (this.extend ({
            'symbol': this.marketId (symbol),
            'precision': 'R0',
        }, params));
        let timestamp = this.milliseconds ();
        let result = {
            'bids': [],
            'asks': [],
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'nonce': undefined,
        };
        for (let i = 0; i < orderbook.length; i++) {
            let order = orderbook[i];
            let price = order[1];
            let amount = order[2];
            let side = (amount > 0) ? 'bids' : 'asks';
            amount = Math.abs (amount);
            result[side].push ([ price, amount ]);
        }
        result['bids'] = this.sortBy (result['bids'], 0, true);
        result['asks'] = this.sortBy (result['asks'], 0);
        return result;
    }

    parseTicker (ticker, market = undefined) {
        let timestamp = this.milliseconds ();
        let symbol = undefined;
        if (market)
            symbol = market['symbol'];
        let length = ticker.length;
        let last = ticker[length - 4];
        return {
            'symbol': symbol,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'high': ticker[length - 2],
            'low': ticker[length - 1],
            'bid': ticker[length - 10],
            'bidVolume': undefined,
            'ask': ticker[length - 8],
            'askVolume': undefined,
            'vwap': undefined,
            'open': undefined,
            'close': last,
            'last': last,
            'previousClose': undefined,
            'change': ticker[length - 6],
            'percentage': ticker[length - 5],
            'average': undefined,
            'baseVolume': ticker[length - 3],
            'quoteVolume': undefined,
            'info': ticker,
        };
    }

    async fetchTickers (symbols = undefined, params = {}) {
        await this.loadMarkets ();
        let tickers = await this.publicGetTickers (this.extend ({
            'symbols': this.ids.join (','),
        }, params));
        let result = {};
        for (let i = 0; i < tickers.length; i++) {
            let ticker = tickers[i];
            let id = ticker[0];
            let market = this.markets_by_id[id];
            let symbol = market['symbol'];
            result[symbol] = this.parseTicker (ticker, market);
        }
        return result;
    }

    async fetchTicker (symbol, params = {}) {
        await this.loadMarkets ();
        let market = this.markets[symbol];
        let ticker = await this.publicGetTickerSymbol (this.extend ({
            'symbol': market['id'],
        }, params));
        return this.parseTicker (ticker, market);
    }

    parseTrade (trade, market) {
        let [ id, timestamp, amount, price ] = trade;
        let side = (amount < 0) ? 'sell' : 'buy';
        if (amount < 0) {
            amount = -amount;
        }
        return {
            'id': id.toString (),
            'info': trade,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'symbol': market['symbol'],
            'type': undefined,
            'side': side,
            'price': price,
            'amount': amount,
        };
    }

    async fetchTrades (symbol, since = undefined, limit = 120, params = {}) {
        await this.loadMarkets ();
        let market = this.market (symbol);
        let request = {
            'symbol': market['id'],
            'sort': '-1',
            'limit': limit, // default = max = 120
        };
        if (typeof since !== 'undefined')
            request['start'] = since;
        let response = await this.publicGetTradesSymbolHist (this.extend (request, params));
        let trades = this.sortBy (response, 1);
        return this.parseTrades (trades, market, undefined, limit);
    }

    async fetchOHLCV (symbol, timeframe = '1m', since = undefined, limit = 100, params = {}) {
        await this.loadMarkets ();
        let market = this.market (symbol);
        if (typeof since === 'undefined')
            since = this.milliseconds () - this.parseTimeframe (timeframe) * limit * 1000;
        let request = {
            'symbol': market['id'],
            'timeframe': this.timeframes[timeframe],
            'sort': 1,
            'limit': limit,
            'start': since,
        };
        let response = await this.publicGetCandlesTradeTimeframeSymbolHist (this.extend (request, params));
        return this.parseOHLCVs (response, market, timeframe, since, limit);
    }

    async createOrder (symbol, type, side, amount, price = undefined, params = {}) {
        throw new NotSupported (this.id + ' createOrder not implemented yet');
    }

    cancelOrder (id, symbol = undefined, params = {}) {
        throw new NotSupported (this.id + ' cancelOrder not implemented yet');
    }

    async fetchOrder (id, symbol = undefined, params = {}) {
        throw new NotSupported (this.id + ' fetchOrder not implemented yet');
    }

    async fetchDepositAddress (currency, params = {}) {
        throw new NotSupported (this.id + ' fetchDepositAddress() not implemented yet.');
    }

    async withdraw (currency, amount, address, tag = undefined, params = {}) {
        throw new NotSupported (this.id + ' withdraw not implemented yet');
    }

    async fetchMyTrades (symbol = undefined, since = undefined, limit = 25, params = {}) {
        await this.loadMarkets ();
        let market = this.market (symbol);
        let request = {
            'symbol': market['id'],
            'limit': limit,
            'end': this.seconds (),
        };
        if (typeof since !== 'undefined')
            request['start'] = parseInt (since / 1000);
        let response = await this.privatePostAuthRTradesSymbolHist (this.extend (request, params));
        // return this.parseTrades (response, market, since, limit); // not implemented yet for bitfinex v2
        return response;
    }

    nonce () {
        return this.milliseconds ();
    }

    sign (path, api = 'public', method = 'GET', params = {}, headers = undefined, body = undefined) {
        let request = '/' + this.implodeParams (path, params);
        let query = this.omit (params, this.extractParams (path));
        if (api === 'v1')
            request = api + request;
        else
            request = this.version + request;
        let url = this.urls['api'] + '/' + request;
        if (api === 'public') {
            if (Object.keys (query).length) {
                url += '?' + this.urlencode (query);
            }
        }
        if (api === 'private') {
            this.checkRequiredCredentials ();
            let nonce = this.nonce ().toString ();
            body = this.json (query);
            let auth = '/api' + '/' + request + nonce + body;
            let signature = this.hmac (this.encode (auth), this.encode (this.secret), 'sha384');
            headers = {
                'bfx-nonce': nonce,
                'bfx-apikey': this.apiKey,
                'bfx-signature': signature,
                'Content-Type': 'application/json',
            };
        }
        return { 'url': url, 'method': method, 'body': body, 'headers': headers };
    }

    async request (path, api = 'public', method = 'GET', params = {}, headers = undefined, body = undefined) {
        let response = await this.fetch2 (path, api, method, params, headers, body);
        if (response) {
            if ('message' in response) {
                if (response['message'].indexOf ('not enough exchange balance') >= 0)
                    throw new InsufficientFunds (this.id + ' ' + this.json (response));
                throw new ExchangeError (this.id + ' ' + this.json (response));
            }
            return response;
        } else if (response === '') {
            throw new ExchangeError (this.id + ' returned empty response');
        }
        return response;
    }
};
//     _websocketGenerateUrlStream (events, options) {
//         // let streamList = [];
//         // for (let i = 0; i < events.length; i++) {
//         //     let element = events[i];
//         //     let params = {
//         //         'event': element['event'],
//         //         'symbol': this._websocketMarketId (element['symbol']),
//         //     };
//         //     let streamGenerator = this.wsconf['events'][element['event']]['conx-param']['stream'];
//         //     streamList.push (this.implodeParams (streamGenerator, params));
//         // }
//         // let stream = streamList.join ('/');
//         return options['url'];
//     }

//     _websocketMarketId (symbol) {
//         return this.marketId (symbol).toLowerCase ();
//     }

//     _websocketOnMessage (contextId, data) {
//         let msg = JSON.parse (data);
//         // console.log(this.id + '_websocketOnMessage(): msg = ' + JSON.stringify(msg,null,2))
//         let ws_event = msg['event'];
//         if (typeof ws_event !== 'undefined') {
//             this._websocketOnMessageEvent (contextId, msg);
//         } else {
//             // console.log(this.id + '_websocketOnMessage(): msg does not contain event field.')
//             // It can be an update, then msg is a list. The first element is the channel id.
//             // This should be saved in symboldate when bitfinex returns the first response.
//             let ws_chanId = msg[0];
//             if (typeof ws_chanId !== 'undefined') {
//                 this._websocketOnMessageList (contextId, msg);
//             } else {
//                 this.emit ('err', new NotSupported (this.id + '_websocketOnMessage(): msg is not a list.'));
//             }
//         }
//     }

//     _websocketOnMessageList (contextId, msg) {
//         let ws_chanId = msg[0];
//         // console.log(this.id + '_websocketOnMessageList(): ws_chanId = ' + ws_chanId)
//         if (typeof ws_chanId !== 'undefined') {
//             // chanId appears to be different when resubscribing
//             // find ws_chanId in this.channelIdToSymbol
//             let symbol = this.channelIdToSymbol[ws_chanId.toString ()];
//             // console.log(this.id + '_websocketOnMessageList(): symbol = ' + symbol)
//             this._websocketHandleObUpdate (contextId, msg, symbol);
//         } else {
//             this.emit ('err', new NotSupported (this.id + '_websocketOnMessageList(): msg is not a list.'));
//         }
//     }

//     _websocketOnMessageEvent (contextId, msg) {
//         let ws_event = msg['event'];
//         if (ws_event === 'info') {
//             // contains server information:
//             // msg = {
//             //   "event": "info",
//             //   "version": 2,
//             //   "serverId": "743b0616-0684-4bcd-9fab-c9a0d11feb24",
//             //   "platform": {
//             //     "status": 1
//             //   }
//             // }
//         } else if (ws_event === 'subscribed') {
//             // Now check which channel we subscribed to
//             let ws_channel = msg['channel'];
//             if (ws_channel === 'book') {
//                 this._websocketHandleObFirst (contextId, msg);
//             } else {
//                 this.emit ('err', new NotSupported (this.id + '._websocketOnMessage() ws_event: ' + ws_event + ', ws_channel: ' + ws_channel + ' is not implemented.'));
//                 this.websocketClose (contextId);
//             }
//         } else {
//             this.emit ('err', new NotSupported (this.id + '._websocketOnMessage() ws_event: \'' + ws_event + '\' is not implemented.'));
//             this.websocketClose (contextId);
//         }
//     }

//     _websocketHandleObFirst (contextId, msg) {
//         // msg = {
//         //   event: 'subscribed',
//         //   channel: 'book',
//         //   chanId: CHANNEL_ID,
//         //   symbol: SYMBOL,
//         //   prec: PRECISION,
//         //   freq: FREQUENCY,
//         //   len: LENGTH,
//         // }
//         let ws_event = msg['event'];
//         if (typeof ws_event !== 'undefined') {
//             if (ws_event === 'subscribed') {
//                 // let ws_channel = msg['channel'];
//                 let ws_chanId = msg['chanId'];
//                 let ws_symbol = msg['symbol'];
//                 let ws_precision = msg['prec'];
//                 let ws_frequency = msg['freq'];
//                 let ws_length = msg['len'];
//                 if (ws_symbol[0] === 't') {
//                     ws_symbol = ws_symbol.substring (1);
//                 }
//                 let symbol = this.findSymbol (ws_symbol.toString ());
//                 this.channelIdToSymbol[ws_chanId] = symbol;
//                 // console.log(this.id + '_websocketHandleOb(): symbol = ' + symbol)
//                 let symbolData = this._contextGetSymbolData (contextId, 'ob', symbol);
//                 symbolData['chanId'] = ws_chanId;
//                 symbolData['prec'] = ws_precision;
//                 symbolData['freq'] = ws_frequency;
//                 symbolData['len'] = ws_length;
//                 symbolData['ob'] = {
//                     'asks': [], // regular orderbook
//                     'bids': [], // regular orderbook
//                 };
//                 symbolData['ob_map'] = {
//                     'asks_map': {}, // indexed by price, value is [amount, count]
//                     'bids_map': {}, // indexed by price, value is [amount, count]
//                 };
//                 this._contextSetSymbolData (contextId, 'ob', symbol, symbolData);
//             } else {
//                 this.emit ('err', new NotSupported (this.id + '._websocketHandleObFirst() unsupported event: ' + ws_event));
//                 this.websocketClose (contextId);
//             }
//         } else {
//             this.emit ('err', new NotSupported (this.id + '._websocketHandleObFirst() msg does not contain event.'));
//             this.websocketClose (contextId);
//         }
//     }

//     _websocketHandleObUpdate (contextId, msg, symbol) {
//         let symbolData = this._contextGetSymbolData (contextId, 'ob', symbol);
//         let orderbook_map = symbolData['ob_map'];
//         let payload = msg[1];
//         // console.log(this.id + '._websocketHandleObUpdate(): payload = ' + JSON.stringify(payload, null, 2))
//         if (typeof payload[0].length === 'undefined') {
//             // payload is a single order
//             orderbook_map = this._websocketParseOrders (orderbook_map, [payload]);
//             // this.emit ('err', new NotSupported (this.id + '._websocketHandleObUpdate() STOP HERE FOR DEBUGGING'));
//         } else if (payload[0].length === 3) {
//             // payload is a list of orders
//             orderbook_map = this._websocketParseOrders (orderbook_map, payload);
//             // console.log(this.id + '._websocketHandleObUpdate(): ob = ' + JSON.stringify(payload, null, 2))
//         }
//         // build orderbook fields 'asks' and 'bids'
//         let orderbook = this._websocketBuildOrderbook (orderbook_map['bids_map'], orderbook_map['asks_map']);
//         // console.log(this.id + '._websocketParseOrders(): ob = ' + JSON.stringify(orderbook, null, 2))
//         symbolData['ob'] = orderbook;
//         symbolData['ob_map'] = orderbook_map;
//         this._contextSetSymbolData (contextId, 'ob', symbol, symbolData);
//         this.emit ('ob', symbol, symbolData['ob']);
//     }

//     _websocketParseOrders (orderbook_map, order_list) {
//         // order = [
//         //  price,
//         //  count,
//         //  amount
//         // ]
//         let bids_map = orderbook_map['bids_map'];
//         let asks_map = orderbook_map['asks_map'];
//         let nOrders = order_list.length;
//         let order = [];
//         let price = 0;
//         let count = 0; // number of order at this price
//         let amount = 0;
//         let i = 0;
//         for (i = 0; i < nOrders; i++) {
//             order = order_list[i];
//             price = order[0].toString ();
//             count = order[1]; // number of order at this price
//             amount = order[2];
//             if (count > 0) {
//                 // add or update bid or ask
//                 if (amount > 0) {
//                     // bids
//                     bids_map[price] = [amount, count];
//                 } else if (amount < 0) {
//                     // asks
//                     asks_map[price] = [-amount, count];
//                 }
//             } else if (count === 0) {
//                 // remove bid or ask
//                 if (amount > 0) {
//                     // bids
//                     delete bids_map[price];
//                 } else if (amount < 0) {
//                     // asks
//                     delete asks_map[price];
//                 }
//             }
//         }
//         bids_map = this.keysort (bids_map);
//         asks_map = this.keysort (asks_map);
//         orderbook_map['bids_map'] = bids_map;
//         orderbook_map['asks_map'] = asks_map;
//         return orderbook_map;
//     }

//     _websocketBuildOrderbook (bids_map, asks_map) {
//         let bids = this._websocketCloneBidOrAsk (bids_map);
//         let asks = this._websocketCloneBidOrAsk (asks_map);
//         let orderbook = {
//             'asks': asks,
//             'bids': bids,
//         };
//         orderbook = this.parseOrderBook (orderbook);
//         return orderbook;
//     }

//     _websocketCloneBidOrAsk (some_dict) {
//         let bidOrAsk = [];
//         let keys = Object.keys (some_dict);
//         let nkeys = keys.length;
//         let key = 0;
//         let val = 0;
//         let amount = 0;
//         let i = 0;
//         for (i = 0; i < nkeys; i++) {
//             key = parseFloat (keys[i]);
//             val = some_dict[key];
//             amount = val[0];
//             if (typeof val !== 'undefined') {
//                 bidOrAsk.push ([key, amount]);
//             }
//         }
//         return bidOrAsk;
//     }

//     _websocketDictClean (some_dict) {
//         let new_dict = {};
//         let keys = Object.keys (some_dict);
//         let nkeys = keys.length;
//         let key = 0;
//         let val = 0;
//         let i = 0;
//         for (i = 0; i < nkeys; i++) {
//             key = keys[i];
//             val = some_dict[key];
//             if (typeof val !== 'undefined') {
//                 new_dict[key] = val;
//             }
//         }
//         return new_dict;
//     }

//     _websocketHandleObDeltaCache (contextId, symbol) {
//         let symbolData = this._contextGetSymbolData (contextId, 'ob', symbol);
//         // Handle out-of-order sequenceNumber
//         //
//         // To avoid a memory leak, we must put a maximum on the size of obDeltaCache.
//         // When this maximum is reached, we accept that we have lost some orderbook updates.
//         // In this case we must fetch a new orderbook.
//         // Alternatively, we could apply all cached deltas and keep going.
//         if (symbolData['obDeltaCacheSize'] > symbolData['obDeltaCacheSizeMax']) {
//             symbolData['ob'] = this.fetchOrderBook (symbol, symbolData['limit']);
//             // delete symbolData['obDeltaCache'];
//             symbolData['obDeltaCache'] = undefined;
//             symbolData['obDeltaCacheSize'] = 0;
//             this._contextSetSymbolData (contextId, 'ob', symbol, symbolData);
//             return;
//         }
//         if (symbolData['obDeltaCacheSize'] === 0) {
//             this._contextSetSymbolData (contextId, 'ob', symbol, symbolData);
//             return;
//         }
//         // if the cache exists
//         // check if the next sequenceNumber is in the cache
//         let fullOrderbook = symbolData['ob'];
//         let lastSequenceNumber = fullOrderbook['obLastSequenceNumber'];
//         let cachedSequenceNumber = lastSequenceNumber + 1;
//         let cachedSequenceNumberStr = cachedSequenceNumber.toString ();
//         let orderbookDelta = symbolData['obDeltaCache'][cachedSequenceNumberStr];
//         let continueBool = typeof orderbookDelta !== 'undefined';
//         // While loop is not transpiled properly
//         // while (continueBool) {
//         let nkeys = symbolData['obDeltaCacheSize'];
//         let i = 0;
//         for (i = 0; i < nkeys; i++) {
//             if (!continueBool) {
//                 break;
//             }
//             symbolData['obDeltaCache'][cachedSequenceNumberStr] = undefined;
//             fullOrderbook = this.mergeOrderBookDelta (symbolData['ob'], orderbookDelta);
//             fullOrderbook = this._cloneOrderBook (fullOrderbook, symbolData['limit']);
//             fullOrderbook['obLastSequenceNumber'] = cachedSequenceNumber;
//             symbolData['ob'] = fullOrderbook;
//             cachedSequenceNumber += 1;
//             orderbookDelta = symbolData['obDeltaCache'][cachedSequenceNumberStr];
//             continueBool = typeof orderbookDelta !== 'undefined';
//             symbolData['obDeltaCacheSize'] -= 1;
//         }
//         this._contextSetSymbolData (contextId, 'ob', symbol, symbolData);
//     }

//     _websocketSubscribeOb (contextId, event, symbol, nonce, params = {}) {
//         // create mapping from channelId received from bitfinex to marketid or symbol
//         if (typeof this.channelIdToSymbol === 'undefined') {
//             this.channelIdToSymbol = {};
//         }
//         let symbolData = this._contextGetSymbolData (contextId, 'ob', symbol);
//         symbolData['limit'] = this.safeInteger (params, 'limit', undefined);
//         // symbolData['obDeltaCache'] = undefined;
//         // symbolData['obDeltaCacheSize'] = 0;
//         // symbolData['obDeltaCacheSizeMax'] = this.safeInteger (params, 'obDeltaCacheSizeMax', 10);
//         this._contextSetSymbolData (contextId, 'ob', symbol, symbolData);
//         //
//         let market = this.marketId (symbol);
//         let limit = symbolData['limit'];
//         if (limit !== 25 && limit !== 100) {
//             limit = 25; // limit can only be 25 or 100
//         }
//         //
//         let payload = {
//             'event': 'subscribe',
//             'channel': 'book',
//             'symbol': market,
//             'prec': 'P0', // highest precision
//             'freq': 'F0', // realtime data
//             'len': limit,
//         };
//         // console.log(this.id + '._websocketSubscribeOb(): payload = ' + JSON.stringify(payload,null,2))
//         // console.log(this.id + '._websocketSubscribeOb(): symbol = ' + symbol)
//         let nonceStr = nonce.toString ();
//         this.emit (nonceStr, true);
//         this.websocketSendJson (payload);
//     }

//     _websocketSubscribe (contextId, event, symbol, nonce, params = {}) {
//         if (event === 'ob') {
//             this._websocketSubscribeOb (contextId, event, symbol, nonce, params);
//         } else {
//             throw new NotSupported (this.id + '._websocketSubscribe() ' + event + '(' + symbol + ') not supported for exchange ' + this.id);
//         }
//     }

//     _websocketUnsubscribeOb (conxid, event, symbol, nonce, params) {
//         let symbolData = this._contextGetSymbolData (conxid, 'ob', symbol);
//         let chanId = symbolData['chanId'];
//         let payload = {
//             'event': 'unsubscribe',
//             'chanId': chanId,
//         };
//         let nonceStr = nonce.toString ();
//         this.emit (nonceStr, true);
//         this.websocketSendJson (payload);
//     }

//     _websocketUnsubscribe (conxid, event, symbol, nonce, params) {
//         if (event === 'ob') {
//             this._websocketUnsubscribeOb (conxid, event, symbol, nonce, params);
//         } else {
//             throw new NotSupported (this.id + '._websocketUnsubscribe() ' + event + '(' + symbol + ') not supported for exchange ' + this.id);
//         }
//     }

//     _getCurrentWebsocketOrderbook (contextId, symbol, limit) {
//         let data = this._contextGetSymbolData (contextId, 'ob', symbol);
//         if (('ob' in data) && (typeof data['ob'] !== 'undefined')) {
//             return this._cloneOrderBook (data['ob'], limit);
//         }
//         return undefined;
//     }
// };
