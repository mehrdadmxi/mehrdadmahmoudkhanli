export type CollaborationTimeline = 'urgent' | 'normal' | 'long-term';

export interface CollaborationFormInput {
  fullName: string;
  contactInfo: string;
  projectTopic: string;
  timeline: CollaborationTimeline;
  budgetRange?: string;
  description: string;
}

export type CollaborationField =
  | 'fullName'
  | 'contactInfo'
  | 'projectTopic'
  | 'description';

export type CollaborationErrors = Partial<Record<CollaborationField, string>>;

export interface CollaborationRecord extends CollaborationFormInput {
  trackingCode: string;
  createdAt: string;
  summary: string;
}

export const COLLABORATION_TOPICS = [
  { id: 'telegram-bots', label: 'طراحی ربات هوشمند تلگرام' },
  { id: 'n8n-automation', label: 'اتوماسیون چندعاملی با n8n و AI' },
  { id: 'market-analysis', label: 'سیستم تحلیل تکنیکال بازارهای مالی' },
  { id: 'ps-rental-platform', label: 'طراحی و توسعه وب‌سایت اختصاصی' },
  { id: 'custom-project', label: 'مشاوره فناوری و مدیریت پروژه' },
] as const;

export const TIMELINE_OPTIONS: { value: CollaborationTimeline; label: string }[] = [
  { value: 'urgent', label: 'فوری (کمتر از ۲ هفته)' },
  { value: 'normal', label: 'عادی (۲ تا ۴ هفته)' },
  { value: 'long-term', label: 'بلندمدت / مشاوره مستمر' },
];

export function normalizeDigits(value: string): string {
  const persian = '۰۱۲۳۴۵۶۷۸۹';
  const arabic = '٠١٢٣٤٥٦٧٨٩';
  return value
    .replace(/[۰-۹]/g, (d) => String(persian.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(arabic.indexOf(d)));
}

export function isValidContactInfo(raw: string): boolean {
  const cleaned = normalizeDigits(raw).trim();
  if (!cleaned) return false;

  const compactPhone = cleaned.replace(/[\s\-()]/g, '');
  const phoneRegex = /^(\+98|0098|0)?9\d{9}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const telegramRegex = /^@[a-zA-Z][a-zA-Z0-9_]{3,31}$/;

  return (
    phoneRegex.test(compactPhone) ||
    emailRegex.test(cleaned) ||
    telegramRegex.test(cleaned)
  );
}

export function validateCollaborationRequest(input: CollaborationFormInput): {
  valid: boolean;
  errors: CollaborationErrors;
} {
  const errors: CollaborationErrors = {};

  if (!input.fullName || input.fullName.trim().length < 2) {
    errors.fullName = 'لطفاً نام و نام خانوادگی خود را (حداقل ۲ کاراکتر) وارد کنید.';
  }

  if (!isValidContactInfo(input.contactInfo || '')) {
    errors.contactInfo =
      'لطفاً شماره موبایل معتبر (مثلاً 09147960679)، ایمیل یا آیدی تلگرام (@username) وارد کنید.';
  }

  if (!input.projectTopic || input.projectTopic.trim().length === 0) {
    errors.projectTopic = 'لطفاً حوزه همکاری یا نوع پروژه را انتخاب کنید.';
  }

  if (!input.description || input.description.trim().length < 10) {
    errors.description =
      'لطفاً شرح مختصری از نیاز یا پروژه خود (حداقل ۱۰ کاراکتر) بنویسید.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function generateTrackingCode(
  date: Date = new Date(),
  randomPart?: string
): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  const suffix =
    randomPart ??
    Math.random().toString(36).substring(2, 6).toUpperCase();
  return `MMK-${y}${m}${d}-${suffix}`;
}

export function getTimelineLabel(timeline: CollaborationTimeline): string {
  return (
    TIMELINE_OPTIONS.find((opt) => opt.value === timeline)?.label ?? 'عادی (۲ تا ۴ هفته)'
  );
}

export function buildCollaborationSummary(
  input: CollaborationFormInput,
  trackingCode: string
): string {
  const lines = [
    `کد پیگیری: ${trackingCode}`,
    `نام متقاضی: ${input.fullName.trim()}`,
    `راه ارتباطی: ${normalizeDigits(input.contactInfo).trim()}`,
    `حوزه همکاری: ${input.projectTopic.trim()}`,
    `زمان‌بندی: ${getTimelineLabel(input.timeline)}`,
  ];

  if (input.budgetRange && input.budgetRange.trim()) {
    lines.push(`بودجه پیشنهادی: ${input.budgetRange.trim()}`);
  }

  lines.push(`شرح پروژه:\n${input.description.trim()}`);
  return lines.join('\n');
}

export function buildMailtoHref(
  input: CollaborationFormInput,
  trackingCode: string
): string {
  const subject = `درخواست همکاری (${trackingCode}) - ${input.projectTopic.trim()}`;
  const body = buildCollaborationSummary(input, trackingCode);
  return `mailto:mehrdadmahmoodkhanli@gmail.com?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;
}

export function mapProjectIdToTopic(projectId?: string): string {
  if (projectId === '3d-web-aurumai') {
    return 'طراحی و توسعه وب‌سایت اختصاصی';
  }
  const found = COLLABORATION_TOPICS.find((t) => t.id === projectId);
  return found ? found.label : COLLABORATION_TOPICS[0].label;
}
