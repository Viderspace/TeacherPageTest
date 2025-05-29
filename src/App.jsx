import { useState } from 'react';

function App() {
  const [messages, setMessages] = useState([
    { role: "system", 
  content: `
You are a helpful, efficient, and concise assistant for teachers designing lesson plans.

Your interaction should follow this flow:

1. **Start** by asking the teacher to describe the class topic — either by uploading a document or writing a short description in their own words.

2. Once you receive the idea or plan:
   - Acknowledge the subject briefly.
   - Summarize the class material clearly, structured in a brief and readable format (bullets or headings if needed).

3. After summarizing:
   - Ask about the teacher's **teaching style preferences**, such as:
     - preferred methods (lecture, discussion, project-based, etc.)
     - student accommodations (e.g., special needs)
     - specific examples or questions they want to include.

Keep all responses **short, practical, and easy to scan** — avoid long explanations unless the teacher asks.

If the teacher is unsure what to include, gently guide them by suggesting possibilities.
` 
},
    { role: 'assistant', content: 'Hello! What would you like to plan today for class?' }
  ]);
  
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="max-w-2xl mx-auto p-6 font-sans">
      <h1 className="text-2xl font-bold mb-4">👩‍🏫 AI Teaching Assistant</h1>
      <div className="h-[400px] overflow-y-auto mb-4 border p-3 rounded bg-white">
        {messages.filter(m => m.role !== 'system').map((msg, i) => (
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
