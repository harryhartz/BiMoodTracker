import React from "react";
import { AlertCircle } from "lucide-react";

interface FormErrorProps {
  message?: string;
}

export default function FormError({ message }: FormErrorProps) {
  if (!message) return null;
  
  return (
    <div className="flex items-center gap-2 text-red-500 text-sm mt-1">
      <AlertCircle className="h-4 w-4" />
      <p>{message}</p>
    </div>
  );
}