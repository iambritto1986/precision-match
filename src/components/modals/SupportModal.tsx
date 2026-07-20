import React, { useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';

interface SupportModalProps {
  onClose: () => void;
  user: any | null;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ onClose, user, showToast }) => {
  const [supportText, setSupportText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!supportText.trim()) return;
    setIsSubmitting(true);
    try {
      const supportRef = doc(collection(db, 'support_tickets'), Date.now().toString());
      await setDoc(supportRef, {
        userId: (user && user.uid !== 'local-guest-uid') ? user.uid : 'anonymous',
        email: (user && user.email) ? user.email : 'Anonymous',
        message: supportText.trim(),
        status: 'open',
        createdAt: new Date().toISOString()
      });
      showToast('Support ticket submitted successfully!', 'success');
      setSupportText('');
      onClose();
    } catch (e) {
      console.error(e);
      showToast('Failed to submit support ticket.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 backdrop-enter">
      <div className="modal-container max-w-md w-full p-6 modal-enter bg-[#0d111d] border border-white/10 rounded-2xl shadow-2xl">
        <h2 className="text-lg font-bold text-white mb-2">Contact Support</h2>
        <p className="text-sm text-slate-400 mb-4">Need help or facing an issue? Describe it below and our team will investigate.</p>
        <textarea
          value={supportText}
          onChange={e => setSupportText(e.target.value)}
          className="w-full h-32 rounded-xl px-3 py-2 text-sm mb-4 resize-none bg-[#090b14] border border-white/10 text-white focus:outline-none focus:border-cyan-500/50"
          placeholder="Describe your issue in detail..."
        />
        <div className="flex justify-end gap-3">
          <button 
            onClick={() => { setSupportText(''); onClose(); }} 
            className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !supportText.trim()}
            className="px-4 py-2 bg-gradient-to-b from-cyan-600 to-cyan-800 border border-cyan-500/20 text-white text-sm font-bold rounded-lg shadow hover:opacity-90 transition disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
          </button>
        </div>
      </div>
    </div>
  );
};
