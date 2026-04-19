import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, Loader2 } from 'lucide-react';
import { apiClient } from '../../utils/apiClient';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
}

export const ChatbotWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', text: "Hello! I'm Grinify assistant. How can I help you recycle today?", sender: 'bot' }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg: Message = { id: Date.now().toString(), text: input, sender: 'user' };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const data = await apiClient('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query: input }),
            });

            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: data.response || "Sorry, I'm having trouble connecting to the brain center.",
                sender: 'bot'
            };
            setMessages(prev => [...prev, botMsg]);
        } catch (err: any) {
            console.error("Chat failed:", err.message);
            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: "I'm offline right now, but you can try asking about plastic, paper or how to scan!",
                sender: 'bot'
            };
            setMessages(prev => [...prev, botMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.8, transformOrigin: 'bottom right' }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.8 }}
                        className="bg-white dark:bg-dark-surface w-80 md:w-96 h-[450px] rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 flex flex-col mb-4 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-primary p-4 flex items-center justify-between text-white">
                            <div className="flex items-center gap-2">
                                <Bot size={20} />
                                <h3 className="font-bold uppercase tracking-wider text-sm">Eco Assistant</h3>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Messages */}
                        <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-4">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.sender === 'user'
                                        ? 'bg-primary text-white rounded-tr-none'
                                        : 'bg-gray-100 dark:bg-gray-800 text-text dark:text-dark-text rounded-tl-none'
                                        }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-2xl rounded-tl-none">
                                        <Loader2 size={16} className="animate-spin text-primary" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Ask about recycling..."
                                className="flex-1 bg-gray-50 dark:bg-gray-900 border-none rounded-xl px-4 py-2 text-sm focus:ring-1 focus:ring-primary outline-none dark:text-white"
                            />
                            <button
                                onClick={handleSend}
                                className="bg-primary text-white p-2 rounded-xl hover:bg-primary/90 transition-colors"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="bg-primary text-white p-4 rounded-full shadow-lg shadow-primary/30 flex items-center justify-center"
            >
                {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
            </motion.button>
        </div>
    );
};
