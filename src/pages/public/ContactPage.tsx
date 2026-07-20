import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export const ContactPage: React.FC = () => {
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim() || !email.trim()) return;
    
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'support_tickets'), {
        userId: 'anonymous',
        userEmail: email,
        subject: ticketSubject,
        message: ticketMessage,
        status: 'open',
        createdAt: new Date().toISOString()
      });
      setSuccess(true);
      setTicketSubject('');
      setTicketMessage('');
      setEmail('');
    } catch (error) {
      console.error('Error submitting ticket:', error);
      alert('Failed to submit message. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-32 pb-24 px-6 max-w-3xl mx-auto">
      <div className="bg-[#111424] border border-white/5 rounded-3xl p-8 md:p-16 shadow-xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">Contact Support</h1>
          <p className="text-slate-400">Have a question or need help? Send us a message.</p>
        </div>

        {success ? (
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-6 rounded-2xl text-center">
            <h3 className="font-bold text-lg mb-2">Message Sent!</h3>
            <p>Thanks for reaching out. We'll get back to you shortly.</p>
            <button onClick={() => setSuccess(false)} className="mt-4 px-4 py-2 bg-white/5 rounded-lg text-sm hover:bg-white/10 transition-colors">Send another message</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0a0c16] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Subject</label>
              <input
                type="text"
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                className="w-full bg-[#0a0c16] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                placeholder="How can we help?"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Message</label>
              <textarea
                value={ticketMessage}
                onChange={(e) => setTicketMessage(e.target.value)}
                className="w-full bg-[#0a0c16] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all min-h-[150px] resize-y"
                placeholder="Describe your issue..."
                required
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-white text-black rounded-xl font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-5 h-5" /> Send Message</>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
