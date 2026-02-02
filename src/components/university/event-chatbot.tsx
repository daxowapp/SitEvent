"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, Loader2, Sparkles } from "lucide-react";

interface Message {
    role: "user" | "assistant";
    content: string;
}

export function EventChatbot({ eventId }: { eventId?: string }) {
    // If no specific event is selected (e.g. global analytics), we might want to disable or handle globally
    // For now, let's assume it requires an ID or handles 'all' if backend supports it.
    // The previous backend code expected eventId. If we are on global analytics, we might need to pick the "active" events or pass a flag.
    // Let's make it robust: If no eventId, show a selector or generic message? 
    // Actually for now let's just assume we pass the first active event ID or handle logic in parent.
    
    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: "Hello! I can help you analyze your event data. Ask me about student demographics, majors, or enrollment stats." }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const handleSend = async () => {
        if (!input.trim() || !eventId) return;

        const userMsg: Message = { role: "user", content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
                    eventId 
                }),
            });

            const data = await res.json();
            
            if (data.error) throw new Error(data.error);

            setMessages(prev => [...prev, { role: "assistant", content: data.content }]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I encountered an error analyzing the data." }]);
        } finally {
            setLoading(false);
        }
    };

    if (!eventId) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {!isOpen && (
                <Button 
                    onClick={() => setIsOpen(true)} 
                    className="rounded-full w-14 h-14 shadow-xl bg-indigo-600 hover:bg-indigo-700 text-white p-0 flex items-center justify-center transition-transform hover:scale-105"
                >
                    <Sparkles className="w-6 h-6" />
                </Button>
            )}

            {isOpen && (
                <Card className="w-[350px] h-[500px] shadow-2xl flex flex-col animate-in slide-in-from-bottom-10 fade-in duration-300">
                    <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-xl p-4 flex flex-row justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Bot className="w-5 h-5" />
                            <CardTitle className="text-base">Data Assistant</CardTitle>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:bg-white/20" onClick={() => setIsOpen(false)}>
                            X
                        </Button>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col p-0 overflow-hidden bg-white">
                        <ScrollArea className="flex-1 p-4">
                            <div className="space-y-4">
                                {messages.map((m, i) => (
                                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] rounded-lg p-3 text-sm ${
                                            m.role === 'user' 
                                                ? 'bg-indigo-600 text-white' 
                                                : 'bg-gray-100 text-gray-800'
                                        }`}>
                                            {m.content}
                                        </div>
                                    </div>
                                ))}
                                {loading && (
                                    <div className="flex justify-start">
                                        <div className="bg-gray-100 rounded-lg p-3">
                                            <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                        <div className="p-3 border-t bg-gray-50 flex gap-2">
                            <Input 
                                value={input} 
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                placeholder="Ask about majors..."
                                className="bg-white"
                            />
                            <Button size="icon" onClick={handleSend} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
                                <Send className="w-4 h-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
