import React, { useState } from 'react';
import { Bot, Send, UserCheck, ShieldCheck, Sparkles, MessageSquare, Info } from 'lucide-react';
import { User, LoanApplication } from '../types';

interface IntelligenceAssistantProps {
  currentUser: User;
  currentApplication?: LoanApplication;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  source?: string;
  citations?: string[];
  timestamp: string;
}

export const IntelligenceAssistant: React.FC<IntelligenceAssistantProps> = ({
  currentUser,
  currentApplication,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg_welcome',
      sender: 'assistant',
      text:
        currentUser.role === 'admin'
          ? `Welcome to the Underwriting Intelligence Console. I have access to portfolio metrics, TreeSHAP attributions, and OCR cross-document heatmaps across all ${currentUser.name}'s active applications. What would you like to review?`
          : `Hello ${currentUser.name}. I am your Explainable Loan Assistant. I can explain the factors influencing your risk score, check your document verification status, or advise on improving your credit parameters for future applications.`,
      source: 'Verified Context Assistant',
      citations: [currentUser.role === 'admin' ? 'Portfolio Audit Trail' : 'Applicant File'],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      id: `msg_u_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          query: textToSend,
          applicationId: currentApplication?.id,
        }),
      });

      const data = await res.json();
      const assistantMsg: Message = {
        id: `msg_a_${Date.now()}`,
        sender: 'assistant',
        text: data.answer || 'No response returned.',
        source: data.source,
        citations: data.authorizedContextCitations,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setLoading(false);
    }
  };

  const sampleQueries =
    currentUser.role === 'admin'
      ? [
          'Which applications have active OCR document mismatches?',
          'What are the primary factors driving high risk scores across the portfolio?',
          'Show summary of applications requiring underwriter decision.',
        ]
      : [
          'Why did my application receive its current risk score?',
          'How can I lower my risk score in the What-If simulator?',
          'Are my uploaded income documents verified?',
        ];

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Loan Risk Intelligence Assistant
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Role-governed natural language assistant grounded strictly in authorized application records and TreeSHAP attributions.
        </p>
      </div>

      {/* Grounding & Privacy Badge */}
      <div className="p-3 bg-white border border-slate-200 rounded text-xs flex items-center justify-between text-slate-600">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>
            Authorized Active Scope: <strong>{currentUser.role === 'admin' ? 'Full Underwriting Portfolio' : `${currentUser.name} (Applicant)`}</strong>
          </span>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">
          Anti-Hallucination Grounding Active
        </span>
      </div>

      {/* Chat Messages Card */}
      <div className="bg-white border border-slate-200 rounded flex flex-col h-[480px]">
        {/* Messages Scroll Area */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {messages.map((m) => {
            const isUser = m.sender === 'user';

            return (
              <div
                key={m.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
              >
                <div
                  className={`max-w-[80%] p-3.5 rounded text-xs leading-relaxed ${
                    isUser
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-800 border border-slate-200'
                  }`}
                >
                  <div className="whitespace-pre-line">{m.text}</div>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-slate-400 px-1">
                  <span>{m.timestamp}</span>
                  {m.source && (
                    <>
                      <span>·</span>
                      <span className="font-medium text-slate-500">{m.source}</span>
                    </>
                  )}
                  {m.citations && m.citations.length > 0 && (
                    <>
                      <span>·</span>
                      <span className="text-blue-600 font-medium">Cited: {m.citations.join(', ')}</span>
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-500 italic p-2">
              <Bot className="w-4 h-4 animate-spin text-blue-600" />
              <span>Grounding answer in loan evidence...</span>
            </div>
          )}
        </div>

        {/* Suggested Queries Strip */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">Suggested:</span>
          {sampleQueries.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-slate-700 text-[11px] whitespace-nowrap transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            placeholder={
              currentUser.role === 'admin'
                ? 'Ask about portfolio defaults, anomaly causes, or model factors...'
                : 'Ask about your credit score, DTI ratio, or verification status...'
            }
            className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={loading || !inputQuery.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
