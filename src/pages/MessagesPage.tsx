import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Conversation, Message } from '../types';
import { MessageSquare, Send, Paperclip, CheckCircle2, User, Building2 } from 'lucide-react';

export const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);

  const loadConversations = async () => {
    try {
      const res = await api.getConversations();
      if (res.success && res.conversations) {
        setConversations(res.conversations);
        if (res.conversations.length > 0 && !activeConv) {
          setActiveConv(res.conversations[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (convId: string) => {
    try {
      const res = await api.getMessages(convId);
      if (res.success) {
        setMessages(res.messages || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (activeConv) {
      loadMessages(activeConv.id);
    }
  }, [activeConv]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConv || !text.trim()) return;
    try {
      const res = await api.sendMessage(activeConv.id, { text });
      if (res.success) {
        setMessages(prev => [
          ...prev,
          {
            id: res.messageId,
            conversation_id: activeConv.id,
            sender_id: user?.id || '',
            text,
            read_status: 1,
            created_at: new Date().toISOString()
          }
        ]);
        setText('');
        loadConversations();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-xs font-bold text-slate-400">Loading chat messaging...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden h-[680px] grid grid-cols-1 md:grid-cols-3">
        {/* Conversations Sidebar */}
        <div className="border-r border-slate-200 dark:border-slate-800 p-4 flex flex-col">
          <h2 className="font-heading font-extrabold text-lg mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" /> Messaging & Chat
          </h2>

          <div className="flex-1 overflow-y-auto space-y-2">
            {conversations.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">No active conversations. Accept an application to start chatting!</div>
            ) : (
              conversations.map(conv => (
                <div
                  key={conv.id}
                  onClick={() => setActiveConv(conv)}
                  className={`p-3 rounded-2xl cursor-pointer transition-all flex items-center gap-3 ${
                    activeConv?.id === conv.id
                      ? 'bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <img
                    src={conv.other_party_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                    alt=""
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs truncate">{conv.other_party_name}</div>
                    <div className="text-[10px] text-blue-600 font-semibold truncate">{conv.campaign_title || 'Deal Collaboration'}</div>
                    <div className="text-[11px] text-slate-400 truncate">{conv.last_message}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Thread Area */}
        <div className="md:col-span-2 flex flex-col justify-between h-full bg-slate-50/50 dark:bg-slate-900/50">
          {activeConv ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3">
                <img
                  src={activeConv.other_party_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                  className="w-9 h-9 rounded-full object-cover"
                  alt=""
                />
                <div>
                  <div className="font-bold text-xs flex items-center gap-1">
                    {activeConv.other_party_name} <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                  <div className="text-[10px] text-slate-400">{activeConv.campaign_title}</div>
                </div>
              </div>

              {/* Messages Thread */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {messages.map(msg => {
                  const isMine = msg.sender_id === user?.id;

                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[75%] p-3.5 rounded-2xl text-xs ${
                          isMine
                            ? 'bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-500/20'
                            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-none'
                        }`}
                      >
                        <div>{msg.text}</div>
                        <div className={`text-[9px] mt-1 text-right ${isMine ? 'text-blue-100' : 'text-slate-400'}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Input Box */}
              <form onSubmit={handleSend} className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type a message or content brief update..."
                  value={text}
                  onChange={e => setText(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:border-blue-500"
                />
                <button type="submit" className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors">
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-400">Select a conversation to start chatting.</div>
          )}
        </div>
      </div>
    </div>
  );
};
