"use server";

export async function askKanana(question: string) {
  const apiKey = process.env.KANANA_O_API_KEY;
  if (!apiKey) {
    throw new Error("환경 변수에 KANANA_O_API_KEY가 설정되지 않았습니다. .env.local 파일을 확인해주세요.");
  }

  // Kanana-O API 호출 (텍스트 응답)
  const response = await fetch("https://kanana-o.a2s-endpoint.kr-central-2.kakaocloud.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "kanana-o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: question }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`카나나 O API 호출 실패 [${response.status}]: ${errText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  
  if (!content) {
    throw new Error("서버에서 메시지 응답을 반환하지 않았습니다.");
  }

  return content;
}

// 오디오 데이터를 위한 WAV 헤더 생성 함수
function createWavHeader(dataLength: number, sampleRate: number, numChannels: number, bitsPerSample: number) {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataLength, 4); // File size
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size
  header.writeUInt16LE(1, 20); // AudioFormat (PCM)
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28); // ByteRate
  header.writeUInt16LE(numChannels * (bitsPerSample / 8), 32); // BlockAlign
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataLength, 40);
  return header;
}

// 오디오 리스폰스를 위한 새로운 서버 액션 (스트리밍 파싱 후 클라이언트에 base64 wav 반환)
export async function askKananaAudio(question: string) {
  const apiKey = process.env.KANANA_O_API_KEY;
  if (!apiKey) {
    throw new Error("환경 변수에 KANANA_O_API_KEY가 설정되지 않았습니다.");
  }

  const response = await fetch("https://kanana-o.a2s-endpoint.kr-central-2.kakaocloud.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "kanana-o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: question }
          ]
        }
      ],
      modalities: ["text", "audio"],
      stream: true,
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`오디오 API 호출 실패 [${response.status}]: ${errText}`);
  }

  if (!response.body) {
    throw new Error("서버에서 빈 응답을 반환했습니다.");
  }

  // 스트림 SSE(Server Sent Events) 파싱
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let done = false;
  
  let fullText = "";
  const audioChunks: Buffer[] = [];
  let buffer = "";

  while (!done) {
    const { value, done: readerDone } = await reader.read();
    done = readerDone;
    if (value) {
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      // 마지막 줄은 불완전할 수 있으므로 다시 버퍼에 저장
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ") && line !== "data: [DONE]") {
          try {
            const dataStr = line.slice(6);
            if (!dataStr.trim()) continue;
            
            const raw = JSON.parse(dataStr);
            const choices = raw.choices || [];
            if (choices.length === 0) continue;
            
            const delta = choices[0].delta || {};
            
            // 텍스트 추출
            if (delta.content && typeof delta.content === 'string') {
               fullText += delta.content;
            }

            // 오디오 추출 (pcm b64)
            const audio = delta.audio;
            if (audio) {
               let audioB64Data = null;
               if (typeof audio === 'string') {
                 audioB64Data = audio;
               } else if (typeof audio === 'object') {
                 audioB64Data = audio.data || audio.audio;
               }

               if (audioB64Data && typeof audioB64Data === 'string') {
                 const pcmBuffer = Buffer.from(audioB64Data, 'base64');
                 if (pcmBuffer.length > 0) {
                     audioChunks.push(pcmBuffer);
                 }
               }
            }
          } catch (e) {
            console.error("Failed to parse SSE JSON line", line, e);
          }
        }
      }
    }
  }

  // 남은 버퍼 검사
  if (buffer.startsWith("data: ") && buffer !== "data: [DONE]") {
     try {
       const raw = JSON.parse(buffer.slice(6));
       const delta = raw.choices?.[0]?.delta;
       if (delta?.content) fullText += delta.content;
       const audioData = delta?.audio?.data || delta?.audio?.audio || delta?.audio;
       if (audioData) audioChunks.push(Buffer.from(audioData, 'base64'));
     } catch(e) {}
  }

  // 모든 PCM 데이터 합치기
  const audioPcmBuffer = Buffer.concat(audioChunks);
  let resultAudioB64 = null;

  // 파이썬 코드 기반 PCM 스펙 (Sample Rate: 24000, Channels: 1, 비트스펙: 16bit(2byte))
  if (audioPcmBuffer.length > 0) {
     const header = createWavHeader(audioPcmBuffer.length, 24000, 1, 16);
     const wavBuffer = Buffer.concat([header, audioPcmBuffer]);
     resultAudioB64 = wavBuffer.toString('base64');
  }

  return { content: fullText, audioBase64: resultAudioB64 };
}
