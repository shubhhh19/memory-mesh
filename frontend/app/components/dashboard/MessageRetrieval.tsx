'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';
import { memoryMeshAPI } from '@/lib/api';
import CodeBlock from '../CodeBlock';

interface RetrievedMessage {
  id: string;
  tenant_id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: Record<string, any>;
  importance_score: number;
  created_at: string;
  updated_at: string;
  embedding_provider?: string;
  embedding_model?: string;
}

export default function MessageRetrieval() {
  const [messageId, setMessageId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<RetrievedMessage | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [response, setResponse] = useState<any>(null);
  const [showResponse, setShowResponse] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageId.trim()) {
      toast.error('Message ID is required');
      return;
    }
    
    // Basic UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(messageId.trim())) {
      toast.error('Please enter a valid UUID format');
      return;
    }
    
    setIsLoading(true);
    setMessage(null);
    setResponse(null);
    
    try {
      const result = await memoryMeshAPI.getMessage(messageId.trim());
      setResponse(result);
      
      if (!result.error && result.data) {
        setMessage(result.data);
        toast.success('Message retrieved successfully!');
      } else if (result.status === 404) {
        toast.error('Message not found');
      }
    } catch {
      // Error already handled by toast
    } finally {
      setIsLoading(false);
    }
  };
  
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };
  
  const generateSampleId = () => {
    // Generate a sample UUID for demonstration
    const sampleUuid = '550e8400-e29b-41d4-a716-446655440000';
    setMessageId(sampleUuid);
    toast.success('Sample UUID loaded');
  };
  
  return (
    <div className="space-y-6">
      {/* Message Retrieval Form */}
      <div className="rounded-2xl border border-[var(--border)] bg-[rgb(var(--surface-rgb)/0.55)] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
        <div className="p-4 border-b border-[var(--border)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Icon icon="material-symbols:download" className="w-5 h-5 text-[var(--accent)]" />
              <h3 className="font-medium text-[var(--text)]">Get Message by ID</h3>
            </div>
            <button
              onClick={generateSampleId}
              type="button"
              className="text-xs text-[var(--muted-text)] hover:text-[var(--text)] transition-colors flex items-center space-x-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded"
            >
              <Icon icon="material-symbols:auto-awesome" className="w-3 h-3" />
              <span>Sample ID</span>
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4">
          <div className="space-y-4">
            <div>
              <label htmlFor="message_id" className="block text-sm font-medium text-[var(--muted-text)] mb-1">
                Message ID (UUID) *
              </label>
              <div className="flex space-x-2">
                <input
                  id="message_id"
                  type="text"
                  value={messageId}
                  onChange={(e) => setMessageId(e.target.value)}
                  placeholder="550e8400-e29b-41d4-a716-446655440000"
                  className="flex-1 px-3 py-2 border border-[var(--border)] rounded-md text-sm font-mono focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] bg-[rgb(var(--surface-rgb)/0.6)] backdrop-blur-xl text-[var(--text)]"
                  required
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-[var(--accent)] text-[var(--surface)] px-6 py-2 rounded-md font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                >
                  {isLoading ? (
                    <>
                      <Icon icon="material-symbols:progress-activity" className="w-4 h-4 animate-spin" />
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <Icon icon="material-symbols:download" className="w-4 h-4" />
                      <span>Get Message</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-[var(--muted-text)] mt-1">Enter the UUID of the message you want to retrieve</p>
            </div>
          </div>
        </form>
        
        {response && (
          <div className="border-t border-[var(--border)]">
            <div className="p-4 flex items-center justify-between">
              <h4 className="text-sm font-medium text-[var(--text)]">API Response</h4>
              <button
                onClick={() => setShowResponse(!showResponse)}
                type="button"
                className="text-xs text-[var(--muted-text)] hover:text-[var(--text)] transition-colors flex items-center space-x-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded"
              >
                <Icon 
                  icon={showResponse ? 'material-symbols:expand-less' : 'material-symbols:expand-more'} 
                  className="w-4 h-4" 
                />
                <span>{showResponse ? 'Hide' : 'Show'} Raw Response</span>
              </button>
            </div>
            
            {showResponse && (
              <div className="px-4 pb-4">
                <CodeBlock 
                  code={JSON.stringify(response, null, 2)}
                  language="json"
                  className="text-xs"
                />
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Message Details */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl border border-[var(--border)] bg-[rgb(var(--surface-rgb)/0.55)] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.06)]"
        >
          <div className="p-4 border-b border-[var(--border)]">
            <div className="flex items-center space-x-2">
              <Icon icon="material-symbols:article" className="w-5 h-5 text-[var(--accent)]" />
              <h3 className="font-medium text-[var(--text)]">Message Details</h3>
              <span className={`inline-block w-2 h-2 rounded-full bg-[var(--accent)]`} />
              <span className="text-sm text-[var(--muted-text)] capitalize">{message.role}</span>
            </div>
          </div>
          
          <div className="p-4 space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[var(--muted-text)] mb-1">Message ID</label>
                <p className="text-sm text-[var(--text)] font-mono bg-[rgb(var(--surface-rgb)/0.45)] backdrop-blur-xl rounded px-2 py-1 border border-[var(--border)]">{message.id}</p>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-[var(--muted-text)] mb-1">Tenant ID</label>
                <p className="text-sm text-[var(--text)] font-mono bg-[rgb(var(--surface-rgb)/0.45)] backdrop-blur-xl rounded px-2 py-1 border border-[var(--border)]">{message.tenant_id}</p>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-[var(--muted-text)] mb-1">Conversation ID</label>
                <p className="text-sm text-[var(--text)] font-mono bg-[rgb(var(--surface-rgb)/0.45)] backdrop-blur-xl rounded px-2 py-1 border border-[var(--border)]">{message.conversation_id}</p>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-[var(--muted-text)] mb-1">Importance Score</label>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-[rgb(var(--surface-rgb)/0.45)] rounded-full h-2 border border-[var(--border)]">
                    <div 
                      className="h-2 rounded-full bg-[var(--accent)]"
                      style={{ width: `${Math.max(message.importance_score * 100, 5)}%` }}
                    />
                  </div>
                  <span className="text-sm text-[var(--text)] font-medium w-12">{message.importance_score.toFixed(3)}</span>
                </div>
              </div>
            </div>
            
            {/* Timestamps */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[var(--muted-text)] mb-1">Created At</label>
                <p className="text-sm text-[var(--text)]">{formatTimestamp(message.created_at)}</p>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-[var(--muted-text)] mb-1">Updated At</label>
                <p className="text-sm text-[var(--text)]">{formatTimestamp(message.updated_at)}</p>
              </div>
            </div>
            
            {/* Embedding Information */}
            {(message.embedding_provider || message.embedding_model) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {message.embedding_provider && (
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted-text)] mb-1">Embedding Provider</label>
                    <p className="text-sm text-[var(--text)]">{message.embedding_provider}</p>
                  </div>
                )}
                
                {message.embedding_model && (
                  <div>
                    <label className="block text-xs font-medium text-[var(--muted-text)] mb-1">Embedding Model</label>
                    <p className="text-sm text-[var(--text)] font-mono">{message.embedding_model}</p>
                  </div>
                )}
              </div>
            )}
            
            {/* Message Content */}
            <div>
              <label className="block text-xs font-medium text-[var(--muted-text)] mb-2">Message Content</label>
              <div className="bg-[rgb(var(--surface-rgb)/0.45)] backdrop-blur-xl rounded-lg p-4 border border-[var(--border)]">
                <p className="text-sm text-[var(--text)] whitespace-pre-wrap leading-relaxed">{message.content}</p>
              </div>
            </div>
            
            {/* Metadata */}
            {message.metadata && Object.keys(message.metadata).length > 0 && (
              <div>
                <label className="block text-xs font-medium text-[var(--muted-text)] mb-2">Metadata</label>
                <CodeBlock 
                  code={JSON.stringify(message.metadata, null, 2)}
                  language="json"
                  title="Message Metadata"
                />
              </div>
            )}
            
            {/* Actions */}
            <div className="flex items-center space-x-2 pt-4 border-t border-[var(--border)]">
              <button
                onClick={() => navigator.clipboard.writeText(message.id)}
                type="button"
                className="flex items-center space-x-1 text-xs text-[var(--muted-text)] hover:text-[var(--text)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded"
              >
                <Icon icon="material-symbols:content-copy" className="w-3 h-3" />
                <span>Copy ID</span>
              </button>
              
              <button
                onClick={() => navigator.clipboard.writeText(JSON.stringify(message, null, 2))}
                type="button"
                className="flex items-center space-x-1 text-xs text-[var(--muted-text)] hover:text-[var(--text)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded"
              >
                <Icon icon="material-symbols:download" className="w-3 h-3" />
                <span>Copy JSON</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}