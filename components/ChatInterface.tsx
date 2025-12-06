import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Sparkles } from 'lucide-react';
import { sendChatMessage } from '../services/geminiService';
import { ChatMessage } from '../types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

export const ChatInterface: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'model', text: "Hello! I'm your Suno Copilot. Need help writing lyrics or brainstorming music styles?" }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setIsLoading(true);

        try {
            // Prepare history for Gemini API
            const history = messages.map(m => ({
                role: m.role,
                parts: [{ text: m.text }]
            }));

            const responseText = await sendChatMessage(history, userMsg);
            
            setMessages(prev => [...prev, { role: 'model', text: responseText || "I couldn't generate a response." }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-black text-white w-full">
            <div className="flex items-center gap-2 p-4 border-b border-zinc-900 bg-zinc-950">
                <Sparkles size={20} className="text-yellow-500" />
                <h2 className="font-bold text-lg">AI Music Copilot</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'model' && (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
                                <Bot size={16} className="text-white" />
                            </div>
                        )}
                        <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-zinc-800 text-white rounded-tr-sm' : 'bg-zinc-900 text-zinc-200 rounded-tl-sm'}`}>
                            {msg.text.split('\n').map((line, i) => <p key={i} className="mb-1 last:mb-0">{line}</p>)}
                        </div>
                        {msg.role === 'user' && (
                             <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center shrink-0">
                                <User size={16} />
                             </div>
                        )}
                    </div>
                ))}
                {isLoading && (
                    <div className="flex gap-3 justify-start">
                         <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
                             <Bot size={16} className="text-white" />
                         </div>
                         <div className="bg-zinc-900 p-3 rounded-2xl rounded-tl-sm flex items-center gap-1">
                             <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce"></div>
                             <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce delay-100"></div>
                             <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce delay-200"></div>
                         </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-zinc-950 border-t border-zinc-900">
                <div className="flex w-full items-center space-x-2">
                    <Input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask about music theory, lyrics, or style ideas..."
                        className="flex-1 bg-zinc-900 border-zinc-800"
                        disabled={isLoading}
                    />
                    <Button 
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        size="icon"
                        className="bg-white text-black hover:bg-zinc-200"
                    >
                        <Send size={18} />
                    </Button>
                </div>
            </div>
        </div>
    );
};