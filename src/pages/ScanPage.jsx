import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Camera, Check, Loader2, AlertCircle, ChevronRight,
  RotateCcw, ShieldCheck, FileText, Sparkles, Upload,
  Droplets, Activity, Layers, Zap, Shield, Circle,
  TrendingUp, TrendingDown, Globe, ChevronDown, ImageIcon,
  Sun, ScanFace, Glasses, ClipboardList,
  ArrowRight, ExternalLink, ShoppingBag, Star, Moon,
  Send, MessageCircle, Phone,
} from 'lucide-react'
import { analyzeWithAI, validatePhoto } from '../services/skinAnalysis'

// ── Language strings ──────────────────────────────────────────────────
const PRIMARY_COLOR = 'oklch(0.4 0.15 15)'

const CONSENT_CONTENT = {
  vi: {
    title:       'Trước Khi Bắt Đầu',
    bodyBold1:   'báo cáo da thẩm mỹ cá nhân hóa',
    bodyMid:     ', chúng tôi sẽ cần một số thông tin từ bạn. Hình ảnh của bạn ',
    bodyBold2:   'chỉ được sử dụng để phân tích',
    bodyEnd:     ' và không được lưu trữ.',
    bodyStart:   'Để tạo ',
    needsTitle:  'Chúng tôi sẽ cần:',
    needs: [
      'Ba ảnh chụp khuôn mặt (chính diện, trái, phải)',
      'Một số thông tin về làn da của bạn',
      'AI sẽ phân tích và tạo báo cáo da cá nhân hóa',
    ],
    check1:      'Tôi hiểu rằng đây ',
    check1Bold:  'không phải là chẩn đoán y khoa',
    check1End:   '.',
    check2:      'Tôi đồng ý tiếp tục trải nghiệm ',
    check2Bold:  'đánh giá da thẩm mỹ',
    check2End:   '.',
    cta:         'Tiếp Tục',
    footer1:     'Đánh giá da thẩm mỹ được hỗ trợ bởi AI.',
    footer2:     'Đây không phải là chẩn đoán y khoa.',
    langLabel:   'Tiếng Việt',
  },
  en: {
    title:       'Before We Begin',
    bodyStart:   'To create your ',
    bodyBold1:   'personalized cosmetic skin report',
    bodyMid:     ", we'll need some information from you. Your images are ",
    bodyBold2:   'only used for analysis',
    bodyEnd:     ' and are not stored.',
    needsTitle:  'We will need:',
    needs: [
      'Three face photos (front, left, right)',
      'Some information about your skin',
      'AI will analyze and create a personalized skin report',
    ],
    check1:      'I understand this is ',
    check1Bold:  'not a medical diagnosis',
    check1End:   '.',
    check2:      'I agree to continue with the ',
    check2Bold:  'cosmetic skin assessment',
    check2End:   '.',
    cta:         'Continue',
    footer1:     'AI-powered cosmetic skin assessment.',
    footer2:     'This is not a medical diagnosis.',
    langLabel:   'English',
  },
}

// ── Camera step language strings ─────────────────────────────────────
const CAMERA_CONTENT = {
  vi: {
    titlePrefix: 'Tải Lên Ảnh',
    titleSuffix: '',
    angles: [
      { label: 'Chính diện', titleLabel: 'Chính diện', instruction: 'Nhìn thẳng vào camera',        hint: 'Nhìn thẳng, khuôn mặt ở giữa khung hình', icon: '😐' },
      { label: 'Góc trái',   titleLabel: 'Góc trái',   instruction: 'Nghiêng nhẹ sang trái (~45°)', hint: 'Để lộ má trái — giữ cằm ngang bằng',       icon: '↩️' },
      { label: 'Góc phải',   titleLabel: 'Góc phải',   instruction: 'Nghiêng nhẹ sang phải (~45°)',hint: 'Để lộ má phải — giữ cằm ngang bằng',      icon: '↪️' },
    ],
    subtitleBold: 'phân tích chính xác',
    subtitlePre:  'Để AI có thể ',
    subtitlePost: ', vui lòng tải lên ảnh rõ nét theo từng góc.',
    tips: [
      { icon: Sun,       label: 'Ánh sáng tốt' },
      { icon: ScanFace,  label: 'Khuôn mặt nằm trong khung oval' },
      { icon: Camera,    label: 'Không bị nhòe' },
      { icon: Glasses,   label: 'Không đeo kính hoặc khẩu trang' },
    ],
    tabUpload:       'Tải ảnh lên',
    tabCamera:       'Dùng camera',
    dropTitle:       'Kéo thả ảnh vào đây',
    dropSub:         'hoặc nhấn để chọn file',
    dropHint:        'Hỗ trợ: JPG, PNG (tối đa 10MB)',
    choosePhoto:     'Chọn Ảnh',
    cameraIdle:      'Camera sẽ bắt đầu khi bạn nhấn nút bên dưới',
    startCamera:     'Bật Camera',
    takePhoto:       'Chụp Ảnh',
    cameraLoading:   'Đang khởi động camera…',
    cameraLoadingHint: 'Vui lòng cho phép truy cập camera khi được hỏi',
    tryAgain:        'Thử Lại',
    retake:          'Chụp Lại',
    nextPhoto:       (n) => `Ảnh ${n + 2} →`,
    reviewAll:       'Xem Tất Cả →',
    captured:        'Đã chụp',
    nextLabel:       'Tiếp theo: ',
    reviewTitle:     'Xem Lại Ảnh Của Bạn',
    reviewSub:       (n) => `${n} / 3 ảnh đã tải lên`,
    retakeAll:       'Chụp Lại Tất Cả',
    analyze:         'Bắt Đầu Phân Tích AI',
    photoCount:      (n) => `Ảnh ${n}/3`,
    analyzeCount:    (n) => `${n} / 3 ảnh đã tải lên`,
    validating:      'Đang kiểm tra ảnh…',
    validErr:        'Ảnh không hợp lệ. Vui lòng thử lại.',
    retakePhoto:     'Chọn Lại',
  },
  en: {
    titlePrefix: 'Upload',
    titleSuffix: 'Photo',
    angles: [
      { label: 'Front face', titleLabel: 'Front face', instruction: 'Look straight at camera',   hint: 'Face forward, centered in frame',        icon: '😐' },
      { label: 'Left face',  titleLabel: 'Left face',  instruction: 'Turn slightly left (~45°)', hint: 'Show left cheek — keep chin level',      icon: '↩️' },
      { label: 'Right face', titleLabel: 'Right face', instruction: 'Turn slightly right (~45°)',hint: 'Show right cheek — keep chin level',     icon: '↪️' },
    ],
    subtitleBold: 'accurate AI analysis',
    subtitlePre:  'For ',
    subtitlePost: ', please upload clear photos from each angle.',
    tips: [
      { icon: Sun,       label: 'Good lighting' },
      { icon: ScanFace,  label: 'Face inside oval' },
      { icon: Camera,    label: 'No blur' },
      { icon: Glasses,   label: 'No glasses or mask' },
    ],
    tabUpload:       'Upload photo',
    tabCamera:       'Use camera',
    dropTitle:       'Drag & drop image here',
    dropSub:         'or click to browse',
    dropHint:        'Supported: JPG, PNG (max 10MB)',
    choosePhoto:     'Choose Photo',
    cameraIdle:      'Camera will start when you click the button below',
    startCamera:     'Start Camera',
    takePhoto:       'Take Photo',
    cameraLoading:   'Starting camera…',
    cameraLoadingHint: 'Please allow camera access when prompted',
    tryAgain:        'Try Again',
    retake:          'Retake',
    nextPhoto:       (n) => `Photo ${n + 2} →`,
    reviewAll:       'Review all →',
    captured:        'Captured',
    nextLabel:       'Next: ',
    reviewTitle:     'Review Your Photos',
    reviewSub:       (n) => `${n} / 3 photos uploaded`,
    retakeAll:       'Retake All',
    analyze:         'Start AI Analysis',
    photoCount:      (n) => `Photo ${n}/3`,
    analyzeCount:    (n) => `${n} / 3 photos uploaded`,
    validating:      'Checking photo…',
    validErr:        'Photo not valid. Please try again.',
    retakePhoto:     'Choose Again',
  },
}

// ── Shared language dropdown ──────────────────────────────────────────
function LangDropdown({ lang, setLang }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleOut(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleOut)
    return () => document.removeEventListener('mousedown', handleOut)
  }, [])

  const label = lang === 'vi' ? 'Tiếng Việt' : 'English'

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.35rem',
          padding: '0.3rem 0.75rem',
          border: `1.5px solid ${PRIMARY_COLOR}`,
          borderRadius: '999px',
          background: open ? PRIMARY_COLOR : 'transparent',
          color: open ? 'white' : PRIMARY_COLOR,
          fontSize: '0.8125rem', fontWeight: 600,
          cursor: 'pointer', transition: 'all 0.2s',
          fontFamily: 'inherit',
        }}
        onMouseEnter={e => { if (!open) { e.currentTarget.style.background = PRIMARY_COLOR; e.currentTarget.style.color = 'white' } }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = PRIMARY_COLOR } }}
      >
        <Globe style={{ width: '0.8rem', height: '0.8rem', flexShrink: 0 }} />
        {label}
        <ChevronDown style={{ width: '0.7rem', height: '0.7rem', flexShrink: 0, transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute', top: 'calc(100% + 0.5rem)', right: 0,
              minWidth: '9rem', background: 'white',
              border: '1px solid oklch(0.92 0.005 90)',
              borderRadius: '0.75rem',
              boxShadow: '0 8px 24px oklch(0 0 0 / 0.10)',
              overflow: 'hidden', zIndex: 100,
            }}
          >
            {[{ key: 'vi', label: 'Tiếng Việt' }, { key: 'en', label: 'English' }].map(opt => (
              <button
                key={opt.key}
                onClick={() => { setLang(opt.key); setOpen(false) }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '0.6rem 1rem', border: 'none',
                  background: lang === opt.key ? 'oklch(0.96 0.005 90)' : 'transparent',
                  color: lang === opt.key ? PRIMARY_COLOR : 'oklch(0.2 0.02 250)',
                  fontSize: '0.8125rem', fontWeight: lang === opt.key ? 600 : 400,
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s',
                }}
                onMouseEnter={e => { if (lang !== opt.key) e.currentTarget.style.background = 'oklch(0.97 0.003 90)' }}
                onMouseLeave={e => { if (lang !== opt.key) e.currentTarget.style.background = 'transparent' }}
              >
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────
const cn = (...c) => c.filter(Boolean).join(' ')

const fade = {
  initial:    { opacity: 0 },
  animate:    { opacity: 1 },
  exit:       { opacity: 0 },
  transition: { duration: 0.35 },
}

const slideUp = {
  initial:    { opacity: 0, y: 20 },
  animate:    { opacity: 1, y: 0 },
  transition: { delay: 0.15, duration: 0.4, ease: 'easeOut' },
}

// ── Shared constants ──────────────────────────────────────────────────
const ANGLES = [
  { label: 'Chính diện', icon: '😐', instruction: 'Nhìn thẳng vào camera',         hint: 'Nhìn thẳng, khuôn mặt ở giữa khung hình' },
  { label: 'Bên trái',   icon: '↩️', instruction: 'Nghiêng nhẹ sang trái (~45°)',  hint: 'Để lộ má trái — giữ cằm ngang bằng' },
  { label: 'Bên phải',   icon: '↪️', instruction: 'Nghiêng nhẹ sang phải (~45°)', hint: 'Để lộ má phải — giữ cằm ngang bằng' },
]

// ── Page header ───────────────────────────────────────────────────────
function PageHeader({ lang, setLang }) {
  const navigate = useNavigate()
  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 50, width: '100%', borderBottom: '1px solid oklch(0.92 0.005 90 / 0.4)', background: 'oklch(0.99 0.002 90 / 0.95)', backdropFilter: 'blur(12px)' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 3rem', height: '4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => navigate('/')} className="focus:outline-none">
          <img src="/images/eucerin-logo.png" alt="Eucerin" className="h-8 w-auto object-contain" />
        </button>
        <LangDropdown lang={lang} setLang={setLang} />
      </div>
    </header>
  )
}

// ── Btn ───────────────────────────────────────────────────────────────
function Btn({ onClick, variant = 'primary', children, disabled, className, type = 'button' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold',
        'px-6 py-3 tracking-wide transition-all duration-200 cursor-pointer select-none',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variant === 'primary' && 'bg-primary text-white hover:bg-primary/90 active:scale-[0.98] shadow-sm',
        variant === 'outline' && 'border border-primary text-primary hover:bg-primary/5 active:scale-[0.98]',
        variant === 'ghost'   && 'text-muted-foreground hover:text-foreground hover:bg-muted',
        className,
      )}
    >
      {children}
    </button>
  )
}

/* ═══════════════════════════════════════════════
   STEP 0 — Consent
═══════════════════════════════════════════════ */
function ConsentStep({ onContinue, lang }) {
  const [agreed1, setAgreed1] = useState(false)
  const [agreed2, setAgreed2] = useState(false)
  const canContinue = agreed1 && agreed2
  const t = CONSENT_CONTENT[lang] || CONSENT_CONTENT.vi

  const NEEDS_ICONS = [Camera, FileText, Sparkles]

  const Checkbox = ({ checked, onToggle, children }) => (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
      <button
        type="button"
        onClick={onToggle}
        style={{
          flexShrink: 0, marginTop: '0.15rem',
          width: '1.2rem', height: '1.2rem',
          borderRadius: '4px',
          border: `2px solid ${checked ? PRIMARY_COLOR : 'oklch(0.82 0.005 90)'}`,
          background: checked ? PRIMARY_COLOR : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'all 0.15s',
        }}
      >
        {checked && <Check style={{ width: '0.7rem', height: '0.7rem', color: 'white', strokeWidth: 3 }} />}
      </button>
      <span style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'oklch(0.2 0.02 250)' }}>{children}</span>
    </label>
  )

  return (
    <motion.div {...fade} style={{ minHeight: 'calc(100vh - 4rem)', background: 'oklch(0.97 0.003 90)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 4rem)', padding: '3rem 1rem' }}>

        <motion.div {...slideUp} style={{ width: '100%', maxWidth: '520px' }}>
          <div style={{ background: 'white', borderRadius: '1.25rem', boxShadow: '0 8px 40px oklch(0 0 0 / 0.09)', overflow: 'hidden' }}>

            {/* Title with shield icon */}
            <div style={{ padding: '2rem 2rem 1.25rem', textAlign: 'center' }}>
              <div style={{
                width: '3.5rem', height: '3.5rem', borderRadius: '50%',
                background: 'oklch(0.78 0.06 15 / 0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1rem',
              }}>
                <ShieldCheck style={{ width: '1.75rem', height: '1.75rem', color: PRIMARY_COLOR }} />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'oklch(0.15 0.02 250)', margin: 0 }}>
                {t.title}
              </h2>
            </div>

            <div style={{ padding: '0 2rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Body */}
              <p style={{ fontSize: '0.9375rem', lineHeight: 1.7, color: 'oklch(0.45 0.02 250)', textAlign: 'center', margin: 0 }}>
                {t.bodyStart}{t.bodyBold1}{t.bodyMid}{t.bodyBold2}{t.bodyEnd}
              </p>

              {/* What we need */}
              <div style={{ background: 'oklch(0.97 0.003 90)', borderRadius: '0.875rem', padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'oklch(0.2 0.02 250)', margin: 0 }}>{t.needsTitle}</p>
                {t.needs.map((text, i) => {
                  const Icon = NEEDS_ICONS[i]
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '2.25rem', height: '2.25rem', flexShrink: 0,
                        borderRadius: '50%', background: 'oklch(0.4 0.15 15 / 0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Icon style={{ width: '1rem', height: '1rem', color: PRIMARY_COLOR }} />
                      </div>
                      <span style={{ fontSize: '0.875rem', color: 'oklch(0.25 0.02 250)' }}>{text}</span>
                    </div>
                  )
                })}
              </div>

              {/* Consent checkboxes */}
              <div style={{ border: '1px solid oklch(0.92 0.005 90)', borderRadius: '0.875rem', padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <Checkbox checked={agreed1} onToggle={() => setAgreed1(v => !v)}>
                  {t.check1}<strong style={{ color: 'oklch(0.15 0.02 250)' }}>{t.check1Bold}</strong>{t.check1End}
                </Checkbox>
                <Checkbox checked={agreed2} onToggle={() => setAgreed2(v => !v)}>
                  {t.check2}<strong style={{ color: 'oklch(0.15 0.02 250)' }}>{t.check2Bold}</strong>{t.check2End}
                </Checkbox>
              </div>

              {/* CTA */}
              <button
                onClick={canContinue ? onContinue : undefined}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  background: canContinue ? PRIMARY_COLOR : 'oklch(0.75 0.04 15)',
                  color: 'white', fontWeight: 600, fontSize: '1rem',
                  padding: '0.875rem', borderRadius: '0.625rem', border: 'none',
                  cursor: canContinue ? 'pointer' : 'not-allowed',
                  transition: 'background 0.2s', fontFamily: 'inherit',
                }}
              >
                {t.cta}
                <ChevronRight style={{ width: '1rem', height: '1rem' }} />
              </button>

              {/* Footer */}
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '0.75rem', color: 'oklch(0.55 0.02 250)', margin: 0, lineHeight: 1.6 }}>{t.footer1}</p>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'oklch(0.35 0.02 250)', margin: 0 }}>{t.footer2}</p>
              </div>

            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════
   STEP 1 — Upload / Camera (3 angles)
═══════════════════════════════════════════════ */
function CameraStep({ onCapture, lang }) {
  const t = CAMERA_CONTENT[lang] || CAMERA_CONTENT.vi

  const [uploadMode,   setUploadMode]  = useState(true)   // true=upload, false=camera
  const [cameraPhase,  setCameraPhase] = useState('idle') // idle|loading|live|error
  const [captureIdx,   setCaptureIdx]  = useState(0)
  const [photos,       setPhotos]      = useState([null, null, null])
  const [isDragging,   setIsDragging]  = useState(false)
  const [cameraError,  setCameraError] = useState('')
  const [validating,   setValidating]  = useState(false)  // checking current photo with AI
  const [validError,   setValidError]  = useState('')     // error message from validation
  const [pendingPhoto, setPendingPhoto] = useState(null)  // URL being validated (for animation)

  const fileInputRef = useRef(null)
  const videoRef     = useRef(null)
  const canvasRef    = useRef(null)
  const streamRef    = useRef(null)

  const angle   = t.angles[captureIdx]
  const allDone = photos.every(Boolean)

  // ── Camera helpers ──────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(tr => tr.stop())
    streamRef.current = null
    setCameraPhase('idle')
  }, [])

  const startCamera = useCallback(async () => {
    setCameraPhase('loading')
    setCameraError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      streamRef.current = stream
      setCameraPhase('live')
    } catch (err) {
      setCameraError(
        err.name === 'NotAllowedError'
          ? (lang === 'vi' ? 'Camera bị từ chối. Vui lòng cho phép truy cập trong cài đặt trình duyệt.' : 'Camera permission denied. Please allow access in your browser settings.')
          : (lang === 'vi' ? 'Không thể truy cập camera. Vui lòng kiểm tra cài đặt trình duyệt.' : 'Could not access camera. Please check your browser settings.')
      )
      setCameraPhase('error')
    }
  }, [lang])

  useEffect(() => {
    if (cameraPhase === 'live' && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current
      videoRef.current.play().catch(() => {})
    }
  }, [cameraPhase])

  useEffect(() => () => stopCamera(), [stopCamera])

  // ── Shared: validate + save a photo dataUrl ────────────────────────
  const acceptPhoto = useCallback(async (url, idx) => {
    setValidating(true)
    setPendingPhoto(url)
    setValidError('')
    try {
      const result = await validatePhoto(url)
      if (result.valid) {
        setPhotos(prev => { const n = [...prev]; n[idx] = url; return n })
        if (idx < 2) setCaptureIdx(i => i + 1)
      } else {
        setValidError(t.validErr)
      }
    } catch {
      // Network / API failure — fail open so users aren't blocked
      setPhotos(prev => { const n = [...prev]; n[idx] = url; return n })
      if (idx < 2) setCaptureIdx(i => i + 1)
    } finally {
      setValidating(false)
      setPendingPhoto(null)
    }
  }, [t.validErr])

  const captureFromCamera = useCallback(() => {
    const v = videoRef.current; const c = canvasRef.current
    if (!v || !c) return
    c.width = v.videoWidth; c.height = v.videoHeight
    const ctx = c.getContext('2d')
    ctx.translate(c.width, 0); ctx.scale(-1, 1)
    ctx.drawImage(v, 0, 0)
    const url = c.toDataURL('image/jpeg', 0.85)
    stopCamera()
    acceptPhoto(url, captureIdx)
  }, [stopCamera, captureIdx, acceptPhoto])

  // ── Upload helpers ──────────────────────────────────────────────────
  const handleFile = (file) => {
    if (!file || !file.type.match(/^image\//)) return
    const reader = new FileReader()
    reader.onload = (e) => acceptPhoto(e.target.result, captureIdx)
    reader.readAsDataURL(file)
  }

  // ── Navigation ──────────────────────────────────────────────────────
  const retake = (idx) => {
    setPhotos(prev => { const n = [...prev]; n[idx] = null; return n })
    setCaptureIdx(idx)
    setValidError('')
    stopCamera()
  }

  // ── Shared sub-components ───────────────────────────────────────────
  const S = { // shared inline style helpers
    card:    { background: 'white', borderRadius: '1.25rem', boxShadow: '0 8px 40px oklch(0 0 0 / 0.09)', padding: '1.5rem' },
    wrap:    { minHeight: 'calc(100vh - 4rem)', background: 'oklch(0.97 0.003 90)' },
    center:  { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 4rem)', padding: '2rem 1rem' },
    btnPri:  { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: PRIMARY_COLOR, color: 'white', fontWeight: 600, fontSize: '0.9375rem', padding: '0.875rem', borderRadius: '0.625rem', border: 'none', cursor: 'pointer', fontFamily: 'inherit', width: '100%' },
    btnOut:  { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', border: `1.5px solid ${PRIMARY_COLOR}`, borderRadius: '0.625rem', background: 'transparent', color: PRIMARY_COLOR, fontWeight: 600, fontSize: '0.875rem', padding: '0.75rem', cursor: 'pointer', fontFamily: 'inherit', flex: 1 },
  }

  const StepDots = () => (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.625rem', marginBottom: '1.25rem' }}>
      {t.angles.map((a, i) => (
        <div
          key={i}
          onClick={() => { setCaptureIdx(i); setValidError(''); if (photos[i]) stopCamera() }}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem',
            padding: '0.625rem 0.5rem', borderRadius: '0.75rem', flex: 1,
            border: `2px solid ${photos[i] ? '#22c55e' : i === captureIdx ? PRIMARY_COLOR : 'oklch(0.88 0.005 90)'}`,
            background: photos[i] ? '#f0fdf4' : i === captureIdx ? `${PRIMARY_COLOR}12` : 'white',
            cursor: i !== captureIdx ? 'pointer' : 'default',
            transition: 'all 0.2s',
          }}
        >
          {photos[i] ? (
            <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', overflow: 'hidden', border: '2px solid #22c55e' }}>
              <img src={photos[i]} alt={a.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ) : (
            <div style={{
              width: '2.5rem', height: '2.5rem', borderRadius: '50%',
              background: i === captureIdx ? `${PRIMARY_COLOR}20` : 'oklch(0.94 0.003 90)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.875rem', fontWeight: 700,
              color: i === captureIdx ? PRIMARY_COLOR : 'oklch(0.6 0.02 250)',
            }}>
              {i + 1}
            </div>
          )}
          <span style={{ fontSize: '0.6875rem', fontWeight: 500, color: 'oklch(0.4 0.02 250)', whiteSpace: 'nowrap' }}>{a.label}</span>
        </div>
      ))}
    </div>
  )

  const TipsGrid = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.75rem' }}>
      {t.tips.map(tip => {
        const Icon = tip.icon
        return (
          <div key={tip.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'oklch(0.97 0.003 90)', borderRadius: '0.5rem', padding: '0.5rem 0.75rem' }}>
            <Icon style={{ width: '0.9rem', height: '0.9rem', color: 'oklch(0.4 0.01 250)', flexShrink: 0 }} />
            <span style={{ fontSize: '0.75rem', color: 'oklch(0.45 0.02 250)' }}>{tip.label}</span>
          </div>
        )
      })}
    </div>
  )

  // ── Main upload / camera screen ─────────────────────────────────────
  return (
    <motion.div {...fade} style={S.wrap}>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <div style={S.center}>
        <motion.div {...slideUp} style={{ width: '100%', maxWidth: '480px' }}>
          <div style={S.card}>

            {/* Title */}
            <h2 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'oklch(0.15 0.02 250)', margin: '0 0 0.375rem', textAlign: 'center' }}>
              {t.titlePrefix} <span style={{ color: PRIMARY_COLOR }}>{angle.titleLabel}</span>{t.titleSuffix ? ` ${t.titleSuffix}` : ''}
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'oklch(0.5 0.02 250)', margin: '0 0 1.25rem', textAlign: 'center', lineHeight: 1.6 }}>
              {t.subtitlePre}<strong style={{ color: PRIMARY_COLOR }}>{t.subtitleBold}</strong>{t.subtitlePost}
            </p>

            <StepDots />

            {/* Mode tabs */}
            <div style={{ display: 'flex', background: 'oklch(0.96 0.003 90)', borderRadius: '0.625rem', padding: '0.25rem', gap: '0.25rem', marginBottom: '1rem' }}>
              {[{ id: true, label: t.tabUpload }, { id: false, label: t.tabCamera }].map(tab => (
                <button
                  key={String(tab.id)}
                  onClick={() => { setUploadMode(tab.id); if (tab.id) stopCamera() }}
                  style={{
                    flex: 1, padding: '0.5rem', borderRadius: '0.375rem', border: 'none',
                    background: uploadMode === tab.id ? 'white' : 'transparent',
                    color: uploadMode === tab.id ? PRIMARY_COLOR : 'oklch(0.55 0.02 250)',
                    fontSize: '0.8125rem', fontWeight: uploadMode === tab.id ? 600 : 400,
                    cursor: 'pointer', fontFamily: 'inherit',
                    boxShadow: uploadMode === tab.id ? '0 1px 4px oklch(0 0 0 / 0.08)' : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── UPLOAD mode ── */}
            {uploadMode && (
              <>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" style={{ display: 'none' }} onChange={e => { handleFile(e.target.files[0]); e.target.value = '' }} />

                {/* Validating overlay — scan animation over the photo */}
                {validating ? (
                  <div style={{ position: 'relative', borderRadius: '0.875rem', overflow: 'hidden', aspectRatio: '4/3', marginBottom: '0.875rem', background: '#000' }}>
                    {pendingPhoto && <img src={pendingPhoto} alt="checking" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.65 }} />}
                    <div style={{ position: 'absolute', inset: 0, background: `${PRIMARY_COLOR}18` }} />
                    <div className="scan-line" style={{ position: 'absolute', left: 0, right: 0 }} />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0.75rem 1rem', background: 'linear-gradient(transparent, rgba(0,0,0,0.72))', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <Loader2 style={{ width: '0.9rem', height: '0.9rem', color: 'white', flexShrink: 0 }} className="animate-spin" />
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'white' }}>{t.validating}</span>
                    </div>
                  </div>
                ) : validError ? (
                  /* Validation error — show the image dimmed with error overlay */
                  <div style={{ position: 'relative', borderRadius: '0.875rem', overflow: 'hidden', aspectRatio: '4/3', marginBottom: '0.875rem' }}>
                    {/* We don't have a saved photo since it was rejected — just show error card */}
                    <div style={{ width: '100%', height: '100%', minHeight: '12rem', background: '#fef2f2', border: '2px solid #fecaca', borderRadius: '0.875rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1.5rem', textAlign: 'center' }}>
                      <AlertCircle style={{ width: '2rem', height: '2rem', color: '#ef4444' }} />
                      <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#b91c1c', margin: 0 }}>{t.validErr}</p>
                    </div>
                  </div>
                ) : photos[captureIdx] ? (
                  /* Already have a valid photo for this slot — show thumbnail + retake */
                  <div style={{ position: 'relative', borderRadius: '0.875rem', overflow: 'hidden', aspectRatio: '4/3', marginBottom: '0.875rem' }}>
                    <img src={photos[captureIdx]} alt={angle.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: '#22c55e', color: 'white', fontSize: '0.7rem', fontWeight: 700, padding: '0.25rem 0.625rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Check style={{ width: '0.75rem', height: '0.75rem', strokeWidth: 3 }} />{t.captured}
                    </div>
                    <button onClick={() => retake(captureIdx)} style={{ position: 'absolute', bottom: '0.5rem', right: '0.5rem', background: 'oklch(0 0 0 / 0.6)', color: 'white', fontSize: '0.75rem', fontWeight: 600, padding: '0.3rem 0.75rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <RotateCcw style={{ width: '0.75rem', height: '0.75rem' }} />{t.retake}
                    </button>
                  </div>
                ) : (
                  /* Empty slot — show drop zone */
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={e => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files[0]) }}
                    style={{
                      border: `2px dashed ${isDragging ? PRIMARY_COLOR : 'oklch(0.85 0.005 90)'}`,
                      borderRadius: '0.875rem', padding: '2rem 1rem 3rem',
                      textAlign: 'center', cursor: 'pointer',
                      background: isDragging ? `${PRIMARY_COLOR}08` : 'oklch(0.985 0.001 90)',
                      transition: 'all 0.2s', marginBottom: '0.875rem', position: 'relative',
                    }}
                  >
                    <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', background: 'oklch(0.93 0.003 90)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                      <ImageIcon style={{ width: '1.5rem', height: '1.5rem', color: 'oklch(0.55 0.02 250)' }} />
                    </div>
                    <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'oklch(0.2 0.02 250)', margin: '0 0 0.25rem' }}>{t.dropTitle}</p>
                    <p style={{ fontSize: '0.8125rem', color: 'oklch(0.55 0.02 250)', margin: '0 0 0.375rem' }}>{t.dropSub}</p>
                    <p style={{ fontSize: '0.6875rem', color: 'oklch(0.65 0.02 250)', margin: 0 }}>{t.dropHint}</p>
                    <div style={{ position: 'absolute', bottom: '0.75rem', left: '50%', transform: 'translateX(-50%)', background: 'oklch(0.2 0.02 250)', color: 'white', fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.875rem', borderRadius: '999px', whiteSpace: 'nowrap' }}>
                      {angle.label}
                    </div>
                  </div>
                )}

                <TipsGrid />
                <button
                  disabled={validating}
                  onClick={() => { setValidError(''); fileInputRef.current?.click() }}
                  style={{ ...S.btnPri, marginTop: '0.875rem', opacity: validating ? 0.5 : 1, cursor: validating ? 'not-allowed' : 'pointer' }}
                >
                  <Upload style={{ width: '1rem', height: '1rem' }} />
                  {validError ? t.retakePhoto : t.choosePhoto}
                </button>
              </>
            )}

            {/* ── CAMERA mode ── */}
            {!uploadMode && (
              <>
                {/* Validating overlay — top priority, shown regardless of camera phase */}
                {validating ? (
                  <>
                    <div style={{ position: 'relative', borderRadius: '0.875rem', overflow: 'hidden', aspectRatio: '4/3', marginBottom: '0.875rem', background: '#000' }}>
                      {pendingPhoto && <img src={pendingPhoto} alt="checking" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.65 }} />}
                      <div style={{ position: 'absolute', inset: 0, background: `${PRIMARY_COLOR}18` }} />
                      <div className="scan-line" style={{ position: 'absolute', left: 0, right: 0 }} />
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0.75rem 1rem', background: 'linear-gradient(transparent, rgba(0,0,0,0.72))', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <Loader2 style={{ width: '0.9rem', height: '0.9rem', color: 'white', flexShrink: 0 }} className="animate-spin" />
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'white' }}>{t.validating}</span>
                      </div>
                    </div>
                    <button disabled style={{ ...S.btnPri, opacity: 0.5, cursor: 'not-allowed' }}>
                      <Camera style={{ width: '1rem', height: '1rem' }} />
                      {t.validating}
                    </button>
                  </>
                ) : (
                  <>
                    {/* Idle */}
                    {cameraPhase === 'idle' && !validError && (
                      <>
                        <div style={{ border: '2px dashed oklch(0.85 0.005 90)', borderRadius: '0.875rem', padding: '2rem 1rem', textAlign: 'center', background: 'oklch(0.985 0.001 90)', marginBottom: '0.875rem' }}>
                          <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', background: 'oklch(0.93 0.003 90)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                            <Camera style={{ width: '1.5rem', height: '1.5rem', color: 'oklch(0.55 0.02 250)' }} />
                          </div>
                          <p style={{ fontSize: '0.875rem', color: 'oklch(0.55 0.02 250)', margin: 0 }}>{t.cameraIdle}</p>
                        </div>
                        <TipsGrid />
                        <button onClick={startCamera} style={{ ...S.btnPri, marginTop: '0.875rem' }}>
                          <Camera style={{ width: '1rem', height: '1rem' }} />{t.startCamera}
                        </button>
                      </>
                    )}

                    {/* Loading */}
                    {cameraPhase === 'loading' && (
                      <div style={{ padding: '2.5rem 1rem', textAlign: 'center' }}>
                        <Loader2 style={{ width: '2.5rem', height: '2.5rem', color: PRIMARY_COLOR, margin: '0 auto 0.75rem', display: 'block' }} className="animate-spin" />
                        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'oklch(0.2 0.02 250)', margin: '0 0 0.25rem' }}>{t.cameraLoading}</p>
                        <p style={{ fontSize: '0.75rem', color: 'oklch(0.55 0.02 250)', margin: 0 }}>{t.cameraLoadingHint}</p>
                      </div>
                    )}

                    {/* Camera error */}
                    {cameraPhase === 'error' && (
                      <>
                        <div style={{ display: 'flex', gap: '0.75rem', padding: '0.875rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.75rem', marginBottom: '0.875rem' }}>
                          <AlertCircle style={{ width: '1.25rem', height: '1.25rem', color: '#ef4444', flexShrink: 0, marginTop: '0.1rem' }} />
                          <p style={{ fontSize: '0.875rem', color: '#b91c1c', margin: 0, lineHeight: 1.5 }}>{cameraError}</p>
                        </div>
                        <button onClick={startCamera} style={S.btnPri}>{t.tryAgain}</button>
                      </>
                    )}

                    {/* Validation error */}
                    {validError && (
                      <>
                        <div style={{ width: '100%', minHeight: '12rem', background: '#fef2f2', border: '2px solid #fecaca', borderRadius: '0.875rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1.5rem', textAlign: 'center', marginBottom: '0.875rem' }}>
                          <AlertCircle style={{ width: '2rem', height: '2rem', color: '#ef4444' }} />
                          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#b91c1c', margin: 0 }}>{t.validErr}</p>
                        </div>
                        <button onClick={() => { setValidError(''); startCamera() }} style={S.btnPri}>
                          <Camera style={{ width: '1rem', height: '1rem' }} />{t.retakePhoto}
                        </button>
                      </>
                    )}

                    {/* Live feed — always in DOM so video element is ready */}
                    <div style={{ display: cameraPhase === 'live' ? 'block' : 'none' }}>
                      <div style={{ position: 'relative', borderRadius: '0.875rem', overflow: 'hidden', background: 'black', aspectRatio: '4/3', marginBottom: '0.875rem' }}>
                        <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} muted playsInline />
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                          <div style={{ width: '62%', height: '78%', borderRadius: '50%', border: '2px dashed rgba(255,255,255,0.75)', boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)' }} />
                          <div style={{ position: 'absolute', bottom: '0.75rem', background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: '0.75rem', padding: '0.25rem 0.75rem', borderRadius: '999px' }}>
                            {t.photoCount(captureIdx + 1)} — {angle.label}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => { setValidError(''); captureFromCamera() }}
                        style={S.btnPri}
                      >
                        <Camera style={{ width: '1rem', height: '1rem' }} />
                        {`${t.takePhoto} ${captureIdx + 1}`}
                      </button>
                    </div>
                  </>
                )}
              </>
            )}

          </div>

          {/* Persistent bottom: progress count + analyze button */}
          <div style={{ marginTop: '1.25rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <button
              disabled={!allDone}
              onClick={() => allDone && onCapture(photos)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                background: allDone ? PRIMARY_COLOR : 'oklch(0.78 0.04 15 / 0.45)',
                color: 'white', fontWeight: 600, fontSize: '0.9375rem',
                padding: '0.75rem 2rem', borderRadius: '0.625rem', border: 'none',
                cursor: allDone ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
                transition: 'background 0.2s',
              }}
            >
              {t.analyze}
              <ChevronRight style={{ width: '1rem', height: '1rem' }} />
            </button>
            <p style={{ fontSize: '0.8125rem', color: 'oklch(0.55 0.02 250)', margin: 0 }}>
              {t.analyzeCount(photos.filter(Boolean).length)}
            </p>
          </div>

        </motion.div>
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════
   STEP 2 — Profile form
═══════════════════════════════════════════════ */
const FORM_CONTENT = {
  vi: {
    title:    'Thu Thập Thông Tin Của Bạn',
    subtitle: 'Vui lòng cung cấp một số thông tin cơ bản để cá nhân hóa kết quả phân tích da.',
    photoLabels: ['Chính diện', 'Góc trái', 'Góc phải'],
    sections: {
      age: {
        label:   'Độ tuổi của bạn là gì?',
        options: ['18–24', '25–30', '31–40', '41+'],
      },
      skinType: {
        label:   'Làn da của bạn thuộc loại nào?',
        options: ['Da khô', 'Da dầu', 'Da hỗn hợp', 'Da thường', 'Da nhạy cảm', 'Không chắc chắn'],
      },
      concerns: {
        label:        'Mối quan tâm chính về làn da của bạn là gì?',
        note:         '(Chọn nhiều mục)',
        selectedNote: n => `Đã chọn: ${n} mối quan tâm`,
        options: [
          { label: 'Dấu hiệu lão hóa sớm',   icon: '🕐' },
          { label: 'Khô da và xỉn màu',       icon: '💧' },
          { label: 'Đốm nâu / Nám',           icon: '🔵' },
          { label: 'Kết cấu da không đều',    icon: '🪞' },
          { label: 'Da kém săn chắc',         icon: '📉' },
          { label: 'Lỗ chân lông to',         icon: '⭕' },
          { label: 'Mụn và thâm mụn',         icon: '🔴' },
          { label: 'Nhạy cảm / Kích ứng',    icon: '⚡' },
        ],
      },
      routine: {
        label:   'Chu trình chăm sóc da hiện tại của bạn như thế nào?',
        options: [
          'Chỉ dùng sữa rửa mặt',
          'Sữa rửa mặt và kem dưỡng',
          'Sữa rửa mặt, serum và kem dưỡng',
          'Chu trình đầy đủ có kem chống nắng',
        ],
      },
      sleep: {
        label:   'Bạn mô tả giấc ngủ và mức độ căng thẳng của mình như thế nào?',
        options: ['Cân bằng', 'Thỉnh thoảng mệt mỏi', 'Căng thẳng cao', 'Thường xuyên ngủ không đủ'],
      },
      hydration: {
        label:   'Bạn duy trì thói quen uống đủ nước như thế nào?',
        options: ['Rất đều đặn', 'Thỉnh thoảng', 'Hiếm khi', 'Tôi thường quên uống nước'],
      },
    },
    cta:     'Tạo Báo Cáo Da Của Tôi',
    loading: 'Đang phân tích…',
  },
  en: {
    title:    'Your Skin Profile',
    subtitle: 'Please provide a few details to personalize your skin analysis result.',
    photoLabels: ['Front face', 'Left face', 'Right face'],
    sections: {
      age: {
        label:   'What is your age range?',
        options: ['18–24', '25–30', '31–40', '41+'],
      },
      skinType: {
        label:   'What is your skin type?',
        options: ['Dry', 'Oily', 'Combination', 'Normal', 'Sensitive', 'Not sure'],
      },
      concerns: {
        label:        'What are your main skin concerns?',
        note:         '(Select multiple)',
        selectedNote: n => `Selected: ${n} concerns`,
        options: [
          { label: 'Early aging signs',        icon: '🕐' },
          { label: 'Dryness and dullness',     icon: '💧' },
          { label: 'Dark spots / Melasma',     icon: '🔵' },
          { label: 'Uneven texture',           icon: '🪞' },
          { label: 'Loss of firmness',         icon: '📉' },
          { label: 'Large pores',              icon: '⭕' },
          { label: 'Acne and acne scars',      icon: '🔴' },
          { label: 'Sensitivity / Irritation', icon: '⚡' },
        ],
      },
      routine: {
        label:   'What does your current routine look like?',
        options: [
          'Cleanser only',
          'Cleanser and moisturizer',
          'Cleanser, serum, and moisturizer',
          'Full routine with sunscreen',
        ],
      },
      sleep: {
        label:   'How would you describe your sleep and stress level?',
        options: ['Balanced', 'Occasionally tired', 'High stress', 'Poor sleep frequently'],
      },
      hydration: {
        label:   'How often do you stay hydrated?',
        options: ['Consistently', 'Sometimes', 'Rarely', 'I often forget'],
      },
    },
    cta:     'Generate My Skin Report',
    loading: 'Analyzing…',
  },
}

function OptionBtn({ label, icon, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative flex items-center gap-2.5 w-full rounded-lg border-2 p-3 text-sm text-left',
        'cursor-pointer transition-all duration-200',
        selected
          ? 'border-primary bg-primary/5 text-primary'
          : 'border-border text-foreground hover:border-primary/40',
      )}
    >
      {icon && <span className="text-base leading-none flex-shrink-0">{icon}</span>}
      <span className={cn('font-medium', selected && 'text-primary')}>{label}</span>
      {selected && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-primary flex-shrink-0">
          <Check className="h-3 w-3 text-white" strokeWidth={3} />
        </div>
      )}
    </button>
  )
}

function FormSection({ title, note, children }) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-2">
        <p className="text-sm font-bold text-foreground">{title}</p>
        {note && <span className="text-xs text-muted-foreground">{note}</span>}
      </div>
      {children}
    </div>
  )
}

function FormStep({ photos, onSubmit, lang }) {
  const t = FORM_CONTENT[lang] || FORM_CONTENT.vi

  const [form, setForm] = useState({
    age: '', skinType: '', concerns: [], routine: '', sleep: '', hydration: '',
  })
  const [loading, setLoading] = useState(false)

  const set    = k => v => setForm(f => ({ ...f, [k]: v }))
  const toggle = k => v => setForm(f => ({
    ...f, [k]: f[k].includes(v) ? f[k].filter(x => x !== v) : [...f[k], v],
  }))

  const ready = form.age && form.skinType && form.concerns.length > 0 && form.routine && form.sleep && form.hydration

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!ready || loading) return
    setLoading(true)
    try {
      const ai = await analyzeWithAI(photos, form, lang)
      onSubmit(form, ai)
    } catch {
      onSubmit(form, null) // fail open — show results with fallback
    }
  }

  return (
    <motion.div {...fade} className="min-h-[calc(100vh-4rem)] bg-muted/30">
      <div className="flex flex-col items-center px-4 py-8 lg:py-12">
        <motion.div {...slideUp} className="w-full max-w-2xl">
          <div className="bg-card rounded-2xl shadow-lg overflow-hidden">

            {/* Header */}
            <div className="p-8 pb-6 text-center border-b border-border">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <ClipboardList className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">{t.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{t.subtitle}</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-8 pt-6 space-y-8">

              <FormSection title={t.sections.age.label}>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {t.sections.age.options.map(a => (
                    <OptionBtn key={a} label={a} selected={form.age === a} onClick={() => set('age')(a)} />
                  ))}
                </div>
              </FormSection>

              <FormSection title={t.sections.skinType.label}>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {t.sections.skinType.options.map(s => (
                    <OptionBtn key={s} label={s} selected={form.skinType === s} onClick={() => set('skinType')(s)} />
                  ))}
                </div>
              </FormSection>

              <FormSection
                title={t.sections.concerns.label}
                note={form.concerns.length > 0
                  ? t.sections.concerns.selectedNote(form.concerns.length)
                  : t.sections.concerns.note}
              >
                <div className="grid gap-2 sm:grid-cols-2">
                  {t.sections.concerns.options.map(c => (
                    <OptionBtn
                      key={c.label}
                      label={c.label}
                      icon={c.icon}
                      selected={form.concerns.includes(c.label)}
                      onClick={() => toggle('concerns')(c.label)}
                    />
                  ))}
                </div>
              </FormSection>

              <FormSection title={t.sections.routine.label}>
                <div className="grid gap-2">
                  {t.sections.routine.options.map(r => (
                    <OptionBtn key={r} label={r} selected={form.routine === r} onClick={() => set('routine')(r)} />
                  ))}
                </div>
              </FormSection>

              <FormSection title={t.sections.sleep.label}>
                <div className="grid grid-cols-2 gap-2">
                  {t.sections.sleep.options.map(s => (
                    <OptionBtn key={s} label={s} selected={form.sleep === s} onClick={() => set('sleep')(s)} />
                  ))}
                </div>
              </FormSection>

              <FormSection title={t.sections.hydration.label}>
                <div className="grid grid-cols-2 gap-2">
                  {t.sections.hydration.options.map(h => (
                    <OptionBtn key={h} label={h} selected={form.hydration === h} onClick={() => set('hydration')(h)} />
                  ))}
                </div>
              </FormSection>

              <Btn
                type="submit"
                disabled={!ready || loading}
                className="w-full text-base py-3.5"
              >
                {loading
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> {t.loading}</>
                  : <><strong>{t.cta}</strong><ChevronRight className="h-4 w-4" /></>
                }
              </Btn>
            </form>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════
   STEP 3 — Scanning animation (AI runs here)
═══════════════════════════════════════════════ */
const SCAN_CONTENT = {
  vi: {
    title:    'Đang Quét & Phân Tích…',
    subtitle: 'ảnh của bạn…',
    aiLabel:  'AI đang phân tích',
    progress: 'Đang phân tích',
    steps: [
      'Đánh giá biểu hiện độ ẩm trên da',
      'Phân tích độ săn chắc và nếp nhăn nhỏ',
      'Đánh giá độ rạng rỡ và kết cấu da',
      'Chuẩn bị hồ sơ Aura Scanning của bạn',
    ],
  },
  en: {
    title:    'Scanning & Analyzing…',
    subtitle: 'your photos…',
    aiLabel:  'AI is analyzing',
    progress: 'Analyzing',
    steps: [
      'Evaluating hydration appearance',
      'Reviewing firmness and fine lines',
      'Assessing radiance and texture',
      'Preparing your Aura Scanning profile',
    ],
  },
}

function ScanningStep({ photos, lang, onComplete }) {
  const sc = SCAN_CONTENT[lang] || SCAN_CONTENT.vi
  const [progress,    setProgress]    = useState(0)
  const [stepIdx,     setStepIdx]     = useState(0)
  const [imgIdx,      setImgIdx]      = useState(0)

  useEffect(() => {
    const MIN_MS    = 4500
    const startTime = Date.now()

    // Progress ticker — purely visual, no AI
    const progTimer = setInterval(() => {
      const pct = Math.min(Math.floor(((Date.now() - startTime) / MIN_MS) * 100), 100)
      setProgress(pct)
      if (pct >= 100) {
        clearInterval(progTimer)
        setTimeout(() => onComplete(), 400) // brief pause at 100% then show form
      }
    }, 50)

    const stepTimer = setInterval(() => {
      setStepIdx(i => (i < 3 ? i + 1 : i))
    }, 1100)

    const imgTimer = setInterval(() => {
      setImgIdx(i => (i + 1) % 3)
    }, 1500)

    return () => {
      clearInterval(progTimer)
      clearInterval(stepTimer)
      clearInterval(imgTimer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <motion.div {...fade} className="min-h-[calc(100vh-4rem)] bg-muted/30 flex items-center justify-center">
      <div className="flex w-full flex-col items-center px-4 py-8">
        <motion.div {...slideUp} className="w-full max-w-md">

          {/* Dark phone-style scanning interface */}
          <div className="overflow-hidden rounded-3xl bg-foreground shadow-2xl">
            <div className="flex flex-col items-center p-8 pt-10">

              {/* Face oval with cycling photos — flex column centers it */}
              <div className="relative mb-6 h-72 w-52">
                <div className="absolute inset-0 overflow-hidden rounded-full border-2 border-primary/50">
                  {photos[imgIdx] ? (
                    <img src={photos[imgIdx]} alt="Analyzing" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-white/5">
                      <Sparkles className="h-16 w-16 text-primary/50" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-foreground/50" />
                  {/* Grid overlay clipped to oval */}
                  <svg className="absolute inset-0 h-full w-full opacity-30">
                    <defs>
                      <pattern id="scan-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke={PRIMARY_COLOR} strokeWidth="0.5" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#scan-grid)" />
                  </svg>
                </div>

                {/* Corner brackets */}
                <div className="absolute -left-3 -top-3 h-8 w-8 border-l-2 border-t-2 border-primary" />
                <div className="absolute -right-3 -top-3 h-8 w-8 border-r-2 border-t-2 border-primary" />
                <div className="absolute -bottom-3 -left-3 h-8 w-8 border-b-2 border-l-2 border-primary" />
                <div className="absolute -bottom-3 -right-3 h-8 w-8 border-b-2 border-r-2 border-primary" />

                {/* Scanning line */}
                <motion.div
                  initial={{ top: '0%' }}
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute left-0 right-0 h-1 rounded-full bg-gradient-to-r from-transparent via-primary to-transparent"
                  style={{ boxShadow: '0 0 20px oklch(0.4 0.15 15 / 0.8)' }}
                />

                {/* AI indicator */}
                <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
              </div>

              {/* Photo dots */}
              <div className="mb-5 flex justify-center gap-2">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className={cn('h-2 rounded-full transition-all duration-300', i === imgIdx ? 'w-6 bg-primary' : 'w-2 bg-white/20')}
                  />
                ))}
              </div>

              {/* Title */}
              <div className="mb-5 text-center">
                <h2 className="mb-2 text-xl font-bold text-white">{sc.title}</h2>
                <p className="text-sm text-white/60">
                  <strong className="text-primary">{sc.aiLabel}</strong> {sc.subtitle}
                </p>
              </div>

              {/* Progress bar */}
              <div className="mb-6 w-full">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-white/70 text-xs">{sc.progress}</span>
                  <span className="font-mono font-bold text-primary text-xs">{progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(to right, oklch(0.4 0.15 15), oklch(0.5 0.12 15))' }}
                  />
                </div>
              </div>

              {/* Analysis steps */}
              <div className="w-full space-y-4">
                {sc.steps.map((step, i) => (
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: i <= stepIdx ? 1 : 0.35, x: 0 }}
                    transition={{ delay: i * 0.15 }}
                    className="flex items-center gap-3"
                  >
                    <div className={cn(
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-all',
                      i < stepIdx  ? 'bg-primary text-white' :
                      i === stepIdx ? 'border-2 border-primary' : 'bg-white/10',
                    )}>
                      {i < stepIdx ? (
                        <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                      ) : i === stepIdx ? (
                        <motion.div
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{ duration: 0.9, repeat: Infinity }}
                          className="h-2 w-2 rounded-full bg-primary"
                        />
                      ) : null}
                    </div>
                    <span className={cn('text-sm', i <= stepIdx ? 'text-white' : 'text-white/35')}>
                      {step}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════
   STEP 4 — Results
═══════════════════════════════════════════════ */

// Bilingual labels for concern tags shown on product cards
const CONCERN_TAG_LABELS = {
  'acne':                  { vi: 'Mụn',                      en: 'Acne'                  },
  'excess oil':            { vi: 'Dầu thừa',                 en: 'Excess Oil'             },
  'clogged pores':         { vi: 'Lỗ chân lông tắc',        en: 'Clogged Pores'          },
  'blackheads':            { vi: 'Mụn đầu đen',              en: 'Blackheads'             },
  'large pores':           { vi: 'Lỗ chân lông to',          en: 'Large Pores'            },
  'texture':               { vi: 'Kết cấu da',               en: 'Texture'               },
  'dark spots':            { vi: 'Đốm nâu',                  en: 'Dark Spots'             },
  'hyperpigmentation':     { vi: 'Tăng sắc tố',              en: 'Hyperpigmentation'      },
  'melasma':               { vi: 'Nám',                      en: 'Melasma'               },
  'post-acne dark spots':  { vi: 'Thâm sau mụn',             en: 'Post-Acne Dark Spots'  },
  'uneven skin tone':      { vi: 'Da không đều màu',         en: 'Uneven Skin Tone'       },
  'dull skin':             { vi: 'Da xỉn màu',               en: 'Dull Skin'             },
  'fine lines':            { vi: 'Nếp nhăn nhỏ',             en: 'Fine Lines'             },
  'wrinkles':              { vi: 'Nếp nhăn',                 en: 'Wrinkles'              },
  'anti-aging':            { vi: 'Chống lão hóa',            en: 'Anti-Aging'             },
  'firmness':              { vi: 'Độ săn chắc',              en: 'Firmness'              },
  'hydration':             { vi: 'Độ ẩm',                    en: 'Hydration'             },
  'radiance':              { vi: 'Độ rạng rỡ',               en: 'Radiance'              },
  'dehydration':           { vi: 'Thiếu nước',               en: 'Dehydration'           },
  'dryness':               { vi: 'Da khô',                   en: 'Dryness'               },
  'sensitive skin':        { vi: 'Da nhạy cảm',              en: 'Sensitive Skin'         },
  'irritation':            { vi: 'Kích ứng',                 en: 'Irritation'            },
  'redness':               { vi: 'Da đỏ',                    en: 'Redness'               },
  'UV protection':         { vi: 'Chống nắng',               en: 'UV Protection'          },
}

const SCORE_ITEMS = [
  { key: 'hydration',    icon: Droplets, label: { vi: 'Độ Ẩm',              en: 'Hydration'      }, isPositive: true  },
  { key: 'firmness',     icon: Activity, label: { vi: 'Độ Săn Chắc',        en: 'Firmness'       }, isPositive: true  },
  { key: 'radiance',     icon: Sparkles, label: { vi: 'Độ Rạng Rỡ',         en: 'Radiance'       }, isPositive: true  },
  { key: 'texture',      icon: Layers,   label: { vi: 'Kết Cấu Da',         en: 'Texture'        }, isPositive: false },
  { key: 'fineLines',    icon: Zap,      label: { vi: 'Nếp Nhăn Nhỏ',      en: 'Fine Lines'     }, isPositive: false },
  { key: 'darkSpots',    icon: Circle,   label: { vi: 'Đốm Nâu',            en: 'Dark Spots'     }, isPositive: false },
  { key: 'barrierHealth',icon: Shield,   label: { vi: 'Hàng Rào Bảo Vệ Da', en: 'Barrier Health' }, isPositive: true  },
]

const STEP_COLOR = {
  Cleanse: '#0ea5e9', Tone: '#8b5cf6', Treat: '#f59e0b',
  Moisturize: '#22c55e', Protect: '#f97316', Exfoliate: '#ec4899',
}

const PRIORITY_CONFIG = {
  featured:  { label: '⭐ Nổi bật',    cls: 'bg-primary text-white',          border: 'border-primary/50',  bg: 'bg-primary/[0.03]' },
  primary:   { label: 'Chính',         cls: 'bg-primary/10 text-primary',      border: 'border-primary/20',  bg: 'bg-primary/[0.02]' },
  secondary: { label: 'Hỗ trợ',        cls: 'bg-muted text-muted-foreground',  border: 'border-border',      bg: 'bg-muted/20'       },
}

// ── Results & Products bilingual content ──────────────────────────────
const SKIN_TYPE_LABELS = {
  vi: { oily: 'Da dầu', dry: 'Da khô', combination: 'Da hỗn hợp', sensitive: 'Da nhạy cảm', normal: 'Da thường' },
  en: { oily: 'Oily', dry: 'Dry', combination: 'Combination', sensitive: 'Sensitive', normal: 'Normal' },
}

const RESULTS_CONTENT = {
  vi: {
    title:    'Kết Quả Phân Tích Da Của Bạn',
    subtitle: 'Được tạo bởi AI dựa trên phân tích hình ảnh của bạn',
    cards: {
      skinAge:     { label: 'Tuổi Da Ước Tính', unit: 'tuổi' },
      confidence:  { label: 'Độ Tin Cậy Của AI' },
      skinType:    { label: 'Loại Da' },
      mainConcern: { label: 'Mối Quan Tâm Chính' },
    },
    aiLabel:   'Đánh Giá AI',
    scores: {
      title:    'Điểm Số Chi Tiết',
      highLabel: 'Điểm cao:',
      highText:  'Điểm cao hơn thể hiện trạng thái tốt hơn.',
      lowLabel:  'Cần chú ý:',
      lowText:   'Điểm cao hơn thể hiện mối quan tâm nhìn thấy rõ hơn.',
    },
    priorities: {
      title: 'Mối Quan Tâm Ưu Tiên',
      items: [
        {
          icon: Droplets,
          title: 'Hỗ Trợ Cấp Ẩm',
          copy: 'Điểm độ ẩm của bạn đang thấp hơn mức lý tưởng, khiến làn da có thể trông kém căng mọng và kém rạng rỡ.',
        },
        {
          icon: Zap,
          title: 'Nếp Nhăn Nhỏ & Độ Săn Chắc',
          copy: 'Nếp nhăn nhỏ có thể quan sát và độ săn chắc giảm cho thấy làn da cần một bước serum chống lão hóa chuyên sâu.',
        },
        {
          icon: Layers,
          title: 'Kết Cấu Da & Độ Rạng Rỡ',
          copy: 'Kết cấu da chưa đều và độ rạng rỡ thấp có thể khiến làn da trông mệt mỏi, ngay cả khi hàng rào bảo vệ da tương đối ổn định.',
        },
      ],
    },
    cta:        'Xem Sản Phẩm Gợi Ý',
    disclaimer: [
      'Đánh giá da thẩm mỹ được hỗ trợ bởi AI.',
      'Đây không phải là chẩn đoán y khoa.',
      'Nếu bạn gặp tình trạng mụn kéo dài, kích ứng hoặc triệu chứng nghiêm trọng, vui lòng tham khảo ý kiến bác sĩ da liễu.',
    ],
  },
  en: {
    title:    'Your Skin Analysis Results',
    subtitle: 'Generated by AI based on your image analysis',
    cards: {
      skinAge:     { label: 'Estimated Skin Age', unit: 'years' },
      confidence:  { label: 'AI Confidence' },
      skinType:    { label: 'Skin Type' },
      mainConcern: { label: 'Main Concern' },
    },
    aiLabel:   'AI Assessment',
    scores: {
      title:    'Detailed Scores',
      highLabel: 'High score:',
      highText:  'Higher score means a better cosmetic appearance.',
      lowLabel:  'Needs attention:',
      lowText:   'Higher score means a stronger visible concern.',
    },
    priorities: {
      title: 'Priority Concerns',
      items: [
        {
          icon: Droplets,
          title: 'Hydration Support',
          copy: 'Your hydration score appears lower than ideal, which may make skin look less plump and less radiant.',
        },
        {
          icon: Zap,
          title: 'Fine Lines & Firmness',
          copy: 'Visible fine lines and reduced firmness suggest the need for a focused anti-aging serum step.',
        },
        {
          icon: Layers,
          title: 'Texture & Radiance',
          copy: 'Uneven texture and lower radiance can make skin look tired even when the skin barrier appears relatively stable.',
        },
      ],
    },
    cta:        'View Recommended Products',
    disclaimer: [
      'AI-powered cosmetic skin assessment.',
      'This is not a medical diagnosis.',
      'For persistent acne, irritation, or severe symptoms, consult a dermatologist.',
    ],
  },
}

const PRODUCTS_CONTENT = {
  vi: {
    title:      'Chu Trình Eucerin Được Gợi Ý Cho Bạn',
    subtitle:   <>Chu trình sản phẩm được tạo bằng hệ thống <strong className="text-foreground">gợi ý dựa trên AI</strong>, sử dụng các điểm số da của bạn.</>,
    recommended: 'Được Gợi Ý',
    howToUse:   'Cách dùng:',
    learnMore:  'Tìm Hiểu Thêm',
    buyShopee:  'Mua Trên Shopee',
    morning: {
      title: 'Chu Trình Buổi Sáng',
      steps: ['Sữa rửa mặt dịu nhẹ', 'Eucerin Hyaluron-Filler Epicelline Serum', 'Kem dưỡng ẩm', 'Eucerin Sun Fluid Anti-Age SPF50+'],
    },
    night: {
      title: 'Chu Trình Buổi Tối',
      steps: ['Sữa rửa mặt dịu nhẹ', 'Eucerin Hyaluron-Filler Epicelline Serum', 'Kem dưỡng ẩm hoặc kem hỗ trợ hàng rào bảo vệ da'],
    },
    rescan:   'Quét Lại',
    home:     'Về Trang Chủ',
    sendBtn:  'Gửi Kết Quả',
  },
  en: {
    title:      'Your Recommended Eucerin Routine',
    subtitle:   <>Your routine is generated through an <strong className="text-foreground">AI-powered recommendation engine</strong> using your skin scores.</>,
    recommended: 'Recommended',
    howToUse:   'How to use:',
    learnMore:  'Learn More',
    buyShopee:  'Buy on Shopee',
    morning: {
      title: 'Morning Routine',
      steps: ['Gentle cleanser', 'Eucerin Hyaluron-Filler Epicelline Serum', 'Moisturizer', 'Eucerin Sun Fluid Anti-Age SPF50+'],
    },
    night: {
      title: 'Night Routine',
      steps: ['Gentle cleanser', 'Eucerin Hyaluron-Filler Epicelline Serum', 'Moisturizer or barrier-support cream'],
    },
    rescan:   'Scan Again',
    home:     'Go Home',
    sendBtn:  'Send My Results',
  },
}

// ── Send Results content ──────────────────────────────────────────────
const SEND_CONTENT = {
  vi: {
    btnLabel:        'Gửi Kết Quả',
    title:           'Gửi Kết Quả Của Tôi',
    subtitle:        'Nhận kết quả phân tích da và tư vấn sản phẩm trực tiếp qua Zalo OA hoặc SMS của Eucerin Việt Nam.',
    summaryTitle:    'Tóm tắt kết quả của bạn:',
    skinAge:         'Tuổi Da Ước Tính',
    skinTypeLabel:   'Loại Da',
    mainConcern:     'Mối Quan Tâm Chính',
    confidence:      'Độ Tin Cậy Của AI',
    ageSuffix:       'tuổi',
    phoneLabel:      'Số điện thoại',
    phonePlaceholder:'Nhập số điện thoại để gửi SMS',
    sendZalo:        'Gửi Qua Zalo',
    openZaloOA:      'Mở Zalo OA Eucerin Việt Nam',
    sendSMS:         'Gửi Qua SMS',
    poweredBy:       'Hỗ trợ bởi',
    homeBtn:         'Trang chủ Eucerin',
    shopeeBtn:       'Cửa hàng Shopee',
    backBtn:         'Quay Lại',
  },
  en: {
    btnLabel:        'Send My Results',
    title:           'Send My Results',
    subtitle:        'Receive your skin analysis and product advice directly via Zalo OA or SMS from Eucerin Vietnam.',
    summaryTitle:    'Your results summary:',
    skinAge:         'Estimated Skin Age',
    skinTypeLabel:   'Skin Type',
    mainConcern:     'Main Concern',
    confidence:      'AI Confidence',
    ageSuffix:       'years old',
    phoneLabel:      'Phone number',
    phonePlaceholder:'Enter phone number to send SMS',
    sendZalo:        'Send via Zalo',
    openZaloOA:      'Open Eucerin Vietnam Zalo OA',
    sendSMS:         'Send via SMS',
    poweredBy:       'Powered by',
    homeBtn:         'Eucerin Website',
    shopeeBtn:       'Shopee Store',
    backBtn:         'Go Back',
  },
}

// ── Eucerin product catalogue (26 products, source: eucerin_vietnam_face_products.xlsx) ──
const EUCERIN_PRODUCTS = [
  {
    id: 'epicelline-serum',
    name: 'Eucerin Hyaluron-Filler Epicelline Serum',
    category: { vi: 'Tinh Chất Chống Lão Hóa Thế Hệ Mới', en: 'Next-Gen Anti-Aging Serum' },
    concernTags: ['anti-aging', 'fine lines', 'wrinkles', 'firmness', 'hydration', 'radiance', 'texture'],
    imageUrl: '/products/epicelline-serum.png',
    eucerinUrl: 'https://www.eucerin.vn/san-pham',
    shopeeUrl: 'https://shopee.vn/Tinh-ch%E1%BA%A5t-gi%C3%BAp-gi%E1%BA%A3m-d%E1%BA%A5u-hi%E1%BB%87u-l%C3%A3o-h%C3%B3a-Eucerin-Hyaluron-Filler-Epicelline-Serum-30ml-i.82297261.26173166984',
    shortDescription: {
      vi: 'Tinh chất với công nghệ Age Clock và Epicelline, hỗ trợ giảm nếp nhăn, tăng săn chắc và cải thiện vẻ trẻ trung sau 4 tuần.',
      en: 'Age Clock + Epicelline serum that reduces wrinkles, improves firmness and skin youthfulness in 4 weeks.',
    },
    usageStep: { vi: 'Bước serum, sáng và tối', en: 'Serum step, morning and night' },
  },
  {
    id: 'dermopure-cleanser',
    name: 'Eucerin DermoPure Clinical Cleanser',
    category: { vi: 'Gel Rửa Mặt Da Mụn', en: 'Acne Gel Cleanser' },
    concernTags: ['acne', 'excess oil', 'clogged pores', 'blackheads', 'large pores', 'texture'],
    imageUrl: '/products/dermopure-cleanser.png',
    eucerinUrl: 'https://www.eucerin.vn/san-pham/dermopure-clinical/cleanser',
    shopeeUrl: 'https://shopee.vn/Gel-r%E1%BB%ADa-m%E1%BA%B7t-Eucerin%C2%AE-DermoPure-Clinical-Purifying-Cleanser-200ml-i.82297261.1464762135',
    shortDescription: {
      vi: 'Gel rửa mặt không gây bít tắc lỗ chân lông, làm sạch dịu nhẹ bã nhờn và bụi bẩn, giúp da sạch và thông thoáng.',
      en: 'Non-comedogenic gel cleanser that gently removes excess oil and impurities, keeping skin clear and breathable.',
    },
    usageStep: { vi: 'Bước làm sạch, sáng và tối', en: 'Cleansing step, morning and night' },
  },
  {
    id: 'dermopure-scrub',
    name: 'Eucerin DermoPure Clinical Scrub',
    category: { vi: 'Tẩy Tế Bào Chết Da Mụn', en: 'Acne Skin Exfoliating Scrub' },
    concernTags: ['acne', 'excess oil', 'clogged pores', 'large pores', 'texture'],
    imageUrl: '/products/dermopure-scrub.png',
    eucerinUrl: 'https://www.eucerin.vn/san-pham/dermopure-clinical/scrub',
    shopeeUrl: 'https://shopee.vn/eucerin.officialstore?keyword=DermoPure+Clinical+Scrub',
    shortDescription: {
      vi: 'Tẩy tế bào chết không chứa dầu với Lactic Acid, giúp thông thoáng lỗ chân lông và hỗ trợ giảm mụn.',
      en: 'Oil-free exfoliating scrub with Lactic Acid to unclog pores and reduce acne breakouts.',
    },
    usageStep: { vi: 'Tẩy da chết 1–2 lần/tuần', en: 'Exfoliate 1–2 times per week' },
  },
  {
    id: 'dermopure-clearing-treatment',
    name: 'Eucerin DermoPure A.I Clearing Treatment',
    category: { vi: 'Tinh Chất Đặc Trị Mụn', en: 'Acne Clearing Treatment' },
    concernTags: ['acne', 'excess oil', 'clogged pores', 'blackheads', 'texture', 'post-acne dark spots'],
    imageUrl: '/products/dermopure-clearing-treatment.png',
    eucerinUrl: 'https://www.eucerin.vn/san-pham/dermopure-clinical/skin-renewal-treatment',
    shopeeUrl: 'https://shopee.vn/eucerin.officialstore?keyword=Eucerin%20DermoPure%20AI%20Clearing%20Treatment%2040ml',
    shortDescription: {
      vi: 'Tinh chất điều trị tái tạo bề mặt da, thông thoáng lỗ chân lông và giảm mụn — thấy cải thiện sau khoảng 7 ngày.',
      en: 'Treatment serum that resurfaces skin, unclogs pores and reduces acne — visible improvement in ~7 days.',
    },
    usageStep: { vi: 'Bước đặc trị tối (sau làm sạch)', en: 'Targeted evening treatment (after cleansing)' },
  },
  {
    id: 'spotless-booster-serum',
    name: 'Eucerin Spotless Brightening Booster Serum',
    category: { vi: 'Tinh Chất Giảm Thâm Nám & Dưỡng Sáng', en: 'Dark Spot Brightening Serum' },
    concernTags: ['dark spots', 'hyperpigmentation', 'melasma', 'post-acne dark spots', 'uneven skin tone', 'dull skin'],
    imageUrl: '/products/spotless-booster-serum.png',
    eucerinUrl: 'https://www.eucerin.vn/san-pham/spotless-brightening/spotless-brightening-booster-serum',
    shopeeUrl: 'https://shopee.vn/eucerin.officialstore?keyword=Eucerin%20Spotless%20Brightening%20Booster%20Serum%2030ml',
    shortDescription: {
      vi: 'Tinh chất với Thiamidol giúp giảm thâm nám và dưỡng sáng da, cải thiện đốm nâu và sắc da không đều.',
      en: 'Thiamidol-powered serum to visibly reduce dark spots and hyperpigmentation for a more even skin tone.',
    },
    usageStep: { vi: 'Bước serum, sáng và tối', en: 'Serum step, morning and night' },
  },
  {
    id: 'spotless-spot-corrector',
    name: 'Eucerin Spotless Brightening Spot Corrector',
    category: { vi: 'Bút Chấm Đặc Trị Đốm Nâu', en: 'Targeted Dark Spot Corrector' },
    concernTags: ['dark spots', 'hyperpigmentation', 'melasma', 'post-acne dark spots'],
    imageUrl: '/products/spotless-spot-corrector.png',
    eucerinUrl: 'https://www.eucerin.vn/san-pham/spotless-brightening/spot-corrector',
    shopeeUrl: 'https://shopee.vn/eucerin.officialstore?keyword=Eucerin%20Spot%20Corrector%205ml',
    shortDescription: {
      vi: 'Bút chấm chuyên biệt làm mờ vùng đốm nâu và thâm nám nhỏ với độ chính xác cao.',
      en: 'Precise applicator pen to fade small dark spots and localized hyperpigmentation.',
    },
    usageStep: { vi: 'Chấm trực tiếp lên vùng đốm nâu, tối', en: 'Apply directly on dark spots, evening' },
  },
  {
    id: 'spotless-day-fluid',
    name: 'Eucerin Spotless Brightening Day Fluid SPF30',
    category: { vi: 'Kem Dưỡng Ngày Sáng Da SPF30', en: 'Brightening Day Fluid SPF30' },
    concernTags: ['dark spots', 'hyperpigmentation', 'uneven skin tone', 'dull skin', 'UV protection'],
    imageUrl: 'https://www.eucerin.vn/media/_/e/5/e5f6g7h8-9i0j-1k2l-3m4n-5o6p7q8r9s0t-day-fluid-spf30.png?im=Resize,width=400',
    eucerinUrl: 'https://www.eucerin.vn/san-pham/spotless-brightening/day-fluid-spf30',
    shopeeUrl: 'https://shopee.vn/eucerin.officialstore?keyword=Eucerin%20Spotless%20Brightening%20Day%20SPF30%2050ml',
    shortDescription: {
      vi: 'Kem dưỡng ngày giảm thâm nám, dưỡng sáng và bảo vệ SPF30 trong chu trình ban ngày.',
      en: 'Day moisturizer that reduces dark spots, brightens skin tone and provides SPF30 sun protection.',
    },
    usageStep: { vi: 'Bước dưỡng ngày, sau serum', en: 'Day moisturizer step, after serum' },
  },
  {
    id: 'spotless-night-cream',
    name: 'Eucerin Spotless Brightening Night Cream',
    category: { vi: 'Kem Dưỡng Đêm Sáng Da', en: 'Brightening Night Cream' },
    concernTags: ['dark spots', 'hyperpigmentation', 'uneven skin tone', 'dull skin'],
    imageUrl: '/products/spotless-night-cream.png',
    eucerinUrl: 'https://www.eucerin.vn/san-pham/spotless-brightening/night-cream',
    shopeeUrl: 'https://shopee.vn/eucerin.officialstore?keyword=Eucerin%20Spotless%20Brightening%20Night%20Cream%2050ml',
    shortDescription: {
      vi: 'Kem dưỡng đêm hỗ trợ giảm thâm nám, làm đều màu da và nuôi dưỡng da trong lúc ngủ.',
      en: 'Night cream to reduce dark spots, even out skin tone, and nourish skin overnight.',
    },
    usageStep: { vi: 'Bước kem dưỡng tối, sau serum', en: 'Night cream step, after serum' },
  },
  {
    id: 'hf-eye-cream',
    name: 'Eucerin Hyaluron-Filler Eye Cream SPF15',
    category: { vi: 'Kem Mắt Chống Lão Hóa SPF15', en: 'Anti-Aging Eye Cream SPF15' },
    concernTags: ['fine lines', 'wrinkles', 'anti-aging'],
    imageUrl: '/products/hf-eye-cream.png',
    eucerinUrl: 'https://www.eucerin.vn/san-pham/hyaluron-filler/kem-duong-da-vung-mat',
    shopeeUrl: 'https://shopee.vn/eucerin.officialstore?keyword=Eucerin%20Hyaluron-Filler%20Eye%20Cream%20SPF15%2015ml',
    shortDescription: {
      vi: 'Kem mắt cấp ẩm, giảm nếp nhăn vùng mắt với SPF15 bảo vệ da mắt ban ngày.',
      en: 'Eye cream that hydrates and reduces crow\'s feet with SPF15 protection for daytime.',
    },
    usageStep: { vi: 'Bước chăm sóc mắt, sáng và tối', en: 'Eye care step, morning and night' },
  },
  {
    id: 'hf-night-cream',
    name: 'Eucerin Hyaluron-Filler Night Cream',
    category: { vi: 'Kem Dưỡng Đêm Cấp Ẩm Chống Lão Hóa', en: 'Hydrating Anti-Aging Night Cream' },
    concernTags: ['fine lines', 'wrinkles', 'hydration', 'dehydration', 'anti-aging'],
    imageUrl: '/products/hf-night-cream.png',
    eucerinUrl: 'https://www.eucerin.vn/san-pham/hyaluron-filler/night-cream',
    shopeeUrl: 'https://shopee.vn/eucerin.officialstore?keyword=Eucerin%20Hyaluron-Filler%20Night%20Cream%2050ml',
    shortDescription: {
      vi: 'Kem dưỡng đêm với Hyaluronic Acid chuỗi ngắn và dài, cấp ẩm sâu và hỗ trợ làm đầy nếp nhăn.',
      en: 'Night cream with short and long-chain Hyaluronic Acid to deeply hydrate and plump wrinkles overnight.',
    },
    usageStep: { vi: 'Bước kem dưỡng tối', en: 'Night cream step' },
  },
  {
    id: 'sun-fluid-photoaging',
    name: 'Eucerin Sun Fluid Photoaging Control SPF50',
    category: { vi: 'Chống Nắng Chống Lão Hóa SPF50', en: 'Anti-Aging Sunscreen SPF50' },
    concernTags: ['UV protection', 'anti-aging', 'fine lines', 'dull skin', 'radiance'],
    imageUrl: '/products/sun-fluid-photoaging.png',
    eucerinUrl: 'https://www.eucerin.vn/san-pham/sun-protection/sun-fluid-photoaging-control-spf-50',
    shopeeUrl: 'https://shopee.vn/eucerin.officialstore?keyword=Eucerin%20Sun%20Fluid%20Photoaging%20Control%20SPF50%2050ml',
    shortDescription: {
      vi: 'Kem chống nắng mặt bảo vệ UVA/UVB và ánh sáng xanh, hỗ trợ giảm nếp nhăn và ngăn lão hóa do nắng.',
      en: 'Facial sunscreen against UVA/UVB and blue light that helps reduce wrinkles and prevent sun-related aging.',
    },
    usageStep: { vi: 'Bước cuối buổi sáng (sau kem dưỡng)', en: 'Final morning step (after moisturizer)' },
  },
  {
    id: 'sun-serum-pigment-control',
    name: 'Eucerin Sun Serum Pigment Control SPF50+',
    category: { vi: 'Chống Nắng Giảm Thâm Nám SPF50+', en: 'Anti-Pigment Sunscreen Serum SPF50+' },
    concernTags: ['UV protection', 'dark spots', 'hyperpigmentation', 'melasma', 'uneven skin tone'],
    imageUrl: '/products/sun-serum-pigment-control.png',
    eucerinUrl: 'https://www.eucerin.vn/san-pham/sun-protection/sun-fluid-pigment-control-spf-50',
    shopeeUrl: 'https://shopee.vn/eucerin.officialstore?keyword=Eucerin%20Sun%20Serum%20Pigment%20Control%20SPF50%2B%2050ml',
    shortDescription: {
      vi: 'Tinh chất chống nắng SPF50+ bảo vệ da khỏi UV và hỗ trợ giảm, ngăn thâm nám quay lại.',
      en: 'SPF50+ sunscreen serum that shields from UV and helps reduce and prevent dark spots from recurring.',
    },
    usageStep: { vi: 'Bước cuối buổi sáng', en: 'Final morning step' },
  },
  {
    id: 'sun-cc-oil-control',
    name: 'Eucerin Sun Dry Touch CC Oil Control SPF50+',
    category: { vi: 'Chống Nắng Có Màu Kiềm Dầu SPF50+', en: 'Tinted Oil-Control Sunscreen SPF50+' },
    concernTags: ['excess oil', 'large pores', 'UV protection', 'acne', 'texture'],
    imageUrl: 'https://www.eucerin.vn/media/_/k/1/k1l2m3n4-5o6p-7q8r-9s0t-1u2v3w4x5y6z-cc-oil-control.png?im=Resize,width=400',
    eucerinUrl: 'https://www.eucerin.vn/san-pham/sun-protection/sun-creme-tinted-cc-fair-spf-50plus',
    shopeeUrl: 'https://shopee.vn/eucerin.officialstore?keyword=Eucerin%20Sun%20Dry%20Touch%20CC%20Oil%20Control%20SPF50%2B%2050ml',
    shortDescription: {
      vi: 'Kem chống nắng có màu, kiềm dầu và che phủ nhẹ cho da đều màu — phù hợp da nhờn mụn.',
      en: 'Tinted oil-control sunscreen with light coverage for a more even complexion — ideal for oily, acne-prone skin.',
    },
    usageStep: { vi: 'Bước cuối buổi sáng', en: 'Final morning step' },
  },
  {
    id: 'sun-gel-creme-dry-touch',
    name: 'Eucerin Sun Gel-Creme Dry Touch SPF50+',
    category: { vi: 'Chống Nắng Khô Thoáng Da Nhờn SPF50+', en: 'Dry-Touch Sunscreen for Oily Skin SPF50+' },
    concernTags: ['excess oil', 'acne', 'clogged pores', 'UV protection'],
    imageUrl: '/products/sun-gel-creme-dry-touch.png',
    eucerinUrl: 'https://www.eucerin.vn/san-pham/sun-protection/sun-gel-creme-dry-touch-spf-50plus',
    shopeeUrl: 'https://shopee.vn/eucerin.officialstore?keyword=Eucerin%20Sun%20Gel%20Creme%20Dry%20Touch%20SPF50%2B%2050ml',
    shortDescription: {
      vi: 'Kem chống nắng SPF50+ kết cấu khô thoáng, kiểm soát dầu và phù hợp da nhờn mụn.',
      en: 'SPF50+ sunscreen with dry-touch texture that controls oil — designed for oily and acne-prone skin.',
    },
    usageStep: { vi: 'Bước cuối buổi sáng', en: 'Final morning step' },
  },
  {
    id: 'dermato-clean-micellar',
    name: 'Eucerin DermatoCLEAN Micellar Water 3 in 1',
    category: { vi: 'Nước Tẩy Trang 3 Trong 1', en: '3-in-1 Micellar Cleansing Water' },
    concernTags: ['sensitive skin', 'dryness', 'dehydration', 'irritation'],
    imageUrl: '/products/dermato-clean-micellar.png',
    eucerinUrl: 'https://www.eucerin.vn/san-pham/dermato-clean/dermatoclean-%5Bhyaluron%5D-micellar-water-3-in-1',
    shopeeUrl: 'https://shopee.vn/eucerin.officialstore?keyword=Eucerin%20DermatoCLEAN%20Micellar%203in1%20400ml',
    shortDescription: {
      vi: 'Nước tẩy trang 3 trong 1 làm sạch dịu nhẹ, loại bỏ trang điểm và cấp ẩm với Hyaluronic Acid.',
      en: '3-in-1 micellar water that gently cleanses, removes makeup, and hydrates with Hyaluronic Acid.',
    },
    usageStep: { vi: 'Bước tẩy trang trước rửa mặt', en: 'Makeup removal step before cleansing' },
  },
  {
    id: 'lipo-balance-cream',
    name: 'Eucerin Lipo Balance Intensive Nourishing Cream',
    category: { vi: 'Kem Dưỡng Ẩm Chuyên Sâu Da Khô', en: 'Intensive Nourishing Cream for Dry Skin' },
    concernTags: ['dryness', 'dehydration', 'sensitive skin'],
    imageUrl: '/products/lipo-balance-cream.png',
    eucerinUrl: 'https://www.eucerin.vn/san-pham/lipo-balance/san-pham-lipo-balance',
    shopeeUrl: 'https://shopee.vn/eucerin.officialstore?keyword=Eucerin%20Lipo%20Balance%20Intensive%20Nourishing%20Cream%2050ml',
    shortDescription: {
      vi: 'Kem dưỡng ẩm chuyên sâu phục hồi cân bằng lipid biểu bì, giảm mất nước và cải thiện da khô.',
      en: 'Intensive moisturizer that restores the skin\'s lipid balance, reduces water loss, and improves very dry skin.',
    },
    usageStep: { vi: 'Bước kem dưỡng ẩm, sáng và tối', en: 'Moisturizer step, morning and night' },
  },
  {
    id: 'q10-night-cream',
    name: 'Eucerin Q10 Active Night Cream',
    category: { vi: 'Kem Dưỡng Đêm Chống Lão Hóa Sớm', en: 'Early Anti-Aging Night Cream Q10' },
    concernTags: ['fine lines', 'anti-aging', 'sensitive skin'],
    imageUrl: '/products/q10-night-cream.png',
    eucerinUrl: 'https://www.eucerin.vn/san-pham/q10-active/night-cream',
    shopeeUrl: 'https://shopee.vn/eucerin.officialstore?keyword=Eucerin%20Q10%20Active%20Night%20Cream%2050ml',
    shortDescription: {
      vi: 'Kem dưỡng đêm chứa Coenzyme Q10, hỗ trợ tái tạo da và giảm dấu hiệu nếp nhăn lão hóa sớm.',
      en: 'Night cream with Coenzyme Q10 to support skin renewal and reduce early signs of fine lines.',
    },
    usageStep: { vi: 'Bước kem dưỡng tối', en: 'Night cream step' },
  },
  {
    id: 'hf-elasticity-3d-serum',
    name: 'Eucerin Hyaluron-Filler + Elasticity 3D Serum',
    category: { vi: 'Tinh Chất Chống Lão Hóa 3 Tác Động', en: 'Triple-Action Anti-Aging Serum' },
    concernTags: ['fine lines', 'wrinkles', 'anti-aging', 'dark spots', 'firmness'],
    imageUrl: '/products/hf-elasticity-3d-serum.png',
    eucerinUrl: 'https://www.eucerin.vn/san-pham/elasticity-filler/3d-serum',
    shopeeUrl: 'https://shopee.vn/eucerin.officialstore?keyword=Eucerin%20Hyaluron-Filler%20Elasticity%203D%20Serum%2030ml',
    shortDescription: {
      vi: 'Tinh chất 3 tác động giảm nếp nhăn, cải thiện độ săn chắc và làm mờ đốm nâu do tuổi tác.',
      en: 'Triple-action serum that reduces wrinkles, improves firmness, and fades age-related dark spots.',
    },
    usageStep: { vi: 'Bước serum, sáng và tối', en: 'Serum step, morning and night' },
  },
  {
    id: 'hf-elasticity-night-care',
    name: 'Eucerin Hyaluron-Filler + Elasticity Night Care',
    category: { vi: 'Kem Dưỡng Đêm Chống Chảy Xệ', en: 'Firming Anti-Sagging Night Care' },
    concernTags: ['fine lines', 'wrinkles', 'anti-aging', 'firmness'],
    imageUrl: '/products/hf-elasticity-night-care.png',
    eucerinUrl: 'https://www.eucerin.vn/san-pham/elasticity-filler/night-care',
    shopeeUrl: 'https://shopee.vn/eucerin.officialstore?keyword=Eucerin%20Hyaluron-Filler%20Elasticity%20Night%20Care%2050ml',
    shortDescription: {
      vi: 'Kem dưỡng đêm hỗ trợ cải thiện nếp nhăn sâu và da chảy xệ, giúp da săn chắc và căng mịn hơn.',
      en: 'Night cream to improve deep wrinkles and sagging, leaving skin firmer and more supple.',
    },
    usageStep: { vi: 'Bước kem dưỡng tối', en: 'Night cream step' },
  },
  {
    id: 'ato-control-face-cream',
    name: 'Eucerin Ato Control Face Cream',
    category: { vi: 'Kem Dưỡng Phục Hồi Hàng Rào Bảo Vệ', en: 'Barrier Recovery Face Cream' },
    concernTags: ['sensitive skin', 'irritation', 'redness', 'dryness'],
    imageUrl: '/products/ato-control-face-cream.png',
    eucerinUrl: 'https://www.eucerin.vn/san-pham/atopicontrol/face-care-cream',
    shopeeUrl: 'https://shopee.vn/eucerin.officialstore?keyword=Eucerin%20Ato%20Control%20Face%20Cream%2050ml',
    shortDescription: {
      vi: 'Kem dưỡng làm dịu, phục hồi và tái tạo hàng rào bảo vệ da cho da khô, nhạy cảm hoặc viêm cơ địa.',
      en: 'Face cream that soothes, repairs, and restores the skin barrier for dry, sensitive, or atopy-prone skin.',
    },
    usageStep: { vi: 'Bước kem dưỡng ẩm, sáng và tối', en: 'Moisturizer step, morning and night' },
  },
  {
    id: 'ph5-facial-cleanser',
    name: 'Eucerin pH5 Sensitive Skin Facial Cleanser',
    category: { vi: 'Sữa Rửa Mặt Da Nhạy Cảm', en: 'Sensitive Skin Facial Cleanser' },
    concernTags: ['sensitive skin', 'irritation', 'redness'],
    imageUrl: '/products/ph5-facial-cleanser.png',
    eucerinUrl: 'https://www.eucerin.vn/san-pham',
    shopeeUrl: 'https://shopee.vn/eucerin.officialstore?keyword=Eucerin%20pH5%20Sensitive%20Skin%20Facial%20Cleanser',
    shortDescription: {
      vi: 'Sữa rửa mặt dịu nhẹ cho da nhạy cảm, làm sạch không gây khô căng và duy trì cân bằng pH tự nhiên.',
      en: 'Gentle cleanser for sensitive skin that cleans without stripping and maintains the skin\'s natural pH balance.',
    },
    usageStep: { vi: 'Bước làm sạch, sáng và tối', en: 'Cleansing step, morning and night' },
  },
  {
    id: 'proacne-cleansing-foam',
    name: 'Eucerin Pro Acne Cleansing Foam',
    category: { vi: 'Sữa Rửa Mặt Tạo Bọt Da Mụn', en: 'Acne Foaming Cleanser' },
    concernTags: ['acne', 'excess oil', 'clogged pores'],
    imageUrl: '/products/proacne-cleansing-foam.png',
    eucerinUrl: 'https://www.eucerin.vn/san-pham/pro-acne',
    shopeeUrl: 'https://shopee.vn/eucerin.officialstore?keyword=Eucerin%20Pro%20Acne%20Cleansing%20Foam%2050g',
    shortDescription: {
      vi: 'Sữa rửa mặt dạng bọt làm sạch sâu cho da nhờn mụn, loại bỏ dầu thừa và bụi bẩn hiệu quả.',
      en: 'Foaming cleanser for deep cleaning of oily, acne-prone skin — removes excess oil and impurities.',
    },
    usageStep: { vi: 'Bước làm sạch, sáng và tối', en: 'Cleansing step, morning and night' },
  },
  {
    id: 'dermopure-toner',
    name: 'Eucerin DermoPure Clinical Purifying Toner',
    category: { vi: 'Nước Cân Bằng Da Mụn', en: 'Acne Skin Purifying Toner' },
    concernTags: ['acne', 'excess oil', 'clogged pores', 'large pores'],
    imageUrl: '/products/dermopure-toner.png',
    eucerinUrl: 'https://www.eucerin.vn/san-pham/pro-acne',
    shopeeUrl: 'https://shopee.vn/eucerin.officialstore?keyword=Eucerin%20DermoPure%20Clinical%20Purifying%20Toner%20200ml',
    shortDescription: {
      vi: 'Nước cân bằng sau rửa mặt, thông thoáng lỗ chân lông và chuẩn bị da cho bước đặc trị mụn.',
      en: 'Post-cleanse toner that unclogs pores and preps skin for acne treatment steps.',
    },
    usageStep: { vi: 'Sau bước làm sạch, trước serum', en: 'After cleansing, before serum' },
  },
  {
    id: 'dermopure-gel-to-foam',
    name: 'Eucerin DermoPure Clinical Correcting Gel To Foam',
    category: { vi: 'Gel Rửa Mặt Da Mụn', en: 'Acne Correcting Gel-to-Foam Cleanser' },
    concernTags: ['acne', 'excess oil', 'clogged pores'],
    imageUrl: '/products/dermopure-gel-to-foam.png',
    eucerinUrl: 'https://www.eucerin.vn/san-pham/pro-acne',
    shopeeUrl: 'https://shopee.vn/eucerin.officialstore?keyword=Eucerin%20DermoPure%20Correcting%20Gel%20To%20Foam%2075ml',
    shortDescription: {
      vi: 'Sản phẩm gel-to-foam làm sạch dầu thừa và bụi bẩn, phù hợp chu trình chăm sóc da mụn.',
      en: 'Gel-to-foam cleanser that removes excess oil and impurities — designed for acne-prone skin routines.',
    },
    usageStep: { vi: 'Bước làm sạch, sáng và tối', en: 'Cleansing step, morning and night' },
  },
  {
    id: 'ultra-sensitive-serum',
    name: 'Eucerin Ultra Sensitive Repair Serum',
    category: { vi: 'Tinh Chất Phục Hồi Da Nhạy Cảm', en: 'Sensitive Skin Repair Serum' },
    concernTags: ['sensitive skin', 'irritation', 'redness', 'dehydration'],
    imageUrl: 'https://www.eucerin.vn/media/_/w/3/w3x4y5z6-7a8b-9c0d-1e2f-3g4h5i6j7k8l-repair-serum.png?im=Resize,width=400',
    eucerinUrl: 'https://www.eucerin.vn/san-pham',
    shopeeUrl: 'https://shopee.vn/eucerin.officialstore?keyword=Eucerin%20Ultra%20Sensitive%20Repair%20Serum%2030ml',
    shortDescription: {
      vi: 'Tinh chất hỗ trợ phục hồi và làm dịu da nhạy cảm, giúp củng cố hàng rào bảo vệ da.',
      en: 'Serum that restores and soothes sensitive skin and strengthens the skin barrier.',
    },
    usageStep: { vi: 'Bước serum, sáng và tối', en: 'Serum step, morning and night' },
  },
]

function getRecommendedProducts(scores = {}, detectedConcerns = []) {
  const hasConcern = (...kws) => kws.some(kw =>
    detectedConcerns.some(c => c.toLowerCase().includes(kw.toLowerCase()) || kw.toLowerCase().includes(c.toLowerCase()))
  )

  const pts = {}
  const add = (id, n) => { pts[id] = (pts[id] || 0) + n }

  // Dark spots / pigmentation
  if ((scores.darkSpots || 0) > 50 || hasConcern('dark spots', 'hyperpigmentation', 'melasma', 'post-acne dark spots', 'uneven skin tone')) {
    add('spotless-booster-serum',   scores.darkSpots || 60)
    add('sun-serum-pigment-control', (scores.darkSpots || 50) * 0.8)
    add('spotless-spot-corrector',   (scores.darkSpots || 50) * 0.7)
    add('spotless-day-fluid', 30)
    add('spotless-night-cream', 25)
  }

  // Acne / oily / texture
  if ((scores.texture || 0) > 50 || hasConcern('acne', 'excess oil', 'clogged pores', 'blackheads', 'large pores')) {
    add('dermopure-clearing-treatment', scores.texture || 60)
    add('dermopure-cleanser',           (scores.texture || 50) * 0.8)
    add('sun-cc-oil-control', 25)
    add('sun-gel-creme-dry-touch', 20)
  }

  // Fine lines / wrinkles / firmness / anti-aging
  if ((scores.fineLines || 0) > 50 || (scores.firmness || 100) < 50 || hasConcern('fine lines', 'wrinkles', 'anti-aging')) {
    const agePts = Math.max(scores.fineLines || 0, 100 - (scores.firmness || 50))
    add('hf-elasticity-3d-serum',    agePts)
    add('hf-elasticity-night-care',  agePts * 0.8)
    add('sun-fluid-photoaging', 25)
    add('q10-night-cream', 20)
    add('hf-eye-cream', 15)
  }

  // Dryness / dehydration / low hydration
  if ((scores.hydration || 100) < 50 || hasConcern('dryness', 'dehydration')) {
    const dryPts = 100 - (scores.hydration || 50)
    add('lipo-balance-cream', dryPts)
    add('hf-night-cream',     dryPts * 0.7)
    add('dermato-clean-micellar', 15)
  }

  // Barrier / sensitive / redness
  if ((scores.barrierHealth || 100) < 50 || hasConcern('sensitive skin', 'irritation', 'redness')) {
    const barrierPts = 100 - (scores.barrierHealth || 50)
    add('ato-control-face-cream', barrierPts)
    add('ultra-sensitive-serum',  barrierPts * 0.8)
    add('ph5-facial-cleanser', 20)
  }

  // Dull skin / low radiance
  if ((scores.radiance || 100) < 50 || hasConcern('dull skin')) {
    add('spotless-booster-serum', 20)
    add('spotless-day-fluid', 20)
    add('sun-fluid-photoaging', 15)
  }

  // UV — always slightly relevant if skin shows aging/spots
  if (hasConcern('UV protection') || (scores.darkSpots || 0) > 40 || (scores.fineLines || 0) > 40) {
    add('sun-fluid-photoaging', 20)
    add('sun-serum-pigment-control', 10)
  }

  // Sort by relevance score, exclude hero (always first)
  const sorted = Object.entries(pts)
    .sort(([, a], [, b]) => b - a)
    .map(([id]) => id)
    .filter(id => id !== 'epicelline-serum')

  const list = ['epicelline-serum']
  for (const id of sorted) {
    if (list.length >= 4) break
    list.push(id)
  }

  // Pad to minimum 3 with sensible fallbacks
  const fallbacks = ['sun-fluid-photoaging', 'spotless-booster-serum', 'hf-elasticity-3d-serum', 'lipo-balance-cream', 'ato-control-face-cream']
  for (const id of fallbacks) {
    if (list.length >= 3) break
    if (!list.includes(id)) list.push(id)
  }

  return list.map(id => EUCERIN_PRODUCTS.find(p => p.id === id)).filter(Boolean)
}

function ScoreBar({ item, score, lang = 'vi' }) {
  const bar = score ?? 0
  // For positive metrics: low=bad(red), mid=yellow, high=good(green)
  // For negative metrics: low=good(green), mid=yellow, high=bad(red)
  const goodness = item.isPositive ? bar : (100 - bar)
  const color = goodness >= 67 ? 'bg-green-500' : goodness >= 34 ? 'bg-yellow-500' : 'bg-primary'
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <item.icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-bold text-foreground">{item.label[lang] ?? item.label}</span>
          {item.isPositive
            ? <TrendingUp className="h-3 w-3 text-green-600" />
            : <TrendingDown className="h-3 w-3 text-primary" />
          }
        </div>
        <span className="font-mono text-sm font-bold text-foreground">{bar}/100</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-muted">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${bar}%` }}
          transition={{ duration: 0.9, delay: 0.2, ease: 'easeOut' }}
          className={cn('h-full rounded-full', color)}
        />
      </div>
    </div>
  )
}

function RoutineCard({ item, isLast }) {
  const color  = STEP_COLOR[item.label] || '#9ca3af'
  const pCfg   = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.secondary
  const p      = item.product

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center flex-shrink-0">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0"
          style={{ background: color + '22', boxShadow: `0 0 0 3px ${color}18` }}
        >
          {item.icon}
        </div>
        {!isLast && <div className="w-px flex-1 min-h-5 mt-1 bg-border" />}
      </div>

      <div className={cn('flex-1', isLast ? 'pb-0' : 'pb-6')}>
        <div className="flex items-center flex-wrap gap-1.5 mb-1">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color }}>{item.label}</span>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{item.when}</span>
          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', pCfg.cls)}>{pCfg.label}</span>
        </div>
        <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{item.why}</p>

        <div className={cn('border rounded-xl p-3.5 flex gap-3', pCfg.border, pCfg.bg)}>
          <div className="w-14 flex-shrink-0 rounded-lg overflow-hidden flex items-center justify-center bg-gradient-to-b from-slate-100 to-slate-200">
            <div className="text-center">
              <div className="w-3.5 h-2 bg-foreground/80 rounded-t mx-auto" />
              <div className="w-6 h-9 bg-foreground rounded-sm mx-auto flex items-center justify-center">
                <span className="font-serif italic font-bold text-[9px] text-white/75">E</span>
              </div>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground mb-1">
              {p.category.replace(/_/g, ' ')}
            </p>
            <p className="font-bold text-sm text-foreground leading-snug mb-1.5">{p.name}</p>
            <p className="text-xs text-muted-foreground leading-relaxed mb-2.5">{p.summary}</p>
            {p.key_ingredients?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {p.key_ingredients.slice(0, 3).map(ing => (
                  <span key={ing} className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">{ing}</span>
                ))}
              </div>
            )}
            <a
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-lg transition-colors',
                item.priority === 'featured'
                  ? 'bg-primary text-white hover:bg-primary/90'
                  : 'bg-foreground text-white hover:bg-foreground/90',
              )}
            >
              Xem trên Shopee <ChevronRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

function ResultsStep({ skinType, aiAnalysis, lang, onContinue }) {
  const t       = RESULTS_CONTENT[lang] || RESULTS_CONTENT.vi
  const scores  = aiAnalysis?.scores || {}
  const concerns = aiAnalysis?.detectedConcerns || []
  const skinAge    = aiAnalysis?.skinAge
  const confidence = aiAnalysis?.confidence
  // Translate skin type if in Vietnamese
  const skinTypeLabel = (SKIN_TYPE_LABELS[lang] || SKIN_TYPE_LABELS.vi)[skinType?.toLowerCase()] || skinType || '—'
  // Primary concern — use bilingual field if available, else the single string
  const mainConcern = (lang === 'vi' ? aiAnalysis?.primaryConcernVi : aiAnalysis?.primaryConcernEn)
    || aiAnalysis?.primaryConcern
    || concerns.slice(0, 2).join(', ')
    || (lang === 'vi' ? 'Chưa xác định' : 'Not detected')

  const [animated, setAnimated] = useState({})
  useEffect(() => {
    const timers = SCORE_ITEMS.map(({ key }, i) => {
      const target = scores[key] ?? 0
      return setTimeout(() => {
        let cur = 0
        const inc = target / 30
        const iv = setInterval(() => {
          cur = Math.min(cur + inc, target)
          setAnimated(prev => ({ ...prev, [key]: Math.round(cur) }))
          if (cur >= target) clearInterval(iv)
        }, 20)
      }, i * 100)
    })
    return () => timers.forEach(clearTimeout)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <motion.div {...fade} className="min-h-[calc(100vh-4rem)] bg-muted/30">
      <div className="flex flex-col items-center px-4 py-8 lg:py-12">
        <motion.div {...slideUp} className="w-full max-w-4xl space-y-8">

          {/* Section title */}
          <div className="text-center">
            <h1 className="mb-2 text-2xl font-bold text-foreground lg:text-3xl">{t.title}</h1>
            <p className="text-muted-foreground">{t.subtitle}</p>
          </div>

          {/* Header cards — matches reference: skinAge | confidence | skinType | mainConcern */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Skin age — gradient primary */}
            <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-4 text-center text-white shadow-lg">
              <p className="mb-1 text-xs font-bold uppercase tracking-wider opacity-80">{t.cards.skinAge.label}</p>
              <p className="text-4xl font-bold">{skinAge ?? '—'}</p>
              {skinAge && <p className="mt-1 text-xs opacity-80">{t.cards.skinAge.unit}</p>}
            </div>
            {/* Confidence */}
            <div className="rounded-2xl bg-card p-4 text-center shadow-lg">
              <p className="mb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.cards.confidence.label}</p>
              <p className="text-4xl font-bold text-primary">{confidence != null ? `${confidence}%` : '—'}</p>
            </div>
            {/* Skin type */}
            <div className="rounded-2xl bg-card p-4 text-center shadow-lg">
              <p className="mb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.cards.skinType.label}</p>
              <p className="text-xl font-bold text-foreground">{skinTypeLabel}</p>
            </div>
            {/* Main concern */}
            <div className="rounded-2xl bg-card p-4 text-center shadow-lg">
              <p className="mb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">{t.cards.mainConcern.label}</p>
              <p className="text-sm font-bold capitalize leading-snug text-foreground">{mainConcern}</p>
            </div>
          </div>

          {/* Main result headline — left-bordered card */}
          <div className="rounded-2xl bg-card shadow-lg" style={{ borderLeft: '4px solid oklch(0.4 0.15 15)' }}>
            <div className="p-6">
              <p className="text-lg leading-relaxed text-foreground">
                {lang === 'vi'
                  ? (aiAnalysis?.descriptionVi || aiAnalysis?.description || aiAnalysis?.headlineVi || aiAnalysis?.headline || '—')
                  : (aiAnalysis?.descriptionEn || aiAnalysis?.description || aiAnalysis?.headlineEn || aiAnalysis?.headline || '—')
                }
              </p>
            </div>
          </div>

          {/* Score bars */}
          <div className="rounded-2xl bg-card shadow-lg">
            <div className="border-b border-border px-6 pt-6 pb-4">
              <h3 className="text-lg font-bold text-foreground">{t.scores.title}</h3>
            </div>
            <div className="space-y-6 p-6">
              {/* Legend */}
              <div className="grid gap-4 rounded-lg bg-muted/50 p-4 text-sm sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">{t.scores.highLabel}</strong> {t.scores.highText}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">{t.scores.lowLabel}</strong> {t.scores.lowText}
                  </span>
                </div>
              </div>
              {/* Bars */}
              <div className="space-y-4">
                {SCORE_ITEMS.map(item => (
                  <ScoreBar key={item.key} item={item} score={animated[item.key]} lang={lang} />
                ))}
              </div>
            </div>
          </div>

          {/* Priority concerns — fixed 3 cards matching reference */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-foreground">{t.priorities.title}</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              {t.priorities.items.map((priority, i) => (
                <motion.div
                  key={priority.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="rounded-2xl bg-card shadow-lg"
                >
                  <div className="p-5">
                    <div className="mb-3 flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <priority.icon className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-xs font-bold text-primary">
                        {lang === 'vi' ? `Ưu tiên ${i + 1}` : `Priority ${i + 1}`}
                      </span>
                    </div>
                    <h4 className="mb-2 font-bold text-foreground">{priority.title}</h4>
                    <p className="text-sm leading-relaxed text-muted-foreground">{priority.copy}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="flex justify-center pt-4">
            <button
              onClick={onContinue}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-base font-bold text-white shadow-lg transition-opacity hover:opacity-90"
            >
              <strong>{t.cta}</strong>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Disclaimer */}
          <div className="space-y-1 pb-4 text-center text-xs text-muted-foreground/80">
            {t.disclaimer.map((line, i) => (
              <p key={i}>{i === 1 ? <strong>{line}</strong> : line}</p>
            ))}
          </div>

        </motion.div>
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════
   STEP 6 — Send Results page
═══════════════════════════════════════════════ */
function SendResultsPage({ aiAnalysis, lang, onBack }) {
  const t = SEND_CONTENT[lang] || SEND_CONTENT.vi
  const [phone, setPhone] = useState('')
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_TEXTBEE_API_KEY || '')
  const [deviceId, setDeviceId] = useState(import.meta.env.VITE_TEXTBEE_DEVICE_ID || '')
  const [showApiConfig, setShowApiConfig] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendStatus, setSendStatus] = useState('')

  const skinAge       = aiAnalysis?.skinAge
  const confidence    = aiAnalysis?.confidence
  const skinType      = aiAnalysis?.skinType
  const skinTypeLabel = SKIN_TYPE_LABELS[lang]?.[skinType] || skinType || '—'
  const mainConcern   = lang === 'vi'
    ? (aiAnalysis?.primaryConcernVi || aiAnalysis?.primaryConcernEn || '—')
    : (aiAnalysis?.primaryConcernEn || aiAnalysis?.primaryConcernVi || '—')

  // SMS body
  const smsBody = lang === 'vi'
    ? `Kết quả phân tích da Eucerin:\n- Tuổi da: ${skinAge ? `${skinAge} tuổi` : '—'}\n- Loại da: ${skinTypeLabel}\n- Mối quan tâm chính: ${mainConcern}\n- Độ tin cậy AI: ${confidence ? `${confidence}%` : '—'}\n\nXem thêm tại: https://www.eucerin.vn`
    : `Eucerin Skin Analysis:\n- Skin age: ${skinAge ? `${skinAge} years old` : '—'}\n- Skin type: ${skinTypeLabel}\n- Main concern: ${mainConcern}\n- AI confidence: ${confidence ? `${confidence}%` : '—'}\n\nLearn more: https://www.eucerin.vn`
  const smsHref = phone
    ? `sms:${phone}?body=${encodeURIComponent(smsBody)}`
    : `sms:?body=${encodeURIComponent(smsBody)}`

  const zaloOAUrl  = 'https://zalo.me/eucerin'
  const zaloSendUrl = 'https://zalo.me/eucerin'

  // Send SMS via textbee.dev API
  const sendViaTextbee = async () => {
    if (!phone || !apiKey || !deviceId) {
      setSendStatus(lang === 'vi' ? 'Vui lòng nhập số điện thoại, API key và Device ID' : 'Please enter phone number, API key and Device ID')
      return
    }

    // Format phone number to E.164 format (add + if missing)
    const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`

    setSending(true)
    setSendStatus('')

    try {
      const response = await fetch(`https://api.textbee.dev/api/v1/gateway/devices/${deviceId}/send-sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({
          recipients: [formattedPhone],
          message: smsBody
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSendStatus(lang === 'vi' ? 'Đã gửi SMS thành công!' : 'SMS sent successfully!')
      } else {
        setSendStatus(lang === 'vi' ? `Lỗi: ${data.message || 'Không thể gửi SMS'}` : `Error: ${data.message || 'Failed to send SMS'}`)
      }
    } catch (error) {
      setSendStatus(lang === 'vi' ? `Lỗi kết nối: ${error.message}` : `Connection error: ${error.message}`)
    } finally {
      setSending(false)
    }
  }

  return (
    <motion.div {...fade} className="min-h-[calc(100vh-4rem)] bg-muted/30 flex items-start justify-center">
      <div className="w-full max-w-md px-4 py-10">
        <motion.div {...slideUp} className="bg-card rounded-2xl shadow-lg p-8 space-y-6">

          {/* Icon + title */}
          <div className="text-center space-y-3">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <MessageCircle className="h-8 w-8 text-blue-500" />
            </div>
            <h2 className="text-xl font-bold text-foreground">{t.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{t.subtitle}</p>
          </div>

          {/* Results summary */}
          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2.5">
            <p className="text-xs font-bold text-foreground">{t.summaryTitle}</p>
            {[
              { label: t.skinAge,       value: skinAge ? `${skinAge} ${t.ageSuffix}` : '—' },
              { label: t.skinTypeLabel, value: skinTypeLabel },
              { label: t.mainConcern,   value: mainConcern },
              { label: t.confidence,    value: confidence ? `${confidence}%` : '—', highlight: true },
            ].map(({ label, value, highlight }) => (
              <div key={label} className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">{label}:</span>
                <span
                  className="text-sm font-bold text-right"
                  style={highlight ? { color: PRIMARY_COLOR } : { color: 'oklch(0.2 0.02 250)' }}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* Phone number input */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-foreground">{t.phoneLabel}</label>
            <div className="flex items-center gap-2 rounded-xl border-2 border-border bg-background px-4 py-2.5 focus-within:border-primary transition-colors">
              <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/[^\d+]/g, ''))}
                placeholder={t.phonePlaceholder}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
            </div>
          </div>

          {/* API Configuration Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              {lang === 'vi' ? 'Cấu hình SMS API' : 'SMS API Configuration'}
            </span>
            <button
              onClick={() => setShowApiConfig(!showApiConfig)}
              className="text-xs font-medium text-primary hover:underline"
            >
              {showApiConfig ? (lang === 'vi' ? 'Ẩn' : 'Hide') : (lang === 'vi' ? 'Hiện' : 'Show')}
            </button>
          </div>

          {/* API Configuration Fields */}
          {showApiConfig && (
            <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  {lang === 'vi' ? 'Textbee API Key' : 'Textbee API Key'}
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder={lang === 'vi' ? 'Nhập API key của bạn' : 'Enter your API key'}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  {lang === 'vi' ? 'Device ID' : 'Device ID'}
                </label>
                <input
                  type="text"
                  value={deviceId}
                  onChange={e => setDeviceId(e.target.value)}
                  placeholder={lang === 'vi' ? 'Nhập Device ID của bạn' : 'Enter your Device ID'}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
                />
              </div>
            </div>
          )}

          {/* Send Status */}
          {sendStatus && (
            <div className={`text-center text-sm ${sendStatus.includes('thành công') || sendStatus.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
              {sendStatus}
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-3">
            <button
              onClick={sendViaTextbee}
              disabled={sending}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white shadow transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#22c55e' }}
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {lang === 'vi' ? 'Đang gửi...' : 'Sending...'}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  {lang === 'vi' ? 'Gửi qua SMS' : 'Send via SMS'}
                </>
              )}
            </button>

            <a
              href={zaloSendUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white shadow transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#0068FF' }}
            >
              <Send className="h-4 w-4" />
              {t.sendZalo}
            </a>

            <a
              href={zaloOAUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-transparent py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              {t.openZaloOA}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {/* Powered by */}
          <p className="text-center text-xs text-muted-foreground">
            {t.poweredBy}{' '}<span className="font-bold text-blue-500">Zalo</span>
          </p>

          {/* Footer links */}
          <div className="flex justify-center gap-3">
            <a
              href="https://www.eucerin.vn"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-full border border-border px-4 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
            >
              <img src="/images/eucerin-logo.png" alt="Eucerin" className="h-4 w-auto" onError={e => { e.target.style.display = 'none' }} />
              {t.homeBtn}
            </a>
            <a
              href="https://shopee.vn/search?keyword=eucerin"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-full border px-4 py-1.5 text-xs font-medium hover:bg-muted"
              style={{ borderColor: PRIMARY_COLOR, color: PRIMARY_COLOR }}
            >
              {t.shopeeBtn}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {/* Back button */}
          <div className="flex justify-center pt-1">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronRight className="h-4 w-4 rotate-180" />
              {t.backBtn}
            </button>
          </div>

        </motion.div>
      </div>
    </motion.div>
  )
}

function ProductsStep({ aiAnalysis, lang, onRescan, onSend }) {
  const navigate = useNavigate()
  const t = PRODUCTS_CONTENT[lang] || PRODUCTS_CONTENT.vi
  const scores   = aiAnalysis?.scores || {}
  const concerns = aiAnalysis?.detectedConcerns || []
  const products = getRecommendedProducts(scores, concerns)

  return (
    <motion.div {...fade} className="min-h-[calc(100vh-4rem)] bg-muted/30">
      <div className="flex flex-col items-center px-4 py-8 lg:py-12">
        <motion.div {...slideUp} className="w-full max-w-4xl space-y-8">

          {/* Section header */}
          <div className="text-center">
            <h2 className="mb-2 text-2xl font-bold text-foreground lg:text-3xl">{t.title}</h2>
            <p className="mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground">{t.subtitle}</p>
          </div>

          {/* Product cards */}
          <div className="grid gap-6 md:grid-cols-2">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="group overflow-hidden rounded-2xl bg-card shadow-lg transition-all hover:shadow-xl"
              >
                {/* Product image area */}
                <div className="relative aspect-square bg-gradient-to-br from-muted/50 to-muted">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="absolute inset-0 h-full w-full object-contain p-6 transition-transform group-hover:scale-105"
                    onError={e => { e.target.style.display = 'none' }}
                  />
                  {/* Category badge */}
                  <span className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-white">
                    {product.category[lang]}
                  </span>
                  {/* Recommended star — first product only */}
                  {index === 0 && (
                    <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-yellow-500 px-2.5 py-0.5 text-xs font-bold text-white">
                      <Star className="h-3 w-3" />
                      {t.recommended}
                    </span>
                  )}
                </div>

                {/* Product info */}
                <div className="space-y-4 p-5">
                  <div>
                    <h3 className="mb-1 text-lg font-bold text-foreground">{product.name}</h3>
                  </div>

                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {product.shortDescription[lang]}
                  </p>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-foreground">{t.howToUse}</span>
                    <span className="text-muted-foreground">{product.usageStep[lang]}</span>
                  </div>

                  {/* Concern tags */}
                  <div className="flex flex-wrap gap-1">
                    {product.concernTags.slice(0, 4).map(tag => (
                      <span key={tag} className="rounded-full border border-border px-2 py-0.5 text-xs text-foreground">
                        {CONCERN_TAG_LABELS[tag]?.[lang] || tag}
                      </span>
                    ))}
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 pt-2">
                    <a
                      href="https://www.eucerin.vn/san-pham"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-border bg-transparent px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                    >
                      {t.learnMore}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    <a
                      href={product.shopeeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-1 items-center justify-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
                      style={{ backgroundColor: '#EE4D2D' }}
                    >
                      <ShoppingBag className="h-3 w-3" />
                      {t.buyShopee}
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Daily routines */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Morning */}
            <div className="rounded-2xl bg-card shadow-lg">
              <div className="flex items-center gap-2 border-b border-border px-6 py-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100">
                  <Sun className="h-4 w-4 text-yellow-600" />
                </div>
                <h4 className="text-lg font-bold text-foreground">{t.morning.title}</h4>
              </div>
              <ol className="space-y-3 p-6">
                {t.morning.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <span className="text-sm text-foreground">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Night */}
            <div className="rounded-2xl bg-card shadow-lg">
              <div className="flex items-center gap-2 border-b border-border px-6 py-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100">
                  <Moon className="h-4 w-4 text-indigo-600" />
                </div>
                <h4 className="text-lg font-bold text-foreground">{t.night.title}</h4>
              </div>
              <ol className="space-y-3 p-6">
                {t.night.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <span className="text-sm text-foreground">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Send Results — navigates to dedicated page */}
          <button
            onClick={onSend}
            className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold text-white shadow-lg transition-opacity hover:opacity-90"
            style={{ background: PRIMARY_COLOR }}
          >
            <Send className="h-5 w-5" />
            {t.sendBtn}
          </button>

          {/* Rescan + Home */}
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={onRescan}
              className="rounded-xl border border-border bg-transparent px-6 py-3 text-sm font-bold text-foreground transition-colors hover:bg-muted"
            >
              {t.rescan}
            </button>
            <button
              onClick={() => navigate('/')}
              className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow transition-opacity hover:opacity-90"
            >
              {t.home}
            </button>
          </div>

        </motion.div>
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════
   Root — ScanPage
═══════════════════════════════════════════════ */
export default function ScanPage() {
  const [step,       setStep]       = useState(0)   // 0=consent 1=camera 2=scan-anim 3=form 4=results 5=products 6=send
  const [lang,       setLang]       = useState('vi')
  const [photos,     setPhotos]     = useState(null)
  const [formData,   setFormData]   = useState(null)
  const [skinType,   setSkinType]   = useState(null)
  const [aiAnalysis, setAiAnalysis] = useState(null)

  const go = n => {
    setStep(n)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCapture    = urls => { setPhotos(urls); go(2) }
  const handleScanDone   = ()   => { go(3) }
  const handleFormSubmit = (data, ai) => {
    setFormData(data)
    const unknownValues = ['Chưa rõ', 'Không chắc chắn', 'Not sure']
    const st = ai?.skinType || (!unknownValues.includes(data?.skinType) ? data?.skinType?.toLowerCase() : 'normal') || 'normal'
    setSkinType(st)
    setAiAnalysis(ai || { skinType: st, detectedConcerns: [], headline: 'Skin profile', description: null, issues: [], advice: null, scores: {} })
    go(4)
  }
  const handleRescan = () => {
    setPhotos(null); setFormData(null); setSkinType(null); setAiAnalysis(null); go(0)
  }

  return (
    <div className="min-h-screen bg-background font-sans">
      <PageHeader lang={lang} setLang={setLang} />
      <AnimatePresence mode="wait">
        {step === 0 && <ConsentStep       key="consent"   onContinue={() => go(1)} lang={lang} />}
        {step === 1 && <CameraStep        key="camera"    onCapture={handleCapture} lang={lang} />}
        {step === 2 && <ScanningStep      key="scanning"  photos={photos} lang={lang} onComplete={handleScanDone} />}
        {step === 3 && <FormStep          key="form"      photos={photos} onSubmit={handleFormSubmit} lang={lang} />}
        {step === 4 && <ResultsStep       key="results"   skinType={skinType} aiAnalysis={aiAnalysis} lang={lang} onContinue={() => go(5)} />}
        {step === 5 && <ProductsStep      key="products"  aiAnalysis={aiAnalysis} lang={lang} onRescan={handleRescan} onSend={() => go(6)} />}
        {step === 6 && <SendResultsPage   key="send"      aiAnalysis={aiAnalysis} lang={lang} onBack={() => go(5)} />}
      </AnimatePresence>
    </div>
  )
}
