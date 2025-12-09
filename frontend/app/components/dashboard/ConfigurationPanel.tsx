'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';
import { getConfig, saveConfig, clearAllData } from '@/lib/api';

interface ConfigurationPanelProps {
  onConfigChange?: () => void;
}

export default function ConfigurationPanel({ onConfigChange }: ConfigurationPanelProps) {
  const [config, setConfig] = useState({
    baseUrl: 'http://localhost:8000',
    apiKey: '',
    tenantId: 'demo-tenant'
  });
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  
  useEffect(() => {
    const savedConfig = getConfig();
    setConfig(savedConfig);
  }, []);
  
  const handleSave = () => {
    // Validate configuration
    if (!config.baseUrl.trim()) {
      toast.error('API Base URL is required');
      return;
    }
    
    if (!config.tenantId.trim()) {
      toast.error('Tenant ID is required');
      return;
    }
    
    try {
      new URL(config.baseUrl);
    } catch {
      toast.error('Please enter a valid API Base URL');
      return;
    }
    
    saveConfig(config);
    toast.success('Configuration saved successfully!');
    onConfigChange?.();
    setIsExpanded(false);
  };
  
  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all data? This will remove your configuration, request history, and navigation state.')) {
      clearAllData();
      setConfig({
        baseUrl: 'http://localhost:8000',
        apiKey: '',
        tenantId: 'demo-tenant'
      });
      onConfigChange?.();
    }
  };
  
  const handleInputChange = (field: string, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };
  
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[rgb(var(--surface-rgb)/0.55)] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
      <div className="p-4 border-b border-[var(--border)]">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-md"
          aria-expanded={isExpanded}
          aria-controls="config-panel"
        >
          <div className="flex items-center space-x-2">
            <Icon icon="material-symbols:settings" className="w-5 h-5 text-[var(--muted-text)]" />
            <h3 className="font-medium text-[var(--text)]">API Configuration</h3>
            <div className={`w-2 h-2 rounded-full ${config.apiKey ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`} 
                 title={config.apiKey ? 'Configured' : 'Not configured'} />
          </div>
          <Icon 
            icon={isExpanded ? 'material-symbols:expand-less' : 'material-symbols:expand-more'} 
            className="w-5 h-5 text-[var(--muted-text)]" 
          />
        </button>
      </div>
      
      <motion.div
        initial={false}
        animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden"
        id="config-panel"
      >
        <div className="p-4 space-y-4">
          {/* API Base URL */}
          <div>
            <label htmlFor="baseUrl" className="block text-sm font-medium text-[var(--muted-text)] mb-1">
              API Base URL
            </label>
            <input
              id="baseUrl"
              type="url"
              value={config.baseUrl}
              onChange={(e) => handleInputChange('baseUrl', e.target.value)}
              placeholder="http://localhost:8000"
              className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] bg-[rgb(var(--surface-rgb)/0.6)] backdrop-blur-xl text-[var(--text)]"
            />
            <p className="text-xs text-[var(--muted-text)] mt-1">The base URL of your Memory Mesh API instance</p>
          </div>
          
          {/* API Key */}
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-[var(--muted-text)] mb-1">
              API Key
            </label>
            <div className="relative">
              <input
                id="apiKey"
                type={showApiKey ? 'text' : 'password'}
                value={config.apiKey}
                onChange={(e) => handleInputChange('apiKey', e.target.value)}
                placeholder="Enter your API key"
                className="w-full px-3 py-2 pr-10 border border-[var(--border)] rounded-md text-sm focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] bg-[rgb(var(--surface-rgb)/0.6)] backdrop-blur-xl text-[var(--text)]"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded"
                aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
              >
                <Icon 
                  icon={showApiKey ? 'material-symbols:visibility-off' : 'material-symbols:visibility'} 
                  className="w-4 h-4 text-[var(--muted-text)]" 
                />
              </button>
            </div>
            <p className="text-xs text-[var(--muted-text)] mt-1">Your API key will be included in all requests (stored locally)</p>
          </div>
          
          {/* Tenant ID */}
          <div>
            <label htmlFor="tenantId" className="block text-sm font-medium text-[var(--muted-text)] mb-1">
              Tenant ID
            </label>
            <input
              id="tenantId"
              type="text"
              value={config.tenantId}
              onChange={(e) => handleInputChange('tenantId', e.target.value)}
              placeholder="demo-tenant"
              className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] bg-[rgb(var(--surface-rgb)/0.6)] backdrop-blur-xl text-[var(--text)]"
            />
            <p className="text-xs text-[var(--muted-text)] mt-1">The tenant identifier for multi-tenant deployments</p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
            <button
              onClick={handleClearData}
              type="button"
              className="flex items-center space-x-1 text-sm text-[var(--muted-text)] hover:text-[var(--text)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded"
            >
              <Icon icon="material-symbols:delete" className="w-4 h-4" />
              <span>Clear All Data</span>
            </button>
            
            <button
              onClick={handleSave}
              type="button"
              className="flex items-center space-x-1 bg-[var(--accent)] text-[var(--surface)] px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              <Icon icon="material-symbols:save" className="w-4 h-4" />
              <span>Save Configuration</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}