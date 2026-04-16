import React, { useState, useRef, useEffect } from 'react';
import { Bot, User, Sparkles, ChevronDown, Send } from 'lucide-react';
import { api } from '../services/api';
import { mockSOPs } from '../data/mockSOPs';
import { motion } from 'motion/react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AegisAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello, I am Aegis AI, your operational copilot. How can I assist you with the eCall platform today?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [windowSize, setWindowSize] = useState({ 
    width: typeof window !== 'undefined' ? window.innerWidth : 1000, 
    height: typeof window !== 'undefined' ? window.innerHeight : 800 
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const suggestedPrompts = [
    "Summarize the latest incident",
    "Which active incident is most critical?",
    "Recommend SOP for latest incident",
    "Recommend the nearest hospital",
    "Show vehicles with repeated incidents",
    "Which operator is overloaded?",
    "Generate a report for the latest resolved case"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI processing and response generation based on mock data
    setTimeout(async () => {
      let responseContent = "I'm sorry, I couldn't process that request.";
      
      try {
        const incidents = await api.getIncidents();
        const operators = await api.getOperators();
        const hospitals = await api.getHospitals();

        const lowerText = text.toLowerCase();

        if (lowerText.includes('latest incident') && lowerText.includes('summarize')) {
          const latest = incidents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
          responseContent = `The latest incident is **${latest.incidentId}** (${latest.severity} severity), triggered by ${latest.triggerType} for vehicle ${latest.plateNumber}. It is currently marked as "${latest.status}".`;
        } else if (lowerText.includes('most critical') || lowerText.includes('high severity')) {
          const highSeverity = incidents.filter(i => i.severity === 'high' && !['Resolved', 'Closed'].includes(i.status));
          if (highSeverity.length > 0) {
            responseContent = `There are ${highSeverity.length} critical active incidents. The most recent is **${highSeverity[0].incidentId}** (Vehicle: ${highSeverity[0].plateNumber}), currently ${highSeverity[0].status}.`;
          } else {
            responseContent = "There are currently no active high-severity incidents.";
          }
        } else if (lowerText.includes('sop') || lowerText.includes('procedure')) {
          const activeIncidents = incidents.filter(i => !['Resolved', 'Closed'].includes(i.status));
          if (activeIncidents.length > 0) {
            const inc = activeIncidents[0];
            let foundSOP = null;
            if (inc.triggerType === 'automatic' && inc.passengerCondition?.toLowerCase().includes('unconscious')) {
              foundSOP = mockSOPs.find(s => s.id === 'SOP-001');
            } else if (inc.notes?.toLowerCase().includes('trapped')) {
              foundSOP = mockSOPs.find(s => s.id === 'SOP-002');
            } else if (inc.notes?.toLowerCase().includes('fire') || inc.notes?.toLowerCase().includes('smoke')) {
              foundSOP = mockSOPs.find(s => s.id === 'SOP-003');
            } else if (inc.triggerType === 'manual' && inc.notes?.toLowerCase().includes('medical')) {
              foundSOP = mockSOPs.find(s => s.id === 'SOP-004');
            } else if (inc.passengerCondition?.toLowerCase().includes('child') || inc.passengerCondition?.toLowerCase().includes('elderly')) {
              foundSOP = mockSOPs.find(s => s.id === 'SOP-006');
            } else if (inc.triggerType === 'automatic') {
              foundSOP = mockSOPs.find(s => s.id === 'SOP-005');
            }
            
            if (foundSOP) {
              responseContent = `For the active incident **${inc.incidentId}**, I recommend following **${foundSOP.title}** (${foundSOP.id}). This is a ${foundSOP.priorityLevel} priority procedure. You can view the full checklist in the Emergency SOP Center.`;
            } else {
              responseContent = `I could not determine a specific SOP for incident **${inc.incidentId}**. Please review the incident details manually or consult the SOP Center.`;
            }
          } else {
            responseContent = "There are no active incidents requiring SOP recommendations at the moment.";
          }
        } else if (lowerText.includes('nearest hospital')) {
          const activeIncidents = incidents.filter(i => !['Resolved', 'Closed'].includes(i.status));
          if (activeIncidents.length > 0) {
            const inc = activeIncidents[0];
            const hosp = hospitals[0]; // Mock nearest
            responseContent = `For the active incident **${inc.incidentId}**, the nearest recommended hospital is **${hosp.name}** (approx. 3.2 km away).`;
          } else {
            responseContent = "There are no active incidents requiring hospital routing at the moment.";
          }
        } else if (lowerText.includes('repeated incidents')) {
          responseContent = "Vehicle **VAA 8899** has triggered 2 eCall alerts in the past 30 days. I recommend flagging this vehicle for maintenance review.";
        } else if (lowerText.includes('overloaded') || lowerText.includes('workload')) {
          const busyOperators = operators.sort((a, b) => b.activeIncidents - a.activeIncidents);
          if (busyOperators.length > 0 && busyOperators[0].activeIncidents > 2) {
            responseContent = `Operator **${busyOperators[0].name}** is currently handling ${busyOperators[0].activeIncidents} active incidents. Consider reassigning new cases to available dispatchers.`;
          } else {
            responseContent = "Operator workload is currently balanced. No operators are critically overloaded.";
          }
        } else if (lowerText.includes('report') && lowerText.includes('resolved')) {
          const resolved = incidents.filter(i => i.status === 'Resolved' || i.status === 'Closed');
          if (resolved.length > 0) {
            const res = resolved[0];
            responseContent = `**Incident Report: ${res.incidentId}**\n- **Vehicle:** ${res.plateNumber}\n- **Severity:** ${res.severity}\n- **Trigger:** ${res.triggerType}\n- **Status:** ${res.status}\n\n*Summary:* The incident was successfully handled and emergency services were dispatched. The case is now closed.`;
          } else {
            responseContent = "No recently resolved incidents found to generate a report.";
          }
        } else {
          responseContent = "I can help you summarize incidents, check operator workload, or find nearest hospitals. Could you please specify your request?";
        }
      } catch (error) {
        responseContent = "I encountered an error accessing the platform data. Please try again.";
      }

      const aiMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: responseContent,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <motion.div
          drag
          dragConstraints={{ 
            left: -windowSize.width + 80, 
            right: 0, 
            top: -windowSize.height + 80, 
            bottom: 0 
          }}
          dragElastic={0.1}
          dragMomentum={false}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={() => {
            setTimeout(() => setIsDragging(false), 150);
          }}
          className="fixed bottom-6 right-6 z-50 flex items-center justify-center"
          style={{ touchAction: 'none' }}
        >
          {/* Outer glowing ring */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#005691] to-[#00A8CB] animate-ping opacity-30" style={{ animationDuration: '2s' }}></div>

          {/* Main Button */}
          <motion.button
            onClick={(e) => {
              if (isDragging) {
                e.preventDefault();
                return;
              }
              setIsOpen(true);
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative w-14 h-14 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing
                       bg-gradient-to-tr from-[#005691] via-[#0073B0] to-[#00A8CB] text-white
                       shadow-[0_0_20px_rgba(0,168,203,0.5)] border border-white/20
                       backdrop-blur-sm overflow-hidden group"
            aria-label="Open Aegis AI"
          >
            {/* Inner shine effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <Sparkles className="w-6 h-6 relative z-10 drop-shadow-md" />
          </motion.button>
        </motion.div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-3rem)] h-[600px] max-h-[80vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-[#005691] text-white p-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Aegis AI</h3>
                <p className="text-xs text-blue-100">Operational Copilot</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-blue-100 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === 'user' 
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300' 
                    : 'bg-blue-100 dark:bg-blue-900/30 text-[#005691] dark:text-blue-400'
                }`}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.role === 'user' 
                    ? 'bg-[#005691] text-white rounded-tr-sm' 
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-sm shadow-sm'
                }`}>
                  {/* Simple markdown parsing for bold text and newlines */}
                  {msg.content.split('\n').map((line, i) => (
                    <p key={i} className={i > 0 ? 'mt-2' : ''}>
                      {line.split('**').map((part, j) => 
                        j % 2 === 1 ? <strong key={j} className="font-semibold">{part}</strong> : part
                      )}
                    </p>
                  ))}
                  <div className={`text-[10px] mt-1.5 ${msg.role === 'user' ? 'text-blue-200' : 'text-slate-400'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-[#005691] dark:text-blue-400 shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Prompts */}
          {messages.length < 3 && !isTyping && (
            <div className="px-4 py-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 overflow-x-auto whitespace-nowrap hide-scrollbar">
              <div className="flex gap-2 pb-1">
                {suggestedPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(prompt)}
                    className="inline-block px-3 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-full transition-colors border border-slate-200 dark:border-slate-700 whitespace-nowrap"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(inputValue);
              }}
              className="relative flex items-center"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask Aegis AI..."
                className="w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#005691] dark:text-white"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isTyping}
                className="absolute right-2 p-2 text-[#005691] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
