'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineChatAlt2, HiOutlineX, HiPaperAirplane, HiOutlineDotsHorizontal } from 'react-icons/hi';
import api from '@/lib/api';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'สวัสดีครับ ผม Sentinel AI ผู้ช่วยด้านความปลอดภัยของคุณ มีเหตุฉุกเฉินหรือข้อสงสัยอะไรให้ผมช่วยไหมครับ?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        setInput('');

        const newMessages: Message[] = [...messages, { role: 'user', content: userMsg }];
        setMessages(newMessages);
        setIsLoading(true);

        try {
            // Filter messages to only send what openai needs
            const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));
            const response = await api.post('/chat', { messages: apiMessages });

            setMessages((prev) => [...prev, { role: 'assistant', content: response.data.reply }]);
        } catch (error) {
            console.error('Chat AI failed:', error);
            setMessages((prev) => [...prev, { role: 'assistant', content: 'ขออภัยครับ ระบบประมวลผลคำตอบขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้ง' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[99999] flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="mb-4 bg-white rounded-2xl shadow-2xl border border-slate-200 w-[350px] sm:w-[400px] h-[500px] max-h-[80vh] flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex items-center justify-between text-white shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                    <HiOutlineChatAlt2 className="w-5 h-5 flex-shrink-0" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">Sentinel AI</h3>
                                    <p className="text-xs text-blue-100/80">Support & Emergency Guide</p>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-full hover:bg-white/20 transition-colors">
                                <HiOutlineX className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Chat Body */}
                        <div className="flex-1 p-4 bg-slate-50 overflow-y-auto custom-scrollbar flex flex-col gap-3">
                            {messages.map((msg, index) => (
                                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div
                                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                                ? 'bg-blue-600 text-white rounded-br-sm'
                                                : 'bg-white text-slate-700 border border-slate-200 rounded-bl-sm whitespace-pre-line'
                                            }`}
                                    >
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-white border border-slate-200 rounded-bl-sm shadow-sm flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 shrink-0">
                            <div className="flex items-center gap-2 bg-slate-100 rounded-full p-1 pl-4 border border-slate-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                                <input
                                    type="text"
                                    placeholder="พิมพ์ข้อความสอบถามที่นี่..."
                                    className="flex-1 bg-transparent border-none outline-none text-sm text-slate-700 placeholder-slate-400"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    disabled={isLoading}
                                />
                                <button
                                    type="submit"
                                    disabled={isLoading || !input.trim()}
                                    className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <HiPaperAirplane className="w-4 h-4" style={{ transform: 'rotate(90deg)' }} />
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Bubble Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full shadow-xl flex items-center justify-center text-white border-2 border-white focus:outline-none"
            >
                {isOpen ? <HiOutlineX className="w-6 h-6" /> : <HiOutlineChatAlt2 className="w-6 h-6" />}
            </motion.button>
        </div>
    );
}
