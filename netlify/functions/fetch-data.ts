import { Handler } from '@netlify/functions';

// Mapping exchange ke endpoint REST publik
const EXCHANGE_ENDPOINTS: Record<string, string> = {
  binance: 'https://api.binance.com/api/v3/klines',
  bybit: 'https://api.bybit.com/v5/market/kline',
  bitget: 'https://api.bitget.com/api/v2/spot/market/candles',
  kraken: 'https://api.kraken.com/0/public/OHLC',
  coinbase: 'https://api.exchange.coinbase.com/products/{symbol}/candles',
  okx: 'https://www.okx.com/api/v5/market/candles',
};

export const handler: Handler = async (event) => {
  try {
    const { 
      exchange = 'binance', 
      symbol = 'BTC/USDT', 
      timeframe = '1h', 
      limit = 500 
    } = JSON.parse(event.body || '{}');

    let url = '';
    let data = [];

    // Binance
    if (exchange === 'binance') {
      const sym = symbol.replace('/', '').toUpperCase();
      const interval = timeframe === '1h' ? '1h' : '1d';
      url = `https://api.binance.com/api/v3/klines?symbol=${sym}&interval=${interval}&limit=${limit}`;
      const response = await fetch(url);
      const json = await response.json();
      if (!Array.isArray(json) || json.length === 0) throw new Error('No data from Binance');
      data = json.map((candle: any[]) => ({
        time: candle[0],
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4]),
      }));
    } 
    // Bybit
    else if (exchange === 'bybit') {
      const sym = symbol.replace('/', '');
      const interval = timeframe === '1h' ? '60' : 'D';
      url = `https://api.bybit.com/v5/market/kline?category=spot&symbol=${sym}&interval=${interval}&limit=${limit}`;
      const response = await fetch(url);
      const json = await response.json();
      if (json.retCode !== 0 || !json.result?.list) throw new Error('No data from Bybit');
      data = json.result.list.map((candle: string[]) => ({
        time: parseInt(candle[0]),
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4]),
      }));
    }
    // Bitget
    else if (exchange === 'bitget') {
      const sym = symbol.replace('/', '');
      const interval = timeframe === '1h' ? '1H' : '1D';
      url = `https://api.bitget.com/api/v2/spot/market/candles?symbol=${sym}&granularity=${interval}&limit=${limit}`;
      const response = await fetch(url);
      const json = await response.json();
      if (json.code !== '00000' || !json.data) throw new Error('No data from Bitget');
      data = json.data.map((candle: any) => ({
        time: parseInt(candle[0]),
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4]),
      }));
    }
    // Kraken
    else if (exchange === 'kraken') {
      const sym = symbol.replace('/', '');
      const interval = timeframe === '1h' ? '60' : '1440';
      url = `https://api.kraken.com/0/public/OHLC?pair=${sym}&interval=${interval}&since=${Date.now()/1000 - limit * 3600}`;
      const response = await fetch(url);
      const json = await response.json();
      if (json.error && json.error.length) throw new Error(json.error.join(', '));
      const result = json.result[Object.keys(json.result)[0]];
      if (!Array.isArray(result)) throw new Error('No data from Kraken');
      data = result.map((candle: any[]) => ({
        time: candle[0] * 1000,
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4]),
      }));
    }
    // Fallback ke Binance untuk exchange lain
    else {
      const sym = symbol.replace('/', '').toUpperCase();
      url = `https://api.binance.com/api/v3/klines?symbol=${sym}&interval=1h&limit=${limit}`;
      const response = await fetch(url);
      const json = await response.json();
      if (!Array.isArray(json) || json.length === 0) throw new Error(`Exchange ${exchange} tidak didukung sementara, fallback ke Binance`);
      data = json.map((candle: any[]) => ({
        time: candle[0],
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4]),
      }));
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        exchange,
        symbol,
        timeframe,
        count: data.length,
        data,
      }),
    };
  } catch (error: any) {
    console.error('fetch-data error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Terjadi kesalahan internal',
      }),
    };
  }
};
