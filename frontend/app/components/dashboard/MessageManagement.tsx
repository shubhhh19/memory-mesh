'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';
import { memoryMeshAPI, sampleData, getConfig } from '@/lib/api';
import CodeBlock from '../CodeBlock';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  importance_score: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: Record<string, any>;
  conversation_id: string;
}

export default function MessageManagement() {
  const [formData, setFormData] = useState({
    conversation_id: '',
    role: 'user' as const,
    content: '',
    metadata: '',
    importance_override: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [response, setResponse] = useState<any>(null);
  const [recentMessages, setRecentMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  
  const loadSampleData = () => {
    setFormData({
      conversation_id: sampleData.message.conversation_id,
      role: sampleData.message.role,
      content: sampleData.message.content,
      metadata: JSON.stringify(sampleData.message.metadata, null, 2),
      importance_override: ''
    });
    toast.success('Sample data loaded');
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.conversation_id.trim() || !formData.content.trim()) {
      toast.error('Conversation ID and content are required');
      return;
    }
    
    let metadata;
    if (formData.metadata.trim()) {
      try {
        metadata = JSON.parse(formData.metadata);
      } catch {
        toast.error('Invalid JSON format in metadata');
        return;
      }
    }
    
    let importance_override;
    if (formData.importance_override) {
      importance_override = parseFloat(formData.importance_override);
      if (isNaN(importance_override) || importance_override < 0 || importance_override > 1) {
        toast.error('Importance override must be between 0.0 and 1.0');
        return;
      }
    }
    
    setIsLoading(true);
    
    try {
      const config = getConfig();
      const result = await memoryMeshAPI.storeMessage({
        tenant_id: config.tenantId,
        conversation_id: formData.conversation_id,
        role: formData.role,
        content: formData.content,
        metadata,
        importance_override
      });
      
      setResponse(result);
      
      if (!result.error) {
        toast.success('Message stored successfully!');
        
        // Reset form
        setFormData({
          conversation_id: '',
          role: 'user',
          content: '',
          metadata: '',
          importance_override: ''
        });
        
        // Add to recent messages (simulated)
        if (result.data) {
          const newMessage: Message = {
            id: result.data.id || Date.now().toString(),
            role: formData.role,
            content: formData.content,
            created_at: new Date().toISOString(),
            importance_score: result.data.importance_score || 0.5,
            metadata,
            conversation_id: formData.conversation_id
          };
          setRecentMessages(prev => [newMessage, ...prev.slice(0, 9)]);
        }
      }
    } catch {
      // Error already handled by toast
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };
  
  const truncateContent = (content: string, maxLength: number = 100) => {
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  };
  
  return (
    <div className="space-y-6">
      {/* Store Message Section */}
      <div className="rounded-2xl border border-[var(--border)] bg-[rgb(var(--surface-rgb)/0.55)] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
        <div className="p-4 border-b border-[var(--border)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Icon icon="material-symbols:add" className="w-5 h-5 text-[var(--accent)]" />
              <h3 className="font-medium text-[var(--text)]">Store Message</h3>
            </div>
            <button
              onClick={loadSampleData}
              type="button"
              className="text-xs text-[var(--muted-text)] hover:text-[var(--text)] transition-colors flex items-center space-x-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded"
            >
              <Icon icon="material-symbols:data-object" className="w-3 h-3" />
              <span>Load Sample</span>
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4" aria-labelledby="store-message-heading">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="conversation_id" className="block text-sm font-medium text-[var(--muted-text)] mb-1">
                Conversation ID *
              </label>
              <input
                id="conversation_id"
                type="text"
                value={formData.conversation_id}
                onChange={(e) => handleInputChange('conversation_id', e.target.value)}
                placeholder="conversation-123"
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] bg-[rgb(var(--surface-rgb)/0.6)] backdrop-blur-xl text-[var(--text)]"
                required
              />
            </div>
            
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-[var(--muted-text)] mb-1">
                Role *
              </label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] bg-[rgb(var(--surface-rgb)/0.6)] backdrop-blur-xl text-[var(--text)]"
                required
              >
                <option value="user">User</option>
                <option value="assistant">Assistant</option>
                <option value="system">System</option>
              </select>
            </div>
          </div>
          
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-[var(--muted-text)] mb-1">
              Content *
            </label>
            <textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              placeholder="Enter the message content..."
              rows={4}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] bg-[rgb(var(--surface-rgb)/0.6)] backdrop-blur-xl text-[var(--text)]"
              required
            />
          </div>
          
          <div>
            <label htmlFor="metadata" className="block text-sm font-medium text-[var(--muted-text)] mb-1">
              Metadata (JSON, optional)
            </label>
            <textarea
              id="metadata"
              value={formData.metadata}
              onChange={(e) => handleInputChange('metadata', e.target.value)}
              placeholder='{"user_id": "123", "session_id": "abc"}'
              rows={3}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm font-mono focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] bg-[rgb(var(--surface-rgb)/0.6)] backdrop-blur-xl text-[var(--text)]"
            />
          </div>
          
          <div>
            <label htmlFor="importance_override" className="block text-sm font-medium text-[var(--muted-text)] mb-1">
              Importance Override (0.0 - 1.0, optional)
            </label>
            <input
              id="importance_override"
              type="number"
              min="0"
              max="1"
              step="0.1"
              value={formData.importance_override}
              onChange={(e) => handleInputChange('importance_override', e.target.value)}
              placeholder="0.8"
              className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] bg-[rgb(var(--surface-rgb)/0.6)] backdrop-blur-xl text-[var(--text)]"
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[var(--accent)] text-[var(--surface)] px-4 py-2 rounded-md font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            {isLoading ? (
              <>
                <Icon icon="material-symbols:progress-activity" className="w-4 h-4 animate-spin" />
                <span>Storing...</span>
              </>
            ) : (
              <>
                <Icon icon="material-symbols:send" className="w-4 h-4" />
                <span>Store Message</span>
              </>
            )}
          </button>
        </form>
        
        {response && (
          <div className="border-t border-[var(--border)] p-4">
            <h4 className="text-sm font-medium text-[var(--text)] mb-2">API Response</h4>
            <CodeBlock 
              code={JSON.stringify(response, null, 2)}
              language="json"
              className="text-xs"
            />
          </div>
        )}
      </div>
      
      {/* Recent Messages Section */}
      <div className="rounded-2xl border border-[var(--border)] bg-[rgb(var(--surface-rgb)/0.55)] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
        <div className="p-4 border-b border-[var(--border)]">
          <div className="flex items-center space-x-2">
            <Icon icon="material-symbols:history" className="w-5 h-5 text-[var(--accent)]" />
            <h3 className="font-medium text-[var(--text)]">Recent Messages</h3>
            <span className="text-xs text-[var(--muted-text)]">({recentMessages.length} stored locally)</span>
          </div>
        </div>
        
        <div className="divide-y divide-[var(--border)]">
          {recentMessages.length === 0 ? (
            <div className="p-8 text-center text-[var(--muted-text)]">
              <Icon icon="material-symbols:inbox" className="w-12 h-12 mx-auto text-[var(--border)] mb-4" />
              <p className="text-sm">No recent messages</p>
              <p className="text-xs text-[var(--muted-text)] mt-1">Store your first message to see it here</p>
            </div>
          ) : (
            recentMessages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="p-4 hover:bg-[rgb(var(--surface-rgb)/0.45)] backdrop-blur-xl cursor-pointer transition-colors"
                onClick={() => setSelectedMessage(message)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className={`inline-block w-2 h-2 rounded-full bg-[var(--accent)]`} />
                    <span className="text-sm font-medium text-[var(--text)] capitalize">{message.role}</span>
                    <span className="text-xs text-[var(--muted-text)]">{message.conversation_id}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <Icon icon="material-symbols:star" className="w-3 h-3 text-[var(--accent)]" />
                      <span className="text-xs text-[var(--muted-text)]">{message.importance_score.toFixed(2)}</span>
                    </div>
                    <span className="text-xs text-[var(--muted-text)]">{formatTimestamp(message.created_at)}</span>
                  </div>
                </div>
                <p className="text-sm text-[var(--text)]">{truncateContent(message.content)}</p>
              </motion.div>
            ))
          )}
        </div>
      </div>
      
      {/* Message Detail Modal */}
      {selectedMessage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedMessage(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="message-detail-title"
            className="rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-[var(--border)] bg-[rgb(var(--surface-rgb)/0.6)] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.08)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
              <h3 id="message-detail-title" className="font-medium text-[var(--text)]">Message Details</h3>
              <button
                onClick={() => setSelectedMessage(null)}
                type="button"
                className="text-[var(--muted-text)] hover:text-[var(--text)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded"
              >
                <Icon icon="material-symbols:close" className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-text)] mb-1">Message ID</label>
                  <p className="text-sm text-[var(--text)] font-mono">{selectedMessage.id}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-text)] mb-1">Role</label>
                  <p className="text-sm text-[var(--text)] capitalize">{selectedMessage.role}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-text)] mb-1">Conversation ID</label>
                  <p className="text-sm text-[var(--text)] font-mono">{selectedMessage.conversation_id}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-text)] mb-1">Importance Score</label>
                  <p className="text-sm text-[var(--text)]">{selectedMessage.importance_score.toFixed(3)}</p>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-[var(--muted-text)] mb-1">Created At</label>
                  <p className="text-sm text-[var(--text)]">{formatTimestamp(selectedMessage.created_at)}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-[var(--muted-text)] mb-1">Content</label>
                <div className="bg-[rgb(var(--surface-rgb)/0.45)] backdrop-blur-xl rounded-md p-3 border border-[var(--border)]">
                  <p className="text-sm text-[var(--text)] whitespace-pre-wrap">{selectedMessage.content}</p>
                </div>
              </div>
              
              {selectedMessage.metadata && (
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-text)] mb-1">Metadata</label>
                  <CodeBlock 
                    code={JSON.stringify(selectedMessage.metadata, null, 2)}
                    language="json"
                    className="text-xs"
                  />
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}