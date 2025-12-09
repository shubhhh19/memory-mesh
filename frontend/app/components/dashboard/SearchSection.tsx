'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';
import { memoryMeshAPI, sampleData } from '@/lib/api';
import CodeBlock from '../CodeBlock';

interface SearchResult {
  message: {
    id: string;
    content: string;
    role: 'user' | 'assistant' | 'system';
    created_at: string;
    conversation_id: string;
    importance_score: number;
  };
  similarity_score: number;
  temporal_decay_factor: number;
}

export default function SearchSection() {
  const [searchData, setSearchData] = useState({
    query: '',
    conversation_id: '',
    top_k: 5,
    min_importance: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [response, setResponse] = useState<any>(null);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  
  const loadSampleData = () => {
    setSearchData(prev => ({
      ...prev,
      query: sampleData.search.query,
      top_k: sampleData.search.top_k
    }));
    toast.success('Sample search loaded');
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchData.query.trim()) {
      toast.error('Search query is required');
      return;
    }
    
    if (searchData.top_k < 1 || searchData.top_k > 20) {
      toast.error('Top K must be between 1 and 20');
      return;
    }
    
    let min_importance;
    if (searchData.min_importance) {
      min_importance = parseFloat(searchData.min_importance);
      if (isNaN(min_importance) || min_importance < 0 || min_importance > 1) {
        toast.error('Minimum importance must be between 0.0 and 1.0');
        return;
      }
    }
    
    setIsLoading(true);
    setResults([]);
    
    try {
      const result = await memoryMeshAPI.searchMemories({
        query: searchData.query,
        conversation_id: searchData.conversation_id || undefined,
        top_k: searchData.top_k,
        min_importance
      });
      
      setResponse(result);
      
      if (!result.error && result.data?.results) {
        setResults(result.data.results);
        toast.success(`Found ${result.data.results.length} results`);
      } else if (!result.error && result.data?.results?.length === 0) {
        toast.success('No results found for your search');
      }
    } catch {
      // Error already handled by toast
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleInputChange = (field: string, value: string | number) => {
    setSearchData(prev => ({ ...prev, [field]: value }));
  };
  
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };
  
  const highlightQuery = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.split(' ').join('|')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => {
      if (regex.test(part)) {
        return (
          <span key={index} className="border-b border-dashed border-[var(--accent)]">
            {part}
          </span>
        );
      }
      return part;
    });
  };
  
  const getScoreWidth = (score: number) => {
    return Math.max(score * 100, 5); // Minimum 5% width
  };
  
  return (
    <div className="space-y-6">
      {/* Search Form */}
      <div className="rounded-2xl border border-[var(--border)] bg-[rgb(var(--surface-rgb)/0.55)] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
        <div className="p-4 border-b border-[var(--border)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Icon icon="material-symbols:search" className="w-5 h-5 text-[var(--accent)]" />
              <h3 className="font-medium text-[var(--text)]">Search Memories</h3>
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
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label htmlFor="query" className="block text-sm font-medium text-[var(--muted-text)] mb-1">
              Search Query *
            </label>
            <input
              id="query"
              type="text"
              value={searchData.query}
              onChange={(e) => handleInputChange('query', e.target.value)}
              placeholder="Enter your search query..."
              className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] bg-[rgb(var(--surface-rgb)/0.6)] backdrop-blur-xl text-[var(--text)]"
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="conversation_id_filter" className="block text-sm font-medium text-[var(--muted-text)] mb-1">
                Conversation ID (optional)
              </label>
              <input
                id="conversation_id_filter"
                type="text"
                value={searchData.conversation_id}
                onChange={(e) => handleInputChange('conversation_id', e.target.value)}
                placeholder="Filter by conversation"
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] bg-[rgb(var(--surface-rgb)/0.6)] backdrop-blur-xl text-[var(--text)]"
              />
            </div>
            
            <div>
              <label htmlFor="top_k" className="block text-sm font-medium text-[var(--muted-text)] mb-1">
                Top K Results
              </label>
              <input
                id="top_k"
                type="number"
                min="1"
                max="20"
                value={searchData.top_k}
                onChange={(e) => handleInputChange('top_k', parseInt(e.target.value) || 5)}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] bg-[rgb(var(--surface-rgb)/0.6)] backdrop-blur-xl text-[var(--text)]"
              />
            </div>
            
            <div>
              <label htmlFor="min_importance_search" className="block text-sm font-medium text-[var(--muted-text)] mb-1">
                Min Importance (optional)
              </label>
              <input
                id="min_importance_search"
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={searchData.min_importance}
                onChange={(e) => handleInputChange('min_importance', e.target.value)}
                placeholder="0.0"
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] bg-[rgb(var(--surface-rgb)/0.6)] backdrop-blur-xl text-[var(--text)]"
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[var(--accent)] text-[var(--surface)] px-4 py-2 rounded-md font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            {isLoading ? (
              <>
                <Icon icon="material-symbols:progress-activity" className="w-4 h-4 animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Icon icon="material-symbols:search" className="w-4 h-4" />
                <span>Search Memories</span>
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
      
      {/* Search Results */}
      {results.length > 0 && (
        <div className="rounded-2xl border border-[var(--border)] bg-[rgb(var(--surface-rgb)/0.55)] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
          <div className="p-4 border-b border-[var(--border)]">
            <div className="flex items-center space-x-2">
              <Icon icon="material-symbols:list" className="w-5 h-5 text-[var(--accent)]" />
              <h3 className="font-medium text-[var(--text)]">Search Results</h3>
              <span className="text-xs text-[var(--muted-text)]">({results.length} found)</span>
            </div>
          </div>
          
          <div className="divide-y divide-[var(--border)]">
            {results.map((result, index) => (
              <motion.div
                key={result.message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="p-4 hover:bg-[rgb(var(--surface-rgb)/0.45)] backdrop-blur-xl cursor-pointer transition-colors"
                onClick={() => setSelectedResult(result)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className={`inline-block w-2 h-2 rounded-full bg-[var(--accent)]`} />
                    <span className="text-sm font-medium text-[var(--text)] capitalize">{result.message.role}</span>
                    <span className="text-xs text-[var(--muted-text)]">{result.message.conversation_id}</span>
                  </div>
                  <span className="text-xs text-[var(--muted-text)]">{formatTimestamp(result.message.created_at)}</span>
                </div>
                
                <div className="mb-3">
                  <p className="text-sm text-[var(--text)]">
                    {highlightQuery(result.message.content, searchData.query)}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-[var(--muted-text)]">Similarity:</span>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="flex-1 bg-[rgb(var(--surface-rgb)/0.45)] rounded-full h-2 border border-[var(--border)]">
                        <div 
                          className={`h-2 rounded-full bg-[var(--accent)]`}
                          style={{ width: `${getScoreWidth(result.similarity_score)}%` }}
                        />
                      </div>
                      <span className="text-[var(--muted-text)] font-medium w-12">{(result.similarity_score * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-[var(--muted-text)]">Importance:</span>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="flex items-center space-x-1">
                        <Icon icon="material-symbols:star" className="w-3 h-3 text-[var(--accent)]" />
                        <span className="text-[var(--muted-text)] font-medium">{result.message.importance_score.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-[var(--muted-text)]">Temporal Decay:</span>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="flex items-center space-x-1">
                        <Icon icon="material-symbols:schedule" className="w-3 h-3 text-[var(--muted-text)]" />
                        <span className="text-[var(--muted-text)] font-medium">{result.temporal_decay_factor.toFixed(3)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
      
      {/* Result Detail Modal */}
      {selectedResult && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedResult(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="search-result-title"
            className="rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-[var(--border)] bg-[rgb(var(--surface-rgb)/0.6)] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.08)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
              <h3 id="search-result-title" className="font-medium text-[var(--text)]">Search Result Details</h3>
              <button
                onClick={() => setSelectedResult(null)}
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
                  <p className="text-sm text-[var(--text)] font-mono">{selectedResult.message.id}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-text)] mb-1">Role</label>
                  <p className="text-sm text-[var(--text)] capitalize">{selectedResult.message.role}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-text)] mb-1">Conversation ID</label>
                  <p className="text-sm text-[var(--text)] font-mono">{selectedResult.message.conversation_id}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-text)] mb-1">Created At</label>
                  <p className="text-sm text-[var(--text)]">{formatTimestamp(selectedResult.message.created_at)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-text)] mb-1">Similarity Score</label>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-[rgb(var(--surface-rgb)/0.45)] rounded-full h-2 border border-[var(--border)]">
                      <div 
                        className="h-2 rounded-full bg-[var(--accent)]"
                        style={{ width: `${getScoreWidth(selectedResult.similarity_score)}%` }}
                      />
                    </div>
                    <span className="text-sm text-[var(--text)] font-medium">{(selectedResult.similarity_score * 100).toFixed(1)}%</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-text)] mb-1">Importance Score</label>
                  <div className="flex items-center space-x-1">
                    <Icon icon="material-symbols:star" className="w-4 h-4 text-[var(--accent)]" />
                    <span className="text-sm text-[var(--text)] font-medium">{selectedResult.message.importance_score.toFixed(3)}</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-text)] mb-1">Temporal Decay</label>
                  <div className="flex items-center space-x-1">
                    <Icon icon="material-symbols:schedule" className="w-4 h-4 text-[var(--muted-text)]" />
                    <span className="text-sm text-[var(--text)] font-medium">{selectedResult.temporal_decay_factor.toFixed(3)}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-[var(--muted-text)] mb-1">Message Content</label>
                <div className="bg-[rgb(var(--surface-rgb)/0.45)] backdrop-blur-xl rounded-md p-3 border border-[var(--border)]">
                  <p className="text-sm text-[var(--text)] whitespace-pre-wrap">
                    {highlightQuery(selectedResult.message.content, searchData.query)}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}