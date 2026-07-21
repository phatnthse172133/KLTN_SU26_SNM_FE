"use client";

import { useState, useEffect } from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { useToast } from '@/presentation/components/shared/ToastContext';
import { getErrorMessage } from '@/shared/errors/errorMapper';

interface SanctionModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetId: string;
  targetName: string;
  targetType: 'Night Market' | 'Booth';
  currentStatus: 'Active' | 'Suspended';
  onSubmit: (request: { status: 'Active' | 'Suspended', reason: string }) => Promise<void>;
}

export function SanctionModal({ isOpen, onClose, targetName, targetType, currentStatus, onSubmit }: SanctionModalProps) {
  const { showToast } = useToast();
  const [reason, setReason] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isSuspending = currentStatus === 'Active';
  const newStatus = isSuspending ? 'Suspended' : 'Active';



  // Escape to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (reason.length < 10 || reason.length > 1000) {
      setError('Reason must be between 10 and 1000 characters.');
      return;
    }
    if (isSuspending && !isConfirmed) {
      setError('You must confirm this action.');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      await onSubmit({ status: newStatus, reason });
      showToast('success', `${targetType} ${newStatus.toLowerCase()} successfully.`);
    } catch (err: unknown) {
      const msg = getErrorMessage(err);
      setError(msg);
      showToast('error', `Failed to ${isSuspending ? 'suspend' : 'restore'} ${targetType.toLowerCase()}.`);
      setIsLoading(false); // only stop loading on error, let parent unmount on success
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">

        {/* Header */}
        <div className={`p-6 border-b flex items-center gap-4 ${isSuspending ? 'bg-red-50' : 'bg-emerald-50'}`}>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${isSuspending ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
            {isSuspending ? <AlertTriangle className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {isSuspending ? `Suspend ${targetType}` : `Restore ${targetType}`}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Target: <span className="font-bold text-gray-900">{targetName}</span>
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Warning Box */}
          <div className={`p-4 rounded-xl border text-sm ${isSuspending ? 'bg-red-50 border-red-200 text-red-800' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
            {isSuspending ? (
              <p>Suspending this {targetType.toLowerCase()} will immediately hide it from public view and notify the owner. Active services may be interrupted.</p>
            ) : (
              <p>Restoring this {targetType.toLowerCase()} will reactivate it on the platform and notify the owner. Ensure all violations have been resolved.</p>
            )}
          </div>

          {/* Reason Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Reason for Action <span className="text-red-500">*</span>
            </label>
            <textarea
              disabled={isLoading}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError('');
              }}
              placeholder={`Enter detailed reason for ${isSuspending ? 'suspension' : 'restoration'}...`}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none disabled:bg-gray-50 disabled:text-gray-500"
              rows={5}
            />
            <div className="flex justify-between items-center mt-2">
              <span className={`text-xs ${reason.length < 10 || reason.length > 1000 ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                {reason.length} / 1000 characters
              </span>
              <span className="text-xs text-gray-500">Minimum 10 characters</span>
            </div>
          </div>

          {/* Confirmation Checkbox */}
          {isSuspending && (
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                disabled={isLoading}
                checked={isConfirmed}
                onChange={(e) => {
                  setIsConfirmed(e.target.checked);
                  if (error) setError('');
                }}
                className="mt-0.5 w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500 disabled:opacity-50"
              />
              <span className="text-sm text-gray-700 group-hover:text-gray-900">
                I confirm that I want to suspend this {targetType.toLowerCase()} and have provided a valid reason.
              </span>
            </label>
          )}

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
          <button
            disabled={isLoading}
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            disabled={isLoading}
            onClick={handleSubmit}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl transition-colors disabled:opacity-50 ${
              isSuspending ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              isSuspending ? 'Suspend Now' : 'Restore Now'
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
