"use client";
import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../../components/Navbar';

export default function Chatbot() {
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hello! I am your AI Market Assistant. Ask me about stock prices, trends, or highs/lows for any Indian stock (e.g., "What is the price of ITC?").' }
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
    // Add user message
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setLoading(true); // <--- Important: Start loading

    try {
      // The backend now handles resolution, so we just send the raw text
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/chat`, { 
        message: userMsg 
      });
      
      setMessages(prev => [...prev, { role: 'bot', text: res.data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', text: "Sorry, I'm having trouble connecting to the market server." }]);
    }
    setLoading(false); // <--- Stop loading
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
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-200 rounded-full px-4 py-2 text-gray-500 text-sm animate-pulse">
                  Thinking...
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
                placeholder="Ask about a stock (e.g. 'Predict trend for TATASTEEL')"
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