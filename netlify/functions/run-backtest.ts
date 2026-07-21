import { Handler } from '@netlify/functions';
import { runBacktest } from '../../src/lib/backtestEngine';

export const handler: Handler = async (event) => {
  try {
    const { pineCode, data, config } = JSON.parse(event.body || '{}');
    if (!pineCode || !data) return { statusCode: 400, body: JSON.stringify({ error: 'Missing params' }) };
    const result = runBacktest(data, pineCode, config);
    return { statusCode: 200, body: JSON.stringify({ success: true, result }) };
  } catch (error: any) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: error.message }) };
  }
};