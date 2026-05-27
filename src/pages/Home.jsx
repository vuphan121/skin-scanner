import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Sparkles, Droplets, Brain, User, Globe, ChevronDown } from 'lucide-react'

const content = {
  vi: {
    header:     'AURA SCANNING',
    subheading: 'Khám Phá Tuổi Da & Độ Rạng Rỡ Của Bạn',
    subtitle:   'Phân Tích Tuổi Da & Độ Rạng Rỡ Bằng AI',
    body:       'Trải nghiệm phân tích da thẩm mỹ cao cấp được hỗ trợ bởi AI, giúp đánh giá các dấu hiệu có thể quan sát như độ ẩm, độ săn chắc, độ rạng rỡ, kết cấu da, nếp nhăn nhỏ, đốm nâu và sức khỏe hàng rào bảo vệ da.',
    cta:        'Bắt Đầu Aura Scanning',
    disclaimer: 'Trải nghiệm này chỉ mang tính định hướng chăm sóc da thẩm mỹ và không thay thế tư vấn từ bác sĩ da liễu.',
    features: [
      { icon: Brain,    label: 'Phân tích tuổi da' },
      { icon: Sparkles, label: 'Công nghệ AI' },
      { icon: Droplets, label: 'Đánh giá độ ẩm' },
      { icon: User,     label: 'Routine cá nhân hóa' },
    ],
    statCards: [
      { icon: Brain,    value: '7+',   label: 'Chỉ số da được phân tích' },
      { icon: Sparkles, value: 'AI',   label: 'Phân tích hình ảnh thông minh' },
      { icon: Droplets, value: '100%', label: 'Cá nhân hóa cho bạn' },
    ],
    langLabel: 'Tiếng Việt',
    switchTo:  'English',
  },
  en: {
    header:     'AURA SCANNING',
    subheading: 'Discover Your Skin Age & Glow Profile',
    subtitle:   'AI Skin Age & Glow Analysis',
    body:       'A premium AI-powered cosmetic skin assessment designed to evaluate visible signs of hydration, firmness, radiance, texture, fine lines, dark spots, and barrier health.',
    cta:        'Start Aura Scanning',
    disclaimer: 'This experience is for cosmetic guidance only and does not replace professional dermatological advice.',
    features: [
      { icon: Brain,    label: 'Skin age analysis' },
      { icon: Sparkles, label: 'AI Technology' },
      { icon: Droplets, label: 'Hydration assessment' },
      { icon: User,     label: 'Personalized routine' },
    ],
    statCards: [
      { icon: Brain,    value: '7+',   label: 'Skin metrics analyzed' },
      { icon: Sparkles, value: 'AI',   label: 'Smart image analysis' },
      { icon: Droplets, value: '100%', label: 'Personalized for you' },
    ],
    langLabel: 'English',
    switchTo:  'Tiếng Việt',
  },
}

const PRIMARY = 'oklch(0.4 0.15 15)'

// ── hook: track window width ──────────────────────────────────────────────────
function useWindowWidth() {
  const [width, setWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1280
  )
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return width
}

// ── shared: language dropdown ────────────────────────────────────────────────
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

  const c = content[lang]

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.35rem',
          padding: '0.3rem 0.75rem',
          border: `1.5px solid ${PRIMARY}`,
          borderRadius: '999px',
          background: open ? PRIMARY : 'transparent',
          color: open ? 'white' : PRIMARY,
          fontSize: '0.8125rem',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s',
          fontFamily: 'inherit',
        }}
        onMouseEnter={e => { if (!open) { e.currentTarget.style.background = PRIMARY; e.currentTarget.style.color = 'white' } }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = PRIMARY } }}
      >
        <Globe style={{ width: '0.8rem', height: '0.8rem', flexShrink: 0 }} />
        {c.langLabel}
        <ChevronDown style={{
          width: '0.7rem', height: '0.7rem', flexShrink: 0,
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s',
        }} />
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
              minWidth: '9rem',
              background: 'white',
              border: '1px solid oklch(0.92 0.005 90)',
              borderRadius: '0.75rem',
              boxShadow: '0 8px 24px oklch(0 0 0 / 0.10)',
              overflow: 'hidden',
              zIndex: 100,
            }}
          >
            {[{ key: 'vi', label: 'Tiếng Việt' }, { key: 'en', label: 'English' }].map(opt => (
              <button
                key={opt.key}
                onClick={() => { setLang(opt.key); setOpen(false) }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '0.6rem 1rem',
                  border: 'none',
                  background: lang === opt.key ? 'oklch(0.96 0.005 90)' : 'transparent',
                  color: lang === opt.key ? PRIMARY : 'oklch(0.2 0.02 250)',
                  fontSize: '0.8125rem',
                  fontWeight: lang === opt.key ? 600 : 400,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'background 0.15s',
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

// ── rich heading with highlighted words ──────────────────────────────────────
function Heading({ lang }) {
  if (lang === 'vi') return (
    <>Khám Phá <span style={{ color: PRIMARY }}>Tuổi Da</span> &amp; <span style={{ color: PRIMARY }}>Độ Rạng Rỡ</span> Của Bạn</>
  )
  return (
    <>Discover Your <span style={{ color: PRIMARY }}>Skin Age</span> &amp; <span style={{ color: PRIMARY }}>Glow Profile</span></>
  )
}

// ── rich body with bold highlights ───────────────────────────────────────────
function BodyText({ lang }) {
  const bold = { fontWeight: 700, color: 'oklch(0.2 0.02 250)' }
  if (lang === 'vi') return (
    <>Trải nghiệm phân tích da thẩm mỹ cao cấp được hỗ trợ bởi <strong style={bold}>AI</strong>, giúp đánh giá các dấu hiệu có thể quan sát như <strong style={bold}>độ ẩm</strong>, <strong style={bold}>độ săn chắc</strong>, <strong style={bold}>độ rạng rỡ</strong>, kết cấu da, nếp nhăn nhỏ, đốm nâu và sức khỏe hàng rào bảo vệ da.</>
  )
  return (
    <>A premium <strong style={bold}>AI-powered</strong> cosmetic skin assessment designed to evaluate visible signs of <strong style={bold}>hydration</strong>, <strong style={bold}>firmness</strong>, <strong style={bold}>radiance</strong>, texture, fine lines, dark spots, and barrier health.</>
  )
}

// ── MOBILE layout ─────────────────────────────────────────────────────────────
function MobileHome({ lang, setLang, navigate }) {
  const c = content[lang]
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', background: 'oklch(0.99 0.002 90)' }}>

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50, width: '100%',
        borderBottom: '1px solid oklch(0.92 0.005 90 / 0.4)',
        background: 'oklch(0.99 0.002 90 / 0.95)',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ padding: '0 1.25rem', height: '3.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <img src="/images/eucerin-logo.png" alt="Eucerin" style={{ height: '1.75rem', width: 'auto', objectFit: 'contain' }} />
          <LangDropdown lang={lang} setLang={setLang} />
        </div>
      </header>

      {/* Hero */}
      <main style={{ flex: 1 }}>

        {/* ── Image block — full width, fixed height, face fully visible ── */}
        <div style={{ position: 'relative', width: '100%', height: '300px', overflow: 'hidden' }}>
          <img
            src="/images/hero-skin-scan.png"
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%' }}
          />
          {/* Fade out to page background at the bottom */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, transparent 40%, oklch(0.99 0.002 90) 100%)',
          }} />
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={lang}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{
              padding: '1rem 1.25rem 2.5rem',
              display: 'flex', flexDirection: 'column', gap: '1.25rem',
            }}
          >
            {/* AURA SCANNING — big header */}
            <h1 style={{
              fontSize: 'clamp(2.25rem, 9vw, 3rem)',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              color: PRIMARY,
              margin: 0,
              textTransform: 'uppercase',
            }}>
              {c.header}
            </h1>

            {/* Subheading + subtitle */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '-0.5rem' }}>
              <p style={{ fontSize: '1rem', fontWeight: 600, color: 'oklch(0.2 0.02 250)', margin: 0, lineHeight: 1.4 }}>
                {c.subheading}
              </p>
              <p style={{ fontSize: '0.8125rem', fontWeight: 400, color: 'oklch(0.2 0.02 250 / 0.55)', margin: 0 }}>
                {c.subtitle}
              </p>
            </div>

            {/* Body */}
            <p style={{ fontSize: '0.9375rem', lineHeight: 1.7, color: 'oklch(0.45 0.02 250)', margin: 0 }}>
              <BodyText lang={lang} />
            </p>

            {/* Feature pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {c.features.map(f => (
                <div
                  key={f.label}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    background: 'oklch(0.97 0.003 90 / 0.9)',
                    border: '1px solid oklch(0.92 0.005 90)',
                    borderRadius: '999px',
                    padding: '0.4rem 0.875rem',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <f.icon style={{ width: '0.875rem', height: '0.875rem', color: PRIMARY, flexShrink: 0 }} />
                  <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'oklch(0.2 0.02 250)' }}>{f.label}</span>
                </div>
              ))}
            </div>

            {/* CTA — full width */}
            <button
              onClick={() => navigate('/scan')}
              style={{
                width: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                background: PRIMARY, color: 'white',
                fontWeight: 700, fontSize: '1rem',
                padding: '1rem',
                borderRadius: '0.75rem', border: 'none', cursor: 'pointer',
                boxShadow: `0 4px 20px ${PRIMARY.replace(')', ' / 0.35)')}`,
                fontFamily: 'inherit',
                marginTop: '0.25rem',
              }}
            >
              {c.cta}
              <ArrowRight style={{ width: '1.1rem', height: '1.1rem' }} />
            </button>

            {/* Disclaimer */}
            <p style={{ fontSize: '0.6875rem', color: 'oklch(0.5 0.02 250 / 0.75)', lineHeight: 1.6, margin: 0, textAlign: 'center' }}>
              {c.disclaimer}
            </p>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}

// ── DESKTOP layout ────────────────────────────────────────────────────────────
function DesktopHome({ lang, setLang, navigate }) {
  const c = content[lang]
  return (
    <div style={{ minHeight: '100vh', background: 'oklch(0.99 0.002 90)', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50, width: '100%',
        borderBottom: '1px solid oklch(0.92 0.005 90 / 0.4)',
        background: 'oklch(0.99 0.002 90 / 0.95)',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 3rem', height: '4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <img src="/images/eucerin-logo.png" alt="Eucerin" style={{ height: '2rem', width: 'auto', objectFit: 'contain' }} />
          <LangDropdown lang={lang} setLang={setLang} />
        </div>
      </header>

      {/* Hero */}
      <main style={{ flex: 1 }}>
        <div style={{ position: 'relative', minHeight: 'calc(100vh - 4rem)', display: 'flex', alignItems: 'center' }}>

          {/* Background image + gradient */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
            <img
              src="/images/hero-skin-scan.png"
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
            />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to right, oklch(0.99 0.002 90) 0%, oklch(0.99 0.002 90) 38%, oklch(0.99 0.002 90 / 0.85) 52%, oklch(0.99 0.002 90 / 0.4) 70%, transparent 100%)',
            }} />
          </div>

          {/* Content */}
          <div style={{ position: 'relative', zIndex: 10, width: '100%' }}>
            <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '5rem 3rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5rem', alignItems: 'center' }}>

                {/* Left column */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={lang}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
                  >
                    {/* Main header */}
                    <h1 style={{
                      fontSize: 'clamp(2.5rem, 3.8vw, 3.75rem)',
                      fontWeight: 800,
                      lineHeight: 1.1,
                      letterSpacing: '-0.02em',
                      color: PRIMARY,
                      margin: 0,
                      textTransform: 'uppercase',
                    }}>
                      {c.header}
                    </h1>

                    {/* Subheading + subtitle */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <p style={{ fontSize: '1.125rem', fontWeight: 600, color: 'oklch(0.2 0.02 250)', margin: 0, lineHeight: 1.4 }}>
                        {c.subheading}
                      </p>
                      <p style={{ fontSize: '0.875rem', fontWeight: 400, color: 'oklch(0.2 0.02 250 / 0.55)', margin: 0 }}>
                        {c.subtitle}
                      </p>
                    </div>

                    {/* Body */}
                    <p style={{ fontSize: '1rem', lineHeight: 1.75, color: 'oklch(0.5 0.02 250)', margin: 0, maxWidth: '34rem' }}>
                      {c.body}
                    </p>

                    {/* Feature pills */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {c.features.map(f => (
                        <div
                          key={f.label}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            background: 'oklch(0.96 0.005 90 / 0.85)',
                            border: '1px solid oklch(0.92 0.005 90)',
                            borderRadius: '999px',
                            padding: '0.375rem 0.875rem',
                            backdropFilter: 'blur(8px)',
                          }}
                        >
                          <f.icon style={{ width: '0.875rem', height: '0.875rem', color: PRIMARY, flexShrink: 0 }} />
                          <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'oklch(0.2 0.02 250)' }}>{f.label}</span>
                        </div>
                      ))}
                    </div>

                    {/* CTA */}
                    <div style={{ paddingTop: '0.5rem' }}>
                      <button
                        onClick={() => navigate('/scan')}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                          background: PRIMARY, color: 'white',
                          fontWeight: 700, fontSize: '0.9375rem',
                          padding: '0.875rem 2rem',
                          borderRadius: '0.5rem', border: 'none', cursor: 'pointer',
                          boxShadow: `0 4px 16px ${PRIMARY.replace(')', ' / 0.3)')}`,
                          transition: 'all 0.2s',
                          fontFamily: 'inherit',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'oklch(0.35 0.15 15)'}
                        onMouseLeave={e => e.currentTarget.style.background = PRIMARY}
                      >
                        {c.cta}
                        <ArrowRight style={{ width: '1rem', height: '1rem' }} />
                      </button>
                    </div>

                    {/* Disclaimer */}
                    <p style={{ fontSize: '0.75rem', color: 'oklch(0.5 0.02 250 / 0.7)', lineHeight: 1.6, margin: 0, maxWidth: '30rem' }}>
                      {c.disclaimer}
                    </p>
                  </motion.div>
                </AnimatePresence>

                {/* Right column — stat cards */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}
                >
                  <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {c.statCards.map((card, i) => (
                      <motion.div
                        key={`${lang}-${i}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.55 + i * 0.12, duration: 0.45 }}
                        style={{
                          marginLeft: i % 2 === 0 ? 'auto' : '0',
                          width: '17rem',
                          borderRadius: '1.25rem',
                          border: '1px solid oklch(0.92 0.005 90 / 0.6)',
                          background: 'oklch(1 0 0 / 0.88)',
                          padding: '1.25rem 1.5rem',
                          boxShadow: '0 8px 32px oklch(0 0 0 / 0.07)',
                          backdropFilter: 'blur(12px)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{
                            width: '3rem', height: '3rem', flexShrink: 0,
                            borderRadius: '50%',
                            background: 'oklch(0.4 0.15 15 / 0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <card.icon style={{ width: '1.5rem', height: '1.5rem', color: PRIMARY }} />
                          </div>
                          <div>
                            <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'oklch(0.2 0.02 250)', margin: 0, lineHeight: 1 }}>{card.value}</p>
                            <p style={{ fontSize: '0.75rem', color: 'oklch(0.5 0.02 250)', margin: '0.25rem 0 0' }}>{card.label}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

              </div>
            </div>
          </div>
        </div>
      </main>

    </div>
  )
}

// ── Root component ────────────────────────────────────────────────────────────
export default function Home() {
  const navigate = useNavigate()
  const [lang, setLang] = useState('vi')
  const width = useWindowWidth()
  const isMobile = width < 768

  return isMobile
    ? <MobileHome  lang={lang} setLang={setLang} navigate={navigate} />
    : <DesktopHome lang={lang} setLang={setLang} navigate={navigate} />
}
