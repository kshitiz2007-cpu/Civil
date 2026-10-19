'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { MessageCircle, X, Send, Image as ImageIcon, Loader2 } from 'lucide-react';

export default function StudentChatWidget({ user }: { user: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [adminId, setAdminId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;

    // 1. Find the Admin's UUID
    async function fetchAdminId() {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin')
        .limit(1)
        .single();
      if (data) setAdminId(data.id);
    }
    fetchAdminId();

    // 2. Fetch Chat History
    async function fetchMessages() {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: true });
      if (data) setMessages(data);
    }
    fetchMessages();

    // 3. Subscribe to LIVE incoming messages
    const channel = supabase
      .channel('realtime_messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMsg = payload.new;
        if (newMsg.sender_id === user.id || newMsg.receiver_id === user.id) {
          setMessages((prev) => [...prev, newMsg]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // IMAGE UPLOAD HANDLER
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !adminId) return;

    // Optional: Validate file size (e.g., max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be smaller than 5MB");
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('chat-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('chat-images')
        .getPublicUrl(fileName);

      // Send the message with the image URL
      await supabase.from('messages').insert([{
        sender_id: user.id,
        receiver_id: adminId,
        content: "Sent an image", // Fallback text
        image_url: publicUrl
      }]);

    } catch (error: any) {
      console.error("Upload error:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
      // Reset the file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !adminId) return;

    const msgText = newMessage.trim();
    setNewMessage(''); 

    await supabase.from('messages').insert([{
      sender_id: user.id,
      receiver_id: adminId,
      content: msgText,
      image_url: null
    }]);
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-50 animate-fade-in">
      
      {isOpen && (
        <div className="mb-4 w-[320px] md:w-[380px] h-[500px] bg-[#0f172a]/90 backdrop-blur-3xl border border-white/20 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-slide-up origin-bottom-right">
          
          <div className="p-4 bg-emerald-500/20 border-b border-white/10 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full flex items-center justify-center text-white font-bold shadow-inner">
                  A
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-[#0f172a] rounded-full"></div>
              </div>
              <div>
                <h3 className="text-white font-bold text-sm">Admin Support</h3>
                <p className="text-emerald-300/70 text-[10px] font-bold uppercase tracking-widest">Typically replies instantly</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white transition-colors bg-white/5 p-2 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.length === 0 ? (
              <div className="text-center text-white/40 text-sm mt-10">
                Send a message to start the conversation!
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isMe = msg.sender_id === user.id;
                return (
                  <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-md flex flex-col gap-2 ${
                      isMe 
                        ? 'bg-emerald-500 text-white rounded-br-sm' 
                        : 'bg-white/10 text-white border border-white/10 rounded-bl-sm'
                    }`}>
                      {/* Render Image if it exists */}
                      {msg.image_url && (
                        <img 
                          src={msg.image_url} 
                          alt="Chat attachment" 
                          className="rounded-xl max-w-full h-auto object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(msg.image_url, '_blank')}
                        />
                      )}
                      
                      {/* Render Text (unless it's just the fallback text for an image-only message) */}
                      {!(msg.image_url && msg.content === "Sent an image") && (
                        <span>{msg.content}</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={sendMessage} className="p-4 bg-white/5 border-t border-white/10 flex gap-2 items-center">
            {/* Hidden File Input */}
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef}
              onChange={handleImageUpload}
              className="hidden" 
            />
            
            {/* Image Upload Button */}
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || !adminId}
              className="p-3 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-colors disabled:opacity-50 shrink-0"
              title="Upload Image"
            >
              {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
            </button>

            <input 
              type="text" 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              disabled={isUploading}
              className="flex-1 bg-white/5 border border-white/10 text-white placeholder-white/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            
            <button 
              type="submit"
              disabled={!newMessage.trim() || !adminId || isUploading}
              className="p-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      )}

      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 md:w-16 md:h-16 bg-emerald-500 hover:bg-emerald-400 rounded-full flex items-center justify-center text-white shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-transform hover:scale-110 border border-emerald-400/50 group"
        >
          <MessageCircle className="w-6 h-6 md:w-7 md:h-7 group-hover:animate-pulse" />
        </button>
      )}
    </div>
  );
}