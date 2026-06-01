// backend/widget.js
// This file is served publicly for embedding

(function () {
  const config = window.ChatbotConfig || {};
  const apiKey = config.apiKey;
  const wsUrl  = config.wsUrl || 'ws://localhost:8000';
  const httpUrl= config.httpUrl || 'http://localhost:8000';

  if (!apiKey) {
    console.error('ChatbotConfig: apiKey is required');
    return;
  }

  // ── Inject Styles ────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    #vaultiq-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 58px;
      height: 58px;
      border-radius: 50%;
      background: linear-gradient(135deg, #2563eb, #7c3aed);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 20px rgba(37,99,235,0.4);
      z-index: 99998;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    #vaultiq-btn:hover {
      transform: scale(1.08);
      box-shadow: 0 6px 28px rgba(37,99,235,0.5);
    }
    #vaultiq-btn svg {
      width: 26px;
      height: 26px;
      fill: white;
    }
    #vaultiq-badge {
      position: absolute;
      top: -3px;
      right: -3px;
      width: 14px;
      height: 14px;
      background: #22c55e;
      border-radius: 50%;
      border: 2px solid white;
      animation: viq-pulse 2s infinite;
    }
    @keyframes viq-pulse {
      0%,100%{opacity:1;transform:scale(1)}
      50%{opacity:0.6;transform:scale(0.85)}
    }
    #vaultiq-window {
      position: fixed;
      bottom: 96px;
      right: 24px;
      width: 380px;
      height: 560px;
      background: #ffffff;
      border-radius: 20px;
      box-shadow: 0 8px 48px rgba(0,0,0,0.18);
      z-index: 99999;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border: 1px solid #e5e7eb;
      transform: scale(0.95) translateY(8px);
      opacity: 0;
      pointer-events: none;
      transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1);
      font-family: 'Segoe UI', Arial, sans-serif;
    }
    #vaultiq-window.open {
      transform: scale(1) translateY(0);
      opacity: 1;
      pointer-events: all;
    }
    #vaultiq-header {
      background: linear-gradient(135deg, #2563eb, #7c3aed);
      padding: 16px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
    }
    #vaultiq-header-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    #vaultiq-avatar {
      width: 36px;
      height: 36px;
      background: rgba(255,255,255,0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
    }
    #vaultiq-header-info h3 {
      margin: 0;
      font-size: 14px;
      font-weight: 700;
      color: white;
    }
    #vaultiq-header-info p {
      margin: 0;
      font-size: 11px;
      color: rgba(255,255,255,0.8);
      display: flex;
      align-items: center;
      gap: 4px;
    }
    #vaultiq-header-info p::before {
      content: '';
      width: 6px;
      height: 6px;
      background: #4ade80;
      border-radius: 50%;
      display: inline-block;
      animation: viq-pulse 2s infinite;
    }
    #vaultiq-close {
      background: rgba(255,255,255,0.2);
      border: none;
      cursor: pointer;
      border-radius: 50%;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 16px;
      transition: background 0.15s;
    }
    #vaultiq-close:hover {
      background: rgba(255,255,255,0.3);
    }
    #vaultiq-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: #f9fafb;
    }
    #vaultiq-messages::-webkit-scrollbar {
      width: 4px;
    }
    #vaultiq-messages::-webkit-scrollbar-track {
      background: transparent;
    }
    #vaultiq-messages::-webkit-scrollbar-thumb {
      background: #e5e7eb;
      border-radius: 2px;
    }
    .viq-msg {
      display: flex;
      gap: 8px;
      align-items: flex-end;
    }
    .viq-msg.user {
      flex-direction: row-reverse;
    }
    .viq-bubble {
      max-width: 78%;
      padding: 10px 14px;
      border-radius: 16px;
      font-size: 13px;
      line-height: 1.6;
      word-wrap: break-word;
      white-space: pre-wrap;
    }
    .viq-msg.bot .viq-bubble {
      background: #ffffff;
      color: #0f172a;
      border-radius: 16px 16px 16px 4px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.07);
      border: 1px solid #f1f5f9;
    }
    .viq-msg.user .viq-bubble {
      background: linear-gradient(135deg,#2563eb,#7c3aed);
      color: white;
      border-radius: 16px 16px 4px 16px;
    }
    .viq-icon {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      flex-shrink: 0;
      background: #eff6ff;
    }
    .viq-msg.user .viq-icon {
      background: #ede9fe;
    }
    .viq-time {
      font-size: 10px;
      color: #9ca3af;
      margin-top: 3px;
      text-align: right;
    }
    .viq-typing {
      display: flex;
      gap: 4px;
      padding: 12px 14px;
    }
    .viq-dot {
      width: 7px;
      height: 7px;
      background: #94a3b8;
      border-radius: 50%;
      animation: viq-bounce 1s infinite;
    }
    .viq-dot:nth-child(2){animation-delay:0.15s}
    .viq-dot:nth-child(3){animation-delay:0.3s}
    @keyframes viq-bounce {
      0%,60%,100%{transform:translateY(0)}
      30%{transform:translateY(-5px)}
    }
    .viq-cursor {
      display: inline-block;
      width: 2px;
      height: 14px;
      background: #2563eb;
      margin-left: 2px;
      vertical-align: middle;
      animation: viq-blink 1s infinite;
    }
    @keyframes viq-blink {
      0%,100%{opacity:1}50%{opacity:0}
    }
    #vaultiq-suggestions {
      padding: 0 16px 8px;
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      background: #f9fafb;
    }
    .viq-suggest {
      font-size: 11px;
      padding: 5px 10px;
      border-radius: 20px;
      border: 1px solid #e5e7eb;
      background: white;
      color: #64748b;
      cursor: pointer;
      transition: all 0.15s;
      font-family: inherit;
    }
    .viq-suggest:hover {
      border-color: #2563eb;
      color: #2563eb;
      background: #eff6ff;
    }
    #vaultiq-input-area {
      padding: 12px 14px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      gap: 8px;
      align-items: flex-end;
      background: white;
      flex-shrink: 0;
    }
    #vaultiq-input {
      flex: 1;
      padding: 10px 14px;
      border: 1.5px solid #e5e7eb;
      border-radius: 12px;
      font-size: 13px;
      outline: none;
      resize: none;
      font-family: inherit;
      color: #0f172a;
      background: #f9fafb;
      max-height: 80px;
      overflow-y: auto;
      transition: border-color 0.2s;
    }
    #vaultiq-input:focus {
      border-color: #2563eb;
      background: white;
    }
    #vaultiq-input::placeholder {
      color: #94a3b8;
    }
    #vaultiq-send {
      width: 38px;
      height: 38px;
      background: linear-gradient(135deg,#2563eb,#7c3aed);
      border: none;
      border-radius: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: opacity 0.2s, transform 0.15s;
    }
    #vaultiq-send:hover {
      transform: scale(1.05);
    }
    #vaultiq-send:disabled {
      opacity: 0.4;
      cursor: not-allowed;
      transform: none;
    }
    #vaultiq-send svg {
      width: 16px;
      height: 16px;
      fill: white;
    }
    #vaultiq-footer {
      padding: 6px 14px 10px;
      text-align: center;
      font-size: 10px;
      color: #94a3b8;
      background: white;
      flex-shrink: 0;
    }
    #vaultiq-footer a {
      color: #2563eb;
      text-decoration: none;
      font-weight: 600;
    }
    @media (max-width: 480px) {
      #vaultiq-window {
        width: calc(100vw - 16px);
        right: 8px;
        bottom: 80px;
        height: 70vh;
      }
    }
  `;
  document.head.appendChild(style);

  // ── State ────────────────────────────────────────
  let isOpen     = false;
  let isStreaming = false;
  let ws         = null;
  let messages   = [];
  let streamBubble = null;
  let chatHistory  = [];

  const suggestions = [
    'What services do you offer?',
    'How can I contact support?',
    'What are your policies?',
  ];

  const botName = config.botName || 'Assistant';
  const primaryColor = config.primaryColor || '#2563eb';

  // ── Build UI ─────────────────────────────────────
  // Toggle button
  const btn = document.createElement('button');
  btn.id = 'vaultiq-btn';
  btn.setAttribute('aria-label', 'Open chat');
  btn.innerHTML = `
    <svg viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 3 1 4.3L2 22l5.7-1C8.99 21.64 10.46 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.38 0-2.7-.28-3.9-.8l-.28-.12-2.92.76.77-2.84-.15-.3C5.28 15.7 5 14.38 5 13 5 8.59 8.59 5 13 5s8 3.59 8 8-3.59 8-8 8z"/>
    </svg>
    <div id="vaultiq-badge"></div>
  `;

  // Chat window
  const win = document.createElement('div');
  win.id = 'vaultiq-window';
  win.innerHTML = `
    <div id="vaultiq-header">
      <div id="vaultiq-header-left">
        <div id="vaultiq-avatar">🤖</div>
        <div id="vaultiq-header-info">
          <h3>${botName}</h3>
          <p>Online — Ready to help</p>
        </div>
      </div>
      <button id="vaultiq-close">✕</button>
    </div>
    <div id="vaultiq-messages"></div>
    <div id="vaultiq-suggestions"></div>
    <div id="vaultiq-input-area">
      <textarea
        id="vaultiq-input"
        placeholder="Type your message..."
        rows="1"
      ></textarea>
      <button id="vaultiq-send" disabled>
        <svg viewBox="0 0 24 24">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
        </svg>
      </button>
    </div>
    <div id="vaultiq-footer">
      Powered by <a href="#" target="_blank">VaultIQ</a>
    </div>
  `;

  document.body.appendChild(btn);
  document.body.appendChild(win);

  // ── Suggestions ──────────────────────────────────
  const sugBox = win.querySelector('#vaultiq-suggestions');
  suggestions.forEach(s => {
    const b = document.createElement('button');
    b.className = 'viq-suggest';
    b.textContent = s;
    b.onclick = () => {
      document.getElementById('vaultiq-input').value = s;
      sendMessage(s);
      sugBox.style.display = 'none';
    };
    sugBox.appendChild(b);
  });

  // ── Toggle ───────────────────────────────────────
  btn.onclick = () => toggleChat();
  win.querySelector('#vaultiq-close').onclick = () => toggleChat(false);

  function toggleChat(force) {
    isOpen = force !== undefined ? force : !isOpen;
    win.classList.toggle('open', isOpen);
    if (isOpen && messages.length === 0) {
      addBotMessage(
        `Hello! 👋 I'm ${botName}. How can I help you today?`
      );
    }
  }

  // ── Input handling ───────────────────────────────
  const input = win.querySelector('#vaultiq-input');
  const sendBtn = win.querySelector('#vaultiq-send');

  input.addEventListener('input', () => {
    sendBtn.disabled = !input.value.trim() || isStreaming;
    // Auto resize
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 80) + 'px';
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!sendBtn.disabled) sendMessage(input.value.trim());
    }
  });

  sendBtn.onclick = () => {
    if (!sendBtn.disabled) sendMessage(input.value.trim());
  };

  // ── Add messages ─────────────────────────────────
  function addUserMessage(text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'viq-msg user';
    msgDiv.innerHTML = `
      <div>
        <div class="viq-bubble">${escapeHtml(text)}</div>
        <div class="viq-time">${getTime()}</div>
      </div>
      <div class="viq-icon">👤</div>
    `;
    getMessagesEl().appendChild(msgDiv);
    scrollBottom();
    messages.push({ role: 'user', content: text });
    chatHistory.push({ role: 'user', content: text });
    sugBox.style.display = 'none';
  }

  function addBotMessage(text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'viq-msg bot';
    msgDiv.innerHTML = `
      <div class="viq-icon">🤖</div>
      <div>
        <div class="viq-bubble">${escapeHtml(text)}</div>
        <div class="viq-time">${getTime()}</div>
      </div>
    `;
    getMessagesEl().appendChild(msgDiv);
    scrollBottom();
    messages.push({ role: 'assistant', content: text });
    chatHistory.push({ role: 'assistant', content: text });
  }

  function addTypingIndicator() {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'viq-msg bot';
    msgDiv.id = 'viq-typing';
    msgDiv.innerHTML = `
      <div class="viq-icon">🤖</div>
      <div>
        <div class="viq-bubble viq-typing">
          <div class="viq-dot"></div>
          <div class="viq-dot"></div>
          <div class="viq-dot"></div>
        </div>
      </div>
    `;
    getMessagesEl().appendChild(msgDiv);
    scrollBottom();
    return msgDiv;
  }

  function addStreamBubble() {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'viq-msg bot';
    msgDiv.id = 'viq-streaming';
    msgDiv.innerHTML = `
      <div class="viq-icon">🤖</div>
      <div>
        <div class="viq-bubble" id="viq-stream-text"></div>
        <div class="viq-time">${getTime()}</div>
      </div>
    `;
    getMessagesEl().appendChild(msgDiv);
    scrollBottom();
    return msgDiv;
  }

  // ── Send message ─────────────────────────────────
  function sendMessage(text) {
    if (!text || isStreaming) return;
    input.value = '';
    input.style.height = 'auto';
    sendBtn.disabled = true;

    addUserMessage(text);

    // Try WebSocket first
    connectAndSend(text);
  }

  function connectAndSend(question) {
    isStreaming = true;
    const typing = addTypingIndicator();

    try {
      const wsEndpoint = wsUrl.replace('http', 'ws');
      ws = new WebSocket(`${wsEndpoint}/chat/ws/external`);

      ws.onopen = () => {
        ws.send(JSON.stringify({
          question,
          api_key:      apiKey,
          chat_history: chatHistory.slice(-10),
        }));
      };

      let streamText = '';
      let streamEl   = null;

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'start') {
          // Remove typing, add stream bubble
          typing.remove();
          streamEl   = addStreamBubble();
          streamText = '';
        }

        else if (data.type === 'chunk') {
          streamText += data.chunk;
          const textEl = document.getElementById('viq-stream-text');
          if (textEl) {
            textEl.innerHTML = escapeHtml(streamText) +
              '<span class="viq-cursor"></span>';
          }
          scrollBottom();
        }

        else if (data.type === 'done') {
          // Remove cursor
          const textEl = document.getElementById('viq-stream-text');
          if (textEl) {
            textEl.innerHTML = escapeHtml(streamText);
          }
          chatHistory.push({ role:'assistant', content:streamText });
          messages.push({ role:'assistant', content:streamText });
          isStreaming = false;
          sendBtn.disabled = false;
        }

        else if (data.type === 'error') {
          typing.remove();
          if (streamEl) streamEl.remove();
          addBotMessage(data.message || 'Something went wrong. Please try again.');
          isStreaming = false;
          sendBtn.disabled = false;
        }
      };

      ws.onerror = () => {
        // Fallback to HTTP
        typing.remove();
        httpFallback(question);
      };

      ws.onclose = () => {
        isStreaming = false;
        sendBtn.disabled = !input.value.trim();
      };

    } catch(e) {
      typing.remove();
      httpFallback(question);
    }
  }

  function httpFallback(question) {
    fetch(`${httpUrl}/chat/external/ask`, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key':    apiKey,
      },
      body: JSON.stringify({
        question,
        chat_history: chatHistory.slice(-10).map(m => ({
          role:    m.role,
          content: m.content,
        })),
      }),
    })
    .then(r => r.json())
    .then(data => {
      addBotMessage(data.answer || 'No response received.');
    })
    .catch(() => {
      addBotMessage('Sorry, I could not connect. Please try again.');
    })
    .finally(() => {
      isStreaming  = false;
      sendBtn.disabled = !input.value.trim();
    });
  }

  // ── Helpers ──────────────────────────────────────
  function getMessagesEl() {
    return document.getElementById('vaultiq-messages');
  }

  function scrollBottom() {
    const el = getMessagesEl();
    if (el) el.scrollTop = el.scrollHeight;
  }

  function getTime() {
    return new Date().toLocaleTimeString([], {
      hour: '2-digit', minute: '2-digit'
    });
  }

  function escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');
  }

})();