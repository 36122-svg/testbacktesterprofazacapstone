import { Handler } from '@netlify/functions';
import ccxt from 'ccxt';

// Daftar exchange yang didukung
const SUPPORTED_EXCHANGES = ['binance', 'bybit', 'bitget', 'kraken', 'coinbase', 'okx'];

export const handler: Handler = async (event) => {
  try {
    // 1. Parse parameter dari request
    const { 
      exchange = 'binance', 
      symbol = 'BTC/USDT', 
      timeframe = '1h', 
      limit = 500 
    } = JSON.parse(event.body || '{}');

    // 2. Validasi exchange
    if (!SUPPORTED_EXCHANGES.includes(exchange)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          success: false, 
          error: `Exchange "${exchange}" tidak didukung. Pilih: ${SUPPORTED_EXCHANGES.join(', ')}` 
        }),
      };
    }

    // 3. Inisialisasi exchange via CCXT (dinamis)
    // @ts-ignore - CCXT mendukung dynamic instantiation
    const ExchangeClass = ccxt[exchange];
    if (!ExchangeClass) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: `CCXT tidak mengenali exchange "${exchange}"` }),
      };
    }

    const exchangeInstance = new ExchangeClass({
      enableRateLimit: true,
      options: {
        defaultType: 'spot', // Spot market
      },
    });

    // 4. Fetch data OHLCV
    const ohlcv = await exchangeInstance.fetchOHLCV(symbol, timeframe, undefined, limit);

    if (!ohlcv || ohlcv.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ 
          success: false, 
          error: `Tidak ada data untuk ${symbol} di ${exchange}. Periksa simbol atau coba yang lain.` 
        }),
      };
    }

    // 5. Format data ke struktur yang kita butuhkan
    const data = ohlcv.map(([time, open, high, low, close]) => ({
      time,
      open,
      high,
      low,
      close,
    }));

    // 6. Return sukses
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

    // Deteksi error spesifik dari CCXT
    let errorMessage = error.message || 'Terjadi kesalahan internal';
    
    if (errorMessage.includes('symbol')) {
      errorMessage = `Simbol "${JSON.parse(event.body || '{}').symbol || 'BTC/USDT'}" tidak ditemukan di exchange tersebut.`;
    } else if (errorMessage.includes('rate limit')) {
      errorMessage = 'Terlalu banyak request, coba lagi nanti. (Rate limit)';
    }

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: errorMessage,
      }),
    };
  }
};