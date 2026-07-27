import { X } from 'lucide-react';
import { ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ isOpen, onClose, title, children, size = 'lg' }: ModalProps) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
      role="presentation"
    >
      <div
        className={`rounded-2xl w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col`}
        style={{
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          boxShadow: '0 32px 80px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.9)',
          animation: 'fadeInUp 0.2s ease both',
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5 flex-shrink-0"
          style={{ borderBottom: '1px solid #E5E7EB' }}
        >
          <h3 style={{ color: '#111827', fontWeight: 700, fontSize: '1.125rem' }}>{title}</h3>
          <button
            type="button"
            aria-label="Close dialog"
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200"
            style={{ color: '#64748B', background: 'transparent' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = '#F3F4F6';
              (e.currentTarget as HTMLElement).style.color = '#111827';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'transparent';
              (e.currentTarget as HTMLElement).style.color = '#64748B';
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
