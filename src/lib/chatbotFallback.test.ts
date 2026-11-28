import test from 'node:test';
import assert from 'node:assert/strict';
import { generatePortfolioReply } from './chatbotFallback';

test('generatePortfolioReply returns Telegram bot portfolio on bot queries', () => {
  const reply = generatePortfolioReply('نمونه‌کارهای ربات تلگرام را معرفی کن');
  assert.match(reply, /Filesavebox_bot/);
  assert.match(reply, /Drhair_barberbot/);
  assert.match(reply, /botformweb\.pages\.dev/);
});

test('generatePortfolioReply returns n8n automation info on n8n queries', () => {
  const reply = generatePortfolioReply('اتوماسیون با n8n چه کمکی می‌کند؟');
  assert.match(reply, /CRM هوشمند/);
});

test('generatePortfolioReply returns XAUUSD/AurumAI info on market queries', () => {
  const reply = generatePortfolioReply('تحلیل طلا xauusd');
  assert.match(reply, /aurumai\.ai\.studio/);
});

test('generatePortfolioReply returns project order steps without fixed pricing', () => {
  const reply = generatePortfolioReply('قیمت سفارش پروژه چقدر است؟');
  assert.match(reply, /09147960679/);
  assert.match(reply, /هیچ قیمت ثابتی/);
  assert.match(reply, /botformweb\.pages\.dev/);
});
