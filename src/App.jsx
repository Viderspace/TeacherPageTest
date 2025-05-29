// import * as pdfjsLib from 'pdfjs-dist';
// import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';

// import * as pdfjsLib from 'pdfjs-dist/build/pdf';
// import 'pdfjs-dist/build/pdf.worker.entry';

import * as pdfjsLib from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.entry';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;



import { useState, useEffect } from 'react';




const handlePDFUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const fileReader = new FileReader();
  fileReader.onload = async function () {
    const typedArray = new Uint8Array(this.result);
    const pdf = await pdfjsLib.getDocument(typedArray).promise;

    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((item) => item.str).join(' ');
      text += pageText + '\n';
    }

    // 👇 Add PDF content as hidden system message (not displayed in chat UI)
    const hiddenPdfMessage = {
      role: 'system',
      content: `The teacher uploaded this lesson material:\n\n${text}`
    };

    // 👇 Add a user message that will appear in the chat
    const userPrompt = {
      role: 'user',
      content: 'Please review the uploaded lesson and assist.'
    };

    const newMessages = [...messages, hiddenPdfMessage, userPrompt];
    setMessages([...messages, userPrompt]); // Only show the visible message in UI
    setLoading(true);

    const res = await fetch('https://teacher-backend-production.up.railway.app/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: newMessages })
    });

    const data = await res.json();
    const reply = data.reply || 'Sorry, something went wrong.';
    setMessages([...messages, userPrompt, { role: 'assistant', content: reply }]);
    setLoading(false);
  };

  fileReader.readAsArrayBuffer(file);
};




function App() {
  const [messages, setMessages] = useState([
    { role: "system", 
  content: `
  You are a helpful, efficient, and concise assistant for a teacher. Your sole goal is to gather lesson material for upcoming classes so you can later help students learn it more effectively.

  Your interaction should follow this flow:
  
  1. **Start** by asking the teacher to upload a document containing the material, or alternatively to describe the upcoming class topics in their own words.
  
  2. Once you receive the material or topic:
     - Briefly acknowledge the subject.
     - Ask teaching-related follow-up questions, such as:
       - What teaching methods they prefer (lecture, examples, discussion, etc.)
       - Whether there are specific examples or exercises they use in class
       - Any special needs or goals for the students
  
  3. After collecting all information:
     - Confirm that you're ready to support the students with personalized explanations and tutoring based on the material.
  
  Keep all responses **short, practical, and easy to scan** — avoid long explanations unless asked.
  
  If the teacher seems unsure, gently guide them by suggesting helpful options.
` 
},
    // { role: 'assistant', content: 'Hello! What would you like to plan today for class?' }
  ]);
  
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const startChat = async () => {
      const res = await fetch('https://teacher-backend-production.up.railway.app/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages })
      });
      const data = await res.json();
      setMessages([...messages, { role: 'assistant', content: data.reply }]);
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
  headers: {
    'Content-Type': 'application/json'
  },
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

    // Inject PDF text as if teacher typed it
    handleSendPDF(fullText);
  };

  reader.readAsArrayBuffer(file);
};

const handleSendPDF = async (pdfText) => {
  const newMessages = [...messages, { role: 'user', content: pdfText }];
  setMessages(newMessages);
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

  return (
    <div className="max-w-2xl mx-auto p-6 font-sans">
      <h1 className="text-2xl font-bold mb-4">👩‍🏫 AI Teaching Assistant</h1>
      <div className="h-[400px] overflow-y-auto mb-4 border p-3 rounded bg-white">
      {messages.filter(m => m.role === 'user' || m.role === 'assistant').map((msg, i) => (
        // {messages.filter(m => m.role !== 'system').map((msg, i) => (
          <div
            key={i}
            className={`mb-2 p-2 rounded ${msg.role === 'user' ? 'bg-blue-100 self-end text-right' : 'bg-gray-100 self-start text-left'}`}
          >
            {msg.content}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 border p-2 rounded"
          value={input}
          placeholder="Type your message..."
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <div className="mb-4">
          <label className="block mb-2 font-semibold">📄 Upload PDF Lesson Plan:</label>
          <input type="file" accept="application/pdf" onChange={handlePDFUpload} />
        </div>
        <button
          onClick={handleSend}
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          {loading ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
}

export default App;
