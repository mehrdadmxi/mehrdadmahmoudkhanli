import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import os from 'os';
import { promises as fs } from 'fs';
import {
  validateCollaborationRequest,
  generateTrackingCode,
  buildCollaborationSummary,
  normalizeDigits,
  type CollaborationFormInput,
  type CollaborationRecord,
} from './src/lib/collaboration';
import { generatePortfolioReply } from './src/lib/chatbotFallback';

dotenv.config();

const SYSTEM_INSTRUCTION = `# PORTFOLIO & SERVICES
# Mehrdad Mahmoodkhani

## 1. Telegram Bot Development
طراحی، برنامه‌نویسی و راه‌اندازی ربات‌های تلگرام اختصاصی برای کسب‌وکارها و کاربران.

### نمونه‌کارهای اجرایی

1. FileSaveBox
Username: @Filesavebox_bot
حوزه فعالیت: آرشیو و مدیریت فایل‌ها، ذخیره و دسته‌بندی تصاویر، ویدئوها، موسیقی و اسناد.

2. Music Finder
Username: @Musicdownloadfindebot
حوزه فعالیت: جستجو و دریافت موسیقی از طریق ربات.

3. App Finder
Username: @Appfinderrbot
حوزه فعالیت: جستجو و دسترسی به اپلیکیشن‌ها.

4. Dr Hair Barber
Username: @Drhair_barberbot
حوزه فعالیت: رزرو آنلاین نوبت آرایشگاه، انتخاب خدمات و مدیریت درخواست‌های مشتریان.

5. Customer Service Bot
Username: @CustomerrServiceBot
حوزه فعالیت: ارتباط با مشتریان، پاسخگویی و مدیریت درخواست‌های پشتیبانی.

### خدمات قابل ارائه
- طراحی ربات اختصاصی بر اساس نیاز مشتری
- ربات فروشگاهی و پرداخت آنلاین
- ربات رزرو نوبت و مدیریت مشتریان
- ربات پشتیبانی و خدمات مشتریان
- ربات دانلود و جستجوی فایل
- ربات مدیریت کسب‌وکار

## 2. Business Automation & AI Integration

طراحی و پیاده‌سازی سیستم‌های اتوماسیون هوشمند برای کسب‌وکارها با استفاده از n8n و هوش مصنوعی.

### زمینه‌های تخصصی
- طراحی و پیاده‌سازی سیستم CRM هوشمند
- اتصال هوش مصنوعی به فرایندهای کسب‌وکار
- خودکارسازی ارتباط با مشتریان
- مدیریت و پیگیری خودکار مشتریان بالقوه
- اتصال سایت، ربات، پایگاه داده و سرویس‌های مختلف
- طراحی AI Agent و سیستم‌های چندعاملی
- خودکارسازی گزارش‌گیری و پردازش اطلاعات
- طراحی گردش‌کارهای اختصاصی با n8n

هدف: کاهش کارهای تکراری، افزایش سرعت پاسخگویی و بهبود مدیریت کسب‌وکار.

## 3. Financial Market Automation

طراحی سیستم‌های هوشمند برای تحلیل و پردازش اطلاعات بازارهای مالی.

### خدمات و تخصص‌ها
- اتوماسیون تحلیل تکنیکال بازارهای مالی
- طراحی سیستم‌های تحلیل چندتایم‌فریمی
- توسعه ایجنت‌های هوش مصنوعی برای تحلیل نمودار
- پردازش داده‌های بازار
- طراحی سیستم ارسال خودکار تحلیل و سیگنال
- اتصال سیستم‌های تحلیل به ربات تلگرام
- استفاده از n8n برای اجرای گردش‌کارهای معاملاتی

بازارهای مورد توجه: فارکس، طلا (XAUUSD) و ارزهای دیجیتال.

## 4. AI-Powered 3D Website Development

طراحی و توسعه وب‌سایت‌های سه‌بعدی و تعاملی مجهز به هوش مصنوعی.

### قابلیت‌ها
- طراحی رابط کاربری سه‌بعدی
- محیط‌های تعاملی و انیمیشن‌های سه‌بعدی
- طراحی پس‌زمینه‌های متحرک و گرافیک WebGL
- استفاده از Three.js و فناوری‌های مرتبط
- ادغام چت‌بات هوشمند Gemini
- جستجوی هوشمند و دستیار اختصاصی سایت
- طراحی وب‌سایت‌های مدرن و واکنش‌گرا
- اتصال هوش مصنوعی به خدمات و امکانات سایت

هدف: ایجاد تجربه کاربری متفاوت و ارائه وب‌سایت‌های هوشمند برای برندها و کسب‌وکارها.

## 5. AI Assistant Behavior

وقتی کاربر درباره نمونه‌کارها سؤال می‌کند:
- نمونه‌کار مرتبط را با نام و آیدی معرفی کن.
- کاربرد و امکانات پروژه را توضیح بده.
- در صورت درخواست، لینک مستقیم ربات را ارائه بده.
- تفاوت خدمات و امکانات پروژه‌ها را توضیح بده.
- برای پروژه‌های جدید، راهکار فنی متناسب پیشنهاد بده.

لینک مستقیم نمونه‌کارها:
https://t.me/Filesavebox_bot
https://t.me/Musicdownloadfindebot
https://t.me/Appfinderrbot
https://t.me/Drhair_barberbot
https://t.me/CustomerrServiceBot

## 6. Lead Generation

در صورتی که بازدیدکننده قصد سفارش پروژه داشته باشد:
1. نوع پروژه را مشخص کن.
2. نیازها و امکانات موردنظر را بپرس.
3. راهکار فنی پیشنهادی را ارائه بده.
4. پیچیدگی پروژه را بررسی کن.
5. اطلاعات تماس مشتری را با رضایت او دریافت کن.
6. خلاصه درخواست را برای پیگیری مهرداد آماده کن.

قوانین مهم:
- هیچ قیمت ثابتی را بدون بررسی جزئیات پروژه اعلام نکن.
- هر سوالی غیر مربوط به من را هم با کمال میل و با دقت پاسخگو باش.
- همواره پاسخ‌ها را دوستانه، صمیمی، حرفه‌ای و به زبان کاربر (فارسی روان) ارائه بده.`;

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // Initialize GoogleGenAI SDK
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Chat API endpoint
  app.post('/api/chat', async (req, res) => {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content || '';

    // If GEMINI_API_KEY is present and valid, call Gemini 3.8 Flash
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.length > 20) {
      try {
        const contents = messages.map((m: { role: string; content: string }) => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }],
        }));

        // Timeout promise after 10 seconds to avoid hanging
        const generatePromise = ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
          },
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('TIMEOUT')), 10000)
        );

        const response: any = await Promise.race([generatePromise, timeoutPromise]);
        const replyText = response.text || 'پاسخی دریافت نشد.';
        return res.json({ reply: replyText });
      } catch (error: any) {
        console.error('Gemini API call failed or timed out:', error?.message);
        // Fall through to knowledge-base generator if API fails or lacks billing/scope
      }
    }

    // Knowledge-base assistant fallback based on Mehrdad's prompt
    return res.json({ reply: generatePortfolioReply(lastUserMessage) });
  });

  // Collaboration requests store (persisted in temp JSON file + memory)
  const COLLAB_STORE_PATH = path.join(os.tmpdir(), 'mehrdad-collaborations.json');
  let collaborationRequests: CollaborationRecord[] = [];
  try {
    const raw = await fs.readFile(COLLAB_STORE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      collaborationRequests = parsed;
    }
  } catch {
    // Store does not exist yet; start empty
  }

  app.post('/api/collaboration', async (req, res) => {
    const body = (req.body || {}) as Partial<CollaborationFormInput>;
    const normalizedInput: CollaborationFormInput = {
      fullName: String(body.fullName || '').trim(),
      contactInfo: normalizeDigits(String(body.contactInfo || '')).trim(),
      projectTopic: String(body.projectTopic || '').trim(),
      timeline:
        body.timeline === 'urgent' || body.timeline === 'long-term'
          ? body.timeline
          : 'normal',
      budgetRange: body.budgetRange ? String(body.budgetRange).trim() : '',
      description: String(body.description || '').trim(),
    };

    const validation = validateCollaborationRequest(normalizedInput);
    if (!validation.valid) {
      return res.status(400).json({
        ok: false,
        error: 'لطفاً فیلدهای مشخص‌شده را به درستی تکمیل کنید.',
        errors: validation.errors,
      });
    }

    const trackingCode = generateTrackingCode();
    const record: CollaborationRecord = {
      ...normalizedInput,
      trackingCode,
      createdAt: new Date().toISOString(),
      summary: buildCollaborationSummary(normalizedInput, trackingCode),
    };

    collaborationRequests.unshift(record);
    try {
      await fs.writeFile(
        COLLAB_STORE_PATH,
        JSON.stringify(collaborationRequests.slice(0, 200), null, 2),
        'utf-8'
      );
    } catch (err) {
      console.error('Failed to persist collaboration request:', err);
    }

    return res.status(201).json({
      ok: true,
      record,
    });
  });

  app.get('/api/collaboration', (_req, res) => {
    res.json({
      ok: true,
      count: collaborationRequests.length,
    });
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'gemini-assistant' });
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve('.', 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve('.', 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`AXON / Mehrdad server running on port ${PORT}`);
  });
}

startServer();
