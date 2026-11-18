import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeDigits,
  isValidContactInfo,
  validateCollaborationRequest,
  generateTrackingCode,
  buildCollaborationSummary,
  mapProjectIdToTopic,
} from './collaboration';

test('normalizeDigits converts Persian and Arabic digits to Latin', () => {
  assert.equal(normalizeDigits('۰۹۱۴۷۹۶۰۶۷۹'), '09147960679');
  assert.equal(normalizeDigits('٠٩١٢٣٤٥٦٧٨٩'), '09123456789');
});

test('isValidContactInfo accepts mobile numbers, emails, and Telegram handles', () => {
  assert.equal(isValidContactInfo('09147960679'), true);
  assert.equal(isValidContactInfo('۰۹۱۴-۷۹۶-۰۶۷۹'), true);
  assert.equal(isValidContactInfo('+989147960679'), true);
  assert.equal(isValidContactInfo('client@domain.com'), true);
  assert.equal(isValidContactInfo('@mehrdad_dev'), true);

  assert.equal(isValidContactInfo(''), false);
  assert.equal(isValidContactInfo('12345'), false);
  assert.equal(isValidContactInfo('@ab'), false);
  assert.equal(isValidContactInfo('not-an-email'), false);
});

test('validateCollaborationRequest returns specific field errors when invalid', () => {
  const res = validateCollaborationRequest({
    fullName: 'ا',
    contactInfo: 'bad',
    projectTopic: '',
    timeline: 'normal',
    description: 'کوتاه',
  });

  assert.equal(res.valid, false);
  assert.ok(res.errors.fullName);
  assert.ok(res.errors.contactInfo);
  assert.ok(res.errors.projectTopic);
  assert.ok(res.errors.description);
});

test('validateCollaborationRequest passes for complete valid payload', () => {
  const res = validateCollaborationRequest({
    fullName: 'علی رضایی',
    contactInfo: '۰۹۱۲۳۴۵۶۷۸۹',
    projectTopic: 'اتوماسیون چندعاملی با n8n و AI',
    timeline: 'urgent',
    budgetRange: '۲۰ تا ۴۰ میلیون تومان',
    description: 'نیاز به اتصال ربات تلگرام به CRM و ارسال گزارش خودکار داریم.',
  });

  assert.equal(res.valid, true);
  assert.deepEqual(res.errors, {});
});

test('generateTrackingCode and buildCollaborationSummary format cleanly', () => {
  const code = generateTrackingCode(new Date('2026-11-14T10:00:00Z'), 'A7K2');
  assert.equal(code, 'MMK-20261114-A7K2');

  const summary = buildCollaborationSummary(
    {
      fullName: 'سارا محمدی',
      contactInfo: 'sara@example.com',
      projectTopic: 'طراحی ربات هوشمند تلگرام',
      timeline: 'normal',
      description: 'طراحی ربات نوبت‌دهی و پرداخت آنلاین برای کلینیک زیبایی.',
    },
    code
  );

  assert.match(summary, /MMK-20261114-A7K2/);
  assert.match(summary, /سارا محمدی/);
  assert.match(summary, /عادی \(۲ تا ۴ هفته\)/);
  assert.equal(mapProjectIdToTopic('n8n-automation'), 'اتوماسیون چندعاملی با n8n و AI');
});
