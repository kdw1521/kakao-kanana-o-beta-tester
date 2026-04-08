"use client";

import { useState, useRef, FormEvent, MouseEvent, ChangeEvent, DragEvent } from "react";
import { askKanana, askKananaAudio, askKananaImage } from "./actions";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"gogohu" | "whatimage">("gogohu");

  // === 고고휴 (Text vs Text) State ===
  const [texts, setTexts] = useState<string[]>(["", ""]);
  const [showError, setShowError] = useState(false);
  
  // === 왓더이미지 (Image Upload) State ===
  const [uploadedImageBase64, setUploadedImageBase64] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // === Global UI State ===
  const [isLoadingText, setIsLoadingText] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [isLoadingImage, setIsLoadingImage] = useState(false);

  const [responseMsg, setResponseMsg] = useState<string | null>(null);
  const [responseAudio, setResponseAudio] = useState<string | null>(null);

  // ===================== 고고휴 로직 =====================
  const handleTextChange = (index: number, val: string) => {
    const newTexts = [...texts];
    newTexts[index] = val;
    setTexts(newTexts);
    if (showError && (newTexts[0].trim() !== "" || newTexts[1].trim() !== "")) {
      setShowError(false);
    }
  };

  const isGogohuValid = texts[0].trim() !== "" || texts[1].trim() !== "";

  const submitQuestion = async (type: "text" | "audio") => {
    if (!isGogohuValid) {
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

  // ===================== 왓더이미지 로직 =====================
  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
         setUploadedImageBase64(reader.result as string);
         setImageError(false);
      };
      reader.readAsDataURL(file);
    }
    // reset input so same file can be selected again if removed
    e.target.value = '';
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!uploadedImageBase64) setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (uploadedImageBase64) return;
    
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
         setUploadedImageBase64(reader.result as string);
         setImageError(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setUploadedImageBase64(null);
  };

  const onImageSubmit = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!uploadedImageBase64) {
      setImageError(true);
      return;
    }
    setImageError(false);
    setResponseMsg(null);
    setResponseAudio(null);

    try {
      setIsLoadingImage(true);
      // 이미지 분석 요청 함수 호출 (사용자 요청: 이미지를 분석한 결과를 텍스트로 반환)
      const answer = await askKananaImage(uploadedImageBase64, "이 이미지에 대해 자세히 분석해서 설명해줘");
      setResponseMsg(answer);
    } catch (err: any) {
      alert("오류 발생: " + err.message);
    } finally {
      setIsLoadingImage(false);
    }
  };

  // ===================== 공통 팝업 로직 =====================
  const handleCloseModal = () => {
    setResponseMsg(null);
    setResponseAudio(null);
    // 현재 탭에 맞춰서 입력창 초기화
    if (activeTab === "gogohu") {
       setTexts(["", ""]);
       setShowError(false);
    } else {
       setUploadedImageBase64(null);
       setImageError(false);
    }
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
        title: activeTab === "whatimage" ? '카나나 O의 이미지 분석 결과' : '카나나 O의 답변',
        text: responseMsg || '응답 없음'
      }).catch(console.error);
    } else {
      alert("현재 환경(PC 등)에서는 기기 자체 공유 기능을 지원하지 않습니다.\n'복사하기'를 눌러 복사해주세요!");
    }
  };

  const isAnyLoading = isLoadingText || isLoadingAudio || isLoadingImage;

  return (
    <main className="app-container" style={{ position: 'relative' }}>
      
      {/* Navigation Layer */}
      <nav style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '2.5rem' }}>
        <button 
           type="button"
           onClick={() => setActiveTab("gogohu")}
           style={{
             padding: '0.8rem 2rem', 
             borderRadius: '2rem',
             border: '1px solid var(--border)',
             background: activeTab === "gogohu" ? 'var(--primary)' : 'var(--surface)',
             color: activeTab === "gogohu" ? '#000' : 'var(--text-secondary)',
             fontWeight: activeTab === "gogohu" ? 'bold' : 'normal',
             cursor: 'pointer',
             transition: 'all 0.3s ease'
           }}
        >
          고고휴
        </button>
        <button 
           type="button"
           onClick={() => setActiveTab("whatimage")}
           style={{
             padding: '0.8rem 2rem', 
             borderRadius: '2rem',
             border: '1px solid var(--border)',
             background: activeTab === "whatimage" ? 'var(--primary)' : 'var(--surface)',
             color: activeTab === "whatimage" ? '#000' : 'var(--text-secondary)',
             fontWeight: activeTab === "whatimage" ? 'bold' : 'normal',
             cursor: 'pointer',
             transition: 'all 0.3s ease'
           }}
        >
          왓더이미지
        </button>
      </nav>

      <h1 className="glow-title">
        {activeTab === "gogohu" ? "고민고민하지마 휴먼" : "왓더이미지"}
      </h1>

      <form style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        
        {/* ======================= 고고휴 UI ======================= */}
        {activeTab === "gogohu" && (
          <>
            <div className="glass-box">
              <label className="input-label" style={{ textAlign: "center", fontSize: "1.2rem", fontWeight: "bold", marginBottom: "1.5rem", color: "var(--primary)" }}>
                상황1 VS 상황2
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                <textarea
                  className="text-input"
                  style={{ background: 'var(--background)', borderRadius: '0.75rem', padding: '1rem', minHeight: '120px' }}
                  placeholder="상황1을 입력해주세요"
                  value={texts[0]}
                  onChange={(e) => handleTextChange(0, e.target.value)}
                />

                <div style={{ display: 'flex', justifyContent: 'center', margin: '0.5rem 0' }}>
                   <div style={{ background: 'var(--primary)', color: '#000', fontWeight: '900', padding: '0.5rem 1.5rem', borderRadius: '2rem', fontSize: '1.2rem', boxShadow: '0 4px 15px var(--primary-glow)' }}>
                     VS
                   </div>
                </div>

                <textarea
                  className="text-input"
                  style={{ background: 'var(--background)', borderRadius: '0.75rem', padding: '1rem', minHeight: '120px' }}
                  placeholder="상황2를 입력해주세요"
                  value={texts[1]}
                  onChange={(e) => handleTextChange(1, e.target.value)}
                />

              </div>
            </div>

            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '1rem' }}>
              <button 
                type="button" 
                className="submit-btn" 
                onClick={onTextSubmit} 
                disabled={isAnyLoading}
                style={{ flex: 1, backgroundColor: 'var(--surface-hover)', color: 'var(--text-primary)', border: '1px solid var(--border)', marginTop: 0 }}
              >
                {isLoadingText ? "카나나가 답변을 고민 중..." : "텍스트로 응답받기"}
              </button>
              
              <button 
                type="button" 
                className="submit-btn" 
                onClick={onAudioSubmit} 
                disabled={isAnyLoading}
                style={{ flex: 1, marginTop: 0 }}
              >
                {isLoadingAudio ? "음성 생성 중..." : "음성으로 응답받기"}
              </button>
            </div>

            {showError && (
              <div className="error-message">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                비교할 상황을 1개 이상 입력해 주세요.
              </div>
            )}
          </>
        )}

        {/* ======================= 왓더이미지 UI ======================= */}
        {activeTab === "whatimage" && (
          <>
            <div className="glass-box">
              <label className="input-label" style={{ textAlign: "center", fontSize: "1.2rem", fontWeight: "bold", marginBottom: "1.5rem", color: "var(--primary)" }}>
                이미지 분석하기
              </label>
              
              <div 
                className={`upload-area ${uploadedImageBase64 ? 'active' : ''}`}
                style={{ 
                  padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '300px',
                  borderColor: isDragging ? 'var(--primary)' : undefined,
                  backgroundColor: isDragging ? 'rgba(250, 225, 0, 0.05)' : undefined
                }}
                onClick={() => !uploadedImageBase64 && fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                 <input 
                   type="file" 
                   accept="image/*" 
                   hidden 
                   ref={fileInputRef} 
                   onChange={handleImageUpload} 
                 />

                 {uploadedImageBase64 ? (
                   <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', justifyContent: 'center' }}>
                     <img src={uploadedImageBase64} alt="Preview" style={{ maxHeight: '300px', borderRadius: '0.5rem', objectFit: 'contain' }} />
                     <button type="button" className="remove-btn" onClick={(e) => { e.stopPropagation(); handleRemoveImage(); }}>
                       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                     </button>
                   </div>
                 ) : (
                   <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--text-secondary)' }}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                      <span style={{ marginTop: '1rem', fontSize: '1rem' }}>이곳을 클릭하거나 이미지를 드래그 앤 드롭 하세요</span>
                   </div>
                 )}
              </div>
            </div>

            <div style={{ marginTop: '0.5rem' }}>
              <button 
                type="button" 
                className="submit-btn" 
                onClick={onImageSubmit} 
                disabled={isAnyLoading}
              >
                {isLoadingImage ? "이지미를 스캔하고 분석 중..." : "이미지 분석 요청하기"}
              </button>

              {imageError && (
                <div className="error-message">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                  분석할 이미지를 업로드해야 합니다.
                </div>
              )}
            </div>
          </>
        )}

      </form>

      {/* Response Modal Box (공통) */}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  <h2 style={{ fontSize: '1.2rem', color: 'var(--primary)', margin: 0, fontWeight: '700' }}>
                     {activeTab === "whatimage" ? "왓더이미지 분석 결과" : "카나나 O의 조언"}
                  </h2>
               </div>
               <button onClick={handleCloseModal} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
               </button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
               {responseAudio && (
                 <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '0.5rem' }}>
                    <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold', color: 'var(--primary)', fontSize: '0.9rem' }}>🎧 카나나 음성 재생</p>
                    <audio controls src={responseAudio} autoPlay style={{ width: '100%' }} />
                 </div>
               )}
               {/* 왓더이미지일 경우 썸네일 미리보기 */}
               {activeTab === "whatimage" && uploadedImageBase64 && (
                 <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                    <img src={uploadedImageBase64} alt="analyzed" style={{ maxHeight: '200px', borderRadius: '0.5rem', opacity: '0.9' }} />
                 </div>
               )}
               <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: '1.05rem', color: '#f3f4f6' }}>
                  {responseMsg}
               </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
              <button onClick={handleCopy} style={{ flex: 1, padding: '0.8rem', background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}>
                복사하기
              </button>
              <button onClick={handleShare} style={{ flex: 1, padding: '0.8rem', background: '#FEE500', color: '#000000', border: 'none', borderRadius: '0.5rem', fontWeight: 'bold', cursor: 'pointer' }}>
                카카오톡 공유하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Screen Loading Overlay */}
      {isAnyLoading && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, pointerEvents: 'all' 
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
           <h2 style={{ color: 'var(--primary)', fontWeight: 'bold', textAlign: 'center', lineHeight: '1.5' }}>
             {isLoadingAudio 
                ? "카나나가 음성으로 대답을 준비하고 있습니다..." 
                : isLoadingImage 
                  ? "카나나 비전 AI가 이미지를 스캔 및 분석 중입니다..." 
                  : "카나나가 답변을 작성하고 있습니다..."}
           </h2>
           <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>잠시만 기다려주세요</p>
        </div>
      )}
    </main>
  );
}
