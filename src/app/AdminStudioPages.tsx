import { FormEvent, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import {
  Award,
  Check,
  CheckCircle2,
  Copy,
  FileText,
  Film,
  Image as ImageIcon,
  MessageSquare,
  MonitorUp,
  Pin,
  Play,
  Plus,
  Radio,
  RefreshCw,
  Send,
  Sparkles,
  Square,
  Trash2,
  Upload,
} from "lucide-react";
import {
  CertificateTemplateConfig,
  CourseLessonItem,
  CourseTrackItem,
  LiveChatMessageItem,
  LiveSessionItem,
  MentorMessageItem,
  QuizQuestionItem,
  StudentCertificateItem,
  deleteCourseLessonFromDb,
  deleteLiveSessionFromDb,
  deleteSessionChatMessageInDb,
  fetchCertificateTemplateFromDb,
  fetchCoursesWithLessons,
  fetchLiveSessionsFromDb,
  fetchMentorMessagesFromDb,
  fetchSessionChatMessagesFromDb,
  getCachedCertificateTemplate,
  getCachedCertificates,
  getCachedCourses,
  getCachedLiveSessions,
  renderPersonalizedCertificateDataUrl,
  saveCertificateTemplateToDb,
  saveCourseLessonToDb,
  saveCourseLevelQuizQuestionsToDb,
  saveLiveSessionInDb,
  sendMentorMessageInDb,
  sendSessionChatMessageInDb,
  togglePinSessionChatMessageInDb,
  uploadCertificateTemplateImage,
  uploadCourseLevelPdfAndGenerateQuiz,
  uploadCourseVideoFile,
} from "./portalDataStore";

// ============================================================================
// 1. ADMIN COURSES, VIDEO UPLOADS, 4-LEVEL PDF QUIZ ENGINE & CERTIFICATE STUDIO
// ============================================================================

export function AdminCoursesPage() {
  const [tracks, setTracks] = useState<CourseTrackItem[]>(getCachedCourses());
  const [selectedCourseId, setSelectedCourseId] = useState<string>("forex-foundations");
  const [certificates, setCertificates] = useState<StudentCertificateItem[]>(getCachedCertificates());

  // New / Edit Lesson Form State
  const [lessonNumber, setLessonNumber] = useState<number>(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState<number>(15);
  const [pairTag, setPairTag] = useState("EUR/USD · 15M");
  const [videoMode, setVideoMode] = useState<"supabase_storage" | "url">("supabase_storage");
  const [videoUrl, setVideoUrl] = useState("");
  const [takeawaysInput, setTakeawaysInput] = useState(
    "Confirm higher-timeframe structure before execution\nWait for candle closure at key liquidity zone\nRisk maximum 1% to 2% per trade"
  );
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [savingLesson, setSavingLesson] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [previewLesson, setPreviewLesson] = useState<CourseLessonItem | null>(null);

  // 4-Level PDF Auto-Quiz Generator State
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfCurriculumNotes, setPdfCurriculumNotes] = useState("");
  const [pdfQuestionCount, setPdfQuestionCount] = useState<number>(6);
  const [generatingPdfQuiz, setGeneratingPdfQuiz] = useState(false);
  const [pdfFeedback, setPdfFeedback] = useState<string | null>(null);
  const [editingQuestions, setEditingQuestions] = useState<QuizQuestionItem[]>([]);

  // Certificate Template Studio State
  const [certTemplate, setCertTemplate] = useState<CertificateTemplateConfig>(
    getCachedCertificateTemplate()
  );
  const [uploadingCertTemplate, setUploadingCertTemplate] = useState(false);
  const [certPreviewDataUrl, setCertPreviewDataUrl] = useState<string>("");
  const [certSampleStudentName, setCertSampleStudentName] = useState("Samuel Osei");
  const [certStudioFeedback, setCertStudioFeedback] = useState<string | null>(null);

  const selectedTrack = tracks.find((t) => t.id === selectedCourseId) || tracks[0];

  async function reloadCourses() {
    const data = await fetchCoursesWithLessons();
    setTracks(data);
    setCertificates(getCachedCertificates());
    const current = data.find((t) => t.id === selectedCourseId) || data[0];
    if (current) {
      setLessonNumber(current.lessons.length + 1);
      setEditingQuestions(current.levelQuizQuestions || []);
    }
  }

  useEffect(() => {
    void reloadCourses();
    void fetchCertificateTemplateFromDb().then(setCertTemplate);
  }, [selectedCourseId]);

  useEffect(() => {
    void renderPersonalizedCertificateDataUrl({
      studentName: certSampleStudentName || "Verified Student",
      courseTitle: selectedTrack?.title || "Forex Foundations",
      certificateCode: "CSA-PREVIEW-001",
      issuedAt: new Date().toISOString(),
      template: certTemplate,
    }).then(setCertPreviewDataUrl);
  }, [certTemplate, certSampleStudentName, selectedTrack?.title]);

  async function handleVideoFileSelect(file: File | null) {
    if (!file) return;
    setUploadingVideo(true);
    setFeedback(null);
    const res = await uploadCourseVideoFile(selectedCourseId, file);
    setUploadingVideo(false);
    setVideoUrl(res.url);
    setFeedback(res.message);
  }

  async function handleSaveLesson(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSavingLesson(true);
    setFeedback(null);

    const takeaways = takeawaysInput
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const res = await saveCourseLessonToDb({
      courseId: selectedCourseId,
      lessonNumber,
      title,
      description,
      durationMinutes,
      videoUrl,
      videoSourceType: videoMode,
      pairTag,
      keyTakeaways: takeaways,
    });

    setSavingLesson(false);
    setFeedback(res.message);
    setTitle("");
    setDescription("");
    setVideoUrl("");
    await reloadCourses();
  }

  async function handleDeleteLesson(lessonId: string) {
    await deleteCourseLessonFromDb(selectedCourseId, lessonId);
    await reloadCourses();
  }

  async function handleGenerateLevelPdfQuiz(e: FormEvent) {
    e.preventDefault();
    setGeneratingPdfQuiz(true);
    setPdfFeedback(null);
    const res = await uploadCourseLevelPdfAndGenerateQuiz({
      courseId: selectedCourseId,
      file: pdfFile,
      curriculumNotes: pdfCurriculumNotes,
      questionCount: pdfQuestionCount,
    });
    setGeneratingPdfQuiz(false);
    setPdfFeedback(res.message);
    setEditingQuestions(res.questions);
    await reloadCourses();
  }

  async function handleSaveEditedQuestions() {
    await saveCourseLevelQuizQuestionsToDb(selectedCourseId, editingQuestions);
    setPdfFeedback(
      `Saved ${editingQuestions.length} quiz questions for ${selectedTrack.level} (${selectedTrack.title})!`
    );
    await reloadCourses();
  }

  async function handleCertTemplateUpload(file: File | null) {
    if (!file) return;
    setUploadingCertTemplate(true);
    setCertStudioFeedback(null);
    const res = await uploadCertificateTemplateImage(file);
    setUploadingCertTemplate(false);
    const updated = { ...certTemplate, templateImageUrl: res.url };
    setCertTemplate(updated);
    await saveCertificateTemplateToDb(updated);
    setCertStudioFeedback(res.message);
  }

  async function handleSaveCertTemplate() {
    await saveCertificateTemplateToDb(certTemplate);
    setCertStudioFeedback(
      "Certificate template & student name coordinates saved! Completed students will receive this official template."
    );
    setTimeout(() => setCertStudioFeedback(null), 4000);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#ffde02]">
            FOUNDER COURSE, LEVEL PDF QUIZ &amp; CERTIFICATE STUDIO
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">
            Courses, 4-Level PDF Quizzes &amp; Certificate Designer
          </h1>
          <p className="text-xs sm:text-sm text-[#9aa4b5] mt-1">
            Name and upload your videos for Beginner, Intermediate, Essential, and Advanced tracks, upload the 4 Level PDFs to generate multi-question assessments, and customize your official completion certificate.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            to={`/courses/${selectedCourseId}`}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition whitespace-nowrap"
          >
            Preview Student View ↗
          </Link>
        </div>
      </div>

      {/* 4 Course Track Selector Cards (Beginner, Intermediate, Essential, Advanced) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {tracks.map((track) => {
          const isSelected = track.id === selectedCourseId;
          const pdfQuizCount = track.levelQuizQuestions?.length || 0;
          return (
            <button
              key={track.id}
              type="button"
              onClick={() => {
                setSelectedCourseId(track.id);
                setLessonNumber(track.lessons.length + 1);
                setEditingQuestions(track.levelQuizQuestions || []);
                setPreviewLesson(null);
              }}
              className={`p-5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? "bg-[#171c26] border-[#ffde02] shadow-[0_10px_30px_rgba(255,222,2,0.12)]"
                  : "bg-[#12151d] border-white/10 hover:border-white/25"
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs text-[#9aa4b5] font-mono">
                  <span className="uppercase font-bold text-white">{track.level} Level</span>
                  <span className="text-[#ffde02] font-bold tabular-nums">
                    {track.lessons.length} Videos
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-2">{track.title}</h3>
                <p className="text-xs text-[#8c95a6] mt-1 line-clamp-2">{track.description}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono">
                <span className={isSelected ? "text-[#ffde02] font-bold" : "text-[#7d8799]"}>
                  {track.levelPdfName ? `PDF: ${track.levelPdfName.slice(0, 14)}...` : "Upload Level PDF"}
                </span>
                <span className="text-emerald-400">
                  {pdfQuizCount > 0 ? `${pdfQuizCount} PDF Qs` : "Auto-Quiz"}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Split: Upload Video Lesson (Left) + Track Video Lessons Roster (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Name & Upload Video Lesson */}
        <form
          onSubmit={handleSaveLesson}
          className="lg:col-span-5 bg-[#12151d] border border-white/10 rounded-2xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#ffde02]">
                {selectedTrack.level.toUpperCase()} TRACK · {selectedTrack.title.toUpperCase()}
              </span>
              <h2 className="text-lg font-bold text-white mt-0.5">
                Name &amp; Upload Video #{lessonNumber}
              </h2>
            </div>
            <Film size={20} className="text-[#ffde02]" />
          </div>

          {feedback && (
            <div className="p-3.5 rounded-xl bg-[#ffde02]/10 border border-[#ffde02]/30 text-xs text-[#ffde02] flex items-start gap-2">
              <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
              <span>{feedback}</span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9aa4b5] mb-1.5">
                Lesson #
              </label>
              <input
                type="number"
                min={1}
                required
                value={lessonNumber}
                onChange={(e) => setLessonNumber(Number(e.target.value))}
                className="w-full bg-[#181c26] border border-white/10 rounded-xl px-3 py-2.5 text-white text-xs font-mono focus:outline-none focus:border-[#ffde02]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9aa4b5] mb-1.5">
                Duration (Min)
              </label>
              <input
                type="number"
                min={1}
                required
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full bg-[#181c26] border border-white/10 rounded-xl px-3 py-2.5 text-white text-xs font-mono focus:outline-none focus:border-[#ffde02]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9aa4b5] mb-1.5">
                Market Tag
              </label>
              <input
                type="text"
                value={pairTag}
                onChange={(e) => setPairTag(e.target.value)}
                placeholder="EUR/USD · 15M"
                className="w-full bg-[#181c26] border border-white/10 rounded-xl px-3 py-2.5 text-white text-xs font-mono focus:outline-none focus:border-[#ffde02]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9aa4b5] mb-1.5">
              Video / Course Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Name this video lesson..."
              className="w-full bg-[#181c26] border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-[#ffde02]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9aa4b5] mb-1.5">
              Lesson Summary
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain what the student will master in this video..."
              className="w-full bg-[#181c26] border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-[#ffde02]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9aa4b5] mb-1.5">
              Video Source (Supabase Bucket Upload or Direct URL)
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#181c26] rounded-xl border border-white/10 mb-2.5">
              <button
                type="button"
                onClick={() => setVideoMode("supabase_storage")}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                  videoMode === "supabase_storage"
                    ? "bg-[#ffde02] text-black"
                    : "text-[#9aa4b5] hover:text-white"
                }`}
              >
                Upload Video File
              </button>
              <button
                type="button"
                onClick={() => setVideoMode("url")}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                  videoMode === "url"
                    ? "bg-[#ffde02] text-black"
                    : "text-[#9aa4b5] hover:text-white"
                }`}
              >
                Paste Video URL
              </button>
            </div>

            {videoMode === "supabase_storage" ? (
              <div className="p-4 rounded-xl border border-dashed border-[#ffde02]/40 bg-[#161a24] text-center space-y-2">
                <Upload size={20} className="mx-auto text-[#ffde02]" />
                <p className="text-xs text-white font-semibold">
                  Select MP4 / WebM / MOV course video
                </p>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => void handleVideoFileSelect(e.target.files?.[0] || null)}
                  className="block w-full text-xs text-[#9aa4b5] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#ffde02] file:text-black hover:file:bg-[#ffe540] cursor-pointer"
                />
                {uploadingVideo && (
                  <p className="text-[11px] text-[#ffde02] font-mono">
                    Uploading to Supabase Storage (course-videos)...
                  </p>
                )}
              </div>
            ) : null}

            <input
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://... (MP4, HLS .m3u8, YouTube, Vimeo, or Supabase Storage URL)"
              className="w-full mt-2 bg-[#181c26] border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs font-mono focus:outline-none focus:border-[#ffde02]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9aa4b5] mb-1.5">
              Key Takeaways (One per line)
            </label>
            <textarea
              rows={2}
              value={takeawaysInput}
              onChange={(e) => setTakeawaysInput(e.target.value)}
              className="w-full bg-[#181c26] border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-[#ffde02]"
            />
          </div>

          <button
            type="submit"
            disabled={savingLesson || uploadingVideo}
            className="w-full py-3.5 px-5 rounded-xl bg-[#ffde02] hover:bg-[#ffe540] text-black font-extrabold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <Plus size={15} />
            <span>
              {savingLesson
                ? "Publishing Video Lesson..."
                : `Publish Video #${lessonNumber} to ${selectedTrack.title}`}
            </span>
          </button>
        </form>

        {/* Right: Uploaded Videos List for this Level Track */}
        <div className="lg:col-span-7 bg-[#12151d] border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#9aa4b5]">
                {selectedTrack.level.toUpperCase()} LEVEL · {selectedTrack.title.toUpperCase()}
              </span>
              <h2 className="text-lg font-bold text-white">
                {selectedTrack.lessons.length} Uploaded Video Lessons
              </h2>
            </div>
            <span className="text-xs text-[#9aa4b5] font-mono">
              Zero demo lessons · Only your uploaded videos show to clients
            </span>
          </div>

          {previewLesson && (
            <div className="p-4 rounded-xl bg-[#181c26] border border-[#ffde02]/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#ffde02]">
                  Previewing Lesson #{previewLesson.lessonNumber}: {previewLesson.title}
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewLesson(null)}
                  className="text-xs text-[#9aa4b5] hover:text-white cursor-pointer"
                >
                  Close Preview ✕
                </button>
              </div>
              {previewLesson.videoUrl ? (
                previewLesson.videoUrl.includes("youtube.com") ||
                previewLesson.videoUrl.includes("youtu.be") ||
                previewLesson.videoUrl.includes("vimeo.com") ? (
                  <iframe
                    src={previewLesson.videoUrl}
                    title={previewLesson.title}
                    className="w-full aspect-video rounded-lg border border-white/10"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={previewLesson.videoUrl}
                    controls
                    className="w-full aspect-video rounded-lg bg-black border border-white/10"
                  />
                )
              ) : (
                <div className="p-4 rounded-lg bg-black/50 text-xs text-[#9aa4b5]">
                  No video file URL set yet. Edit this lesson on the left to attach an MP4 file or stream URL.
                </div>
              )}
            </div>
          )}

          {selectedTrack.lessons.length === 0 ? (
            <div className="p-10 rounded-2xl bg-[#161a24] border border-dashed border-white/10 text-center space-y-2">
              <Film size={28} className="mx-auto text-[#ffde02]" />
              <h3 className="text-sm font-bold text-white">
                No videos uploaded to {selectedTrack.title} ({selectedTrack.level}) yet
              </h3>
              <p className="text-xs text-[#8c95a6] max-w-md mx-auto">
                Use the form on the left to name and upload your first video lesson for {selectedTrack.title}. Every video you upload immediately appears in the Client Course Library.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {selectedTrack.lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="p-3.5 rounded-xl bg-[#171b24] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-white/20 transition"
                >
                  <div className="flex items-start gap-3">
                    <span className="w-8 h-8 rounded-lg bg-[#ffde02]/15 text-[#ffde02] font-mono text-xs font-bold flex items-center justify-center shrink-0">
                      {String(lesson.lessonNumber).padStart(2, "0")}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-white">{lesson.title}</h4>
                        <span className="text-[11px] font-mono text-[#9aa4b5]">
                          · {lesson.durationMinutes} min · {lesson.pairTag}
                        </span>
                      </div>
                      <p className="text-xs text-[#8c95a6] mt-0.5 line-clamp-1">
                        {lesson.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setPreviewLesson(lesson)}
                      className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition cursor-pointer flex items-center gap-1"
                    >
                      <Play size={12} className="text-[#ffde02]" /> Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLessonNumber(lesson.lessonNumber);
                        setTitle(lesson.title);
                        setDescription(lesson.description);
                        setDurationMinutes(lesson.durationMinutes);
                        setPairTag(lesson.pairTag);
                        setVideoUrl(lesson.videoUrl);
                        setTakeawaysInput(lesson.keyTakeaways.join("\n"));
                      }}
                      className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-[#cfd7e4] transition cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteLesson(lesson.id)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-[#9aa4b5] hover:text-red-400 transition cursor-pointer"
                      title="Delete lesson"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ============================================================================
          SECTION 2: 4-LEVEL PDF UPLOAD & AI MULTI-QUESTION QUIZ GENERATOR
         ============================================================================ */}
      <div className="bg-[#12151d] border border-[#ffde02]/30 rounded-2xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#ffde02] flex items-center gap-1.5">
              <Sparkles size={13} /> 4-LEVEL PDF AUTO-QUIZ ENGINE ·{" "}
              {selectedTrack.level.toUpperCase()} PDF ({selectedTrack.title.toUpperCase()})
            </span>
            <h2 className="text-xl font-bold text-white mt-1">
              Upload {selectedTrack.level} Level PDF &amp; Generate Multi-Question Quiz
            </h2>
            <p className="text-xs text-[#9aa4b5] mt-0.5">
              Upload your PDF study guide for <strong>{selectedTrack.level}</strong> ({selectedTrack.title}). Our AI engine reads your PDF and generates a multi-question quiz specifically for this level.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {tracks.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedCourseId(t.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  t.id === selectedCourseId
                    ? "bg-[#ffde02] text-black border-[#ffde02]"
                    : "bg-white/5 text-[#9aa4b5] border-white/10 hover:text-white"
                }`}
              >
                {t.level} PDF ({t.levelQuizQuestions?.length || 0} Qs)
              </button>
            ))}
          </div>
        </div>

        {pdfFeedback && (
          <div className="p-3.5 rounded-xl bg-[#ffde02]/10 border border-[#ffde02]/30 text-xs text-[#ffde02] flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{pdfFeedback}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form onSubmit={handleGenerateLevelPdfQuiz} className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-xl border border-dashed border-[#ffde02]/40 bg-[#161a24] space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <FileText size={16} className="text-[#ffde02]" />
                <span>Select {selectedTrack.level} Level PDF Document</span>
              </div>
              <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                className="block w-full text-xs text-[#9aa4b5] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#ffde02] file:text-black hover:file:bg-[#ffe540] cursor-pointer"
              />
              {selectedTrack.levelPdfName && (
                <p className="text-[11px] font-mono text-emerald-400">
                  Current Uploaded PDF: {selectedTrack.levelPdfName}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9aa4b5] mb-1">
                  Level
                </label>
                <input
                  type="text"
                  disabled
                  value={`${selectedTrack.level} · ${selectedTrack.title}`}
                  className="w-full bg-[#181c26] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono opacity-80"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9aa4b5] mb-1">
                  Number of Questions
                </label>
                <input
                  type="number"
                  min={5}
                  max={12}
                  value={pdfQuestionCount}
                  onChange={(e) => setPdfQuestionCount(Number(e.target.value))}
                  className="w-full bg-[#181c26] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9aa4b5] mb-1">
                Key Topics / Focus Notes from PDF (Optional)
              </label>
              <textarea
                rows={3}
                value={pdfCurriculumNotes}
                onChange={(e) => setPdfCurriculumNotes(e.target.value)}
                placeholder={`Paste key points or topics from your ${selectedTrack.level} PDF to emphasize in the generated questions...`}
                className="w-full bg-[#181c26] border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-[#ffde02]"
              />
            </div>

            <button
              type="submit"
              disabled={generatingPdfQuiz}
              className="w-full py-3.5 px-5 rounded-xl bg-[#ffde02] hover:bg-[#ffe540] text-black font-extrabold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <Sparkles size={15} />
              <span>
                {generatingPdfQuiz
                  ? `Reading ${selectedTrack.level} PDF & Generating Questions...`
                  : `Upload ${selectedTrack.level} PDF & Generate ${pdfQuestionCount} Quiz Questions`}
              </span>
            </button>
          </form>

          {/* Right: Generated Multi-Question Quiz Editor */}
          <div className="lg:col-span-7 bg-[#161a24] border border-white/10 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">
                  {selectedTrack.level} Level Quiz Questions ({editingQuestions.length} Questions)
                </h3>
                <p className="text-[11px] text-[#8c95a6]">
                  Students taking the {selectedTrack.title} quiz will answer all {editingQuestions.length} questions below.
                </p>
              </div>
              {editingQuestions.length > 0 && (
                <button
                  type="button"
                  onClick={() => void handleSaveEditedQuestions()}
                  className="px-3.5 py-1.5 rounded-lg bg-[#ffde02] text-black font-extrabold text-xs cursor-pointer"
                >
                  Save Quiz Changes
                </button>
              )}
            </div>

            {editingQuestions.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#8c95a6]">
                Upload your <strong>{selectedTrack.level} PDF</strong> on the left and click Generate to create a multi-question quiz for this level.
              </div>
            ) : (
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {editingQuestions.map((q, qIdx) => (
                  <div
                    key={q.id}
                    className="p-3.5 rounded-xl bg-[#11141c] border border-white/10 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono font-bold text-[#ffde02]">
                        Question {qIdx + 1} of {editingQuestions.length}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setEditingQuestions(editingQuestions.filter((_, i) => i !== qIdx))
                        }
                        className="text-xs text-[#8c95a6] hover:text-red-400 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                    <input
                      type="text"
                      value={q.question}
                      onChange={(e) => {
                        const copy = [...editingQuestions];
                        copy[qIdx] = { ...copy[qIdx], question: e.target.value };
                        setEditingQuestions(copy);
                      }}
                      className="w-full bg-[#181c26] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-semibold"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-1.5">
                          <input
                            type="radio"
                            name={`correct-${q.id}`}
                            checked={q.correctIndex === optIdx}
                            onChange={() => {
                              const copy = [...editingQuestions];
                              copy[qIdx] = { ...copy[qIdx], correctIndex: optIdx };
                              setEditingQuestions(copy);
                            }}
                            className="accent-[#ffde02] cursor-pointer"
                          />
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const copy = [...editingQuestions];
                              const nextOpts = [...copy[qIdx].options];
                              nextOpts[optIdx] = e.target.value;
                              copy[qIdx] = { ...copy[qIdx], options: nextOpts };
                              setEditingQuestions(copy);
                            }}
                            className={`w-full bg-[#181c26] border rounded-lg px-2.5 py-1 text-[11px] ${
                              q.correctIndex === optIdx
                                ? "border-emerald-500/50 text-emerald-300 font-bold"
                                : "border-white/10 text-[#cfd7e4]"
                            }`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================================
          SECTION 3: OFFICIAL CERTIFICATE TEMPLATE DESIGNER (ADMIN UPLOAD + NAME PLACEMENT)
         ============================================================================ */}
      <div className="bg-[#12151d] border border-white/10 rounded-2xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#ffde02]">
              ACADEMY CERTIFICATE STUDIO · AUTOMATIC STUDENT NAME RENDERER
            </span>
            <h2 className="text-xl font-bold text-white mt-0.5">
              Official Certificate Template &amp; Student Name Position
            </h2>
            <p className="text-xs text-[#9aa4b5] mt-0.5">
              Upload your official certificate template image and set where the student&apos;s name is written. When any student completes 100% of a course, their own name is automatically rendered on this certificate for download.
            </p>
          </div>
          <Award size={22} className="text-[#ffde02]" />
        </div>

        {certStudioFeedback && (
          <div className="p-3.5 rounded-xl bg-[#ffde02]/10 border border-[#ffde02]/30 text-xs text-[#ffde02] flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{certStudioFeedback}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 5 Cols: Template Image Upload & Coordinate Sliders */}
          <div className="lg:col-span-5 space-y-4 bg-[#161a24] border border-white/10 rounded-xl p-5">
            <div className="p-4 rounded-xl border border-dashed border-[#ffde02]/40 bg-[#12151d] text-center space-y-2">
              <ImageIcon size={20} className="mx-auto text-[#ffde02]" />
              <p className="text-xs font-bold text-white">
                Upload Blank Certificate Template Image (PNG / JPG)
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => void handleCertTemplateUpload(e.target.files?.[0] || null)}
                className="block w-full text-xs text-[#9aa4b5] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#ffde02] file:text-black hover:file:bg-[#ffe540] cursor-pointer"
              />
              {uploadingCertTemplate && (
                <p className="text-[11px] font-mono text-[#ffde02]">Uploading template...</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9aa4b5] mb-1">
                Sample Student Name for Live Preview
              </label>
              <input
                type="text"
                value={certSampleStudentName}
                onChange={(e) => setCertSampleStudentName(e.target.value)}
                className="w-full bg-[#181c26] border border-white/10 rounded-xl px-3.5 py-2 text-white text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9aa4b5] mb-1">
                  Horizontal Position (X: {certTemplate.nameXPct}%)
                </label>
                <input
                  type="range"
                  min={15}
                  max={85}
                  value={certTemplate.nameXPct}
                  onChange={(e) =>
                    setCertTemplate({ ...certTemplate, nameXPct: Number(e.target.value) })
                  }
                  className="w-full accent-[#ffde02]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9aa4b5] mb-1">
                  Vertical Position (Y: {certTemplate.nameYPct}%)
                </label>
                <input
                  type="range"
                  min={20}
                  max={85}
                  value={certTemplate.nameYPct}
                  onChange={(e) =>
                    setCertTemplate({ ...certTemplate, nameYPct: Number(e.target.value) })
                  }
                  className="w-full accent-[#ffde02]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9aa4b5] mb-1">
                  Name Font Size ({certTemplate.fontSize}px)
                </label>
                <input
                  type="number"
                  min={20}
                  max={80}
                  value={certTemplate.fontSize}
                  onChange={(e) =>
                    setCertTemplate({ ...certTemplate, fontSize: Number(e.target.value) })
                  }
                  className="w-full bg-[#181c26] border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9aa4b5] mb-1">
                  Name Ink Color
                </label>
                <input
                  type="color"
                  value={certTemplate.fontColor}
                  onChange={(e) =>
                    setCertTemplate({ ...certTemplate, fontColor: e.target.value })
                  }
                  className="w-full h-9 bg-[#181c26] border border-white/10 rounded-xl px-2 py-1 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-[#cfd7e4] pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={certTemplate.showCourseTitle}
                  onChange={(e) =>
                    setCertTemplate({ ...certTemplate, showCourseTitle: e.target.checked })
                  }
                  className="accent-[#ffde02]"
                />
                <span>Print Course Track Title on Certificate</span>
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => void handleSaveCertTemplate()}
                className="flex-1 py-3 px-4 rounded-xl bg-[#ffde02] hover:bg-[#ffe540] text-black font-extrabold text-xs uppercase tracking-wider cursor-pointer"
              >
                Save Certificate Template Settings
              </button>
              {certTemplate.templateImageUrl && (
                <button
                  type="button"
                  onClick={() => {
                    const reset = { ...certTemplate, templateImageUrl: "" };
                    setCertTemplate(reset);
                    void saveCertificateTemplateToDb(reset);
                  }}
                  className="px-3 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-[#9aa4b5] hover:text-white cursor-pointer"
                >
                  Reset Image
                </button>
              )}
            </div>
          </div>

          {/* Right 7 Cols: Live Certificate Canvas Preview */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between text-xs text-[#9aa4b5]">
              <span>Live Student Certificate Preview ({certSampleStudentName})</span>
              <span className="font-mono text-[#ffde02]">1600 × 1130 High-Res PNG</span>
            </div>
            <div className="rounded-2xl overflow-hidden border border-white/15 bg-[#090b10] shadow-2xl">
              {certPreviewDataUrl ? (
                <img
                  src={certPreviewDataUrl}
                  alt="Certificate Template Preview"
                  className="w-full h-auto block"
                />
              ) : (
                <div className="p-12 text-center text-xs text-[#8c95a6]">
                  Generating certificate preview...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Issued Course Completion Certificates Table */}
        <div className="pt-5 border-t border-white/10">
          <h3 className="text-base font-bold text-white mb-3">
            Issued Student Certificates ({certificates.length})
          </h3>
          {certificates.length === 0 ? (
            <p className="text-xs text-[#8c95a6] py-4">
              When students complete 100% of any course track, their verifiable certificate appears here.
            </p>
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Certificate Code</th>
                    <th>Student</th>
                    <th>Course Track</th>
                    <th>Quiz Average</th>
                    <th>Issued Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {certificates.map((c) => (
                    <tr key={c.id}>
                      <td className="font-mono text-xs font-bold text-[#ffde02]">
                        {c.certificateCode}
                      </td>
                      <td>
                        <b>{c.studentName}</b>
                        <small className="block text-xs text-[#8c95a6]">{c.studentEmail}</small>
                      </td>
                      <td>{c.courseTitle}</td>
                      <td className="font-mono tabular-nums">{c.quizAverage}%</td>
                      <td className="text-xs text-[#9aa4b5]">
                        {new Date(c.issuedAt).toLocaleDateString()}
                      </td>
                      <td className="text-xs font-mono text-emerald-400">VERIFIED</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 2. ADMIN LIVE BROADCAST STUDIO, SCREEN SHARE & RTMP SCHEDULER (/admin/sessions)
// ============================================================================

export function AdminLiveStudioPage() {
  const [sessions, setSessions] = useState<LiveSessionItem[]>(getCachedLiveSessions());
  const [activeSessionId, setActiveSessionId] = useState<string>(
    getCachedLiveSessions()[0]?.id || ""
  );

  // Schedule / Edit Form
  const [title, setTitle] = useState("New York Session: Live Market Breakdown & Execution");
  const [description, setDescription] = useState(
    "Live institutional chart analysis and execution on EUR/USD, GBP/USD, and XAU/USD."
  );
  const [scheduledDateInput, setScheduledDateInput] = useState(() => {
    const dt = new Date(Date.now() + 2 * 3600 * 1000);
    return new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });
  const [durationMinutes, setDurationMinutes] = useState(90);
  const [focusPair, setFocusPair] = useState("EUR/USD · XAU/USD · GBP/USD");
  const [streamMode, setStreamMode] = useState<"screen_share" | "rtmp_hls" | "embed">(
    "screen_share"
  );
  const [rtmpIngestUrl, setRtmpIngestUrl] = useState("rtmp://live.candlesticks.academy/live");
  const [rtmpStreamKey, setRtmpStreamKey] = useState("csa_live_ny_qgcrue4rqj");
  const [streamPlaybackUrl, setStreamPlaybackUrl] = useState("");
  const [copiedKey, setCopiedKey] = useState(false);
  const [studioFeedback, setStudioFeedback] = useState<string | null>(null);

  // Browser WebRTC / Screen Share Broadcast state
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const frameIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Live Chat Moderation State
  const [chatMessages, setChatMessages] = useState<LiveChatMessageItem[]>([]);
  const [hostChatInput, setHostChatInput] = useState("");

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0] || null;

  useEffect(() => {
    void fetchLiveSessionsFromDb().then((data) => {
      setSessions(data);
      const found = data.find((s) => s.id === activeSessionId) || data[0];
      if (found) {
        setActiveSessionId(found.id);
        populateForm(found);
      }
    });
  }, []);

  useEffect(() => {
    if (activeSession) {
      populateForm(activeSession);
      void fetchSessionChatMessagesFromDb(activeSession.id).then(setChatMessages);
    }
  }, [activeSessionId]);

  useEffect(() => {
    const syncChat = () => {
      if (activeSession) {
        void fetchSessionChatMessagesFromDb(activeSession.id).then(setChatMessages);
      }
    };
    window.addEventListener("candlesticks_portal_data_updated", syncChat);
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("candlesticks_live_stream");
      bc.onmessage = (ev) => {
        if (ev.data?.type === "CHAT_MESSAGE") {
          syncChat();
        }
      };
    } catch {
      // ignore
    }
    return () => {
      window.removeEventListener("candlesticks_portal_data_updated", syncChat);
      bc?.close();
    };
  }, [activeSessionId, activeSession]);

  function populateForm(s: LiveSessionItem) {
    setTitle(s.title);
    setDescription(s.description);
    const dt = new Date(s.scheduledAt);
    const localIso = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setScheduledDateInput(localIso);
    setDurationMinutes(s.durationMinutes);
    setFocusPair(s.focusPair);
    setStreamMode(s.streamMode);
    setRtmpIngestUrl(s.rtmpIngestUrl);
    setRtmpStreamKey(s.rtmpStreamKey);
    setStreamPlaybackUrl(s.streamPlaybackUrl);
  }

  async function handleSaveSession(e: FormEvent) {
    e.preventDefault();
    const slug = activeSession?.id || `session-${Date.now().toString().slice(-5)}`;
    const parsedTime = scheduledDateInput
      ? new Date(scheduledDateInput).toISOString()
      : new Date(Date.now() + 2 * 3600 * 1000).toISOString();

    const updated: LiveSessionItem = {
      id: slug,
      slug,
      title: title.trim() || "Live Trading Session",
      description: description.trim() || "Live market breakdown and execution.",
      scheduledAt: parsedTime,
      durationMinutes: Number(durationMinutes || 90),
      status: activeSession?.status || "scheduled",
      streamMode,
      rtmpIngestUrl: rtmpIngestUrl.trim(),
      rtmpStreamKey: rtmpStreamKey.trim(),
      streamPlaybackUrl: streamPlaybackUrl.trim(),
      screenShareSnapshot: activeSession?.screenShareSnapshot || "",
      focusPair: focusPair.trim() || "EUR/USD · XAU/USD",
      viewersCount: activeSession?.viewersCount || 1,
      pinnedResources: activeSession?.pinnedResources || [],
    };

    await saveLiveSessionInDb(updated);
    const nextList = await fetchLiveSessionsFromDb();
    setSessions(nextList);
    setActiveSessionId(updated.id);
    setStudioFeedback(
      `Session "${updated.title}" scheduled & synced to all student dashboards!`
    );
    setTimeout(() => setStudioFeedback(null), 4000);
  }

  async function handleScheduleNewSession() {
    const slug = `session-${Date.now().toString().slice(-5)}`;
    const future = new Date(Date.now() + 3 * 3600 * 1000).toISOString();
    const created: LiveSessionItem = {
      id: slug,
      slug,
      title: "New York Open Live Execution Room",
      description: "Real-time chart breakdown, liquidity mapping, and live trade execution.",
      scheduledAt: future,
      durationMinutes: 90,
      status: "scheduled",
      streamMode: "screen_share",
      rtmpIngestUrl: "rtmp://live.candlesticks.academy/live",
      rtmpStreamKey: `csa_${slug}_qgcrue4rqj`,
      streamPlaybackUrl: "",
      focusPair: "EUR/USD · XAU/USD",
      viewersCount: 1,
      pinnedResources: [],
    };
    await saveLiveSessionInDb(created);
    const nextList = await fetchLiveSessionsFromDb();
    setSessions(nextList);
    setActiveSessionId(created.id);
    populateForm(created);
  }

  async function handleStartScreenShare() {
    let targetSession = activeSession;
    if (!targetSession) {
      const slug = `live-${Date.now().toString().slice(-5)}`;
      targetSession = {
        id: slug,
        slug,
        title: title.trim() || "Live Market Broadcast",
        description: description.trim() || "Live trading session with Pastor Mike.",
        scheduledAt: new Date().toISOString(),
        durationMinutes: Number(durationMinutes || 90),
        status: "live",
        streamMode: "screen_share",
        rtmpIngestUrl,
        rtmpStreamKey,
        streamPlaybackUrl,
        focusPair,
        viewersCount: 1,
        pinnedResources: [],
      };
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 15 },
        audio: true,
      });
      mediaStreamRef.current = stream;
      setIsSharingScreen(true);

      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        void videoPreviewRef.current.play();
      }

      const liveSession: LiveSessionItem = {
        ...targetSession,
        status: "live",
        streamMode: "screen_share",
      };
      await saveLiveSessionInDb(liveSession);
      setSessions(getCachedLiveSessions());
      setActiveSessionId(liveSession.id);
      setStudioFeedback("You are LIVE! Your screen is now broadcasting to students in the Live Room.");

      const canvas = document.createElement("canvas");
      canvas.width = 960;
      canvas.height = 540;
      const ctx = canvas.getContext("2d");

      frameIntervalRef.current = setInterval(async () => {
        if (videoPreviewRef.current && ctx && !videoPreviewRef.current.paused) {
          ctx.drawImage(videoPreviewRef.current, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.65);
          try {
            const bc = new BroadcastChannel("candlesticks_live_stream");
            bc.postMessage({
              type: "SCREEN_FRAME",
              sessionId: liveSession.id,
              frame: dataUrl,
            });
            bc.close();
          } catch {
            // ignore
          }
          await saveLiveSessionInDb({
            ...liveSession,
            status: "live",
            screenShareSnapshot: dataUrl,
          });
        }
      }, 1800);

      stream.getVideoTracks()[0].onended = () => {
        void handleStopLiveBroadcast();
      };
    } catch {
      setStudioFeedback(
        "Screen share permission was cancelled or blocked by browser. You can also toggle status to LIVE using RTMP or stream URL."
      );
    }
  }

  async function handleToggleLiveStatus(nextStatus: "scheduled" | "live" | "ended") {
    if (!activeSession) return;
    const updated: LiveSessionItem = {
      ...activeSession,
      status: nextStatus,
      screenShareSnapshot: nextStatus === "live" ? activeSession.screenShareSnapshot : "",
    };
    await saveLiveSessionInDb(updated);
    setSessions(getCachedLiveSessions());
    setStudioFeedback(
      nextStatus === "live"
        ? `Session "${updated.title}" is now LIVE on all student dashboards!`
        : `Session status updated to ${nextStatus.toUpperCase()}.`
    );
  }

  async function handleStopLiveBroadcast() {
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    setIsSharingScreen(false);
    if (activeSession) {
      await handleToggleLiveStatus("ended");
    }
  }

  async function handleSendHostMessage(e: FormEvent) {
    e.preventDefault();
    if (!hostChatInput.trim() || !activeSession) return;
    await sendSessionChatMessageInDb({
      sessionId: activeSession.id,
      senderEmail: "mike.vinci77@gmail.com",
      senderName: "Pastor Mike (Host)",
      senderAvatar: "/ceo.png",
      isHost: true,
      message: hostChatInput,
    });
    setHostChatInput("");
    const updated = await fetchSessionChatMessagesFromDb(activeSession.id);
    setChatMessages(updated);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#ffde02]">
            LIVE BROADCAST &amp; RTMP STUDIO
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">
            Live Trading Studio, Screen Share &amp; Chat
          </h1>
          <p className="text-xs sm:text-sm text-[#9aa4b5] mt-1">
            Schedule live sessions with real-time countdowns, share your screen directly from the browser or stream via RTMP, and moderate student chat.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => void handleScheduleNewSession()}
            className="px-4 py-2.5 rounded-xl bg-[#ffde02] hover:bg-[#ffe540] text-black font-extrabold text-xs uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} /> Schedule New Session
          </button>
          {activeSession && (
            <Link
              to={`/sessions/live/${activeSession.id}`}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition"
            >
              Open Student Live Room ↗
            </Link>
          )}
        </div>
      </div>

      {/* Session Selector Tabs */}
      {sessions.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {sessions.map((s) => (
            <div
              key={s.id}
              onClick={() => setActiveSessionId(s.id)}
              className={`px-4 py-3 rounded-xl border cursor-pointer transition flex items-center gap-3 ${
                s.id === activeSessionId
                  ? "bg-[#171c26] border-[#ffde02] text-white"
                  : "bg-[#12151d] border-white/10 text-[#9aa4b5] hover:text-white"
              }`}
            >
              <Radio
                size={15}
                className={s.status === "live" ? "text-red-400 animate-pulse" : "text-[#ffde02]"}
              />
              <div>
                <div className="text-xs font-bold text-white">{s.title}</div>
                <div className="text-[10px] font-mono text-[#8c95a6]">
                  {s.status.toUpperCase()} · {new Date(s.scheduledAt).toLocaleString()}
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  void deleteLiveSessionFromDb(s.id).then(() => {
                    const rem = getCachedLiveSessions();
                    setSessions(rem);
                    setActiveSessionId(rem[0]?.id || "");
                  });
                }}
                className="text-[#7d8799] hover:text-red-400 p-1"
                title="Delete session"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {studioFeedback && (
        <div className="p-4 rounded-xl bg-[#ffde02]/10 border border-[#ffde02]/30 text-xs text-[#ffde02] flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{studioFeedback}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Columns: Broadcast Monitor + Session Settings + RTMP Config */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#12151d] border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#ffde02]">
                  LIVE BROADCAST MONITOR · STATUS: {(activeSession?.status || "READY").toUpperCase()}
                </span>
                <h2 className="text-lg font-bold text-white mt-0.5">
                  Screen Share &amp; RTMP Stream Deck
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {!isSharingScreen ? (
                  <button
                    type="button"
                    onClick={() => void handleStartScreenShare()}
                    className="px-4 py-2 rounded-xl bg-[#ffde02] hover:bg-[#ffe540] text-black font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                  >
                    <MonitorUp size={15} /> Share Screen &amp; Go Live
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void handleStopLiveBroadcast()}
                    className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                  >
                    <Square size={14} /> Stop Screen Share
                  </button>
                )}

                {activeSession && activeSession.status !== "live" && (
                  <button
                    type="button"
                    onClick={() => void handleToggleLiveStatus("live")}
                    className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold cursor-pointer"
                  >
                    Set Status: LIVE NOW
                  </button>
                )}
                {activeSession && activeSession.status === "live" && (
                  <button
                    type="button"
                    onClick={() => void handleToggleLiveStatus("scheduled")}
                    className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold cursor-pointer"
                  >
                    End / Reset to Countdown
                  </button>
                )}
              </div>
            </div>

            <div className="relative w-full aspect-video rounded-xl bg-[#090b10] border border-white/10 overflow-hidden flex items-center justify-center">
              <video
                ref={videoPreviewRef}
                muted
                playsInline
                className={`w-full h-full object-contain ${isSharingScreen ? "block" : "hidden"}`}
              />
              {!isSharingScreen && (
                <div className="text-center p-6 space-y-2">
                  <MonitorUp size={36} className="mx-auto text-[#ffde02]" />
                  <p className="text-sm font-bold text-white">
                    Click &ldquo;Share Screen &amp; Go Live&rdquo; to broadcast your trading terminal
                  </p>
                  <p className="text-xs text-[#8c95a6] max-w-md mx-auto">
                    Your browser screen (MT4/MT5/TradingView) will stream directly to all students inside the Live Room, or use the RTMP Server credentials below in OBS Studio.
                  </p>
                </div>
              )}
            </div>
          </div>

          <form
            onSubmit={handleSaveSession}
            className="bg-[#12151d] border border-white/10 rounded-2xl p-6 space-y-4"
          >
            <h3 className="text-base font-bold text-white border-b border-white/10 pb-3">
              {activeSession ? "Edit Scheduled Live Session" : "Schedule a New Live Session"}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9aa4b5] mb-1.5">
                  Session Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#181c26] border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-[#ffde02]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9aa4b5] mb-1.5">
                  Scheduled Start Time (Real-Time Countdown Target) *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={scheduledDateInput}
                  onChange={(e) => setScheduledDateInput(e.target.value)}
                  className="w-full bg-[#181c26] border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs font-mono focus:outline-none focus:border-[#ffde02]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9aa4b5] mb-1.5">
                  Focus Currency Pairs
                </label>
                <input
                  type="text"
                  value={focusPair}
                  onChange={(e) => setFocusPair(e.target.value)}
                  className="w-full bg-[#181c26] border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs font-mono focus:outline-none focus:border-[#ffde02]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9aa4b5] mb-1.5">
                  Duration (Minutes)
                </label>
                <input
                  type="number"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full bg-[#181c26] border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs font-mono focus:outline-none focus:border-[#ffde02]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9aa4b5] mb-1.5">
                Session Description &amp; Trading Plan
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-[#181c26] border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-[#ffde02]"
              />
            </div>

            <div className="p-4 rounded-xl bg-[#161a24] border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase text-[#ffde02]">
                  RTMP Server &amp; HLS Stream Configuration (OBS / External Stream)
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-[#9aa4b5] mb-1">
                    RTMP Ingest Server URL
                  </label>
                  <input
                    type="text"
                    value={rtmpIngestUrl}
                    onChange={(e) => setRtmpIngestUrl(e.target.value)}
                    className="w-full bg-[#0e1118] border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-[#9aa4b5] mb-1">
                    RTMP Stream Key
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={rtmpStreamKey}
                      onChange={(e) => setRtmpStreamKey(e.target.value)}
                      className="w-full bg-[#0e1118] border border-white/10 rounded-lg px-3 py-2 text-[#ffde02] text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(rtmpStreamKey);
                        setCopiedKey(true);
                        setTimeout(() => setCopiedKey(false), 2000);
                      }}
                      className="px-3 py-2 rounded-lg bg-white/10 text-white text-xs font-bold cursor-pointer shrink-0"
                    >
                      {copiedKey ? <Check size={13} /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-[#9aa4b5] mb-1">
                  Live Stream Playback URL (Optional HLS .m3u8, YouTube Live, or Vimeo Embed URL)
                </label>
                <input
                  type="text"
                  value={streamPlaybackUrl}
                  onChange={(e) => setStreamPlaybackUrl(e.target.value)}
                  placeholder="Leave blank when using Browser Screen Share above, or paste HLS/Embed URL"
                  className="w-full bg-[#0e1118] border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-5 rounded-xl bg-[#ffde02] hover:bg-[#ffe540] text-black font-extrabold text-xs uppercase tracking-wider transition cursor-pointer"
            >
              {activeSession
                ? "Save Session & Update Student Countdown Clock"
                : "Schedule Live Session & Publish to Student Dashboards"}
            </button>
          </form>
        </div>

        {/* Right 5 Columns: Live Chat & Moderation Console */}
        <div className="lg:col-span-5 bg-[#12151d] border border-white/10 rounded-2xl p-6 flex flex-col h-[680px]">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#ffde02]">
                REAL-TIME ROOM CHAT
              </span>
              <h3 className="text-base font-bold text-white">
                Live Session Chat &amp; Moderation ({chatMessages.length})
              </h3>
            </div>
            <button
              type="button"
              onClick={() =>
                activeSession && void fetchSessionChatMessagesFromDb(activeSession.id).then(setChatMessages)
              }
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#9aa4b5] hover:text-white cursor-pointer"
              title="Refresh chat"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {chatMessages.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#8c95a6]">
                No chat messages yet for this session. Send a welcome message below!
              </div>
            ) : (
              chatMessages.map((m) => (
                <div
                  key={m.id}
                  className={`p-3 rounded-xl border text-xs ${
                    m.isHost
                      ? "bg-[#ffde02]/10 border-[#ffde02]/40"
                      : m.isPinned
                      ? "bg-white/10 border-[#ffde02]/30"
                      : "bg-[#171b24] border-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {m.senderAvatar ? (
                        <img
                          src={m.senderAvatar}
                          alt={m.senderName}
                          referrerPolicy="no-referrer"
                          className="w-6 h-6 rounded-full object-cover border border-[#ffde02]/40"
                        />
                      ) : (
                        <span className="w-6 h-6 rounded-full bg-white/10 text-[#ffde02] font-bold text-[10px] flex items-center justify-center">
                          {m.senderName.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                      <strong className={m.isHost ? "text-[#ffde02]" : "text-white"}>
                        {m.senderName}
                      </strong>
                      {m.isPinned && (
                        <span className="text-[10px] font-mono text-[#ffde02]">· PINNED</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          activeSession &&
                          void togglePinSessionChatMessageInDb(activeSession.id, m.id).then(() =>
                            fetchSessionChatMessagesFromDb(activeSession.id).then(setChatMessages)
                          )
                        }
                        className="text-[#8c95a6] hover:text-[#ffde02] p-1 cursor-pointer"
                        title="Pin / Unpin message"
                      >
                        <Pin size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          activeSession &&
                          void deleteSessionChatMessageInDb(activeSession.id, m.id).then(() =>
                            fetchSessionChatMessagesFromDb(activeSession.id).then(setChatMessages)
                          )
                        }
                        className="text-[#8c95a6] hover:text-red-400 p-1 cursor-pointer"
                        title="Delete message"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  <p className="text-[#d6dde8] mt-1.5 leading-relaxed">{m.message}</p>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSendHostMessage} className="mt-4 pt-3 border-t border-white/10 flex gap-2">
            <input
              type="text"
              value={hostChatInput}
              onChange={(e) => setHostChatInput(e.target.value)}
              placeholder="Broadcast message to live room as Pastor Mike..."
              className="flex-1 bg-[#181c26] border border-white/15 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-[#ffde02]"
            />
            <button
              type="submit"
              disabled={!activeSession}
              className="px-4 py-2.5 rounded-xl bg-[#ffde02] text-black font-extrabold text-xs uppercase tracking-wider cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send size={13} /> Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 3. ADMIN MENTOR Q&A & SUPPORT INBOX (/admin/messages)
// ============================================================================

export function AdminMentorInboxPage() {
  const [messages, setMessages] = useState<MentorMessageItem[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  async function loadMessages() {
    const list = await fetchMentorMessagesFromDb();
    setMessages(list);
    if (!selectedEmail && list.length > 0) {
      setSelectedEmail(list[0].studentEmail);
    }
  }

  useEffect(() => {
    void loadMessages();
    const sync = () => void loadMessages();
    window.addEventListener("candlesticks_portal_data_updated", sync);
    return () => window.removeEventListener("candlesticks_portal_data_updated", sync);
  }, []);

  const studentThreads = Array.from(
    messages.reduce((map, msg) => {
      const existing = map.get(msg.studentEmail) || [];
      existing.push(msg);
      map.set(msg.studentEmail, existing);
      return map;
    }, new Map<string, MentorMessageItem[]>())
  );

  const activeThread = selectedEmail
    ? messages.filter((m) => m.studentEmail === selectedEmail)
    : [];
  const activeStudentInfo = activeThread[0];

  async function handleSendReply(e: FormEvent) {
    e.preventDefault();
    if (!replyText.trim() || !selectedEmail) return;
    setSending(true);
    await sendMentorMessageInDb({
      studentEmail: selectedEmail,
      studentName: activeStudentInfo?.studentName || selectedEmail,
      studentAvatar: "/ceo.png",
      senderRole: "admin",
      subject: activeStudentInfo?.subject || "Mentor Reply",
      message: replyText,
    });
    setSending(false);
    setReplyText("");
    await loadMessages();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-5">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#ffde02]">
            DIRECT MENTORSHIP INBOX
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">
            Student Mentor Q&amp;A &amp; Support Threads
          </h1>
          <p className="text-xs sm:text-sm text-[#9aa4b5] mt-1">
            View questions sent by students from their Settings &amp; Dashboard and reply directly to their portal.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadMessages()}
          className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw size={14} /> Refresh Inbox
        </button>
      </div>

      {studentThreads.length === 0 ? (
        <div className="bg-[#12151d] border border-white/10 rounded-2xl p-12 text-center space-y-2">
          <MessageSquare size={32} className="mx-auto text-[#ffde02]" />
          <h3 className="text-base font-bold text-white">No student questions yet</h3>
          <p className="text-xs text-[#8c95a6]">
            When students send a mentorship question from their portal, their conversation thread and profile photo appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 bg-[#12151d] border border-white/10 rounded-2xl p-4 space-y-2">
            <span className="text-[11px] font-mono uppercase text-[#9aa4b5] px-2">
              Student Conversations ({studentThreads.length})
            </span>
            {studentThreads.map(([email, thread]) => {
              const last = thread[thread.length - 1];
              const studentMsg = thread.find((m) => m.senderRole === "student") || last;
              return (
                <button
                  key={email}
                  type="button"
                  onClick={() => setSelectedEmail(email)}
                  className={`w-full p-3.5 rounded-xl text-left transition cursor-pointer flex items-center gap-3 border ${
                    selectedEmail === email
                      ? "bg-[#181d28] border-[#ffde02]"
                      : "bg-[#151922] border-white/5 hover:border-white/20"
                  }`}
                >
                  {studentMsg.studentAvatar ? (
                    <img
                      src={studentMsg.studentAvatar}
                      alt={studentMsg.studentName}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover border border-[#ffde02]/40 shrink-0"
                    />
                  ) : (
                    <span className="w-10 h-10 rounded-full bg-[#ffde02]/15 text-[#ffde02] font-bold text-xs flex items-center justify-center shrink-0">
                      {studentMsg.studentName.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-white truncate">
                      {studentMsg.studentName}
                    </div>
                    <div className="text-[11px] text-[#8c95a6] truncate">{email}</div>
                    <div className="text-[11px] text-[#cfd7e4] truncate mt-1">{last.message}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="lg:col-span-8 bg-[#12151d] border border-white/10 rounded-2xl p-6 flex flex-col h-[540px]">
            <div className="border-b border-white/10 pb-3 mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">
                  {activeStudentInfo?.studentName || "Student"}
                </h3>
                <span className="text-xs text-[#8c95a6]">{selectedEmail}</span>
              </div>
              <span className="text-xs font-mono text-[#ffde02]">Direct 1-on-1 Mentorship</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {activeThread.map((m) => (
                <div
                  key={m.id}
                  className={`p-3.5 rounded-xl border text-xs max-w-[85%] ${
                    m.senderRole === "admin"
                      ? "ml-auto bg-[#ffde02]/10 border-[#ffde02]/40 text-white"
                      : "bg-[#171b24] border-white/10 text-[#d6dde8]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 mb-1 text-[10px] font-mono text-[#9aa4b5]">
                    <strong className={m.senderRole === "admin" ? "text-[#ffde02]" : "text-white"}>
                      {m.senderRole === "admin" ? "Pastor Mike (Founder)" : m.studentName}
                    </strong>
                    <span>{new Date(m.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="leading-relaxed">{m.message}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendReply} className="mt-4 pt-3 border-t border-white/10 flex gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a direct reply to this student..."
                className="flex-1 bg-[#181c26] border border-white/15 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-[#ffde02]"
              />
              <button
                type="submit"
                disabled={sending}
                className="px-5 py-2.5 rounded-xl bg-[#ffde02] text-black font-extrabold text-xs uppercase tracking-wider cursor-pointer"
              >
                {sending ? "Sending..." : "Send Reply"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export const AdminLiveSessionsPage = AdminLiveStudioPage;
