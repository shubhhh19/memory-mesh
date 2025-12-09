'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import toast from 'react-hot-toast';
import { memoryMeshAPI, getConfig } from '@/lib/api';
import CodeBlock from '../CodeBlock';

interface HealthStatus {
  status: 'ok' | 'degraded' | 'down';
  database: {
    status: string;
    response_time_ms: number;
  };
  uptime_seconds: number;
  environment: string;
  embedding_provider: string;
  version?: string;
}

interface RetentionResult {
  archived_count: number;
  deleted_count: number;
  tenant_id: string;
  dry_run: boolean;
}

export default function AdminSection() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [healthResponse, setHealthResponse] = useState<any>(null);
  
  const [retentionData, setRetentionData] = useState({
    tenant_id: '',
    actions: [] as string[],
    dry_run: true
  });
  
  const [retentionLoading, setRetentionLoading] = useState(false);
  const [retentionResult, setRetentionResult] = useState<RetentionResult | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [retentionResponse, setRetentionResponse] = useState<any>(null);
  
  // Initialize tenant ID from config
  useState(() => {
    const config = getConfig();
    setRetentionData(prev => ({ ...prev, tenant_id: config.tenantId }));
  });
  
  const checkHealth = async () => {
    setHealthLoading(true);
    setHealthStatus(null);
    setHealthResponse(null);
    
    try {
      const result = await memoryMeshAPI.healthCheck();
      setHealthResponse(result);
      
      if (!result.error && result.data) {
        setHealthStatus(result.data);
        toast.success('Health check completed');
      }
    } catch (error) {
      console.error('Error checking health:', error);
    } finally {
      setHealthLoading(false);
    }
  };
  
  const runRetention = async () => {
    if (!retentionData.tenant_id.trim()) {
      toast.error('Tenant ID is required');
      return;
    }
    
    if (retentionData.actions.length === 0) {
      toast.error('Please select at least one action');
      return;
    }
    
    setRetentionLoading(true);
    setRetentionResult(null);
    setRetentionResponse(null);
    
    try {
      const result = await memoryMeshAPI.runRetention(retentionData);
      setRetentionResponse(result);
      
      if (!result.error && result.data) {
        setRetentionResult(result.data);
        const message = retentionData.dry_run ? 'Dry run completed' : 'Retention policy executed';
        toast.success(message);
      }
    } catch (error) {
      console.error('Error running retention:', error);
    } finally {
      setRetentionLoading(false);
    }
  };
  
  const handleActionChange = (action: string, checked: boolean) => {
    setRetentionData(prev => ({
      ...prev,
      actions: checked 
        ? [...prev.actions, action]
        : prev.actions.filter(a => a !== action)
    }));
  };
  
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok':
        return 'text-green-600 bg-green-50';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-50';
      case 'down':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok':
        return 'material-symbols:check-circle';
      case 'degraded':
        return 'material-symbols:warning';
      case 'down':
        return 'material-symbols:error';
      default:
        return 'material-symbols:help';
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Health Check Section */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Icon icon="material-symbols:health-and-safety" className="w-5 h-5 text-green-600" />
              <h3 className="font-medium text-gray-900">System Health</h3>
            </div>
            <button
              onClick={checkHealth}
              disabled={healthLoading}
              className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {healthLoading ? (
                <>
                  <Icon icon="material-symbols:progress-activity" className="w-4 h-4 animate-spin" />
                  <span>Checking...</span>
                </>
              ) : (
                <>
                  <Icon icon="material-symbols:refresh" className="w-4 h-4" />
                  <span>Check Health</span>
                </>
              )}
            </button>
          </div>
        </div>
        
        {healthStatus && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="p-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(healthStatus.status)}`}>
                  <Icon icon={getStatusIcon(healthStatus.status)} className="w-4 h-4 mr-1" />
                  <span className="capitalize">{healthStatus.status}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Overall Status</p>
              </div>
              
              <div className="text-center">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(healthStatus.database.status)}`}>
                  <Icon icon="material-symbols:database" className="w-4 h-4 mr-1" />
                  <span className="capitalize">{healthStatus.database.status}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Database ({healthStatus.database.response_time_ms}ms)</p>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {formatUptime(healthStatus.uptime_seconds)}
                </div>
                <p className="text-xs text-gray-500 mt-1">Uptime</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Environment</label>
                <p className="text-gray-900 font-mono bg-gray-50 rounded px-2 py-1">{healthStatus.environment}</p>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Embedding Provider</label>
                <p className="text-gray-900 bg-gray-50 rounded px-2 py-1">{healthStatus.embedding_provider}</p>
              </div>
              
              {healthStatus.version && (
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Version</label>
                  <p className="text-gray-900 font-mono bg-gray-50 rounded px-2 py-1">{healthStatus.version}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
        
        {healthResponse && (
          <div className="border-t border-gray-100 p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Raw Health Response</h4>
            <CodeBlock 
              code={JSON.stringify(healthResponse, null, 2)}
              language="json"
              className="text-xs"
            />
          </div>
        )}
      </div>
      
      {/* Retention Policy Section */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <Icon icon="material-symbols:auto-delete" className="w-5 h-5 text-orange-600" />
            <h3 className="font-medium text-gray-900">Retention Policy</h3>
          </div>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <label htmlFor="retention_tenant_id" className="block text-sm font-medium text-gray-700 mb-1">
              Tenant ID *
            </label>
            <input
              id="retention_tenant_id"
              type="text"
              value={retentionData.tenant_id}
              onChange={(e) => setRetentionData(prev => ({ ...prev, tenant_id: e.target.value }))}
              placeholder="demo-tenant"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Actions *</label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={retentionData.actions.includes('archive')}
                  onChange={(e) => handleActionChange('archive', e.target.checked)}
                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <span className="text-sm text-gray-700">Archive old messages</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={retentionData.actions.includes('delete')}
                  onChange={(e) => handleActionChange('delete', e.target.checked)}
                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <span className="text-sm text-gray-700">Delete expired messages</span>
              </label>
            </div>
          </div>
          
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={retentionData.dry_run}
                onChange={(e) => setRetentionData(prev => ({ ...prev, dry_run: e.target.checked }))}
                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <span className="text-sm font-medium text-gray-700">Dry Run</span>
              <span className="text-xs text-gray-500">(Preview changes without executing)</span>
            </label>
          </div>
          
          <button
            onClick={runRetention}
            disabled={retentionLoading}
            className={`w-full px-4 py-2 rounded-md font-medium transition-colors flex items-center justify-center space-x-2 ${
              retentionData.dry_run
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-orange-600 text-white hover:bg-orange-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {retentionLoading ? (
              <>
                <Icon icon="material-symbols:progress-activity" className="w-4 h-4 animate-spin" />
                <span>{retentionData.dry_run ? 'Running Preview...' : 'Executing...'}</span>
              </>
            ) : (
              <>
                <Icon icon={retentionData.dry_run ? "material-symbols:preview" : "material-symbols:delete"} className="w-4 h-4" />
                <span>{retentionData.dry_run ? 'Run Preview' : 'Execute Retention'}</span>
              </>
            )}
          </button>
        </div>
        
        {retentionResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="border-t border-gray-100 p-4"
          >
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              {retentionResult.dry_run ? 'Preview Results' : 'Execution Results'}
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{retentionResult.archived_count}</div>
                <p className="text-xs text-blue-600 font-medium">Messages Archived</p>
              </div>
              
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{retentionResult.deleted_count}</div>
                <p className="text-xs text-red-600 font-medium">Messages Deleted</p>
              </div>
              
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-900">{retentionResult.tenant_id}</div>
                <p className="text-xs text-gray-500">Tenant ID</p>
              </div>
            </div>
            
            {retentionResult.dry_run && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <div className="flex items-center space-x-2">
                  <Icon icon="material-symbols:info" className="w-4 h-4 text-yellow-600" />
                  <p className="text-sm text-yellow-800">
                    This was a dry run. No actual changes were made to your data.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}
        
        {retentionResponse && (
          <div className="border-t border-gray-100 p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Raw Retention Response</h4>
            <CodeBlock 
              code={JSON.stringify(retentionResponse, null, 2)}
              language="json"
              className="text-xs"
            />
          </div>
        )}
      </div>
    </div>
  );
}