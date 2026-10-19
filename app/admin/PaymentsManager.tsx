'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  CreditCard,
  CheckCircle,
  XCircle,
  Search,
  Loader2,
  ShieldCheck,
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
  const [activeTab, setActiveTab] = useState<
    'pending' | 'approved' | 'rejected'
  >('pending');

  useEffect(() => {
    let active = true;
    async function fetchPayments() {
      setLoading(true);
      const { data } = await supabase
        .from('transactions')
        .select(
          `
          *,
          profiles:user_id (name, email),
          quizzes:quiz_id (title)
        `
        )
        .order('created_at', { ascending: false });
      if (active && data) setPayments(data as unknown as Payment[]);
      if (active) setLoading(false);
    }
    fetchPayments();
    return () => {
      active = false;
    };
  }, []);

  const updateStatus = async (
    paymentId: string,
    newStatus: 'approved' | 'rejected'
  ) => {
    const originalPayments = [...payments];
    setPayments(
      payments.map((p) =>
        p.id === paymentId ? { ...p, status: newStatus } : p
      )
    );

    const { error } = await supabase
      .from('transactions')
      .update({ status: newStatus })
      .eq('id', paymentId);

    if (error) {
      alert('Failed to update status');
      setPayments(originalPayments);
    }
  };

  const filteredPayments = payments.filter(
    (p) =>
      p.status === activeTab &&
      (p.transaction_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.profiles?.name || '')
          .toLowerCase()
          .includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 text-[var(--app-text)]">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--app-accent)]">
            Enrollment Fee & Test Series Access
          </p>
          <h2 className="mt-1 text-2xl sm:text-3xl font-bold flex items-center gap-2.5">
            <CreditCard className="w-7 h-7 text-[var(--app-accent)]" /> Fee
            Verification Ledger
          </h2>
        </div>

        <div className="theme-surface p-1 rounded-2xl inline-flex">
          {(['pending', 'approved', 'rejected'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                activeTab === tab
                  ? 'bg-[var(--app-accent)] text-slate-950'
                  : 'text-[var(--app-muted)] hover:text-[var(--app-text)]'
              }`}
            >
              {tab}
              {tab === 'pending' &&
                payments.filter((p) => p.status === 'pending').length > 0 && (
                  <span className="ml-2 bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                    {payments.filter((p) => p.status === 'pending').length}
                  </span>
                )}
            </button>
          ))}
        </div>
      </div>

      <div className="theme-surface rounded-3xl overflow-hidden">
        <div className="p-5 border-b border-[var(--app-border)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="font-bold text-sm">UPI & Reference Verification</h3>
            <p className="text-xs text-[var(--app-muted)] mt-0.5">
              Verify UTR / UPI reference IDs before unlocking premium All-India
              Test Series modules.
            </p>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--app-muted)]" />
            <input
              type="text"
              placeholder="Search aspirant or UTR ID..."
              className="glass-input w-full pl-9 py-2 text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--app-accent)]" />
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
              <ShieldCheck className="w-10 h-10 text-[var(--app-muted)] mb-2 opacity-50" />
              <p className="text-xs font-bold text-[var(--app-muted)]">
                No {activeTab} fee verifications found.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs sm:text-sm min-w-[720px]">
              <thead className="bg-[var(--app-surface-muted)] text-[10px] uppercase text-[var(--app-muted)] font-bold tracking-wider border-b border-[var(--app-border)]">
                <tr>
                  <th className="px-5 py-4">Aspirant</th>
                  <th className="px-4 py-4">Test Series Module</th>
                  <th className="px-4 py-4">UPI / UTR Reference</th>
                  <th className="px-4 py-4">Date</th>
                  <th className="px-5 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--app-border)]">
                {filteredPayments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="hover:bg-[var(--app-surface-muted)] transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="font-bold">
                        {payment.profiles?.name || 'Aspirant'}
                      </div>
                      <div className="text-xs text-[var(--app-muted)]">
                        {payment.profiles?.email || 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-4 font-semibold text-[var(--app-accent)]">
                      {payment.quizzes?.title || 'Test Series Module'}
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-mono bg-[var(--app-surface-muted)] border border-[var(--app-border)] px-2.5 py-1 rounded-lg text-xs font-bold">
                        {payment.transaction_id}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-[var(--app-muted)] text-xs">
                      {new Date(payment.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {payment.status === 'pending' ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => updateStatus(payment.id, 'approved')}
                            className="p-2 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded-xl transition"
                            title="Approve & Unlock"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => updateStatus(payment.id, 'rejected')}
                            className="p-2 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 rounded-xl transition"
                            title="Reject"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            payment.status === 'approved'
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          }`}
                        >
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