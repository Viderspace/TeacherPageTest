
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

    // Send the extracted text as if the teacher typed it
    const newMessages = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setLoading(true);

    const res = await fetch('https://teacher-backend-production.up.railway.app/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: newMessages })
    });

    const data = await res.json();
    const reply = data.reply || 'Sorry, something went wrong.';
    setMessages([...newMessages, { role: 'assistant', content: reply }]);
    setLoading(false);
  };

  fileReader.readAsArrayBuffer(file);
};


function App() {
  const [messages, setMessages] = useState([
    {
      role: "system",
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
    const newMessages = [
      ...messages,
      { role: 'user', content: '📄 [Document uploaded]' }  // This shows in chat
    ];
    setMessages(newMessages);
    setLoading(true);

    const backendMessages = [
      ...messages,
      { role: 'user', content: pdfText }  // This is sent to the backend only
    ];

    const res = await fetch('https://teacher-backend-production.up.railway.app/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: backendMessages })
    });

    const data = await res.json();
    const reply = data.reply || "Sorry, something went wrong.";
    setMessages([...newMessages, { role: 'assistant', content: reply }]);
    setLoading(false);
  };

// const publishTutorPrompt = async () => {

//   const promptText = `You are a helpful, efficient, and concise AI tutor. Your goal is to help the student understand the following material:

// ${messages.filter(m => m.role !== 'system' && m.role !== 'assistant').map(m => m.content).join('\n')}

// Adapt your teaching style to the student's needs.`;

// const sessionId = prompt("Give this lesson a short name (e.g., pythagorean):", "latest") || "latest";

//   await fetch('https://teacher-backend-production.up.railway.app/set-tutor-prompt', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ session: sessionId, prompt: promptText })
//   });

//   const link = `https://viderspace.github.io/StudentPageTest/?session=${encodeURIComponent(sessionId)}`;
//   alert(`✅ Tutor prompt published!\n\nShare this link with your students:\n${link}`);
// };
  // 

  const publishTutorPrompt = async () => {
  let sessionId = prompt("Give this lesson a short name (e.g., pythagorean):", "latest");
  if (!sessionId) {
    alert("❌ A session name is required to publish a tutor.");
    return;
  }

  // Collect only teacher-submitted content
  const teacherContent = messages
    .filter(m => m.role === 'user')
    .map(m => m.content)
    .join('\n');

  const promptText = `You are a helpful, efficient, and concise AI tutor. Your goal is to help the student understand the following material:\n\n${teacherContent}\n\nAdapt your teaching style to the student's needs.`;

  try {
    const response = await fetch('https://teacher-backend-production.up.railway.app/set-tutor-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session: sessionId, prompt: promptText })
    });

    const data = await response.json();
    if (data.status !== 'ok') {
      throw new Error("Failed to save tutor prompt");
    }

    const link = `https://viderspace.github.io/StudentPageTest/?session=${encodeURIComponent(sessionId)}`;
    alert(`✅ Tutor prompt published!\n\nShare this link with your students:\n${link}`);
  } catch (err) {
    console.error(err);
    alert("❌ Failed to publish tutor prompt. Please try again.");
  }
};

  return (
    <div className="max-w-2xl mx-auto p-6 font-sans">
      <h1 className="text-2xl font-bold mb-4">👩‍🏫 מורה מלווה</h1>
      <div className="h-[400px] overflow-y-auto mb-4 border p-3 rounded bg-white">
        <pre className="whitespace-pre-wrap text-left">
          {messages
            .filter(m => m.role === 'user' || m.role === 'assistant')
            .map(m => m.content)
            .join('\n\n')}
        </pre>
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
        <button onClick={publishTutorPrompt} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mt-4">
          Publish Tutor
        </button>
      </div>
    </div>
  );

}

export default App;