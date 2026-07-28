import React, { useState, useRef, useEffect } from 'react';

const tg = window.Telegram?.WebApp;
const user = tg?.initDataUnsafe?.user;
const urlParams = new URLSearchParams(window.location.search);
const CHAT_ID = urlParams.get('chatId') || user?.id || '';

const QUICK_PROMPTS = [
  "9-sinf Fizika: yorug'lik tezligi",
  "Python CRUD amaliy dars",
  "Ingliz tili Present Simple ochiq dars",
  "Matematika: kvadrat tenglamalar",
];

const STEPS = [
  "Mavzu tahlil qilinmoqda...",
  "Slayd rejasi tuzilmoqda...",
  "Kontent yozilmoqda...",
  "Dizayn qo'llanilmoqda...",
  "PPTX fayl yaratilmoqda...",
  "Telegram'ga yuborilmoqda...",
];

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const [sentTopic, setSentTopic] = useState('');
  const [error, setError] = useState('');
  const [slides, setSlides] = useState(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const inputRef = useRef(null);
  const progressRef = useRef(null);

  // Chatbot State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([{ role: 'ai', text: "Salom! Men Presentation AI yordamchisiman. Sizga qanday yordam bera olaman?" }]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => { if (tg) { tg.ready(); tg.expand(); } }, []);

  const runProgress = () => {
    let p = 0;
    let s = 0;
    progressRef.current = setInterval(() => {
      p += Math.random() * 3 + 1;
      if (p > 90) p = 90;
      setProgress(Math.round(p));
      const newS = Math.min(Math.floor(p / 16), STEPS.length - 1);
      if (newS !== s) { s = newS; setStepIdx(newS); }
    }, 400);
  };

  const stopProgress = (success) => {
    if (progressRef.current) clearInterval(progressRef.current);
    setProgress(success ? 100 : 0);
  };

  const handleGenerate = async (promptText) => {
    const finalTopic = (promptText || topic).trim();
    if (!finalTopic || loading) return;
    setLoading(true);
    setError('');
    setSlides(null);
    setActiveSlide(0);
    setSentTopic(finalTopic);
    setProgress(0);
    setStepIdx(0);
    setSidebarOpen(false);
    runProgress();

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
      if (!CHAT_ID) throw new Error("Iltimos, botda /start ni qayta bosing.");

      const res = await fetch(`${backendUrl}/api/generate-slides`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: finalTopic, chatId: CHAT_ID })
      });

      if (!res.ok) throw new Error(`Server xatosi (${res.status})`);
      const result = await res.json();
      if (!result.success) throw new Error(result.error || "Noma'lum xatolik");

      stopProgress(true);
      setSlides(result.slides || []);
      setTopic('');
    } catch (err) {
      stopProgress(false);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim();
    setChatMessages(p => [...p, { role: 'user', text: msg }]);
    setChatInput('');
    setChatLoading(true);
    
    try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
        const res = await fetch(`${backendUrl}/api/support-chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: msg })
        });
        const data = await res.json();
        if (data.success) {
            setChatMessages(p => [...p, { role: 'ai', text: data.reply }]);
        } else {
            setChatMessages(p => [...p, { role: 'ai', text: "Uzur, xatolik yuz berdi." }]);
        }
    } catch (e) {
        setChatMessages(p => [...p, { role: 'ai', text: "Uzur, tarmoqda xatolik yuz berdi." }]);
    } finally {
        setChatLoading(false);
    }
  };

  const userName = user ? `${user.first_name || ''}${user.last_name ? ' ' + user.last_name : ''}`.trim() : 'Foydalanuvchi';
  const userUsername = user?.username ? `@${user.username}` : '';
  const userInitial = userName.charAt(0).toUpperCase();

  const screen = loading ? 'loading' : slides ? 'slides' : error ? 'error' : 'home';

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#f7f8fc', fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", position: 'relative' }}>

      {/* Overlay */}
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 40, backdropFilter: 'blur(3px)' }} />}

      {/* ── SIDEBAR ── */}
      <div style={{ position: 'fixed', top: 0, left: sidebarOpen ? 0 : '-290px', width: 285, height: '100vh', background: '#fff', zIndex: 50, display: 'flex', flexDirection: 'column', transition: 'left .28s cubic-bezier(.4,0,.2,1)', boxShadow: sidebarOpen ? '6px 0 30px rgba(0,0,0,.13)' : 'none' }}>
        {/* Logo */}
        <div style={{ padding: '18px 18px 14px', borderBottom: '1px solid #f0f0f8', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: 'linear-gradient(135deg,#6c63ff,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📊</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1a2e' }}>Presentation AI</div>
            <div style={{ fontSize: 11, color: '#9a9db8' }}>O'qituvchi assistenti</div>
          </div>
          <button onClick={() => setSidebarOpen(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: 18, lineHeight: 1, borderRadius: 6, padding: 4 }}>✕</button>
        </div>

        {/* Buttons */}
        <div style={{ padding: '14px 14px 6px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={() => { setSidebarOpen(false); setSlides(null); setError(''); setTimeout(() => inputRef.current?.focus(), 300); }}
            style={{ padding: '11px 14px', background: 'linear-gradient(135deg,#6c63ff,#4f46e5)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 14px rgba(108,99,255,.3)' }}>
            <span style={{ fontSize: 18 }}>＋</span> Yangi taqdimot
          </button>
          <button style={{ padding: '11px 14px', background: 'linear-gradient(135deg,#a855f7,#7c3aed)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, opacity: .85 }}>
            <span>✨</span> Coming Soon
          </button>
        </div>

        {/* History */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 14px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#b0b3c8', letterSpacing: '.07em', margin: '10px 0 8px' }}>O'TGAN DARSLAR</div>
          {sentTopic && (
            <div style={{ padding: '9px 12px', borderRadius: 10, color: '#4b4b70', fontSize: 13, cursor: 'pointer', background: '#f4f3ff', marginBottom: 4 }}>
              📊 {sentTopic.length > 30 ? sentTopic.slice(0, 30) + '…' : sentTopic}
            </div>
          )}
        </div>

        {/* User */}
        <div style={{ padding: '14px 16px', borderTop: '1px solid #f0f0f8', display: 'flex', alignItems: 'center', gap: 11, background: '#fafafe' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#6c63ff,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>{userInitial}</div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#1a1a2e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userName}</div>
            {userUsername && <div style={{ fontSize: 12, color: '#9a9db8' }}>{userUsername}</div>}
          </div>
        </div>
      </div>

      {/* ── MAIN ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '13px 18px', display: 'flex', alignItems: 'center', gap: 12, background: '#fff', borderBottom: '1px solid #f0f0f8', boxShadow: '0 1px 4px rgba(0,0,0,.05)' }}>
          <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b4b70', fontSize: 20, display: 'flex', alignItems: 'center', padding: '3px 6px', borderRadius: 8 }}>☰</button>
          <span style={{ fontWeight: 600, fontSize: 15, color: '#1a1a2e' }}>
            {screen === 'slides' ? sentTopic : 'Yangi taqdimot'}
          </span>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: screen === 'home' ? 'center' : 'flex-start', padding: '20px 16px 12px' }}>

          {/* HOME */}
          {screen === 'home' && (
            <div style={{ textAlign: 'center', width: '100%', maxWidth: 340 }}>
              <div style={{ width: 76, height: 76, borderRadius: 22, background: 'linear-gradient(135deg,#ede9fe,#ddd6fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', fontSize: 36 }}>📊</div>
              <h2 style={{ fontWeight: 800, fontSize: 22, color: '#1a1a2e', margin: '0 0 10px' }}>Qanday dars o'tmoqchisiz?</h2>
              <p style={{ color: '#7b7fa8', fontSize: 14, margin: '0 0 24px', lineHeight: 1.65 }}>Mavzuni erkin tilda yozing. AI o'zi mos fan, sinf va slaydlarni tuzib beradi.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                {QUICK_PROMPTS.map((p, i) => (
                  <button key={i} onClick={() => handleGenerate(p)}
                    style={{ padding: '9px 20px', background: '#fff', border: '1.5px solid #e0dff8', borderRadius: 50, color: '#4f46e5', fontSize: 13, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f0eeff'; e.currentTarget.style.borderColor = '#6c63ff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e0dff8'; }}>
                    "{p}"
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* LOADING */}
          {screen === 'loading' && (
            <div style={{ width: '100%', maxWidth: 340 }}>
              {/* Sent bubble */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
                <div style={{ background: 'linear-gradient(135deg,#6c63ff,#4f46e5)', color: '#fff', padding: '11px 16px', borderRadius: '18px 18px 4px 18px', fontSize: 14, fontWeight: 500, maxWidth: '85%', lineHeight: 1.5 }}>{sentTopic}</div>
              </div>
              {/* Progress card */}
              <div style={{ background: '#fff', borderRadius: 18, padding: '20px 20px 18px', boxShadow: '0 4px 24px rgba(108,99,255,.1)', border: '1px solid #ede9fe' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #6c63ff', borderTopColor: 'transparent', animation: 'spin .8s linear infinite', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#1a1a2e' }}>Generating lesson...</div>
                    <div style={{ fontSize: 12, color: '#9a9db8', marginTop: 2 }}>AI is preparing your lesson.</div>
                  </div>
                </div>
                {/* Progress bar */}
                <div style={{ height: 7, background: '#ede9fe', borderRadius: 10, overflow: 'hidden', marginBottom: 10 }}>
                  <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,#6c63ff,#a855f7)', borderRadius: 10, transition: 'width .4s ease' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#9a9db8' }}>
                  <span>• {STEPS[stepIdx]}</span>
                  <span style={{ fontWeight: 600, color: '#6c63ff' }}>{progress}%</span>
                </div>
              </div>
            </div>
          )}

          {/* SLIDES */}
          {screen === 'slides' && slides && (
            <div style={{ width: '100%', maxWidth: 380 }}>
              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 18, color: '#1a1a2e' }}>Slaydlar</div>
                <div style={{ background: 'linear-gradient(135deg,#6c63ff,#4f46e5)', color: '#fff', padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 3px 10px rgba(108,99,255,.35)' }}>
                  📎 PPTX yuborildi ✓
                </div>
              </div>

              {/* Slide card */}
              <div style={{ background: 'linear-gradient(135deg,#2d3a8c,#1e3a8a)', borderRadius: 18, padding: '22px 20px', marginBottom: 12, minHeight: 180, boxShadow: '0 8px 28px rgba(30,58,138,.3)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 12, left: 16, background: '#f59e0b', color: '#fff', fontWeight: 700, fontSize: 12, padding: '3px 9px', borderRadius: 7 }}>
                  {String(activeSlide + 1).padStart(2, '0')}
                </div>
                <div style={{ marginTop: 24, color: '#fff', fontWeight: 700, fontSize: 20, marginBottom: 16, lineHeight: 1.3 }}>
                  {slides[activeSlide]?.title}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {(slides[activeSlide]?.bullets || []).map((b, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{ width: 22, height: 22, borderRadius: 6, background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                        <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>▶</span>
                      </div>
                      <span style={{ color: '#e0e7ff', fontSize: 14, lineHeight: 1.5 }}>{b}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <button onClick={() => setActiveSlide(p => Math.max(0, p - 1))} disabled={activeSlide === 0}
                  style={{ padding: '9px 16px', background: activeSlide === 0 ? '#f4f3ff' : '#fff', border: '1.5px solid #e0dff8', borderRadius: 10, color: activeSlide === 0 ? '#c4b5fd' : '#4f46e5', fontWeight: 600, fontSize: 13, cursor: activeSlide === 0 ? 'default' : 'pointer' }}>
                  ← Oldingi
                </button>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#6c63ff' }}>{activeSlide + 1} / {slides.length}</span>
                <button onClick={() => setActiveSlide(p => Math.min(slides.length - 1, p + 1))} disabled={activeSlide === slides.length - 1}
                  style={{ padding: '9px 16px', background: activeSlide === slides.length - 1 ? '#f4f3ff' : '#fff', border: '1.5px solid #e0dff8', borderRadius: 10, color: activeSlide === slides.length - 1 ? '#c4b5fd' : '#4f46e5', fontWeight: 600, fontSize: 13, cursor: activeSlide === slides.length - 1 ? 'default' : 'pointer' }}>
                  Keyingi →
                </button>
              </div>

              {/* Slide dots */}
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 18 }}>
                {slides.map((_, i) => (
                  <button key={i} onClick={() => setActiveSlide(i)}
                    style={{ width: i === activeSlide ? 24 : 8, height: 8, borderRadius: 4, background: i === activeSlide ? '#6c63ff' : '#e0dff8', border: 'none', cursor: 'pointer', padding: 0, transition: 'all .2s' }} />
                ))}
              </div>

              {/* Bottom actions */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { setSlides(null); setError(''); setActiveSlide(0); }}
                  style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg,#6c63ff,#4f46e5)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 4px 14px rgba(108,99,255,.3)' }}>
                  🔄 Yangi dars
                </button>
                <button style={{ flex: 1, padding: '12px', background: '#fff', color: '#6c63ff', border: '1.5px solid #e0dff8', borderRadius: 12, fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  💬 Fikr bildirish
                </button>
              </div>
            </div>
          )}

          {/* ERROR */}
          {screen === 'error' && (
            <div style={{ textAlign: 'center', maxWidth: 300 }}>
              <div style={{ fontSize: 52, marginBottom: 14 }}>😕</div>
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 14, padding: '14px 16px', color: '#dc2626', fontSize: 13, marginBottom: 16, textAlign: 'left', wordBreak: 'break-word' }}>{error}</div>
              <button onClick={() => setError('')} style={{ padding: '11px 28px', background: 'linear-gradient(135deg,#6c63ff,#4f46e5)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Qayta urinish</button>
            </div>
          )}
        </div>

        {/* ── INPUT ── */}
        {(screen === 'home' || screen === 'error') && (
          <div style={{ padding: '10px 14px 18px', background: '#fff', borderTop: '1px solid #f0f0f8' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f4f3ff', border: '2px solid #6c63ff', borderRadius: 16, padding: '10px 12px', boxShadow: '0 2px 14px rgba(108,99,255,.12)' }}>
              <input ref={inputRef} type="text" placeholder="Yangi dars yaratish uchun prompt yozing..."
                value={topic}
                onChange={e => { setTopic(e.target.value); setError(''); }}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
                disabled={loading}
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 14, color: '#1a1a2e', caretColor: '#6c63ff' }} />
              <button onClick={() => handleGenerate()} disabled={!topic.trim() || loading}
                style={{ width: 38, height: 38, borderRadius: 11, background: topic.trim() ? 'linear-gradient(135deg,#6c63ff,#4f46e5)' : '#ddd6fe', border: 'none', cursor: topic.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 17, flexShrink: 0, transition: 'all .2s', boxShadow: topic.trim() ? '0 3px 10px rgba(108,99,255,.4)' : 'none' }}>→</button>
            </div>
            <div style={{ textAlign: 'center', marginTop: 7, fontSize: 11, color: '#c4c7dc' }}>AI xato qilishi mumkin. Taqdim etishdan oldin tekshiring.</div>
          </div>
        )}
      </div>

      {/* AI Support Chat Button */}
      <button 
          onClick={() => setChatOpen(p => !p)}
          className="chat-pulse"
          style={{ position: 'fixed', bottom: 80, right: 20, width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#6c63ff,#4f46e5)', color: '#fff', fontSize: 24, border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(108,99,255,.4)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s' }}>
          {chatOpen ? '✕' : '💬'}
      </button>

      {/* AI Support Chat Modal */}
      {chatOpen && (
          <div style={{ position: 'fixed', bottom: 145, right: 20, width: 'calc(100% - 40px)', maxWidth: 320, height: 420, background: '#fff', borderRadius: 20, boxShadow: '0 8px 30px rgba(0,0,0,.15)', zIndex: 60, display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid #e0dff8' }}>
              {/* Header */}
              <div style={{ padding: '14px 18px', background: 'linear-gradient(135deg,#6c63ff,#4f46e5)', color: '#fff', fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>🤖</span> Support Bot
              </div>
              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: 10, background: '#f7f8fc' }}>
                  {chatMessages.map((m, i) => (
                      <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', background: m.role === 'user' ? 'linear-gradient(135deg,#6c63ff,#4f46e5)' : '#fff', color: m.role === 'user' ? '#fff' : '#1a1a2e', padding: '10px 14px', borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px', fontSize: 13, maxWidth: '85%', boxShadow: '0 2px 5px rgba(0,0,0,.05)', border: m.role === 'ai' ? '1px solid #e0dff8' : 'none', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                          {m.text}
                      </div>
                  ))}
                  {chatLoading && <div style={{ alignSelf: 'flex-start', background: '#fff', padding: '10px 14px', borderRadius: '18px 18px 18px 4px', fontSize: 13, border: '1px solid #e0dff8', color: '#9a9db8' }}>Yozmoqda...</div>}
              </div>
              {/* Input */}
              <div style={{ padding: '10px', background: '#fff', borderTop: '1px solid #f0f0f8', display: 'flex', gap: 8 }}>
                  <input type="text" placeholder="Savol yozing..." value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => { if(e.key === 'Enter') handleSendChat(); }} style={{ flex: 1, background: '#f4f3ff', border: 'none', borderRadius: 12, padding: '10px 14px', fontSize: 13, outline: 'none' }} disabled={chatLoading} />
                  <button onClick={handleSendChat} disabled={!chatInput.trim() || chatLoading} style={{ background: chatInput.trim() ? '#6c63ff' : '#ddd6fe', color: '#fff', border: 'none', borderRadius: 12, width: 40, cursor: chatInput.trim() ? 'pointer' : 'default', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>↑</button>
              </div>
          </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
        body{margin:0;padding:0;overflow:hidden;}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse-anim {
          0% { box-shadow: 0 0 0 0 rgba(108, 99, 255, 0.5); }
          70% { box-shadow: 0 0 0 15px rgba(108, 99, 255, 0); }
          100% { box-shadow: 0 0 0 0 rgba(108, 99, 255, 0); }
        }
        .chat-pulse {
          animation: pulse-anim 2s infinite;
        }
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-thumb{background:#d1d5ee;border-radius:2px;}
      `}</style>
    </div>
  );
}