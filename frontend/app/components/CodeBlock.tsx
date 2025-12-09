'use client';

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { Icon } from '@iconify/react';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface CodeBlockProps {
  code: string;
  language: string;
  title?: string;
  className?: string;
  showLineNumbers?: boolean;
}

export default function CodeBlock({ 
  code, 
  language, 
  title, 
  className = '', 
  showLineNumbers = false 
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success('Code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy code');
    }
  };
  
  return (
    <div className={`rounded-2xl overflow-hidden border border-[var(--border)] bg-[rgb(var(--surface-rgb)/0.6)] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] ${className}`}>
      {title && (
        <div className="flex items-center justify-between px-4 py-2 bg-[rgb(var(--surface-rgb)/0.6)] backdrop-blur-xl border-b border-[var(--border)]">
          <span className="text-sm font-medium text-[var(--muted-text)]">{title}</span>
          <button
            onClick={copyToClipboard}
            type="button"
            aria-label="Copy code to clipboard"
            className="flex items-center space-x-1 text-xs text-[var(--muted-text)] hover:text-[var(--text)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded"
          >
            <Icon 
              icon={copied ? 'material-symbols:check' : 'material-symbols:content-copy'} 
              className="w-4 h-4" 
            />
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
      )}
      
      <div className="relative">
        <SyntaxHighlighter
          language={language}
          style={oneLight}
          showLineNumbers={showLineNumbers}
          customStyle={{
            margin: 0,
            background: 'transparent',
            fontSize: '14px'
          }}
        >
          {code}
        </SyntaxHighlighter>
        
        {!title && (
          <button
            onClick={copyToClipboard}
            type="button"
            aria-label="Copy code to clipboard"
            className="absolute top-2 right-2 p-2 text-[var(--muted-text)] hover:text-[var(--text)] hover:bg-[rgb(var(--surface-rgb)/0.4)] backdrop-blur-xl rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            title="Copy to clipboard"
          >
            <Icon 
              icon={copied ? 'material-symbols:check' : 'material-symbols:content-copy'} 
              className="w-4 h-4" 
            />
          </button>
        )}
      </div>
    </div>
  );
}