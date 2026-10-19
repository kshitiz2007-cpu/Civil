'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  CreditCard, CheckCircle, XCircle, Search, Loader2, ShieldCheck 
} from 'lucide-react';

interface Payment {
  id: string;
  user_id: string;
  quiz_id: string;
  transaction_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  profiles: { name: string; email: string };
  quizzes: { title: string };
}

export default function PaymentsManager() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    let active = true;
    async function fetchPayments() {
      setLoading(true);
      const { data } = await supabase
        .from('transactions')
        .select(`
          *,
          profiles:user_id (name, email),
          quizzes:quiz_id (title)
        `)
        .order('created_at', { ascending: false });
      if (active && data) setPayments(data as unknown as Payment[]);
      if (active) setLoading(false);
    }
    fetchPayments();
    return () => { active = false; };
  }, []);

  const updateStatus = async (paymentId: string, newStatus: 'approved' | 'rejected') => {
    const originalPayments = [...payments];
    
    // Optimistic UI update
    setPayments(payments.map(p => p.id === paymentId ? { ...p, status: newStatus } : p));

    const { error } = await supabase
      .from('transactions')
      .update({ status: newStatus })
      .eq('id', paymentId);

    if (error) {
      alert('Failed to update status');
      setPayments(originalPayments); // Revert on failure
    } else if (newStatus === 'approved') {
      // Logic to actually unlock the quiz for the user would go here 
      // (e.g., inserting into a 'purchases' table)
    }
  };

  const filteredPayments = payments.filter(p => 
    p.status === activeTab &&
    (p.transaction_id.toLowerCase().includes(searchQuery.toLowerCase()) || 
     p.profiles?.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-black text-emerald-950 font-serif tracking-tight flex items-center gap-3">
          <CreditCard className="w-8 h-8 text-emerald-600" /> Revenue & Verifications
        </h2>
        
        <div className="bg-white/40 p-1 rounded-2xl border border-white/60 shadow-sm backdrop-blur-md inline-flex">
          {(['pending', 'approved', 'rejected'] as const).map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold capitalize transition-all duration-300 ${
                activeTab === tab 
                  ? 'bg-white text-emerald-800 shadow-sm' 
                  : 'text-gray-500 hover:text-emerald-700'
              }`}
            >
              {tab}
              {tab === 'pending' && payments.filter(p => p.status === 'pending').length > 0 && (
                <span className="ml-2 bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                  {payments.filter(p => p.status === 'pending').length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white/40 backdrop-blur-xl rounded-[2rem] border border-white/60 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-white/60 bg-white/20 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h3 className="font-bold text-gray-900">Transaction History</h3>
            <p className="text-xs text-gray-500 font-medium mt-1">Verify UPI references before unlocking tests.</p>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by Name or UPI ID..." 
              className="glass-input w-full pl-9 py-2 text-sm rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
          ) : filteredPayments.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center opacity-60">
              <ShieldCheck className="w-12 h-12 text-gray-400 mb-3" />
              <p className="text-sm font-bold text-gray-600">No {activeTab} transactions found.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-white/40 text-xs uppercase text-gray-500 font-bold tracking-wider border-b border-white/60">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Module / Test</th>
                  <th className="px-6 py-4">UPI Ref ID</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/40">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-white/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{payment.profiles?.name || 'Unknown'}</div>
                      <div className="text-xs text-gray-500">{payment.profiles?.email || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-emerald-800">
                      {payment.quizzes?.title || 'Unknown Quiz'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono bg-white/60 px-2 py-1 rounded text-gray-700 font-bold">
                        {payment.transaction_id}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs font-semibold">
                      {new Date(payment.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {payment.status === 'pending' ? (
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => updateStatus(payment.id, 'approved')}
                            className="p-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg transition-colors"
                            title="Approve & Unlock"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => updateStatus(payment.id, 'rejected')}
                            className="p-2 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg transition-colors"
                            title="Reject"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          payment.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {payment.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}