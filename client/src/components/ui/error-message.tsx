import React from 'react';
import { AlertTriangle, XCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type ErrorType = 'error' | 'warning' | 'info';

const iconMap = {
  error: <XCircle className="h-5 w-5" />,
  warning: <AlertTriangle className="h-5 w-5" />,
  info: <Info className="h-5 w-5" />,
};

const colorMap = {
  error: 'bg-red-500/15 text-red-500 border-red-500/30',
  warning: 'bg-yellow-500/15 text-yellow-500 border-yellow-500/30',
  info: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
};

interface ErrorMessageProps {
  message: string | null;
  type?: ErrorType;
  className?: string;
  onClose?: () => void;
}

export default function ErrorMessage({ 
  message, 
  type = 'error', 
  className,
  onClose
}: ErrorMessageProps) {
  if (!message) return null;
  
  return (
    <div 
      className={cn(
        'flex items-start gap-3 rounded-md border p-3 text-sm', 
        colorMap[type],
        className
      )}
    >
      <div className="flex-shrink-0 mt-0.5">
        {iconMap[type]}
      </div>
      <div className="flex-1">
        {message}
      </div>
      {onClose && (
        <button 
          onClick={onClose}
          className="flex-shrink-0 rounded-full p-1 hover:bg-white/20"
          aria-label="Close"
        >
          <XCircle className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}