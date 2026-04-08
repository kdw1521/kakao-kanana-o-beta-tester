"use client";

import { useState, FormEvent, MouseEvent } from "react";
import { askKanana, askKananaAudio } from "./actions";

export default function Home() {
  const [texts, setTexts] = useState<string[]>(["", ""]);
  const [showError, setShowError] = useState(false);
  
  const [isLoadingText, setIsLoadingText] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  const [responseMsg, setResponseMsg] = useState<string | null>(null);
  const [responseAudio, setResponseAudio] = useState<string | null>(null);

  const handleTextChange = (index: number, val: string) => {
    const newTexts = [...texts];
    newTexts[index] = val;
    setTexts(newTexts);
    if (showError && (newTexts[0].trim() !== "" || newTexts[1].trim() !== "")) {
      setShowError(false);
    }
  };

  const isValid = texts[0].trim() !== "" || texts[1].trim() !== "";

  const submitQuestion = async (type: "text" | "audio") => {
    if (!isValid) {
      setShowError(true);
      return;
    }
    setShowError(false);

    const condition1 = texts[0].trim() !== "" ? texts[0] : "상황1";
    const condition2 = texts[1].trim() !== "" ? texts[1] : "상황2";
    const generatedQuestion = `${condition1} vs ${condition2}\n둘 중 어느것이 나을까? 나은이유와 설명도 추가해줘`;

    setResponseMsg(null);
    setResponseAudio(null);

    if (type === "text") {
      try {
        setIsLoadingText(true);
        const answer = await askKanana(generatedQuestion);
        setResponseMsg(answer);
      } catch (err: any) {
        alert("오류 발생: " + err.message);
      } finally {
        setIsLoadingText(false);
      }
    } else {
      try {
        setIsLoadingAudio(true);
        const data = await askKananaAudio(generatedQuestion);
        setResponseMsg(data.content);
        if (data.audioBase64) {
           setResponseAudio(`data:audio/wav;base64,${data.audioBase64}`);
        }
      } catch (err: any) {
        alert("오류 발생: " + err.message);
      } finally {
        setIsLoadingAudio(false);
      }
    }
  };

  const onTextSubmit = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    submitQuestion("text");
  };

  const onAudioSubmit = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    submitQuestion("audio");
  };

  const handleCloseModal = () => {
    setResponseMsg(null);
    setResponseAudio(null);
    setTexts(["", ""]);
  };

  const handleCopy = async () => {
    if (responseMsg) {
      try {
        await navigator.clipboard.writeText(responseMsg);
        alert("답변이 성공적으로 복사되었습니다!");
      } catch (e) {
         alert("복사 실패. 브라우저 설정을 확인해주세요.");
      }
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: '카나나 O의 답변',
        text: responseMsg || '응답 없음'
      }).catch(console.error);
    } else {
      alert("현재 환경(PC 브라우저 등)에서는 기기 자체 공유 기능을 지원하지 않습니다.\n'복사하기'를 눌러 복사해주세요!");
    }
  };

  return (
    <main className="app-container" style={{ position: 'relative' }}>
      <h1 className="glow-title">고민고민하지마 휴먼</h1>

      <form style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        
        {/* Situation Inputs Section */}
        <div className="glass-box">
          <label className="input-label" style={{ textAlign: "center", fontSize: "1.2rem", fontWeight: "bold", marginBottom: "1.5rem", color: "var(--primary)" }}>
            상황1 VS 상황2
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Situation 1 */}
            <textarea
              className="text-input"
              style={{ background: 'var(--background)', borderRadius: '0.75rem', padding: '1rem', minHeight: '120px' }}
              placeholder="상황1을 입력해주세요"
              value={texts[0]}
              onChange={(e) => handleTextChange(0, e.target.value)}
            />

            {/* VS Badge */}
            <div style={{ display: 'flex', justifyContent: 'center', margin: '0.5rem 0' }}>
               <div style={{ background: 'var(--primary)', color: '#000', fontWeight: '900', padding: '0.5rem 1.5rem', borderRadius: '2rem', fontSize: '1.2rem', boxShadow: '0 4px 15px var(--primary-glow)' }}>
                 VS
               </div>
            </div>

            {/* Situation 2 */}
            <textarea
              className="text-input"
              style={{ background: 'var(--background)', borderRadius: '0.75rem', padding: '1rem', minHeight: '120px' }}
              placeholder="상황2를 입력해주세요"
              value={texts[1]}
              onChange={(e) => handleTextChange(1, e.target.value)}
            />

          </div>
        </div>

        {/* Submit */}
        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '1rem' }}>
          <button 
            type="button" 
            className="submit-btn" 
            onClick={onTextSubmit} 
            disabled={isLoadingText || isLoadingAudio}
            style={{ flex: 1, backgroundColor: 'var(--surface-hover)', color: 'var(--text-primary)', border: '1px solid var(--border)', marginTop: 0 }}
          >
            {isLoadingText ? "카나나가 답변 작성 중..." : "텍스트로 응답받기"}
          </button>
          
          <button 
            type="button" 
            className="submit-btn" 
            onClick={onAudioSubmit} 
            disabled={isLoadingText || isLoadingAudio}
            style={{ flex: 1, marginTop: 0 }}
          >
            {isLoadingAudio ? "카나나가 말하는 중..." : "음성으로 응답받기"}
          </button>
        </div>

        {/* Validation Error Message */}
        {showError && (
          <div className="error-message">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            비교할 상황을 1개 이상 입력해 주세요.
          </div>
        )}

      </form>

      {/* Response Modal Box */}
      {responseMsg && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 
        }}>
          <div className="glass-box" style={{ 
            width: '90%', maxWidth: '600px', maxHeight: '80vh', 
            display: 'flex', flexDirection: 'column', position: 'relative',
            background: '#15151a', border: '1px solid rgba(250, 225, 0, 0.3)'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  <h2 style={{ fontSize: '1.2rem', color: 'var(--primary)', margin: 0, fontWeight: '700' }}>카나나 O의 조언</h2>
               </div>
               <button onClick={handleCloseModal} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
               </button>
            </div>
            
            {/* Body */}
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
               {/* Audio Player (If Available) */}
               {responseAudio && (
                 <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '0.5rem' }}>
                    <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold', color: 'var(--primary)', fontSize: '0.9rem' }}>🎧 카나나 음성 재생</p>
                    <audio controls src={responseAudio} autoPlay style={{ width: '100%' }} />
                 </div>
               )}
               {/* Text Content */}
               <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: '1.05rem', color: '#f3f4f6' }}>
                  {responseMsg}
               </div>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
              <button 
                onClick={handleCopy} 
                style={{ flex: 1, padding: '0.8rem', background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}
              >
                복사하기
              </button>
              <button 
                onClick={handleShare}
                style={{ flex: 1, padding: '0.8rem', background: '#FEE500', color: '#000000', border: 'none', borderRadius: '0.5rem', fontWeight: 'bold', cursor: 'pointer' }}
              >
                카카오톡 공유하기
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Full Screen Loading Overlay */}
      {(isLoadingText || isLoadingAudio) && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, pointerEvents: 'all' /* Blocks clicks to underlying layers */
        }}>
           <div style={{
             width: '50px', height: '50px', border: '5px solid var(--surface-hover)', 
             borderTop: '5px solid var(--primary)', borderRadius: '50%',
             animation: 'spin 1s linear infinite', marginBottom: '1.5rem'
           }} />
           <style>{`
             @keyframes spin {
               0% { transform: rotate(0deg); }
               100% { transform: rotate(360deg); }
             }
           `}</style>
           <h2 style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
             {isLoadingAudio ? "카나나가 음성으로 대답을 준비하고 있습니다..." : "카나나가 고민을 푸는 중..."}
           </h2>
           <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>잠시만 기다려주세요</p>
        </div>
      )}
    </main>
  );
}
