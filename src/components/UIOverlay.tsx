import React, { useState } from 'react';
import { CollaborationModal } from './CollaborationModal';

interface ProjectItem {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  videoUrl: string;
  tag: string;
  description: string;
  achievements: string[];
  techStack: string[];
  liveUrl?: string;
}

const PROJECTS: ProjectItem[] = [
  {
    id: 'telegram-bots',
    title: 'ربات‌های هوشمند تلگرام',
    subtitle: 'Music Finder · App Finder · رزرو نوبت و خدمات',
    category: 'هوش مصنوعی و بات‌نویسی',
    videoUrl: 'https://pub-86dc5b5484314368ac5436a674b0d919.r2.dev/aaaf/oraciteslArea.mp4',
    tag: 'پروژه‌ها',
    description: 'طراحی و پیاده‌سازی ربات‌های پیشرفته تلگرام برای جستجو و دریافت هوشمند موزیک و نرم‌افزار، همراه با سامانه خودکار رزرو نوبت و مدیریت آنلاین خدمات با اتصال به پایگاه داده MySQL.',
    achievements: [
      'طراحی بات‌های هوشمند Music Finder و App Finder با سرعت پاسخ‌دهی بالا',
      'سیستم نوبت‌دهی خودکار و تعامل پیوسته با کاربران بدون نیاز به اپراتور',
      'اتصال مستقیم به دیتابیس MySQL و مدیریت هوشمند نشست‌های کاربری',
    ],
    techStack: ['Python', 'Telegram Bot API', 'MySQL', 'Linux', 'Automation'],
  },
  {
    id: 'n8n-automation',
    title: 'اتوماسیون چندعاملی با n8n',
    subtitle: 'گردش کار خودکار · وب‌هوک · ایجنت‌های هوشمند',
    category: 'اتوماسیون سازمانی و AI',
    videoUrl: 'https://pub-86dc5b5484314368ac5436a674b0d919.r2.dev/aaaf/facet-glass-hero.mp4',
    tag: 'پروژه‌ها',
    description: 'توسعه زیرساخت‌های اتوماسیون سازمانی مبتنی بر n8n برای یکپارچه‌سازی سامانه‌ها، پردازش خودکار داده‌های ورودی و همگام‌سازی ابزارهای هوش مصنوعی با فرایندهای کسب‌وکار.',
    achievements: [
      'حذف خطاهای انسانی و تسریع چشمگیر پردازش درخواست‌ها',
      'یکپارچه‌سازی وب‌سرویس‌ها، فرم‌های آنلاین، بات‌ها و CRM',
      'پیاده‌سازی ایجنت‌های تصمیم‌گیر خودکار متصل به مدل‌های زبانی',
    ],
    techStack: ['n8n', 'REST APIs', 'Webhooks', 'JavaScript', 'AI Agents'],
  },
  {
    id: 'market-analysis',
    title: 'تحلیل تکنیکال بازارهای مالی',
    subtitle: 'سیستم چندتایم‌فریمی · استراتژی و مدیریت ریسک',
    category: 'بازارهای مالی و معاملات',
    videoUrl: 'https://pub-86dc5b5484314368ac5436a674b0d919.r2.dev/aaaf/stellarmind-hero.mp4',
    tag: 'سوابق کاری',
    description: 'تحلیل تکنیکال ساختار بازارهای بین‌المللی با دیدگاه چندتایم‌فریمی، استخراج سطوح کلیدی، تدوین استراتژی‌های معاملاتی با نسبت ریسک به ریوارد بالا و ژورنال‌نویسی حرفه‌ای.',
    achievements: [
      'طراحی استراتژی تحلیلی چندتایم‌فریمی بر مبنای رفتار قیمت و پرایس‌اکشن',
      'تسلط کامل بر پلتفرم‌های TradingView و MetaTrader و ابزارهای داده‌محور',
      'مدیریت سرمایه و سنجش دقیق ریسک معاملات در شرایط مختلف مارکت',
    ],
    techStack: ['TradingView', 'MetaTrader', 'Technical Analysis', 'Risk Management'],
  },
  {
    id: '3d-web-aurumai',
    title: 'طراحی و توسعه وبسایت سه بعدی',
    subtitle: 'نمونه کار: https://aurumai.ai.studio/ · پلتفرم تخصصی تحلیل چندتایمفریمی XAUUSD با هوش مصنوعی',
    category: 'طراحی و توسعه وب',
    videoUrl: 'https://pub-86dc5b5484314368ac5436a674b0d919.r2.dev/aaaf/thedropthroughArea.mp4',
    tag: 'پروژه‌ها',
    liveUrl: 'https://aurumai.ai.studio/',
    description: 'طراحی و توسعه وب‌سایت‌های سه‌بعدی و تعاملی مجهز به هوش مصنوعی. نمونه کار شاخص: پلتفرم تخصصی AurumAI برای تحلیل چندتایم‌فریمی طلا (XAUUSD) با ترکیب رابط کاربری مدرن، گرافیک تعاملی و پردازش هوشمند داده‌های بازار.',
    achievements: [
      'نمونه کار فعال: https://aurumai.ai.studio/ (پلتفرم تخصصی تحلیل چندتایم‌فریمی XAUUSD با هوش مصنوعی)',
      'طراحی رابط کاربری سه‌بعدی، انیمیشن‌های تعاملی و گرافیک WebGL با Three.js',
      'ادغام دستیار هوشمند Gemini و داشبوردهای تحلیلی واکنش‌گرا و مدرن',
    ],
    techStack: ['Three.js', 'WebGL', 'React', 'TypeScript', 'Gemini AI'],
  },
];

const TABS = [
  { id: 'all', label: 'خلاصه رزومه' },
  { id: 'experience', label: 'سوابق کاری' },
  { id: 'skills', label: 'تخصص‌ها و مهارت‌ها' },
  { id: 'projects', label: 'پروژه‌ها و دستاوردها' },
  { id: 'education', label: 'تحصیلات و زبان‌ها' },
  { id: 'contact', label: 'ارتباط مستقیم' },
];

const STAR_POINTS = Array.from({ length: 16 }, (_, i) => {
  const r = i % 2 === 0 ? 11.5 : 5.0;
  const angle = (i * Math.PI) / 8 - Math.PI / 2;
  return `${(20 + r * Math.cos(angle)).toFixed(2)},${(20 + r * Math.sin(angle)).toFixed(2)}`;
}).join(' ');

export const UIOverlay: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [collabProject, setCollabProject] = useState<ProjectItem | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    showToast(`${label} کپی شد: ${text}`);
  };

  return (
    <div
      className="ui fixed inset-0 pointer-events-none select-none overflow-hidden"
      style={{ zIndex: 1 }}
      dir="rtl"
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className="fixed top-5 left-1/2 -translate-x-1/2 px-4 py-2 rounded bg-[#1c1c1c] border text-white text-[12px] shadow-2xl pointer-events-auto z-50 transition-opacity"
          style={{ borderColor: 'var(--accent)' }}
        >
          {toastMessage}
        </div>
      )}

      {/* Header (Brand & Identification - Top Right) */}
      <header
        className="brand absolute top-6 right-6 flex items-center gap-[14px] pointer-events-auto"
        style={{ mixBlendMode: 'plus-lighter' }}
      >
        <svg
          width="40"
          height="40"
          viewBox="0 0 40 40"
          className="shrink-0"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Mehrdad Logo"
        >
          <circle cx="20" cy="20" r="18.5" stroke="#ffffff" strokeWidth="1.6" />
          <polygon points={STAR_POINTS} fill="#ffffff" />
        </svg>
        <div className="flex flex-col">
          <h1 className="text-[20px] font-bold text-white leading-tight tracking-[0.01em]">
            مهرداد محمودخانلی
          </h1>
          <span
            className="text-[11px] mt-[3px] leading-tight"
            style={{ color: 'var(--muted)' }}
          >
            مدیر فناوری · توسعه‌دهنده هوش مصنوعی و وب
          </span>
        </div>
      </header>

      {/* Top Left Quick Contact Controls & Profile Photo */}
      <div
        className="absolute top-6 left-6 flex items-center gap-2.5 pointer-events-auto"
      >
        <a
          href="tel:09147960679"
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded border text-[11px] text-[#cfcfcf] hover:text-white hover:border-[#aa88ff] transition-colors bg-[#0a0a0a]/90 backdrop-blur-sm"
          style={{ borderColor: 'var(--line)', mixBlendMode: 'plus-lighter' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#aa88ff]"></span>
          <span className="font-mono" dir="ltr">09147960679</span>
        </a>
        <button
          type="button"
          onClick={() => setShowPhotoModal(true)}
          className="w-[44px] h-[44px] rounded-full overflow-hidden border p-[1.5px] bg-[#0a0a0a] shadow-lg relative cursor-pointer group transition-all duration-300 hover:border-[#aa88ff] hover:scale-105"
          style={{
            borderColor: 'var(--line)',
            isolation: 'isolate',
            mixBlendMode: 'normal',
          }}
          title="مشاهده تصویر مهرداد محمودخانلی"
        >
          <img
            src="/assets/aistudio/file_00000000490081f49e53d6ddd2167a62_fe3bbe49.png"
            alt="مهرداد محمودخانلی"
            className="w-full h-full object-cover object-[center_20%] rounded-full group-hover:scale-110 transition-transform duration-300"
          />
        </button>
      </div>

      {/* Category Tabs (Desktop: Top Right underneath header) */}
      <nav
        className="tags-desktop absolute top-[110px] right-6 w-[340px] hidden md:flex flex-wrap gap-[6px] pointer-events-auto"
        aria-label="بخش‌های رزومه"
      >
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className="cursor-pointer transition-colors duration-150 rounded-[2px]"
              style={{
                backgroundColor: isActive ? '#e6e6e6' : 'var(--chip)',
                color: isActive ? '#000000' : '#cfcfcf',
                padding: '5px 10px',
                fontSize: '11px',
                lineHeight: 1.4,
                fontWeight: isActive ? 600 : 400,
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Projects Column (Desktop: Right Column underneath tabs) */}
      <div
        className="list-desktop absolute top-[210px] right-6 bottom-6 w-[340px] overflow-y-auto no-scrollbar hidden md:block pointer-events-auto"
      >
        <div className="flex flex-col gap-4">
          {PROJECTS.map((p) => (
            <article
              key={p.id}
              onClick={() => setSelectedProject(p)}
              className="group cursor-pointer rounded border overflow-hidden bg-[#0a0a0a]/80 hover:bg-[#0f0f0f] transition-all hover:border-[#aa88ff]/60"
              style={{ borderColor: 'var(--line)' }}
            >
              <div className="h-[145px] overflow-hidden relative bg-black">
                <video
                  src={p.videoUrl}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                />
                <span
                  className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-[10px] bg-black/85 text-[#aa88ff] border border-[#aa88ff]/40 backdrop-blur-sm"
                >
                  {p.category}
                </span>
              </div>
              <div className="p-3 border-t border-[#1a1a1a]">
                <div className="flex justify-between items-start gap-2">
                  <h4 className="text-white text-[13px] font-semibold text-right">
                    {p.title}
                  </h4>
                  <span className="text-[11px] text-[#aa88ff] underline shrink-0 mt-0.5">
                    جزئیات
                  </span>
                </div>
                <p
                  className={`text-[11px] text-[#8a8a8a] mt-1 leading-[1.6] text-right ${
                    p.id === '3d-web-aurumai' ? 'line-clamp-2' : 'line-clamp-1'
                  }`}
                >
                  {p.subtitle}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Main Resume Content Column (Desktop: Left Column; Mobile: Bottom Screen) */}
      <aside
        className="about absolute pointer-events-auto overflow-y-auto no-scrollbar pr-1"
      >
        {/* Mobile Tab Filter Bar */}
        <div className="flex md:hidden flex-wrap gap-1.5 mb-3 pb-2 border-b border-[#2a2a2a] bg-black/60 backdrop-blur-sm sticky top-0 z-20">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-2.5 py-1 text-[11px] rounded transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-black font-semibold'
                  : 'bg-[#1c1c1c] text-[#cfcfcf]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Box with subtle obsidian background for pristine readability over particles */}
        <div className="p-5 rounded-lg border bg-[#000000]/75 backdrop-blur-[2px] shadow-2xl space-y-6" style={{ borderColor: 'var(--line)' }}>
          {/* Section: درباره من & هدف شغلی */}
          {(activeTab === 'all' || activeTab === 'about') && (
            <section>
              <h2
                className="text-[12px] mb-2 font-medium tracking-[0.02em] flex items-center gap-1.5"
                style={{ color: 'var(--accent)' }}
              >
                <span>[ درباره من ]</span>
              </h2>
              <p className="about-p text-[13px] leading-[1.75] text-[#dddddd] mb-3">
                مدیر و فعال حوزه فناوری اطلاعات با تجربه در مدیریت عملیات، توسعه وب، طراحی ربات‌های هوشمند، اتوماسیون‌سازی با n8n و تحلیل بازارهای مالی. علاقه‌مند به طراحی و اجرای راهکارهای دیجیتال، بهینه‌سازی فرایندها و توسعه کسب‌وکار.
              </p>
              
              <div className="p-3 rounded border bg-[#0a0a0a]/80" style={{ borderColor: 'var(--line)' }}>
                <span className="text-[11px] text-[#aa88ff] font-medium block mb-1">
                  هدف شغلی و چشم‌انداز
                </span>
                <p className="text-[12px] leading-[1.7] text-[#cfcfcf]">
                  همکاری با مجموعه‌های پیشرو در حوزه فناوری و مدیریت، توسعه محصولات دیجیتال، پیاده‌سازی راهکارهای مبتنی بر هوش مصنوعی و کمک به رشد و بهره‌وری سازمان‌ها.
                </p>
              </div>
            </section>
          )}

          {/* Section: سوابق کاری */}
          {(activeTab === 'all' || activeTab === 'experience') && (
            <section>
              <h2
                className="text-[12px] mb-2 font-medium tracking-[0.02em]"
                style={{ color: 'var(--accent)' }}
              >
                [ سوابق کاری ]
              </h2>
              <div className="p-3.5 rounded border bg-[#0a0a0a]/80" style={{ borderColor: 'var(--line)' }}>
                <div className="flex justify-between items-baseline mb-2">
                  <h3 className="text-[13.5px] font-bold text-white">
                    مدیر مجموعه تفریحی قلعه شادی سیتادیوم | آرِسکو
                  </h3>
                  <span className="text-[11px] text-[#aa88ff] font-mono shrink-0 mr-2">
                    ۱۴۰۱ تا کنون
                  </span>
                </div>
                <ul className="text-[12.5px] leading-[1.8] text-[#cfcfcf] space-y-1.5 list-inside">
                  <li>• مدیریت، برنامه‌ریزی و نظارت همه‌جانبه بر عملکرد کل مجموعه</li>
                  <li>• مهندسی و بهینه‌سازی فرایندهای اجرایی و عملیاتی</li>
                  <li>• مدیریت تیم، جذب هدفمند و آموزش مستمر نیروی انسانی</li>
                  <li>• ارتقای راندمان کاری، افزایش بهره‌وری و بهبود رضایت مشتریان</li>
                </ul>
              </div>
            </section>
          )}

          {/* Section: تخصص‌ها و مهارت‌ها */}
          {(activeTab === 'all' || activeTab === 'skills') && (
            <section>
              <h2
                className="text-[12px] mb-2 font-medium tracking-[0.02em]"
                style={{ color: 'var(--accent)' }}
              >
                [ تخصص‌ها و مهارت‌ها ]
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[12px]">
                <div className="p-3 rounded border bg-[#0a0a0a]/80" style={{ borderColor: 'var(--line)' }}>
                  <span className="text-[#aa88ff] text-[11px] font-medium block mb-1">
                    هوش مصنوعی و بات‌نویسی
                  </span>
                  <p className="text-[#cfcfcf] leading-[1.6]">
                    طراحی ربات‌های هوشمند تلگرام، ساخت ایجنت‌ها، اتوماسیون با n8n
                  </p>
                </div>
                <div className="p-3 rounded border bg-[#0a0a0a]/80" style={{ borderColor: 'var(--line)' }}>
                  <span className="text-[#aa88ff] text-[11px] font-medium block mb-1">
                    توسعه وب و دیتابیس
                  </span>
                  <p className="text-[#cfcfcf] leading-[1.6]">
                    Python، JavaScript، PHP، HTML5 & CSS3، پایگاه داده MySQL
                  </p>
                </div>
                <div className="p-3 rounded border bg-[#0a0a0a]/80" style={{ borderColor: 'var(--line)' }}>
                  <span className="text-[#aa88ff] text-[11px] font-medium block mb-1">
                    بازارهای مالی و معاملات
                  </span>
                  <p className="text-[#cfcfcf] leading-[1.6]">
                    تحلیل تکنیکال چندتایم‌فریمی، استراتژی معاملات، TradingView، MetaTrader
                  </p>
                </div>
                <div className="p-3 rounded border bg-[#0a0a0a]/80" style={{ borderColor: 'var(--line)' }}>
                  <span className="text-[#aa88ff] text-[11px] font-medium block mb-1">
                    سیستم، زیرساخت و مدیریت
                  </span>
                  <p className="text-[#cfcfcf] leading-[1.6]">
                    Linux، Git، مدیریت و تحلیل کسب‌وکار، مهندسی فرایندهای سازمانی
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Section: پروژه‌ها و دستاوردها */}
          {(activeTab === 'all' || activeTab === 'projects') && (
            <section>
              <h2
                className="text-[12px] mb-2 font-medium tracking-[0.02em]"
                style={{ color: 'var(--accent)' }}
              >
                [ پروژه‌ها و دستاوردها ]
              </h2>
              <ul className="text-[12.5px] leading-[1.8] text-[#dddddd] space-y-2 list-inside">
                <li>• طراحی ربات‌های هوشمند <span className="text-white font-medium">Music Finder</span> و <span className="text-white font-medium">App Finder</span></li>
                <li>• طراحی و پیاده‌سازی <span className="text-white font-medium">ربات رزرو نوبت و مدیریت هوشمند خدمات</span></li>
                <li>• توسعه سیستم‌های <span className="text-white font-medium">اتوماسیون چندعاملی با n8n</span> جهت اتصال وب‌سرویس‌ها</li>
                <li>
                  •{' '}
                  <a
                    href="https://aurumai.ai.studio/"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-[#dddddd] hover:text-[#aa88ff] transition-colors underline decoration-[#aa88ff]/50 underline-offset-4 hover:decoration-[#aa88ff]"
                  >
                    طراحی و پیاده‌سازی{' '}
                    <span className="text-white font-medium">
                      سیستم تحلیل تکنیکال چندتایم‌فریمی
                    </span>{' '}
                    <span className="text-[#aa88ff] text-[11px] font-mono inline-block" dir="ltr">
                      ↗
                    </span>
                  </a>
                </li>
                <li>• طراحی و اجرای وب‌سایت <span className="text-white font-medium">اجاره آنلاین کنسول‌های PS4 و PS5</span></li>
                <li>• طراحی و استقرار سامانه‌های دیجیتال و ابزارهای کاربردی کسب‌وکار</li>
              </ul>
            </section>
          )}

          {/* Section: تحصیلات، مدارک و زبان‌ها */}
          {(activeTab === 'all' || activeTab === 'education') && (
            <section>
              <h2
                className="text-[12px] mb-2 font-medium tracking-[0.02em]"
                style={{ color: 'var(--accent)' }}
              >
                [ تحصیلات و مدارک ]
              </h2>
              <ul className="text-[12.5px] leading-[1.7] text-[#cfcfcf] space-y-1.5 list-inside mb-4">
                <li>• <span className="text-white font-medium">مهندسی مکانیک</span>، دانشگاه آزاد اسلامی، ۱۳۹۳</li>
                <li>• مدارک تخصصی کامپیوتر و ICDL بین‌المللی</li>
                <li>• گواهینامه‌های معتبر فنی و حرفه‌ای و مهارتی</li>
                <li>• گواهینامه تکنسین داروخانه</li>
              </ul>

              <div className="p-3 rounded border bg-[#0a0a0a]/80" style={{ borderColor: 'var(--line)' }}>
                <span className="text-[11px] text-[#aa88ff] font-medium block mb-1">
                  زبان‌ها و تسلط
                </span>
                <p className="text-[12px] text-[#cfcfcf]">
                  فارسی (زبان مادری) · ترکی استانبولی (مسلط) · انگلیسی (خوب)
                </p>
              </div>
            </section>
          )}

          {/* Section: اطلاعات تماس */}
          {(activeTab === 'all' || activeTab === 'contact') && (
            <section className="pt-1">
              <h2
                className="text-[12px] mb-2 font-medium tracking-[0.02em]"
                style={{ color: 'var(--accent)' }}
              >
                [ اطلاعات تماس و همکاری ]
              </h2>
              <div className="flex flex-col gap-2 text-[12.5px]">
                <div className="flex items-center justify-between p-2.5 rounded border bg-[#0a0a0a]/90" style={{ borderColor: 'var(--line)' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-[#8a8a8a] text-[11px]">تلفن همراه:</span>
                    <a href="tel:09147960679" className="text-white font-mono hover:text-[#aa88ff] transition-colors" dir="ltr">
                      09147960679
                    </a>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <a
                      href="tel:09147960679"
                      className="text-[11px] text-black bg-[#aa88ff] hover:bg-white px-2 py-0.5 rounded font-medium transition-colors"
                    >
                      تماس
                    </a>
                    <button
                      type="button"
                      onClick={() => copyToClipboard('09147960679', 'شماره تماس')}
                      className="text-[11px] text-[#cfcfcf] hover:text-white px-2 py-0.5 rounded border border-[#2a2a2a] transition-colors cursor-pointer"
                    >
                      کپی
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded border bg-[#0a0a0a]/90" style={{ borderColor: 'var(--line)' }}>
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-[#8a8a8a] text-[11px]">ایمیل:</span>
                    <a href="mailto:mehrdadmahmoodkhanli@gmail.com" className="text-white font-mono hover:text-[#aa88ff] transition-colors truncate" dir="ltr">
                      mehrdadmahmoodkhanli@gmail.com
                    </a>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 mr-1">
                    <a
                      href="mailto:mehrdadmahmoodkhanli@gmail.com"
                      className="text-[11px] text-[#aa88ff] hover:text-white px-2 py-0.5 rounded border border-[#2a2a2a] transition-colors"
                    >
                      ارسال ایمیل
                    </a>
                    <button
                      type="button"
                      onClick={() => copyToClipboard('mehrdadmahmoodkhanli@gmail.com', 'ایمیل')}
                      className="text-[11px] text-[#cfcfcf] hover:text-white px-2 py-0.5 rounded border border-[#2a2a2a] transition-colors cursor-pointer"
                    >
                      کپی
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded border bg-[#0a0a0a]/90 text-[#cfcfcf]" style={{ borderColor: 'var(--line)' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-[#8a8a8a] text-[11px]">موقعیت فعالیت:</span>
                    <span className="text-white font-medium">ایران، ارومیه</span>
                  </div>
                  <span className="text-[11px] text-[#8a8a8a]">آماده همکاری حضوری و ریموت</span>
                </div>
              </div>
            </section>
          )}
        </div>
      </aside>

      {/* Project Detail Modal */}
      {selectedProject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm pointer-events-auto"
          onClick={() => setSelectedProject(null)}
        >
          <div
            className="w-full max-w-[560px] max-h-[90vh] overflow-y-auto rounded-lg bg-[#0e0e0e] border p-6 text-right shadow-2xl relative"
            style={{ borderColor: 'var(--accent)' }}
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <button
              type="button"
              onClick={() => setSelectedProject(null)}
              className="absolute top-4 left-4 w-7 h-7 flex items-center justify-center rounded-full bg-[#1c1c1c] text-[#8a8a8a] hover:text-white transition-colors"
            >
              ✕
            </button>

            <div className="mb-4">
              <span className="text-[11px] text-[#aa88ff] font-medium block mb-1">
                {selectedProject.category}
              </span>
              <h3 className="text-[18px] font-bold text-white">
                {selectedProject.title}
              </h3>
              <p className="text-[12px] text-[#8a8a8a] mt-0.5">
                {selectedProject.subtitle}
              </p>
            </div>

            <div className="h-[210px] rounded overflow-hidden mb-4 bg-black">
              <video
                src={selectedProject.videoUrl}
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-4 text-[13px]">
              <div>
                <h4 className="text-[12px] font-medium text-[#aa88ff] mb-1.5">
                  توضیحات پروژه
                </h4>
                <p className="text-[#cfcfcf] leading-[1.7]">
                  {selectedProject.description}
                </p>
              </div>

              <div>
                <h4 className="text-[12px] font-medium text-[#aa88ff] mb-1.5">
                  دستاوردها و قابلیت‌های کلیدی
                </h4>
                <ul className="text-[#cfcfcf] leading-[1.7] space-y-1 list-inside">
                  {selectedProject.achievements.map((item, idx) => (
                    <li key={idx}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-[12px] font-medium text-[#aa88ff] mb-1.5">
                  فناوری‌ها و ابزارها
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedProject.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="px-2.5 py-1 rounded bg-[#1c1c1c] text-[#cfcfcf] text-[11px] font-mono"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#2a2a2a] flex flex-wrap justify-between items-center gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCollabProject(selectedProject);
                    setSelectedProject(null);
                  }}
                  className="px-4 py-2 rounded bg-[#aa88ff] text-black text-[12px] font-semibold hover:bg-white transition-colors cursor-pointer"
                >
                  درخواست همکاری
                </button>
                {selectedProject.liveUrl && (
                  <a
                    href={selectedProject.liveUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="px-3.5 py-2 rounded border border-[#2a2a2a] text-[#cfcfcf] hover:text-white hover:border-[#aa88ff] text-[12px] transition-colors"
                  >
                    مشاهده نمونه کار
                  </a>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedProject(null)}
                className="text-[12px] text-[#8a8a8a] hover:text-white cursor-pointer"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Photo Modal */}
      {showPhotoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md pointer-events-auto"
          onClick={() => setShowPhotoModal(false)}
        >
          <div
            className="w-full max-w-[420px] rounded-xl bg-[#0e0e0e] border p-5 text-right shadow-2xl relative"
            style={{ borderColor: 'var(--accent)' }}
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <button
              type="button"
              onClick={() => setShowPhotoModal(false)}
              className="absolute top-4 left-4 w-7 h-7 flex items-center justify-center rounded-full bg-[#1c1c1c] text-[#8a8a8a] hover:text-white transition-colors"
            >
              ✕
            </button>

            <div className="mb-3 text-right">
              <h3 className="text-[16px] font-bold text-white">
                مهرداد محمودخانلی
              </h3>
              <p className="text-[11px] text-[#aa88ff] mt-0.5">
                مدیر فناوری · توسعه‌دهنده هوش مصنوعی و وب
              </p>
            </div>

            <div className="rounded-lg overflow-hidden border border-[#2a2a2a] bg-black max-h-[520px] flex items-center justify-center">
              <img
                src="/assets/aistudio/file_00000000490081f49e53d6ddd2167a62_fe3bbe49.png"
                alt="مهرداد محمودخانلی"
                className="w-full h-auto object-cover"
              />
            </div>

            <div className="mt-4 flex justify-between items-center text-[12px]">
              <span className="text-[#8a8a8a] font-mono text-[11px]">
                ایران، ارومیه
              </span>
              <button
                type="button"
                onClick={() => setShowPhotoModal(false)}
                className="px-4 py-1.5 rounded bg-[#1c1c1c] text-[#cfcfcf] hover:text-white transition-colors"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Collaboration Request Modal */}
      <CollaborationModal
        isOpen={Boolean(collabProject)}
        projectId={collabProject?.id}
        projectTitle={collabProject?.title}
        onClose={() => setCollabProject(null)}
        onBackToProject={() => {
          if (collabProject) {
            setSelectedProject(collabProject);
          }
          setCollabProject(null);
        }}
        onToast={showToast}
      />
    </div>
  );
};
