"use client";
import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../../components/Navbar';

export default function Chatbot() {
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hello! I am your AI Market Assistant. Ask me to predict future prices (e.g., "Predict trend for TCS") or get live quotes.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);

    // Use localhost fallback for development
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';

    try {
      const res = await axios.post(`${baseUrl}/api/chat`, { message: userMsg });
      setMessages(prev => [...prev, { role: 'bot', text: res.data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', text: "Sorry, I'm having trouble connecting to the market server." }]);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <div className="flex-grow max-w-4xl mx-auto w-full p-4 flex flex-col">
        <div className="bg-white shadow-lg rounded-xl flex flex-col flex-grow overflow-hidden border border-gray-200">
          
          {/* Header */}
          <div className="bg-blue-600 p-4">
            <h2 className="text-white font-bold text-lg flex items-center">
              <span className="text-2xl mr-2">🤖</span> AI Market Analyst
            </h2>
          </div>

          {/* Messages Area */}
          <div ref={scrollRef} className="flex-grow p-6 overflow-y-auto space-y-4 bg-gray-50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 whitespace-pre-wrap ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-none'
                }`}>
                  {/* Render text with basic formatting */}
                  {msg.text.split(/(\*\*.*?\*\*|_[^_]+_)/).map((part, i) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                      return <strong key={i}>{part.slice(2, -2)}</strong>;
                    } else if (part.startsWith('_') && part.endsWith('_')) {
                      return <em key={i}>{part.slice(1, -1)}</em>;
                    }
                    return part;
                  })}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-200 rounded-full px-4 py-2 text-gray-500 text-sm animate-pulse">
                  Analyzing market data...
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-gray-200">
            <form onSubmit={sendMessage} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Try: 'Predict price for TATAPOWER'"
                className="flex-grow border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button 
                type="submit" 
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}