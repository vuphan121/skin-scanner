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
        setValidError(result.reason || t.validErr)
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
                      <p style={{ fontSize: '0.8125rem', color: '#dc2626', margin: 0, lineHeight: 1.5 }}>{validError}</p>
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
                          <p style={{ fontSize: '0.8125rem', color: '#dc2626', margin: 0, lineHeight: 1.5 }}>{validError}</p>
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
                          <div style={{ width: '40%', height: '55%', borderRadius: '50%', border: '2px dashed rgba(255,255,255,0.75)', boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)' }} />
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
    rescan: 'Quét Lại',
    home:   'Về Trang Chủ',
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
    rescan: 'Scan Again',
    home:   'Go Home',
  },
}

// ── Eucerin product catalogue ─────────────────────────────────────────
const EUCERIN_PRODUCTS = [
  {
    id: 'epicelline-serum',
    name: 'Eucerin Hyaluron-Filler Epicelline Serum',
    category: { vi: 'Serum Chống Lão Hóa Chủ Lực', en: 'Hero Anti-Aging Serum' },
    concernTags: ['hydration', 'fine lines', 'firmness', 'radiance', 'texture', 'anti-aging'],
    imageUrl: 'https://www.eucerin.vn/media/d/a/daca8ee6-7c74-4c9e-bf4c-1bc33d26af3e-image-hyaluron-filler-epicelline-serum-image-1.png?im=Resize,width=400',
    eucerinUrl: 'https://www.eucerin.vn/san-pham/hyaluron-filler/epicelline-serum',
    shopeeUrl: 'https://shopee.vn/search?keyword=eucerin+hyaluron+filler+epicelline+serum',
    shortDescription: {
      vi: 'Được gợi ý như serum chủ lực khi hồ sơ da cho thấy dấu hiệu mất nước, nếp nhăn nhỏ, độ săn chắc giảm, kết cấu da chưa đều hoặc độ rạng rỡ thấp.',
      en: 'Recommended as the hero serum when the skin profile shows visible dehydration, fine lines, reduced firmness, uneven texture, or lower radiance.',
    },
    usageStep: { vi: 'Bước serum, dùng buổi sáng và buổi tối', en: 'Serum step, morning and night' },
    price: '1.200.000đ',
  },
  {
    id: 'anti-pigment-dual-serum',
    name: 'Eucerin Anti-Pigment Dual Serum',
    category: { vi: 'Hỗ Trợ Cải Thiện Đốm Nâu', en: 'Dark Spot Support' },
    concernTags: ['dark spots', 'uneven tone', 'radiance', 'brightening'],
    imageUrl: 'https://www.eucerin.vn/media/6/5/651ba8ae-c39f-4ed2-beda-a4a04dc0b3df-image-anti-pigment-dual-serum.png?im=Resize,width=400',
    eucerinUrl: 'https://www.eucerin.vn/san-pham/anti-pigment/dual-serum',
    shopeeUrl: 'https://shopee.vn/search?keyword=eucerin+anti+pigment+dual+serum',
    shortDescription: {
      vi: 'Được gợi ý khi hồ sơ da cho thấy đốm nâu có thể quan sát, da không đều màu hoặc xỉn màu.',
      en: 'Recommended when the skin profile shows visible dark spots, uneven tone, or dullness.',
    },
    usageStep: { vi: 'Bước serum hỗ trợ chuyên biệt', en: 'Targeted serum step' },
    price: '990.000đ',
  },
  {
    id: 'sun-fluid-anti-age',
    name: 'Eucerin Sun Fluid Anti-Age SPF50+',
    category: { vi: 'Bảo Vệ Da Hằng Ngày Trước Tia UV', en: 'Daily UV Protection' },
    concernTags: ['SPF', 'dark spots', 'anti-aging', 'barrier protection', 'radiance'],
    imageUrl: 'https://www.eucerin.vn/media/7/1/71a0e0a0-2a6e-4cfc-8fcd-00c9bc0e0e59-image-sun-fluid-anti-age.png?im=Resize,width=400',
    eucerinUrl: 'https://www.eucerin.vn/san-pham/sun-protection/sun-fluid-anti-age-spf50',
    shopeeUrl: 'https://shopee.vn/search?keyword=eucerin+sun+fluid+anti+age+spf50',
    shortDescription: {
      vi: 'Được gợi ý để hỗ trợ bảo vệ da trước tia UV, một yếu tố có thể góp phần làm xuất hiện dấu hiệu lão hóa, xỉn màu và đốm nâu.',
      en: 'Recommended to help protect skin from UV exposure, which can contribute to visible aging signs, dullness, and dark spots.',
    },
    usageStep: { vi: 'Bước cuối trong chu trình chăm sóc da buổi sáng', en: 'Final morning skincare step' },
    price: '550.000đ',
  },
  {
    id: 'hyaluron-filler-day-cream',
    name: 'Eucerin Hyaluron-Filler Day Cream SPF30',
    category: { vi: 'Cấp Ẩm Hằng Ngày & Hỗ Trợ Da Căng Mọng', en: 'Daily Moisture & Plumping' },
    concernTags: ['hydration', 'plumping', 'fine lines', 'anti-aging'],
    imageUrl: 'https://www.eucerin.vn/media/a/4/a4c4e0e0-2a6e-4cfc-8fcd-00c9bc0e0e59-image-hyaluron-filler-day-cream.png?im=Resize,width=400',
    eucerinUrl: 'https://www.eucerin.vn/san-pham/hyaluron-filler/day-cream-spf30',
    shopeeUrl: 'https://shopee.vn/search?keyword=eucerin+hyaluron+filler+day+cream+spf30',
    shortDescription: {
      vi: 'Được gợi ý để hỗ trợ cấp ẩm hằng ngày và bổ trợ cho bước serum chống lão hóa.',
      en: 'Recommended to support daily moisture and complement the anti-aging serum step.',
    },
    usageStep: { vi: 'Bước kem dưỡng ẩm', en: 'Moisturizer step' },
    price: '780.000đ',
  },
]

function getRecommendedProducts(scores = {}, detectedConcerns = []) {
  const hasConcern = (...kws) => kws.some(kw =>
    detectedConcerns.some(c => c.toLowerCase().includes(kw.toLowerCase()) || kw.toLowerCase().includes(c.toLowerCase()))
  )
  const list = []
  // Hero serum — always first, per brand strategy
  list.push(EUCERIN_PRODUCTS.find(p => p.id === 'epicelline-serum'))
  // Dark spot serum if high darkSpots score or relevant concerns
  if ((scores.darkSpots ?? 0) > 45 || hasConcern('dark spots', 'hyperpigmentation', 'melasma', 'uneven', 'spots'))
    list.push(EUCERIN_PRODUCTS.find(p => p.id === 'anti-pigment-dual-serum'))
  // SPF if low radiance or high darkSpots
  if ((scores.radiance ?? 100) < 60 || (scores.darkSpots ?? 0) > 40)
    list.push(EUCERIN_PRODUCTS.find(p => p.id === 'sun-fluid-anti-age'))
  // Day cream if low hydration
  if ((scores.hydration ?? 100) < 55)
    list.push(EUCERIN_PRODUCTS.find(p => p.id === 'hyaluron-filler-day-cream'))

  // Guarantee at least 3 products — pad with remaining in catalogue order
  const ORDER = ['epicelline-serum', 'sun-fluid-anti-age', 'hyaluron-filler-day-cream', 'anti-pigment-dual-serum']
  for (const id of ORDER) {
    if (list.length >= 3) break
    if (!list.find(p => p.id === id)) {
      const p = EUCERIN_PRODUCTS.find(p => p.id === id)
      if (p) list.push(p)
    }
  }

  return list.filter(Boolean)
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
                {aiAnalysis?.description || aiAnalysis?.headline || '—'}
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
   ProductsStep
═══════════════════════════════════════════════ */
function ProductsStep({ aiAnalysis, lang, onRescan }) {
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
                        {tag}
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

          {/* Rescan + Home */}
          <div className="flex justify-center gap-3 pt-4">
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
  const [step,       setStep]       = useState(0)   // 0=consent 1=camera 2=scan-anim 3=form 4=results 5=products
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
        {step === 0 && <ConsentStep    key="consent"   onContinue={() => go(1)} lang={lang} />}
        {step === 1 && <CameraStep     key="camera"    onCapture={handleCapture} lang={lang} />}
        {step === 2 && <ScanningStep   key="scanning"  photos={photos} lang={lang} onComplete={handleScanDone} />}
        {step === 3 && <FormStep       key="form"      photos={photos} onSubmit={handleFormSubmit} lang={lang} />}
        {step === 4 && <ResultsStep    key="results"   skinType={skinType} aiAnalysis={aiAnalysis} lang={lang} onContinue={() => go(5)} />}
        {step === 5 && <ProductsStep   key="products"  aiAnalysis={aiAnalysis} lang={lang} onRescan={handleRescan} />}
      </AnimatePresence>
    </div>
  )
}
