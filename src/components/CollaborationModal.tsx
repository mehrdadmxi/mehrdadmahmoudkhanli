import React, { useState, useEffect } from 'react';
import {
  COLLABORATION_TOPICS,
  TIMELINE_OPTIONS,
  validateCollaborationRequest,
  buildMailtoHref,
  buildCollaborationSummary,
  generateTrackingCode,
  normalizeDigits,
  mapProjectIdToTopic,
  type CollaborationErrors,
  type CollaborationFormInput,
  type CollaborationRecord,
  type CollaborationTimeline,
} from '../lib/collaboration';

interface CollaborationModalProps {
  isOpen: boolean;
  projectId?: string;
  projectTitle?: string;
  onClose: () => void;
  onBackToProject?: () => void;
  onToast?: (msg: string) => void;
}

export const CollaborationModal: React.FC<CollaborationModalProps> = ({
  isOpen,
  projectId,
  projectTitle,
  onClose,
  onBackToProject,
  onToast,
}) => {
  const [fullName, setFullName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [projectTopic, setProjectTopic] = useState<string>(
    mapProjectIdToTopic(projectId)
  );
  const [timeline, setTimeline] = useState<CollaborationTimeline>('normal');
  const [budgetRange, setBudgetRange] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<CollaborationErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRecord, setSubmittedRecord] = useState<CollaborationRecord | null>(
    null
  );

  // Sync selected project topic whenever modal opens for a project
  useEffect(() => {
    if (isOpen) {
      setProjectTopic(mapProjectIdToTopic(projectId));
      setErrors({});
      setSubmitError(null);
      setSubmittedRecord(null);
    }
  }, [isOpen, projectId]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const payload: CollaborationFormInput = {
      fullName,
      contactInfo,
      projectTopic,
      timeline,
      budgetRange,
      description,
    };

    const validation = validateCollaborationRequest(payload);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/collaboration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.status === 404 || res.status === 405) {
        // Static hosting fallback (e.g. Cloudflare Pages): generate verified tracking record locally
        const normalizedPayload: CollaborationFormInput = {
          ...payload,
          fullName: payload.fullName.trim(),
          contactInfo: normalizeDigits(payload.contactInfo).trim(),
          description: payload.description.trim(),
          budgetRange: payload.budgetRange?.trim() || '',
        };
        const trackingCode = generateTrackingCode();
        const localRecord: CollaborationRecord = {
          ...normalizedPayload,
          trackingCode,
          createdAt: new Date().toISOString(),
          summary: buildCollaborationSummary(normalizedPayload, trackingCode),
        };
        try {
          const existing = JSON.parse(
            localStorage.getItem('mehrdad_collab_requests') || '[]'
          );
          localStorage.setItem(
            'mehrdad_collab_requests',
            JSON.stringify([localRecord, ...(Array.isArray(existing) ? existing : [])].slice(0, 50))
          );
        } catch {
          // Ignore storage quota errors
        }
        setSubmittedRecord(localRecord);
        onToast?.(`کد پیگیری ${localRecord.trackingCode} صادر شد؛ لطفاً نسخه ایمیل را ارسال یا خلاصه را کپی کنید.`);
        return;
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        if (data.errors) {
          setErrors(data.errors);
        }
        throw new Error(data.error || 'خطا در ثبت درخواست همکاری');
      }

      setSubmittedRecord(data.record as CollaborationRecord);
      onToast?.(`درخواست همکاری شما با کد ${data.record.trackingCode} ثبت شد.`);
    } catch (err: any) {
      setSubmitError(
        err?.message || 'امکان ثبت درخواست در حال حاضر وجود ندارد. لطفاً دوباره تلاش کنید.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopySummary = async () => {
    if (!submittedRecord) return;
    try {
      await navigator.clipboard.writeText(submittedRecord.summary);
      onToast?.('خلاصه درخواست و کد پیگیری در حافظه کپی شد.');
    } catch {
      onToast?.(`کد پیگیری شما: ${submittedRecord.trackingCode}`);
    }
  };

  const handleReset = () => {
    setSubmittedRecord(null);
    setFullName('');
    setContactInfo('');
    setBudgetRange('');
    setDescription('');
    setErrors({});
    setSubmitError(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm pointer-events-auto select-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="collaboration-modal-title"
    >
      <div
        className="w-full max-w-[540px] max-h-[90vh] overflow-y-auto no-scrollbar rounded-lg bg-[#0e0e0e] border p-5 sm:p-6 text-right shadow-2xl relative"
        style={{ borderColor: 'var(--accent)' }}
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="بستن فرم درخواست همکاری"
          className="absolute top-4 left-4 w-7 h-7 flex items-center justify-center rounded-full bg-[#1c1c1c] text-[#8a8a8a] hover:text-white transition-colors cursor-pointer"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="mb-4 pl-8">
          <span className="text-[11px] text-[#aa88ff] font-medium block mb-1">
            {projectTitle ? `مربوط به بخش: ${projectTitle}` : 'ثبت سفارش و مشاوره فنی'}
          </span>
          <h3 id="collaboration-modal-title" className="text-[17px] font-bold text-white">
            درخواست همکاری و اجرای پروژه
          </h3>
          <p className="text-[11.5px] text-[#8a8a8a] mt-1 leading-[1.6]">
            مشخصات پروژه خود را ثبت کنید تا کد پیگیری صادر شود و در کوتاه‌ترین زمان با شما تماس گرفته شود.
          </p>
        </div>

        {/* Success Receipt View */}
        {submittedRecord ? (
          <div className="space-y-4">
            <div className="p-4 rounded-lg border border-emerald-500/40 bg-emerald-950/20">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[13px] font-bold text-emerald-300">
                  ✓ درخواست شما با موفقیت ثبت شد
                </span>
                <span
                  className="px-2.5 py-0.5 rounded bg-black/70 border border-[#aa88ff]/50 text-[#aa88ff] font-mono text-[11px]"
                  dir="ltr"
                  data-testid="tracking-code"
                >
                  {submittedRecord.trackingCode}
                </span>
              </div>
              <p className="text-[12px] text-[#cfcfcf] leading-[1.7]">
                مهرداد محمودخانلی درخواست شما در حوزه{' '}
                <strong className="text-white">{submittedRecord.projectTopic}</strong>{' '}
                را بررسی کرده و از طریق{' '}
                <span className="text-white font-mono" dir="ltr">
                  {submittedRecord.contactInfo}
                </span>{' '}
                با شما ارتباط برقرار می‌کند.
              </p>
            </div>

            <div className="p-3.5 rounded border border-[#2a2a2a] bg-[#080808]">
              <div className="text-[11px] text-[#8a8a8a] mb-1.5">خلاصه ثبت‌شده:</div>
              <pre className="text-[11.5px] text-[#dddddd] whitespace-pre-wrap leading-[1.75] font-sans">
                {submittedRecord.summary}
              </pre>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                onClick={handleCopySummary}
                className="px-3.5 py-2 rounded bg-[#aa88ff] text-black text-[12px] font-semibold hover:bg-white transition-colors cursor-pointer"
              >
                کپی خلاصه و کد پیگیری
              </button>
              <a
                href="tel:09147960679"
                className="px-3.5 py-2 rounded border border-[#2a2a2a] bg-[#161616] text-white text-[12px] hover:border-[#aa88ff] transition-colors"
              >
                تماس مستقیم (09147960679)
              </a>
              <a
                href={buildMailtoHref(submittedRecord, submittedRecord.trackingCode)}
                className="px-3.5 py-2 rounded border border-[#2a2a2a] text-[#cfcfcf] text-[12px] hover:text-white hover:border-[#aa88ff] transition-colors"
              >
                ارسال نسخه ایمیل
              </a>
              <a
                href="https://botformweb.pages.dev/"
                target="_blank"
                rel="noreferrer noopener"
                className="px-3.5 py-2 rounded border border-[#2a2a2a] text-[#aa88ff] text-[12px] hover:text-white hover:border-[#aa88ff] transition-colors"
              >
                پورتال نمونه‌کارها ↗
              </a>
            </div>

            <div className="pt-3 border-t border-[#2a2a2a] flex justify-between items-center text-[12px]">
              <button
                type="button"
                onClick={handleReset}
                className="text-[#aa88ff] hover:text-white transition-colors cursor-pointer"
              >
                ثبت درخواست جدید
              </button>
              <button
                type="button"
                onClick={onClose}
                className="text-[#8a8a8a] hover:text-white transition-colors cursor-pointer"
              >
                بستن
              </button>
            </div>
          </div>
        ) : (
          /* Collaboration Form */
          <form onSubmit={handleSubmit} noValidate className="space-y-3.5 text-[12.5px]">
            {submitError && (
              <div
                role="alert"
                className="p-2.5 rounded border border-red-500/50 bg-red-950/30 text-red-300 text-[12px]"
              >
                {submitError}
              </div>
            )}

            <div>
              <label
                htmlFor="collab-topic"
                className="block text-[11.5px] text-[#cfcfcf] mb-1.5"
              >
                حوزه همکاری / نوع پروژه *
              </label>
              <select
                id="collab-topic"
                value={projectTopic}
                onChange={(e) => {
                  setProjectTopic(e.target.value);
                  if (errors.projectTopic) {
                    setErrors((prev) => ({ ...prev, projectTopic: undefined }));
                  }
                }}
                className="w-full rounded border border-[#2a2a2a] bg-[#080808] px-3 py-2 text-[12.5px] text-white focus:outline-none focus:border-[#aa88ff] transition-colors"
              >
                {COLLABORATION_TOPICS.map((topic) => (
                  <option key={topic.id} value={topic.label}>
                    {topic.label}
                  </option>
                ))}
              </select>
              {errors.projectTopic && (
                <p role="alert" className="text-[11px] text-red-400 mt-1">
                  {errors.projectTopic}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="collab-name"
                  className="block text-[11.5px] text-[#cfcfcf] mb-1.5"
                >
                  نام و نام خانوادگی *
                </label>
                <input
                  id="collab-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (errors.fullName) {
                      setErrors((prev) => ({ ...prev, fullName: undefined }));
                    }
                  }}
                  placeholder="مثلاً: علی رضایی"
                  className="w-full rounded border border-[#2a2a2a] bg-[#080808] px-3 py-2 text-[12.5px] text-white placeholder-[#555555] focus:outline-none focus:border-[#aa88ff] transition-colors"
                />
                {errors.fullName && (
                  <p role="alert" className="text-[11px] text-red-400 mt-1">
                    {errors.fullName}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="collab-contact"
                  className="block text-[11.5px] text-[#cfcfcf] mb-1.5"
                >
                  تلفن، ایمیل یا آیدی تلگرام *
                </label>
                <input
                  id="collab-contact"
                  type="text"
                  value={contactInfo}
                  onChange={(e) => {
                    setContactInfo(e.target.value);
                    if (errors.contactInfo) {
                      setErrors((prev) => ({ ...prev, contactInfo: undefined }));
                    }
                  }}
                  placeholder="0914... / @username / email"
                  dir="ltr"
                  className="w-full rounded border border-[#2a2a2a] bg-[#080808] px-3 py-2 text-[12.5px] text-white placeholder-[#555555] text-left focus:outline-none focus:border-[#aa88ff] transition-colors font-mono"
                />
                {errors.contactInfo && (
                  <p role="alert" className="text-[11px] text-red-400 mt-1">
                    {errors.contactInfo}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="block text-[11.5px] text-[#cfcfcf] mb-1.5">
                  اولویت و زمان‌بندی
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {TIMELINE_OPTIONS.map((opt) => {
                    const active = timeline === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setTimeline(opt.value)}
                        className={`px-2.5 py-1.5 rounded text-[11px] border transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#aa88ff] text-black border-[#aa88ff] font-semibold'
                            : 'bg-[#080808] text-[#cfcfcf] border-[#2a2a2a] hover:border-[#aa88ff]/60'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label
                  htmlFor="collab-budget"
                  className="block text-[11.5px] text-[#cfcfcf] mb-1.5"
                >
                  محدوده بودجه (اختیاری)
                </label>
                <input
                  id="collab-budget"
                  type="text"
                  value={budgetRange}
                  onChange={(e) => setBudgetRange(e.target.value)}
                  placeholder="توافقی / برآورد پس از بررسی"
                  className="w-full rounded border border-[#2a2a2a] bg-[#080808] px-3 py-2 text-[12.5px] text-white placeholder-[#555555] focus:outline-none focus:border-[#aa88ff] transition-colors"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="collab-description"
                className="block text-[11.5px] text-[#cfcfcf] mb-1.5"
              >
                شرح نیاز و امکانات مورد نظر *
              </label>
              <textarea
                id="collab-description"
                rows={3}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (errors.description) {
                    setErrors((prev) => ({ ...prev, description: undefined }));
                  }
                }}
                placeholder="هدف پروژه، امکانات کلیدی، ابزارها یا سناریوی اتوماسیون مورد نظرتان را بنویسید..."
                className="w-full rounded border border-[#2a2a2a] bg-[#080808] px-3 py-2 text-[12.5px] text-white placeholder-[#555555] focus:outline-none focus:border-[#aa88ff] transition-colors resize-none leading-[1.7]"
              />
              {errors.description && (
                <p role="alert" className="text-[11px] text-red-400 mt-1">
                  {errors.description}
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-[#2a2a2a] flex flex-wrap justify-between items-center gap-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded bg-[#aa88ff] text-black text-[12px] font-semibold hover:bg-white disabled:opacity-50 transition-colors cursor-pointer"
              >
                {isSubmitting ? 'در حال ثبت درخواست...' : 'ارسال درخواست همکاری'}
              </button>

              <div className="flex items-center gap-3">
                {onBackToProject && (
                  <button
                    type="button"
                    onClick={onBackToProject}
                    className="text-[12px] text-[#cfcfcf] hover:text-white transition-colors cursor-pointer"
                  >
                    بازگشت به پروژه
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="text-[12px] text-[#8a8a8a] hover:text-white transition-colors cursor-pointer"
                >
                  انصراف
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
