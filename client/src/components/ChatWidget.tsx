import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { MessageSquare, X, Send, Loader2, Sparkles, Compass, Maximize2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      text: "Hello! I am your AI Travel Copilot. Ask me anything about destinations, budgeting, packing, or routes!",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();

  // Scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Load session from localStorage on mount
  useEffect(() => {
    const savedSession = localStorage.getItem("chat_widget_session");
    if (savedSession) {
      setSessionId(savedSession);
    }
  }, []);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Math.random().toString(),
      text: text,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const res = await apiFetch("/api/chat/message", {
        method: "POST",
        body: JSON.stringify({
          message: text,
          session: sessionId,
        }),
      });

      if (res && res.data) {
        const replyText = res.data.reply;
        const newSession = res.data.session;
        if (newSession && newSession !== sessionId) {
          setSessionId(newSession);
          localStorage.setItem("chat_widget_session", newSession);
        }

        const aiMessage: Message = {
          id: Math.random().toString(),
          text: replyText,
          sender: "ai",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      }
    } catch (e) {
      console.error(e);
      const errorMessage: Message = {
        id: Math.random().toString(),
        text: "Sorry, I am having trouble connecting right now. Please try again.",
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action: string) => {
    handleSendMessage(action);
  };

  const openFullChat = () => {
    setIsOpen(false);
    navigate("/chat-assistant");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Expanded Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="mb-4"
          >
            <Card className="w-80 sm:w-96 h-[480px] shadow-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col rounded-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-teal-600 to-teal-700 p-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <Compass className="w-5 h-5 text-white animate-spin-slow" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">AI Travel Copilot</h4>
                    <p className="text-[10px] text-teal-100 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Ready to plan
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="w-8 h-8 text-white hover:bg-white/10"
                    onClick={openFullChat}
                    title="Open Full Screen Chat"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="w-8 h-8 text-white hover:bg-white/10"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950">
                {messages.map((msg) => {
                  const isAI = msg.sender === "ai";
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isAI ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl p-3 text-sm leading-relaxed shadow-sm ${
                          isAI
                            ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-slate-800"
                            : "bg-teal-600 text-white rounded-tr-none"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                        <span className={`block text-[9px] mt-1 text-right ${isAI ? "text-slate-400" : "text-teal-200"}`}>
                          {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-2xl rounded-tl-none p-3 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 text-teal-600 animate-spin" />
                      <span className="text-xs animate-pulse">Copilot is thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Suggestions (Shown if only welcome message exists or dynamically) */}
              {messages.length === 1 && (
                <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-1.5 justify-center">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-[10px] h-7 px-2.5 rounded-full border-teal-200 text-teal-700 hover:bg-teal-50"
                    onClick={() => handleQuickAction("Recommend a beach destination")}
                  >
                    🏖️ Recommend Beach
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-[10px] h-7 px-2.5 rounded-full border-teal-200 text-teal-700 hover:bg-teal-50"
                    onClick={() => handleQuickAction("Suggest a mountain trip itinerary")}
                  >
                    ⛰️ Mountain Itinerary
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-[10px] h-7 px-2.5 rounded-full border-teal-200 text-teal-700 hover:bg-teal-50"
                    onClick={() => handleQuickAction("Budget tips for Paris")}
                  >
                    💶 Paris Budget Advice
                  </Button>
                </div>
              )}

              {/* Input Area */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage(inputValue);
                }}
                className="p-3 border-t border-slate-200 dark:border-slate-800 flex gap-2 bg-white dark:bg-slate-900"
              >
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask Travel Copilot..."
                  className="flex-1 h-9 text-xs focus-visible:ring-teal-600 focus-visible:ring-1 border-slate-200 dark:border-slate-700 bg-transparent"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="w-9 h-9 bg-teal-600 hover:bg-teal-700 text-white rounded-lg flex items-center justify-center shrink-0"
                  disabled={!inputValue.trim() || isLoading}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-full flex items-center justify-center shadow-2xl hover:shadow-teal-500/20 focus:outline-none"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <div className="relative">
            <MessageSquare className="w-6 h-6 text-white" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-orange-500 rounded-full border border-teal-700 animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-orange-500 rounded-full border border-teal-700" />
          </div>
        )}
      </motion.button>
    </div>
  );
}

export default ChatWidget;
