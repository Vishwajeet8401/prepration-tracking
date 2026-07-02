/**
 * Unified AI Integration Service
 * Routes completion requests to Cerebras Llama, Google Gemini, or Groq based on configuration,
 * with automatic fallback logic.
 */

export interface AICallParams {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  cerebrasApiKey?: string;
  geminiApiKey?: string;
  groqApiKey?: string;
  cerebrasModel?: string;
  geminiModel?: string;
  groqModel?: string;
  responseMimeType?: string;
}

export async function callAI(params: AICallParams): Promise<string> {
  const cModel = params.cerebrasModel || 'llama3.1-8b';
  const gModel = params.geminiModel || 'gemini-2.5-flash';
  const grModel = params.groqModel || 'llama-3.3-70b-versatile';
  const temp = params.temperature ?? 0.2;
  const tokens = params.maxTokens ?? 300;

  // 1. Attempt Cerebras API call if key is provided
  if (params.cerebrasApiKey && params.cerebrasApiKey.trim() !== '') {
    try {
      const isDev = import.meta.env.DEV;
      // Use local dev proxy path in Vite to bypass CORS issues, otherwise call direct endpoint
      const baseUrl = isDev ? '/api/cerebras' : 'https://api.cerebras.ai';
      
      console.log(`[aiService] Attempting Cerebras with model ${cModel}...`);
      const response = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${params.cerebrasApiKey}`
        },
        body: JSON.stringify({
          model: cModel,
          messages: [
            { role: 'system', content: params.systemPrompt },
            { role: 'user', content: params.userPrompt }
          ],
          temperature: temp,
          max_completion_tokens: tokens,
          ...(params.responseMimeType === 'application/json' ? { response_format: { type: 'json_object' } } : {})
        })
      });

      if (response.ok) {
        const resData = await response.json();
        const content = resData.choices?.[0]?.message?.content?.trim();
        if (content) {
          console.log('[aiService] Cerebras call succeeded.');
          return content;
        }
      } else {
        const errText = await response.text();
        console.warn(`[aiService] Cerebras API returned status ${response.status}: ${errText}`);
        
        // If it's a model not found / no access error, we fall back to Gemini or throw
        try {
          const errJson = JSON.parse(errText);
          if (errJson.code === 'model_not_found' || errJson.type === 'invalid_request_error') {
            console.warn('[aiService] Cerebras model access error, checking fallback...');
          }
        } catch (_) {}
      }
    } catch (err) {
      console.warn('[aiService] Cerebras API fetch failed:', err);
    }
  }

  // 2. Fallback to Gemini REST API if key is provided
  if (params.geminiApiKey && params.geminiApiKey.trim() !== '') {
    try {
      console.log(`[aiService] Attempting Gemini fallback with model ${gModel}...`);
      
      const payload: any = {
        contents: [{ parts: [{ text: params.userPrompt }] }],
        systemInstruction: { parts: [{ text: params.systemPrompt }] },
        generationConfig: {
          temperature: temp,
          maxOutputTokens: tokens
        }
      };

      if (params.responseMimeType) {
        payload.generationConfig.responseMimeType = params.responseMimeType;
      }

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${gModel}:generateContent?key=${params.geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      if (geminiRes.ok) {
        const geminiData = await geminiRes.json();
        const content = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (content) {
          console.log('[aiService] Gemini call succeeded.');
          return content;
        }
      } else {
        const errText = await geminiRes.text();
        console.warn(`[aiService] Gemini API returned status ${geminiRes.status}: ${errText}`);
      }
    } catch (err) {
      console.warn('[aiService] Gemini API call failed:', err);
    }
  }

  // 3. Fallback to Groq API if key is provided
  if (params.groqApiKey && params.groqApiKey.trim() !== '') {
    try {
      const isDev = import.meta.env.DEV;
      const baseUrl = isDev ? '/api/groq' : 'https://api.groq.com';
      console.log(`[aiService] Attempting Groq fallback with model ${grModel}...`);

      const response = await fetch(`${baseUrl}/openai/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${params.groqApiKey}`
        },
        body: JSON.stringify({
          model: grModel,
          messages: [
            { role: 'system', content: params.systemPrompt },
            { role: 'user', content: params.userPrompt }
          ],
          temperature: temp,
          max_tokens: tokens,
          ...(params.responseMimeType === 'application/json' ? { response_format: { type: 'json_object' } } : {})
        })
      });

      if (response.ok) {
        const resData = await response.json();
        const content = resData.choices?.[0]?.message?.content?.trim();
        if (content) {
          console.log('[aiService] Groq call succeeded.');
          return content;
        }
      } else {
        const errText = await response.text();
        console.warn(`[aiService] Groq API returned status ${response.status}: ${errText}`);
      }
    } catch (err) {
      console.warn('[aiService] Groq API call failed:', err);
    }
  }

  throw new Error('AI Service request failed. Please check that you have configured a valid API Key and Model in Backup & Data Settings.');
}
