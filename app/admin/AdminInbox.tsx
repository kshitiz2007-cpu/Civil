'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { MessageSquare, Send, Image as ImageIcon, Loader2, Search, User, Clock } from 'lucide-react';

export default function AdminInbox() {
  const [adminId, setAdminId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeUser, setActiveUser] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. INITIAL LOAD
  useEffect(() => {
    async function loadInbox() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setAdminId(session.user.id);

      // Fetch all messages to build the conversation list
      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (msgs) {
        // Extract unique student IDs
        const studentIds = new Set<string>();
        msgs.forEach(m => {
          if (m.sender_id !== session.user.id) studentIds.add(m.sender_id);
          if (m.receiver_id !== session.user.id) studentIds.add(m.receiver_id);
        });

        // Fetch profiles for those students
        if (studentIds.size > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('*')
            .in('id', Array.from(studentIds));

          if (profiles) setConversations(profiles);
        }
      }
      setLoading(false);
    }
    loadInbox();
  }, []);

  // 2. FETCH ACTIVE CHAT
  useEffect(() => {
    if (!adminId || !activeUser) return;

    async function fetchChat() {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .in('sender_id', [adminId, activeUser.id])
        .in('receiver_id', [adminId, activeUser.id])
        .order('created_at', { ascending: true });
      
      if (data) setMessages(data);
    }
    fetchChat();

    // Mark as read (optional logic)
    supabase.from('messages')
      .update({ is_read: true })
      .eq('sender_id', activeUser.id)
      .eq('receiver_id', adminId)
      .then();

  }, [activeUser, adminId]);

  // 3. REALTIME SUBSCRIPTION
  useEffect(() => {
    if (!adminId) return;

    const channel = supabase
      .channel('admin_inbox')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMsg = payload.new;
        
        // If the message belongs to the currently open chat, append it
        if (activeUser && (newMsg.sender_id === activeUser.id || newMsg.receiver_id === activeUser.id)) {
          setMessages((prev) => [...prev, newMsg]);
        }
        
        // TODO: Could also update the conversation list here to show unread badges
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [adminId, activeUser]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 4. SEND MESSAGE
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !adminId || !activeUser) return;

    const msgText = newMessage.trim();
    setNewMessage(''); 

    await supabase.from('messages').insert([{
      sender_id: adminId,
      receiver_id: activeUser.id,
      content: msgText
    }]);
  };

  // 5. UPLOAD IMAGE
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !adminId || !activeUser) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `admin_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('chat-images').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('chat-images').getPublicUrl(fileName);

      await supabase.from('messages').insert([{
        sender_id: adminId,
        receiver_id: activeUser.id,
        content: "Sent an image",
        image_url: publicUrl
      }]);

    } catch (error: any) {
      alert("Failed to upload image.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-emerald-400">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="font-medium text-white/70">Loading inbox...</p>
      </div>
    );
  }

  return (
    <div className="h-[80vh] bg-white/5 backdrop-blur-2xl rounded-[2rem] border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] flex overflow-hidden animate-fade-in text-white">
      
      {/* LEFT SIDEBAR: CONVERSATIONS LIST */}
      <div className="w-1/3 md:w-80 border-r border-white/10 flex flex-col bg-white/[0.02]">
        <div className="p-5 border-b border-white/10">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-400" /> Inbox
          </h2>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input 
              type="text" 
              placeholder="Search students..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 text-white placeholder-white/30"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {conversations.length === 0 ? (
            <div className="text-center text-white/40 p-4 text-sm mt-4">No messages yet.</div>
          ) : (
            conversations.map((c) => (
              <button 
                key={c.id}
                onClick={() => setActiveUser(c)}
                className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-colors ${
                  activeUser?.id === c.id ? 'bg-emerald-500/20 border border-emerald-500/30' : 'hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shrink-0">
                  {c.name?.charAt(0).toUpperCase() || 'S'}
                </div>
                <div className="overflow-hidden flex-1">
                  <h4 className="font-bold text-sm text-white truncate">{c.name || c.email}</h4>
                  <p className="text-xs text-white/50 truncate">Student</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* RIGHT SIDE: ACTIVE CHAT */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-[#020617]/50">
        {!activeUser ? (
          <div className="flex-1 flex flex-col items-center justify-center text-white/30">
            <MessageSquare className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg font-bold text-white/50">Select a conversation</p>
            <p className="text-sm">Choose a student from the left to start chatting.</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white/5 border-b border-white/10 flex items-center gap-3 backdrop-blur-md">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                {activeUser.name?.charAt(0).toUpperCase() || 'S'}
              </div>
              <div>
                <h3 className="font-bold text-white">{activeUser.name || activeUser.email}</h3>
                <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Student</p>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar">
              {messages.map((msg, idx) => {
                const isMe = msg.sender_id === adminId;
                return (
                  <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] p-3 md:p-4 rounded-2xl text-sm shadow-md flex flex-col gap-2 ${
                      isMe 
                        ? 'bg-emerald-500/20 text-emerald-50 border border-emerald-500/30 rounded-br-sm' 
                        : 'bg-white/10 text-white border border-white/20 rounded-bl-sm'
                    }`}>
                      {msg.image_url && (
                        <img 
                          src={msg.image_url} 
                          alt="Attachment" 
                          className="rounded-lg max-w-full h-auto object-cover cursor-pointer hover:opacity-90 transition-opacity border border-white/10"
                          onClick={() => window.open(msg.image_url, '_blank')}
                        />
                      )}
                      {!(msg.image_url && msg.content === "Sent an image") && (
                        <span className="leading-relaxed">{msg.content}</span>
                      )}
                      <span className="text-[9px] text-white/40 self-end mt-1 uppercase">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={sendMessage} className="p-4 bg-white/5 border-t border-white/10 flex gap-2 items-center backdrop-blur-md">
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
              <button 
                type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading}
                className="p-3 bg-white/5 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-colors shrink-0"
              >
                {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
              </button>

              <input 
                type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                placeholder={`Reply to ${activeUser.name?.split(' ')[0] || 'student'}...`}
                disabled={isUploading}
                className="flex-1 bg-white/5 border border-white/10 text-white placeholder-white/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              
              <button 
                type="submit" disabled={!newMessage.trim() || isUploading}
                className="p-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}