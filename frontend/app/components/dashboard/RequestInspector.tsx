'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';
import { getRequestHistory, clearRequestHistory } from '@/lib/api';
import CodeBlock from '../CodeBlock';

interface RequestLog {
  id: string;
  method: string;
  endpoint: string;
  timestamp: Date;
  status?: number;
  responseTime?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  request?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  response?: any;
  error?: string;
}

export default function RequestInspector() {
  const [history, setHistory] = useState<RequestLog[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<RequestLog | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'request' | 'response'>('response');
  
  useEffect(() => {
    loadHistory();
    
    // Refresh history every 2 seconds to show new requests
    const interval = setInterval(loadHistory, 2000);
    return () => clearInterval(interval);
  }, []);
  
  const loadHistory = () => {
    const logs = getRequestHistory();
    setHistory(logs.map(log => ({
      ...log,
      timestamp: new Date(log.timestamp)
    })));
  };
  
  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear the request history?')) {
      clearRequestHistory();
      setHistory([]);
      setSelectedRequest(null);
      toast.success('Request history cleared');
    }
  };
  
  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString();
  };
  
  const getStatusClass = () => {
    return 'text-[var(--text)] bg-[var(--surface)] border border-[var(--border)]';
  };
  
  const getMethodClass = () => {
    return 'text-[var(--text)] bg-[var(--surface)] border border-[var(--border)]';
  };
  
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[rgb(var(--surface-rgb)/0.55)] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
      <div className="p-4 border-b border-[var(--border)]">
        <div className="w-full flex items-center justify-between">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-1 flex items-center space-x-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-md"
            aria-expanded={isExpanded}
          >
            <Icon icon="material-symbols:history" className="w-5 h-5 text-[var(--muted-text)]" />
            <h3 className="font-medium text-[var(--text)]">Request History</h3>
            <span className="text-xs text-[var(--muted-text)]">({history.length} requests)</span>
          </button>
          <div className="flex items-center space-x-2">
            {history.length > 0 && (
              <button
                onClick={handleClearHistory}
                type="button"
                className="text-xs text-[var(--muted-text)] hover:text-[var(--text)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded"
              >
                Clear
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              type="button"
              className="text-[var(--muted-text)] hover:text-[var(--text)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded"
              aria-label={isExpanded ? "Collapse" : "Expand"}
            >
              <Icon 
                icon={isExpanded ? 'material-symbols:expand-less' : 'material-symbols:expand-more'} 
                className="w-5 h-5" 
              />
            </button>
          </div>
        </div>
      </div>
      
      <motion.div
        initial={false}
        animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        {history.length === 0 ? (
          <div className="p-8 text-center text-[var(--muted-text)]">
            <Icon icon="material-symbols:inbox" className="w-12 h-12 mx-auto text-[var(--border)] mb-4" />
            <p className="text-sm">No API requests yet</p>
            <p className="text-xs text-[var(--muted-text)] mt-1">Use the API testing tools to see requests here</p>
          </div>
        ) : (
          <>
            <div className="max-h-64 overflow-y-auto divide-y divide-[var(--border)]">
              {history.map((request, index) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="p-3 hover:bg-[rgb(var(--surface-rgb)/0.45)] backdrop-blur-xl cursor-pointer transition-colors"
                  onClick={() => setSelectedRequest(request)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${getMethodClass()}`}>
                        {request.method}
                      </span>
                      
                      {request.status && (
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${getStatusClass()}`}>
                          {request.status}
                        </span>
                      )}
                      
                      <span className="text-sm text-[var(--text)] font-mono truncate max-w-xs">
                        {request.endpoint}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-xs text-[var(--muted-text)]">
                      {request.responseTime && (
                        <span>{request.responseTime}ms</span>
                      )}
                      <span>{formatTimestamp(request.timestamp)}</span>
                    </div>
                  </div>
                  
                  {request.error && (
                    <p className="text-xs text-[var(--muted-text)] mt-1 truncate">{request.error}</p>
                  )}
                </motion.div>
              ))}
            </div>
            
            {/* Request Detail Modal */}
            {selectedRequest && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
                onClick={() => setSelectedRequest(null)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="request-detail-title"
                  className="rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-y-auto border border-[var(--border)] bg-[rgb(var(--surface-rgb)/0.6)] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.08)]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <h3 id="request-detail-title" className="font-medium text-[var(--text)]">Request Details</h3>
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${getMethodClass()}`}>
                        {selectedRequest.method}
                      </span>
                      {selectedRequest.status && (
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${getStatusClass()}`}>
                          {selectedRequest.status}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedRequest(null)}
                      type="button"
                      className="text-[var(--muted-text)] hover:text-[var(--text)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded"
                    >
                      <Icon icon="material-symbols:close" className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="p-4 space-y-4">
                    {/* Request Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-[var(--muted-text)] mb-1">Endpoint</label>
                        <p className="text-sm text-[var(--text)] font-mono bg-[rgb(var(--surface-rgb)/0.45)] backdrop-blur-xl rounded px-2 py-1 border border-[var(--border)]">{selectedRequest.endpoint}</p>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-[var(--muted-text)] mb-1">Timestamp</label>
                        <p className="text-sm text-[var(--text)]">{selectedRequest.timestamp.toLocaleString()}</p>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-[var(--muted-text)] mb-1">Response Time</label>
                        <p className="text-sm text-[var(--text)]">
                          {selectedRequest.responseTime ? `${selectedRequest.responseTime}ms` : 'N/A'}
                        </p>
                      </div>
                    </div>
                    
                    {selectedRequest.error && (
                      <div className="bg-[rgb(var(--surface-rgb)/0.45)] backdrop-blur-xl border border-[var(--border)] rounded-md p-3">
                        <div className="flex items-center space-x-2">
                          <Icon icon="material-symbols:error" className="w-4 h-4 text-[var(--muted-text)]" />
                          <p className="text-sm font-medium text-[var(--text)]">Error</p>
                        </div>
                        <p className="text-sm text-[var(--muted-text)] mt-1">{selectedRequest.error}</p>
                      </div>
                    )}
                    
                    {/* Request/Response Tabs */}
                    <div>
                      <div className="flex space-x-1 mb-4">
                        <button
                          onClick={() => setActiveTab('request')}
                          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                            activeTab === 'request'
                              ? 'bg-[var(--accent)] text-[var(--surface)]'
                              : 'text-[var(--muted-text)] hover:text-[var(--text)] border border-[var(--border)]'
                          }`}
                          disabled={!selectedRequest.request}
                        >
                          Request Body
                        </button>
                        
                        <button
                          onClick={() => setActiveTab('response')}
                          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                            activeTab === 'response'
                              ? 'bg-[var(--accent)] text-[var(--surface)]'
                              : 'text-[var(--muted-text)] hover:text-[var(--text)] border border-[var(--border)]'
                          }`}
                        >
                          Response
                        </button>
                      </div>
                      
                      {activeTab === 'request' ? (
                        selectedRequest.request ? (
                          <CodeBlock 
                            code={JSON.stringify(selectedRequest.request, null, 2)}
                            language="json"
                            title="Request Body"
                          />
                        ) : (
                          <div className="text-center py-8 text-[var(--muted-text)]">
                            <p className="text-sm">No request body</p>
                          </div>
                        )
                      ) : (
                        selectedRequest.response ? (
                          <CodeBlock 
                            code={typeof selectedRequest.response === 'string' 
                              ? selectedRequest.response 
                              : JSON.stringify(selectedRequest.response, null, 2)}
                            language={typeof selectedRequest.response === 'string' ? 'text' : 'json'}
                            title="Response Body"
                          />
                        ) : (
                          <div className="text-center py-8 text-[var(--muted-text)]">
                            <p className="text-sm">No response data</p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}