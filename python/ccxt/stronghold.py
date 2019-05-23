# -*- coding: utf-8 -*-

# PLEASE DO NOT EDIT THIS FILE, IT IS GENERATED AND WILL BE OVERWRITTEN:
# https://github.com/ccxt/ccxt/blob/master/CONTRIBUTING.md#how-to-contribute-code

from ccxt.base.exchange import Exchange
import base64
import hashlib
from ccxt.base.errors import ExchangeError
from ccxt.base.errors import AuthenticationError
from ccxt.base.errors import AccountSuspended
from ccxt.base.errors import ArgumentsRequired
from ccxt.base.errors import InsufficientFunds
from ccxt.base.errors import NotSupported
from ccxt.base.errors import InvalidNonce


class stronghold (Exchange):

    def describe(self):
        return self.deep_extend(super(stronghold, self).describe(), {
            'id': 'stronghold',
            'name': 'Stronghold',
            'country': ['US'],
            'rateLimit': 1000,
            'version': 'v1',
            'comment': 'This comment is optional',
            'urls': {
                'logo': 'https://user-images.githubusercontent.com/1294454/52160042-98c1f300-26be-11e9-90dd-da8473944c83.jpg',
                'api': {
                    'public': 'https://api.stronghold.co',
                    'private': 'https://api.stronghold.co',
                },
                'www': 'https://stronghold.co',
                'doc': [
                    'https://docs.stronghold.co',
                ],
            },
            'requiredCredentials': {
                'apiKey': True,
                'secret': True,
                'password': True,
            },
            'has': {
                'fetchMarkets': True,
                'fetchCurrencies': True,
                'fetchOrderBook': True,
                'fetchOpenOrders': True,
                'fetchTrades': True,
                'fetchMyTrades': True,
                'fetchDepositAddress': False,
                'createDepositAddress': True,
                'withdraw': True,
                'fetchTicker': False,
                'fetchTickers': False,
                'fetchAccounts': True,
                'fetchTransactions': True,
            },
            'api': {
                'public': {
                    'get': [
                        'utilities/time',
                        'utilities/uuid',
                        'venues',
                        'venues/{venueId}/assets',
                        'venues/{venueId}/markets',
                        'venues/{venueId}/markets/{marketId}/orderbook',
                        'venues/{venueId}/markets/{marketId}/trades',
                    ],
                    'post': [
                        'venues/{venueId}/assets',
                        'iam/credentials',
                        'identities',
                    ],
                    'patch': [
                        'identities',
                    ],
                    'put': [
                        'iam/credentials/{credentialId}',
                    ],
                    'delete': [
                        'iam/credentials/{credentialId}',
                    ],
                },
                'private': {
                    'get': [
                        'venues',
                        'venues/{venueId}/accounts',
                        'venues/{venueId}/accounts/{accountId}',
                        'venues/{venueId}/accounts/{accountId}/payments/{paymentId}',
                        'venues/{venueId}/accounts/{accountId}/orders',
                        'venues/{venueId}/accounts/{accountId}/trades',
                        'venues/{venueId}/accounts/{accountId}/transactions',
                    ],
                    'post': [
                        'venues/{venueId}/accounts',
                        'venues/{venueId}/accounts/{accountId}/orders',
                        'venues/{venueId}/accounts/{accountId}/deposit',
                        'venues/{venueId}/accounts/{accountId}/withdrawal',
                        'venues/{venueId}/accounts/{accountId}/payments',
                        'venues/{venueId}/accounts/{accountId}/payments/{paymentId}/stop',
                        'venues/{venueId}/custody/accounts/{accountId}/operations/{operationId}/signatures',
                        'venues/{venueId}/anchor/withdrawal',
                        'venues/{venueId}/testing/friendbot',
                    ],
                    'delete': [
                        'venues/{venueId}/accounts/{accountId}/orders/{orderId}',
                    ],
                },
            },
            'options': {
                'accountId': None,
                'venueId': 'trade-public',
                'venues': {
                    'trade': 'trade-public',
                    'sandbox': 'sandbox-public',
                },
                'paymentMethods': {
                    'ETH': 'ethereum',
                    'BTC': 'bitcoin',
                    'XLM': 'stellar',
                    'XRP': 'ripple',
                    'LTC': 'litecoin',
                    'SHX': 'stellar',
                },
            },
            'exceptions': {
                'CREDENTIAL_MISSING': AuthenticationError,
                'CREDENTIAL_INVALID': AuthenticationError,
                'CREDENTIAL_REVOKED': AccountSuspended,
                'CREDENTIAL_NO_IDENTITY': AuthenticationError,
                'PASSPHRASE_INVALID': AuthenticationError,
                'SIGNATURE_INVALID': AuthenticationError,
                'TIME_INVALID': InvalidNonce,
                'BYPASS_INVALID': AuthenticationError,
                'INSUFFICIENT_FUNDS': InsufficientFunds,
            },
        })

    def get_active_account(self):
        if self.options['accountId'] is not None:
            return self.options['accountId']
        self.loadAccounts()
        numAccounts = len(self.accounts)
        if numAccounts > 0:
            return self.accounts[0]['id']
        raise ExchangeError(self.id + ' requires an accountId.')

    def fetch_accounts(self, params={}):
        request = {
            'venueId': self.options['venueId'],
        }
        response = self.privateGetVenuesVenueIdAccounts(self.extend(request, params))
        #
        #   [{id: '34080200-b25a-483d-a734-255d30ba324d',
        #       venueSpecificId: ''} ...]
        #
        return response['result']

    def fetch_time(self, params={}):
        response = self.publicGetUtilitiesTime(params)
        #
        #     {
        #         "requestId": "6de8f506-ad9d-4d0d-94f3-ec4d55dfcdb9",
        #         "timestamp": 1536436649207281,
        #         "success": True,
        #         "statusCode": 200,
        #         "result": {
        #             "timestamp": "2018-09-08T19:57:29.207282Z"
        #         }
        #     }
        #
        return self.parse8601(self.safe_string(response['result'], 'timestamp'))

    def fetch_markets(self, params={}):
        request = {
            'venueId': self.options['venueId'],
        }
        response = self.publicGetVenuesVenueIdMarkets(self.extend(request, params))
        data = response['result']
        #
        #     [
        #         {
        #             id: 'SHXUSD',
        #             baseAssetId: 'SHX/stronghold.co',
        #             counterAssetId: 'USD/stronghold.co',
        #             minimumOrderSize: '1.0000000',
        #             minimumOrderIncrement: '1.0000000',
        #             minimumPriceIncrement: '0.00010000',
        #             displayDecimalsPrice: 4,
        #             displayDecimalsAmount: 0
        #         },
        #         ...
        #     ]
        #
        result = {}
        for i in range(0, len(data)):
            entry = data[i]
            marketId = entry['id']
            baseId = entry['baseAssetId']
            quoteId = entry['counterAssetId']
            baseAssetId = baseId.split('/')[0]
            quoteAssetId = quoteId.split('/')[0]
            base = self.common_currency_code(baseAssetId)
            quote = self.common_currency_code(quoteAssetId)
            symbol = base + '/' + quote
            limits = {
                'amount': {
                    'min': self.safe_float(entry, 'minimumOrderSize'),
                    'max': None,
                },
            }
            precision = {
                'price': self.safe_integer(entry, 'displayDecimalsPrice'),
                'amount': self.safe_integer(entry, 'displayDecimalsAmount'),
            }
            result[symbol] = {
                'symbol': symbol,
                'id': marketId,
                'base': base,
                'quote': quote,
                'baseId': baseId,
                'quoteId': quoteId,
                'precision': precision,
                'info': entry,
                'limits': limits,
            }
        return result

    def fetch_currencies(self, params={}):
        request = {
            'venueId': self.options['venueId'],
        }
        response = self.publicGetVenuesVenueIdAssets(self.extend(request, params))
        #
        #     [
        #         {
        #             id: 'XLM/native',
        #             alias: '',
        #             code: 'XLM',
        #             name: '',
        #             displayDecimalsFull: 7,
        #             displayDecimalsSignificant: 2,
        #         },
        #         ...
        #     ]
        #
        data = response['result']
        result = {}
        limits = {
            'amount': {
                'min': None,
                'max': None,
            },
            'price': {
                'min': None,
                'max': None,
            },
            'cost': {
                'min': None,
                'max': None,
            },
            'withdraw': {
                'min': None,
                'max': None,
            },
        }
        for i in range(0, len(data)):
            entry = data[i]
            assetId = self.safe_string(entry, 'id')
            currencyId = self.safe_string(entry, 'code')
            code = self.common_currency_code(currencyId)
            precision = self.safe_integer(entry, 'displayDecimalsFull')
            result[code] = {
                'code': code,
                'id': assetId,
                'precision': precision,
                'info': entry,
                'active': None,
                'name': None,
                'limits': limits,
            }
        return result

    def fetch_order_book(self, symbol, limit=None, params={}):
        self.load_markets()
        marketId = self.market_id(symbol)
        request = {
            'marketId': marketId,
            'venueId': self.options['venueId'],
        }
        response = self.publicGetVenuesVenueIdMarketsMarketIdOrderbook(self.extend(request, params))
        #
        #     {
        #         marketId: 'ETHBTC',
        #         bids: [
        #             ['0.031500', '7.385000'],
        #             ...,
        #         ],
        #         asks: [
        #             ['0.031500', '7.385000'],
        #             ...,
        #         ],
        #     }
        #
        data = response['result']
        timestamp = self.parse8601(self.safe_string(response, 'timestamp'))
        return self.parse_order_book(data, timestamp)

    def fetch_trades(self, symbol, since=None, limit=None, params={}):
        self.load_markets()
        market = self.market(symbol)
        request = {
            'marketId': market['id'],
            'venueId': self.options['venueId'],
        }
        response = self.publicGetVenuesVenueIdMarketsMarketIdTrades(self.extend(request, params))
        #
        #     {
        #         "requestId": "4d343700-b53f-4975-afcc-732ae9d3c828",
        #         "timestamp": "2018-11-08T19:22:11.399543Z",
        #         "success": True,
        #         "statusCode": 200,
        #         "result": {
        #             "marketId": "",
        #             "trades": [
        #                 ["0.9", "3.10", "sell", "2018-11-08T19:22:11.399547Z"],
        #                 ...
        #             ],
        #         }
        #     }
        #
        return self.parse_trades(response['result']['trades'], market, since, limit)

    def parse_trade(self, trade, market=None):
        #
        # fetchTrades(public)
        #
        #      ['0.03177000', '0.0643501', 'sell', '2019-01-27T23:02:04Z']
        #
        # fetchMyTrades(private)
        #
        #     {
        #         id: '9cdb109c-d035-47e2-81f8-a0c802c9c5f9',
        #         orderId: 'a38d8bcb-9ff5-4c52-81a0-a40196a66462',
        #         marketId: 'XLMUSD',
        #         side: 'sell',
        #         size: '1.0000000',
        #         price: '0.10440600',
        #         settled: True,
        #         maker: False,
        #         executedAt: '2019-02-01T18:44:21Z'
        #     }
        #
        id = None
        takerOrMaker = None
        price = None
        amount = None
        cost = None
        side = None
        timestamp = None
        orderId = None
        if isinstance(trade, list):
            price = float(trade[0])
            amount = float(trade[1])
            side = trade[2]
            timestamp = self.parse8601(trade[3])
        else:
            id = self.safe_string(trade, 'id')
            price = self.safe_float(trade, 'price')
            amount = self.safe_float(trade, 'size')
            side = self.safe_string(trade, 'side')
            timestamp = self.parse8601(self.safe_string(trade, 'executedAt'))
            orderId = self.safe_string(trade, 'orderId')
            marketId = self.safe_string(trade, 'marketId')
            market = self.safe_value(self.markets_by_id, marketId)
            isMaker = self.safe_value(trade, 'maker')
            takerOrMaker = 'maker' if isMaker else 'taker'
        if amount is not None and price is not None:
            cost = amount * price
        symbol = None
        if market is not None:
            symbol = market['symbol']
        return {
            'id': id,
            'info': trade,
            'timestamp': timestamp,
            'datetime': self.iso8601(timestamp),
            'symbol': symbol,
            'type': None,
            'order': orderId,
            'side': side,
            'price': price,
            'amount': amount,
            'cost': cost,
            'takerOrMaker': takerOrMaker,
            'fee': {
                'cost': None,
                'currency': None,
                'rate': None,
            },
        }

    def fetch_transactions(self, code=None, since=None, limit=None, params={}):
        self.load_markets()
        request = self.extend({
            'venueId': self.options['venueId'],
            'accountId': self.get_active_account(),
        }, params)
        if not request['accountId']:
            raise ArgumentsRequired(self.id + " fetchTransactions requires either the 'accountId' extra parameter or exchange.options['accountId'] = 'YOUR_ACCOUNT_ID'.")
        response = self.privateGetVenuesVenueIdAccountsAccountIdTransactions(request)
        currency = None
        if code is not None:
            currency = self.currency(code)
        return self.parseTransactions(response['result'], currency, since, limit)

    def parse_transaction_status(self, status):
        statuses = {
            'queued': 'pending',
            'settling': 'pending',
        }
        return self.safe_string(statuses, status, status)

    def parse_transaction(self, transaction, currency=None):
        # {
        #     "id": "6408e003-0f14-4457-9340-ba608992ad5c",
        #     "status": "queued",
        #     "direction": "outgoing",
        #     "amount": "98.95000000",
        #     "assetId": "XLM/native",
        #     "sourceAccount": {
        #       "id": "774fa8ef-600b-4636-b9ed-cd6d23421915",
        #       "venueSpecificId": "GC5FIBIQZTQRMJE34GYF5EKH77GEQ3OHFX3NIP5OKDIZFA6VERLZSHY6"
        #     },
        #     "destinationAccount": {
        #       "id": "f72b9fb5-9607-4dd3-b31f-6ded21337056",
        #       "venueSpecificId": "GAOWV6CYBE7DEWSWPODXLMI5YB75VXXZJX5OYVQ2YLZH2TVA3TMMSNYW"
        #     }
        #   }
        id = self.safe_string(transaction, 'id')
        assetId = self.safe_string(transaction, 'assetId')
        code = None
        if assetId is not None:
            currencyId = assetId.split('/')[0]
            code = self.common_currency_code(currencyId)
        else:
            if currency is not None:
                code = currency['code']
        amount = self.safe_float(transaction, 'amount')
        status = self.parse_transaction_status(self.safe_string(transaction, 'status'))
        feeCost = self.safe_float(transaction, 'feeAmount')
        feeRate = None
        if feeCost is not None:
            feeRate = feeCost / amount
        direction = self.safe_string(transaction, 'direction')
        datetime = self.safe_string(transaction, 'requestedAt')
        timestamp = self.parse8601(datetime)
        updated = self.parse8601(self.safe_string(transaction, 'updatedAt'))
        type = 'withdrawal' if (direction == 'outgoing' or direction == 'withdrawal') else 'deposit'
        fee = {
            'cost': feeCost,
            'rate': feeRate,
        }
        return {
            'id': id,
            'info': transaction,
            'currency': code,
            'amount': amount,
            'status': status,
            'fee': fee,
            'tag': None,
            'type': type,
            'updated': updated,
            'address': None,
            'txid': None,
            'timestamp': timestamp,
            'datetime': datetime,
        }

    def create_order(self, symbol, type, side, amount, price=None, params={}):
        self.load_markets()
        market = self.market(symbol)
        request = self.extend({
            'venueId': self.options['venueId'],
            'accountId': self.get_active_account(),
            'marketID': market['id'],
            'type': type,
            'side': side,
            'size': self.amount_to_precision(symbol, amount),
            'price': self.price_to_precision(symbol, price),
        }, params)
        if not request['accountId']:
            raise ArgumentsRequired(self.id + " createOrder requires either the 'accountId' extra parameter or exchange.options['accountId'] = 'YOUR_ACCOUNT_ID'.")
        response = self.privatePostVenuesVenueIdAccountsAccountIdOrders(request)
        return self.parse_order(response, market)

    def cancel_order(self, id, symbol=None, params={}):
        request = self.extend({
            'venueId': self.options['venueId'],
            'accountId': self.get_active_account(),
            'orderId': id,
        }, params)
        if not request['accountId']:
            raise ArgumentsRequired(self.id + " cancelOrder requires either the 'accountId' extra parameter or exchange.options['accountId'] = 'YOUR_ACCOUNT_ID'.")
        response = self.privateDeleteVenuesVenueIdAccountsAccountIdOrdersOrderId(request)
        return self.parse_order(response)

    def fetch_open_orders(self, symbol=None, since=None, limit=None, params={}):
        self.load_markets()
        market = None
        if symbol is not None:
            market = self.market(symbol)
        request = self.extend({
            'venueId': self.options['venueId'],
            'accountId': self.get_active_account(),
        }, params)
        if not request['accountId']:
            raise ArgumentsRequired(self.id + " cancelOrder requires either the 'accountId' extra parameter or exchange.options['accountId'] = 'YOUR_ACCOUNT_ID'.")
        response = self.privateGetVenuesVenueIdAccountsAccountIdOrders(request)
        return self.parse_orders(response['result'], market, since, limit)

    def parse_order(self, order, market=None):
        # {id: '178596',
        #   marketId: 'XLMUSD',
        #   side: 'buy',
        #   size: '1.0000000',
        #   sizeFilled: '0',
        #   price: '0.10000000',
        #   placedAt: '2019-02-01T19:47:52Z'}
        marketId = self.safe_string(order, 'marketId')
        if marketId is not None:
            market = self.safe_value(self.marketsById, marketId)
        symbol = None
        if market is not None:
            symbol = market['symbol']
        id = self.safe_string(order, 'id')
        datetime = self.safe_string(order, 'placedAt')
        amount = self.safe_float(order, 'size')
        price = self.safe_float(order, 'price')
        filled = self.safe_float(order, 'sizeFilled')
        cost = None
        remaining = None
        if amount is not None:
            if filled is not None:
                remaining = amount - filled
            if price is not None:
                cost = amount * price
        return {
            'id': id,
            'info': order,
            'symbol': symbol,
            'datetime': datetime,
            'timestamp': self.parse8601(datetime),
            'side': self.safe_string(order, 'side'),
            'amount': amount,
            'filled': filled,
            'remaining': remaining,
            'price': price,
            'cost': cost,
            'trades': [],
            'lastTradeTimestamp': None,
            'status': None,
            'type': None,
            'average': None,
        }

    def nonce(self):
        return self.seconds()

    def set_sandbox_mode(self, enabled):
        if enabled:
            self.options['venueId'] = self.options['venues']['sandbox']
        else:
            self.options['venueId'] = self.options['venues']['trade']

    def fetch_balance(self, params={}):
        request = self.extend({
            'venueId': self.options['venueId'],
            'accountId': self.get_active_account(),
        }, params)
        if not('accountId' in list(request.keys())):
            raise ArgumentsRequired(self.id + " fetchBalance requires either the 'accountId' extra parameter or exchange.options['accountId'] = 'YOUR_ACCOUNT_ID'.")
        response = self.privateGetVenuesVenueIdAccountsAccountId(request)
        balances = response['result']['balances']
        result = {}
        for i in range(0, len(balances)):
            entry = balances[i]
            asset = entry['assetId'].split('/')[0]
            code = self.common_currency_code(asset)
            account = {}
            account['total'] = self.safe_float(entry, 'amount', 0.0)
            account['free'] = self.safe_float(entry, 'availableForTrade', 0.0)
            account['used'] = account['total'] - account['free']
            result[code] = account
        return self.parse_balance(result)

    def fetch_my_trades(self, symbol=None, since=None, limit=None, params={}):
        self.load_markets()
        request = self.extend({
            'venueId': self.options['venueId'],
            'accountId': self.get_active_account(),
        }, params)
        if not request['accountId']:
            raise ArgumentsRequired(self.id + " fetchMyTrades requires either the 'accountId' extra parameter or exchange.options['accountId'] = 'YOUR_ACCOUNT_ID'.")
        response = self.privateGetVenuesVenueIdAccountsAccountIdTrades(request)
        market = None
        if symbol is not None:
            market = self.market(symbol)
        return self.parse_trades(response['result'], market, since, limit)

    def create_deposit_address(self, code, params={}):
        self.load_markets()
        paymentMethod = self.safe_string(self.options['paymentMethods'], code)
        if paymentMethod is None:
            raise NotSupported(self.id + ' createDepositAddress requires code to be BTC, ETH, or XLM')
        request = self.extend({
            'venueId': self.options['venueId'],
            'accountId': self.get_active_account(),
            'assetId': self.currencyId(code),
            'paymentMethod': paymentMethod,
        }, params)
        if not request['accountId']:
            raise ArgumentsRequired(self.id + " createDepositAddress requires either the 'accountId' extra parameter or exchange.options['accountId'] = 'YOUR_ACCOUNT_ID'.")
        response = self.privatePostVenuesVenueIdAccountsAccountIdDeposit(request)
        #
        #     {
        #         assetId: 'BTC/stronghold.co',
        #         paymentMethod: 'bitcoin',
        #         paymentMethodInstructions: {
        #             deposit_address: 'mzMT9Cfw8JXVWK7rMonrpGfY9tt57ytHt4',
        #             reference: 'sometimes-exists',
        #         },
        #         direction: 'deposit',
        #     }
        #
        data = response['result']['paymentMethodInstructions']
        address = data['deposit_address']
        tag = self.safe_string(data, 'reference')
        return {
            'currency': code,
            'address': self.check_address(address),
            'tag': tag,
            'info': response,
        }

    def withdraw(self, code, amount, address, tag=None, params={}):
        self.load_markets()
        paymentMethod = self.safe_string(self.options['paymentMethods'], code)
        if paymentMethod is None:
            raise NotSupported(self.id + ' withdraw requires code to be BTC, ETH, or XLM')
        request = self.extend({
            'venueId': self.options['venueId'],
            'accountId': self.get_active_account(),
            'assetId': self.currencyId(code),
            'amount': amount,
            'paymentMethod': paymentMethod,
            'paymentMethodDetails': {
                'withdrawal_address': address,
            },
        }, params)
        if tag is not None:
            request['paymentMethodDetails']['reference'] = tag
        if not request['accountId']:
            raise ArgumentsRequired(self.id + " withdraw requires either the 'accountId' extra parameter or exchange.options['accountId'] = 'YOUR_ACCOUNT_ID'.")
        response = self.privatePostVenuesVenueIdAccountsAccountIdWithdrawal(request)
        #
        #     {
        #         "id": "5be48892-1b6e-4431-a3cf-34b38811e82c",
        #         "assetId": "BTC/stronghold.co",
        #         "amount": "10",
        #         "feeAmount": "0.01",
        #         "paymentMethod": "bitcoin",
        #         "paymentMethodDetails": {
        #             "withdrawal_address": "1vHysJeXYV6nqhroBaGi52QWFarbJ1dmQ"
        #         },
        #         "direction": "withdrawal",
        #         "status": "pending"
        #     }
        #
        data = response['result']
        return {
            'id': self.safe_string(data, 'id'),
            'info': response,
        }

    def handle_errors(self, code, reason, url, method, headers, body, response):
        if not response:
            return  # fallback to base error handler by default
        #
        #     {
        #         requestId: '3e7d17ab-b316-4721-b5aa-f7e6497eeab9',
        #         timestamp: '2019-01-31T21:59:06.696855Z',
        #         success: True,
        #         statusCode: 200,
        #         result: []
        #     }
        #
        errorCode = self.safe_string(response, 'errorCode')
        if errorCode in self.exceptions:
            Exception = self.exceptions[errorCode]
            raise Exception(self.id + ' ' + body)
        success = self.safe_value(response, 'success')
        if not success:
            raise ExchangeError(self.id + ' ' + body)

    def sign(self, path, api='public', method='GET', params={}, headers=None, body=None):
        request = '/' + self.version + '/' + self.implode_params(path, params)
        query = self.omit(params, self.extract_params(path))
        url = self.urls['api'][api] + request
        if query:
            if method == 'GET':
                url += '?' + self.urlencode(query)
            else:
                body = self.json(query)
        if api == 'private':
            self.check_required_credentials()
            timestamp = str(self.nonce())
            payload = timestamp + method + request
            if body is not None:
                payload += body
            secret = base64.b64decode(self.secret)
            headers = {
                'SH-CRED-ID': self.apiKey,
                'SH-CRED-SIG': self.hmac(self.encode(payload), secret, hashlib.sha256, 'base64'),
                'SH-CRED-TIME': timestamp,
                'SH-CRED-PASS': self.password,
                'Content-Type': 'application/json',
            }
        return {'url': url, 'method': method, 'body': body, 'headers': headers}
