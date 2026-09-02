'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Loader2, CheckCircle2, AlertTriangle, CalendarDays, FileText, ClipboardList, MessageSquare, Send, ImagePlus, X, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { uploadToHostingerOrFallback } from '@/lib/upload-media';
import { submitDailyReport } from '@/app/actions/backend/reports/report-actions';
import Image from 'next/image';

interface Props {
  todaySubmitted?: boolean;
}

interface PreviewImage {
  file: File | null; // null for images restored from a saved draft (already uploaded, no local File anymore)
  preview: string;
  uploading: boolean;
  url?: string;
  error?: boolean;
}

// ─── Draft auto-save (localStorage) ───────────────────────────────────────────
// Refreshing/navigating away before submit used to lose everything typed and
// every uploaded image. We keep a lightweight draft in localStorage so it can
// be restored on the next visit. Only uploaded image URLs are saved (not the
// File objects themselves — those can't survive a reload).
const DRAFT_KEY = 'gobike-daily-report-draft';

interface DraftData {
  reportDate?: string;
  summary?: string;
  tasks?: string;
  notes?: string;
  images?: { url: string; filename: string }[];
}

export default function ReportForm({ todaySubmitted }: Props) {
  const today = new Date().toISOString().split('T')[0];

  const [isLoading, setIsLoading]     = useState(false);
  const [submitted, setSubmitted]     = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [pendingData, setPendingData] = useState<FormData | null>(null);
  const [reportDate, setReportDate]   = useState(today);
  const [summary, setSummary]         = useState('');
  const [tasks, setTasks]             = useState('');
  const [notes, setNotes]             = useState('');
  const [images, setImages]           = useState<PreviewImage[]>([]);
  const [isDragging, setIsDragging]   = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);

  const fileInputRef  = useRef<HTMLInputElement>(null);
  const dropZoneRef   = useRef<HTMLDivElement>(null);

  const clearDraft = useCallback(() => {
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* storage unavailable, ignore */ }
  }, []);

  // ─── Upload a single file (Hostinger primary, Cloudinary/Vercel Blob fallback) ─
  const uploadFile = useCallback(async (file: File, index: number) => {
    setImages(prev => prev.map((img, i) => i === index ? { ...img, uploading: true } : img));
    try {
      const uploaded = await uploadToHostingerOrFallback(file, 'daily-reports');
      setImages(prev => prev.map((img, i) => i === index ? { ...img, uploading: false, url: uploaded.url } : img));
    } catch {
      setImages(prev => prev.map((img, i) => i === index ? { ...img, uploading: false, error: true } : img));
      toast.error(`Failed to upload ${file.name}`);
    }
  }, []);

  // ─── Add files (from any source) ────────────────────────────────────────────
  const addFiles = useCallback((files: File[]) => {
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;
    if (images.length + imageFiles.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }
    const startIndex = images.length;
    const newPreviews: PreviewImage[] = imageFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      uploading: false,
    }));
    setImages(prev => {
      const updated = [...prev, ...newPreviews];
      // Start uploads
      imageFiles.forEach((file, i) => {
        uploadFile(file, startIndex + i);
      });
      return updated;
    });
  }, [images.length, uploadFile]);

  // ─── Paste handler (Ctrl+V) ──────────────────────────────────────────────────
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = Array.from(e.clipboardData?.items ?? []);
      const imageItems = items.filter(item => item.kind === 'file' && item.type.startsWith('image/'));
      if (imageItems.length === 0) return;
      e.preventDefault();
      const files = imageItems.map(item => item.getAsFile()).filter((f): f is File => f !== null);
      addFiles(files);
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [addFiles]);

  // ─── Restore a saved draft on mount (once) ──────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft: DraftData = JSON.parse(raw);
      const hasContent = !!(draft.summary || draft.tasks || draft.notes || (draft.images && draft.images.length));
      if (!hasContent) return;

      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from an external system (localStorage) on mount, not derivable at render time
      if (draft.reportDate) setReportDate(draft.reportDate);
      if (draft.summary) setSummary(draft.summary);
      if (draft.tasks) setTasks(draft.tasks);
      if (draft.notes) setNotes(draft.notes);
      if (draft.images?.length) {
        setImages(draft.images.map(img => ({
          file: null,
          preview: img.url,
          uploading: false,
          url: img.url,
        })));
      }
      setDraftRestored(true);
    } catch {
      // corrupted draft — ignore silently
    }
  }, []);

  // ─── Auto-save draft (debounced) ────────────────────────────────────────────
  useEffect(() => {
    // Nothing worth saving yet — also avoids clobbering a not-yet-restored
    // draft with the empty initial state on first mount.
    const hasContent = summary || tasks || notes || images.some(img => img.url);
    if (!hasContent) return;

    const handle = setTimeout(() => {
      const draft: DraftData = {
        reportDate,
        summary,
        tasks,
        notes,
        images: images.filter(img => img.url).map(img => ({ url: img.url as string, filename: img.file?.name ?? 'image' })),
      };
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      } catch {
        // storage full/unavailable — not critical, skip
      }
    }, 400);
    return () => clearTimeout(handle);
  }, [reportDate, summary, tasks, notes, images]);

  // ─── Drag & drop ─────────────────────────────────────────────────────────────
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      // Restored-from-draft images use the remote URL as their preview (no
      // local blob was ever created for them), so only revoke real blob: URLs.
      if (prev[index].preview.startsWith('blob:')) URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  // ─── Build FormData with image URLs ─────────────────────────────────────────
  const buildFormData = (form: HTMLFormElement | null, force = false): FormData => {
    const fd = form ? new FormData(form) : new FormData();
    const uploadedUrls = images.filter(img => img.url).map(img => img.url as string);
    fd.set('imageUrls', JSON.stringify(uploadedUrls));
    if (force) fd.set('forceSubmit', 'true');
    return fd;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const stillUploading = images.some(img => img.uploading);
    if (stillUploading) { toast.error('Please wait for images to finish uploading'); return; }
    setIsLoading(true);
    setIsDuplicate(false);

    const formData = buildFormData(e.currentTarget);
    const res = await submitDailyReport(formData);

    if (res.isDuplicate) {
      setPendingData(formData);
      setIsDuplicate(true);
      setIsLoading(false);
      return;
    }
    if (res.success) {
      toast.success(res.message);
      setSubmitted(true);
      setReportDate(today);
      setSummary('');
      setTasks('');
      setNotes('');
      setImages([]);
      setPendingData(null);
      setDraftRestored(false);
      clearDraft();
      setTimeout(() => setSubmitted(false), 5000);
    } else {
      toast.error(res.message);
    }
    setIsLoading(false);
  };

  const handleForceSubmit = async () => {
    if (!pendingData) return;
    setIsLoading(true);
    setIsDuplicate(false);
    const formData = new FormData();
    pendingData.forEach((v, k) => formData.set(k, v as string));
    formData.set('forceSubmit', 'true');
    const res = await submitDailyReport(formData);
    if (res.success) {
      toast.success(res.message);
      setSubmitted(true);
      setReportDate(today);
      setSummary('');
      setTasks('');
      setNotes('');
      setImages([]);
      setPendingData(null);
      setDraftRestored(false);
      clearDraft();
      setTimeout(() => setSubmitted(false), 5000);
    } else {
      toast.error(res.message);
    }
    setIsLoading(false);
  };

  return (
    <div className="bg-white border border-[#c3c4c7] rounded-sm shadow-sm overflow-hidden mb-6">

      {/* Header */}
      <div className="bg-gradient-to-r from-[#2271b1] to-[#135e96] px-5 py-4">
        <h2 className="text-white text-[15px] font-semibold flex items-center gap-2">
          <Send size={15} />
          Submit Daily Report
        </h2>
        <p className="text-blue-100 text-[12px] mt-0.5">
          Admin will be notified by email after submission.
        </p>
      </div>

      <div className="p-5 space-y-5">

        {/* Already submitted today banner */}
        {todaySubmitted && !submitted && (
          <div className="flex items-center gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded text-amber-700 text-[13px]">
            <AlertTriangle size={15} className="shrink-0" />
            <span>You already submitted a report for today. You can still submit another if needed.</span>
          </div>
        )}

        {/* Success banner */}
        {submitted && (
          <div className="flex items-center gap-2.5 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-[13px]">
            <CheckCircle2 size={15} className="shrink-0" />
            Report submitted! Admin has been notified via email.
          </div>
        )}

        {/* Draft restored banner */}
        {draftRestored && !submitted && (
          <div className="flex items-center justify-between gap-2.5 p-3 bg-blue-50 border border-blue-200 rounded text-blue-700 text-[13px]">
            <div className="flex items-center gap-2.5">
              <FileText size={15} className="shrink-0" />
              <span>Draft restored from your last unsaved session.</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setReportDate(today);
                setSummary('');
                setTasks('');
                setNotes('');
                setImages([]);
                clearDraft();
                setDraftRestored(false);
              }}
              className="text-[12px] font-medium text-blue-700 hover:underline shrink-0"
            >
              Clear draft
            </button>
          </div>
        )}

        {/* Duplicate warning */}
        {isDuplicate && (
          <div className="p-4 bg-amber-50 border border-amber-300 rounded space-y-3">
            <div className="flex items-start gap-2.5 text-amber-800 text-[13px]">
              <AlertTriangle size={15} className="shrink-0 mt-0.5" />
              <span>You already submitted a report for this date. Do you want to submit another one anyway?</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleForceSubmit}
                disabled={isLoading}
                className="bg-amber-600 hover:bg-amber-700 text-white text-[12px] font-semibold px-3 py-1.5 rounded flex items-center gap-1.5 disabled:opacity-60"
              >
                {isLoading && <Loader2 size={12} className="animate-spin" />}
                Yes, Submit Anyway
              </button>
              <button
                type="button"
                onClick={() => setIsDuplicate(false)}
                className="border border-amber-300 text-amber-700 hover:bg-amber-100 text-[12px] font-medium px-3 py-1.5 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Report Date */}
          <div>
            <label className="flex items-center gap-1.5 text-[13px] font-semibold text-[#1d2327] mb-1.5">
              <CalendarDays size={13} className="text-[#2271b1]" />
              Report Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="reportDate"
              value={reportDate}
              onChange={e => setReportDate(e.target.value)}
              max={today}
              required
              className="border border-[#8c8f94] rounded-[3px] text-[13px] px-3 py-[6px] w-full max-w-[180px] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none transition"
            />
          </div>

          {/* Summary */}
          <div>
            <label className="flex items-center gap-1.5 text-[13px] font-semibold text-[#1d2327] mb-1">
              <FileText size={13} className="text-[#2271b1]" />
              Summary <span className="text-red-500">*</span>
            </label>
            <p className="text-[11px] text-[#646970] mb-1.5">What did you accomplish today overall?</p>
            <textarea
              name="summary"
              required
              rows={3}
              value={summary}
              onChange={e => setSummary(e.target.value)}
              placeholder="Today I completed..."
              className="border border-[#8c8f94] rounded-[3px] text-[13px] px-3 py-2 w-full focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none resize-y transition"
            />
            <p className="text-[11px] text-[#646970] mt-0.5 text-right">{summary.length} chars</p>
          </div>

          {/* Tasks */}
          <div>
            <label className="flex items-center gap-1.5 text-[13px] font-semibold text-[#1d2327] mb-1">
              <ClipboardList size={13} className="text-[#2271b1]" />
              Tasks Completed
            </label>
            <p className="text-[11px] text-[#646970] mb-1.5">List specific tasks, one per line.</p>
            <textarea
              name="tasks"
              rows={4}
              value={tasks}
              onChange={e => setTasks(e.target.value)}
              placeholder={"- Updated product descriptions\n- Responded to 5 support tickets\n- Reviewed 3 orders"}
              className="border border-[#8c8f94] rounded-[3px] text-[13px] px-3 py-2 w-full focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none resize-y font-mono transition"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="flex items-center gap-1.5 text-[13px] font-semibold text-[#1d2327] mb-1">
              <MessageSquare size={13} className="text-[#2271b1]" />
              Additional Notes
              <span className="text-[11px] font-normal text-[#646970] ml-1">(optional)</span>
            </label>
            <p className="text-[11px] text-[#646970] mb-1.5">Blockers, questions, or anything the admin should know.</p>
            <textarea
              name="notes"
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Optional: issues, blockers, or anything else..."
              className="border border-[#8c8f94] rounded-[3px] text-[13px] px-3 py-2 w-full focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none resize-y transition"
            />
          </div>

          {/* ── Image Upload ─────────────────────────────────────────────────── */}
          <div>
            <label className="flex items-center gap-1.5 text-[13px] font-semibold text-[#1d2327] mb-1">
              <ImagePlus size={13} className="text-[#2271b1]" />
              Attach Images
              <span className="text-[11px] font-normal text-[#646970] ml-1">(optional, max 5)</span>
            </label>
            <p className="text-[11px] text-[#646970] mb-2">
              Screenshots, photos, or any work evidence. Paste with{' '}
              <kbd className="bg-[#f0f0f1] border border-[#dcdcde] rounded px-1 text-[10px] font-mono">Ctrl+V</kbd>
              , drag & drop, or click to browse.
            </p>

            {/* Drop zone */}
            <div
              ref={dropZoneRef}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-[3px] p-4 text-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-[#2271b1] bg-blue-50'
                  : 'border-[#c3c4c7] hover:border-[#2271b1] hover:bg-[#f0f6fc]'
              } ${images.length >= 5 ? 'opacity-40 pointer-events-none' : ''}`}
            >
              <Upload size={18} className="mx-auto mb-1.5 text-[#9ca3af]" />
              <p className="text-[12px] text-[#646970]">
                {images.length >= 5
                  ? 'Maximum 5 images reached'
                  : 'Click to browse · Drag & drop · Ctrl+V to paste'}
              </p>
              <p className="text-[11px] text-[#9ca3af] mt-0.5">PNG, JPG, WEBP, GIF</p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={e => {
                addFiles(Array.from(e.target.files ?? []));
                e.target.value = '';
              }}
            />

            {/* Previews */}
            {images.length > 0 && (
              <div className="mt-3 grid grid-cols-3 sm:grid-cols-5 gap-2">
                {images.map((img, i) => (
                  <div key={i} className="relative group aspect-square rounded overflow-hidden border border-[#dcdcde] bg-[#f6f7f7]">
                    <Image
                      src={img.preview}
                      alt={`Preview ${i + 1}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    {/* Uploading overlay */}
                    {img.uploading && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 size={16} className="text-white animate-spin" />
                      </div>
                    )}
                    {/* Error overlay */}
                    {img.error && (
                      <div className="absolute inset-0 bg-red-500/70 flex items-center justify-center">
                        <AlertTriangle size={14} className="text-white" />
                      </div>
                    )}
                    {/* Done checkmark */}
                    {img.url && !img.uploading && (
                      <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle2 size={10} className="text-white" />
                      </div>
                    )}
                    {/* Remove button */}
                    {!img.uploading && (
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); removeImage(i); }}
                        className="absolute top-1 right-1 w-5 h-5 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={10} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-1 border-t border-[#f0f0f1]">
            <button
              type="submit"
              disabled={isLoading || images.some(img => img.uploading)}
              className="bg-[#2271b1] hover:bg-[#135e96] text-white border border-[#2271b1] hover:border-[#135e96] rounded-[3px] px-5 py-2 text-[13px] font-semibold shadow-sm disabled:opacity-60 flex items-center gap-2 transition-colors"
            >
              {isLoading ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
              {isLoading ? 'Submitting...' : images.some(img => img.uploading) ? 'Uploading images...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
