import * as pdfjsLib from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.entry';
import ReactMarkdown from 'react-markdown';
import { useState, useEffect, useRef } from 'react';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

function App() {
  const [messages, setMessages] = useState([
    {
      role: "system",
      content: `
You are a helpful, efficient, and concise assistant for a teacher. Your sole goal is to gather lesson material for upcoming classes so you can later help students learn it more effectively.

**Flow:**

1. Ask the teacher to upload a document or describe the class topic.
2. Once you get the material:
   - Acknowledge it briefly.
   - Ask follow-up questions (teaching methods, examples, goals).
3. After collecting all info:
   - Confirm you’re ready to assist the students.

Keep responses **short, practical, and easy to scan**. Guide gently if needed.
` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const startChat = async () => {
      const res = await fetch('https://teacher-backend-production.up.railway.app/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages })
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    };

    if (messages.length === 1) {
      startChat();
    }
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    const res = await fetch('https://teacher-backend-production.up.railway.app/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: newMessages })
    });

    const data = await res.json();
    const reply = data.reply || "Sorry, something went wrong.";
    setMessages([...newMessages, { role: 'assistant', content: reply }]);
    setLoading(false);
  };

  const handlePDFUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || file.type !== 'application/pdf') return;

    const reader = new FileReader();
    reader.onload = async function () {
      const typedarray = new Uint8Array(this.result);
      const pdf = await pdfjsLib.getDocument(typedarray).promise;

      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map((item) => item.str).join(' ');
        fullText += strings + '\n\n';
      }

      handleSendPDF(fullText);
    };

    reader.readAsArrayBuffer(file);
  };

  const handleSendPDF = async (pdfText) => {
    const visibleMessage = { role: 'user', content: '📄 *Document uploaded.*' };
    const backendMessages = [...messages, { role: 'user', content: pdfText }];

    setMessages((prev) => [...prev, visibleMessage]);
    setLoading(true);

    const res = await fetch('https://teacher-backend-production.up.railway.app/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: backendMessages })
    });

    const data = await res.json();
    const reply = data.reply || "Sorry, something went wrong.";
    setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    setLoading(false);
  };

  return (
<div className="chat-wrapper">
  <h1>👩‍🏫 AI Teaching Assistant</h1>

  <div className="chat-box">
    {messages.filter(m => m.role !== 'system').map((msg, i) => (
      <div
        key={i}
        className={`message-bubble ${
          msg.role === 'user' ? 'message-user' : 'message-assistant'
        }`}
      >
        <ReactMarkdown>{msg.content}</ReactMarkdown>
      </div>
    ))}
    {loading && (
      <div className="message-bubble message-assistant">
        <em>Assistant is typing…</em>
      </div>
    )}
  </div>

  <div className="input-area">
    <div className="input-row">
      <input
        type="text"
        value={input}
        placeholder="Type your message..."
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
      />
      <button onClick={handleSend} disabled={loading}>
        {loading ? '...' : 'Send'}
      </button>
    </div>
    <label>
      📄 Upload PDF Lesson Plan:
      <input type="file" accept="application/pdf" onChange={handlePDFUpload} />
    </label>
  </div>
</div>


    // <div className="max-w-2xl mx-auto p-6 font-sans flex flex-col min-h-screen">
    //   <h1 className="text-2xl font-bold mb-4">👩‍🏫 AI Teaching Assistant</h1>

    //   <div className="flex-1 overflow-y-auto mb-4 border p-4 rounded bg-white space-y-4 message-container">
    //     {messages.filter(m => m.role !== 'system').map((msg, i) => (
    //       <div
    //         key={i}
    //         className={`max-w-[80%] p-3 rounded-md whitespace-pre-wrap ${
    //           msg.role === 'user'
    //             ? 'bg-blue-100 ml-auto text-right'
    //             : 'bg-gray-100 mr-auto text-left'
    //         }`}
    //       >
    //         <ReactMarkdown>{msg.content}</ReactMarkdown>
    //       </div>
    //     ))}
    //     {loading && (
    //       <div className="text-gray-400 italic">Assistant is typing…</div>
    //     )}
    //     <div ref={messagesEndRef} />
    //   </div>

    //   <div className="flex flex-col gap-3">
    //     <div className="flex gap-2">
    //       <input
    //         className="flex-1 border p-2 rounded"
    //         value={input}
    //         placeholder="Type your message..."
    //         onChange={(e) => setInput(e.target.value)}
    //         onKeyDown={(e) => e.key === 'Enter' && handleSend()}
    //       />
    //       <button
    //         onClick={handleSend}
    //         disabled={loading}
    //         className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
    //       >
    //         {loading ? '...' : 'Send'}
    //       </button>
    //     </div>
    //     <div>
    //       <label className="block mb-1 font-semibold">📄 Upload PDF Lesson Plan:</label>
    //       <input type="file" accept="application/pdf" onChange={handlePDFUpload} />
    //     </div>
    //   </div>
    // </div>
  );
}

export default App;