import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  Download, 
  Upload, 
  RefreshCw, 
  Wifi, 
  WifiOff,
  CheckCircle,
  AlertCircle,
  Database,
  FileText,
  LogOut,
  User
} from 'lucide-react';
import { userBrolostackService } from '../services/UserBrolostackService';
import { useTaskContext } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';

interface SyncStatus {
  isOnline: boolean;
  lastSync: string | null;
  pendingOperations: number;
}

const DataSync: React.FC = () => {
  const { tasks, loadTasks } = useTaskContext();
  const { user, logout, switchAccount } = useAuth();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: true,
    lastSync: null,
    pendingOperations: 0
  });
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    // Initialize sync status
    setSyncStatus(userBrolostackService.getSyncStatus());

    // Update sync status periodically
    const interval = setInterval(() => {
      setSyncStatus(userBrolostackService.getSyncStatus());
    }, 5000);

    // Monitor online/offline status
    const handleOnline = () => setSyncStatus(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setSyncStatus(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const exportData = await userBrolostackService.exportUserData();
      
      // Create and download file
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${user?.username}-tasks-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showMessage('success', 'Data exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      showMessage('error', 'Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const result = await userBrolostackService.importUserData(text);
      
      if (result.errors > 0) {
        showMessage('error', `Import completed with ${result.errors} errors. ${result.imported} items imported.`);
      } else {
        showMessage('success', `Successfully imported ${result.imported} items!`);
      }
      
      // Reload tasks to reflect imported data
      await loadTasks();
    } catch (error) {
      console.error('Import failed:', error);
      showMessage('error', 'Failed to import data. Please check the file format.');
    } finally {
      setIsImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleForceSync = async () => {
    setIsSyncing(true);
    try {
      await userBrolostackService.forceSync();
      showMessage('success', 'Data synchronized successfully!');
    } catch (error) {
      console.error('Sync failed:', error);
      showMessage('error', 'Synchronization failed. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  const formatLastSync = (lastSync: string | null): string => {
    if (!lastSync) return 'Never';
    
    const date = new Date(lastSync);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return date.toLocaleDateString();
  };

  const StatusCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    status?: 'online' | 'offline' | 'syncing' | 'error';
  }> = ({ title, value, icon, status }) => {
    const getStatusColor = () => {
      switch (status) {
        case 'online': return 'text-green-600 bg-green-100';
        case 'offline': return 'text-red-600 bg-red-100';
        case 'syncing': return 'text-blue-600 bg-blue-100';
        case 'error': return 'text-orange-600 bg-orange-100';
        default: return 'text-gray-600 bg-gray-100';
      }
    };

    return (
      <div className="bg-white rounded-lg shadow-sm p-6 border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          </div>
          <div className={`p-3 rounded-full ${getStatusColor()}`}>
            {icon}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Data Synchronization</h2>
          <p className="text-gray-600 mt-1">
            Manage your data backup, sync, and storage settings for {user?.firstName} {user?.lastName}
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={switchAccount}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <User className="w-4 h-4" />
            <span>Switch Account</span>
          </button>
          <button
            onClick={logout}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Message Alert */}
      {message && (
        <div className={`p-4 rounded-lg border ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-700' 
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <div className="flex items-center space-x-2">
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{message.text}</span>
          </div>
        </div>
      )}

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatusCard
          title="Connection Status"
          value={syncStatus.isOnline ? 'Online' : 'Offline'}
          icon={syncStatus.isOnline ? <Wifi className="w-6 h-6" /> : <WifiOff className="w-6 h-6" />}
          status={syncStatus.isOnline ? 'online' : 'offline'}
        />
        <StatusCard
          title="Last Sync"
          value={formatLastSync(syncStatus.lastSync)}
          icon={<RefreshCw className="w-6 h-6" />}
          status={syncStatus.isOnline ? 'online' : 'offline'}
        />
        <StatusCard
          title="Total Tasks"
          value={tasks.length}
          icon={<Database className="w-6 h-6" />}
        />
      </div>

      {/* Sync Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6 border">
        <div className="flex items-center space-x-2 mb-4">
          <Cloud className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Synchronization</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Force Sync</h4>
              <p className="text-sm text-gray-600">Manually synchronize your data with Brolostack</p>
            </div>
            <button
              onClick={handleForceSync}
              disabled={isSyncing}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          </div>

          {syncStatus.pendingOperations > 0 && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                <span className="text-orange-700">
                  {syncStatus.pendingOperations} operations pending sync
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Backup & Restore */}
      <div className="bg-white rounded-lg shadow-sm p-6 border">
        <div className="flex items-center space-x-2 mb-4">
          <FileText className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">Backup & Restore</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Export Data */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3 mb-3">
              <Download className="w-5 h-5 text-green-600" />
              <h4 className="font-medium text-gray-900">Export Data</h4>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Download all your tasks as a JSON backup file for {user?.username}
            </p>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Exporting...' : 'Export Backup'}</span>
            </button>
          </div>

          {/* Import Data */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3 mb-3">
              <Upload className="w-5 h-5 text-blue-600" />
              <h4 className="font-medium text-gray-900">Import Data</h4>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Restore tasks from a previously exported backup file for {user?.username}
            </p>
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                disabled={isImporting}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <button
                disabled={isImporting}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>{isImporting ? 'Importing...' : 'Import Backup'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Data Statistics */}
      <div className="bg-white rounded-lg shadow-sm p-6 border">
        <div className="flex items-center space-x-2 mb-4">
          <Database className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Data Statistics</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{tasks.length}</p>
            <p className="text-sm text-gray-600">Total Tasks</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">
              {tasks.filter(t => t.completed).length}
            </p>
            <p className="text-sm text-gray-600">Completed</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-2xl font-bold text-orange-600">
              {tasks.filter(t => !t.completed).length}
            </p>
            <p className="text-sm text-gray-600">Active</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">
              {new Set(tasks.map(t => t.category)).size}
            </p>
            <p className="text-sm text-gray-600">Categories</p>
          </div>
        </div>
      </div>

      {/* Storage Information */}
      <div className="bg-gray-50 rounded-lg p-6 border">
        <h4 className="font-medium text-gray-900 mb-2">Storage Information</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p>• Data is stored using Brolostack with user isolation and localStorage fallback</p>
          <p>• Each user account has completely separate data storage</p>
          <p>• Automatic synchronization occurs every 5 seconds when online</p>
          <p>• Backup files are in JSON format and can be imported later</p>
          <p>• All data remains private and is stored locally in your browser</p>
          <p>• Multiple accounts can be created and used on the same browser</p>
        </div>
      </div>
    </div>
  );
};

export default DataSync;