import React from 'react';
import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TaskProvider } from './context/TaskContext';
import AuthForm from './components/AuthForm';
import TaskList from './components/TaskList';
import Analytics from './components/Analytics';
import DataSync from './components/DataSync';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'tasks' | 'analytics' | 'sync'>('tasks');

  // Debug logging for production
  React.useEffect(() => {
    console.log('AppContent Debug:', { isAuthenticated, isLoading, user: !!user });
  }, [isAuthenticated, isLoading, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('Rendering AuthForm - user not authenticated');
    return <AuthForm />;
  }

  console.log('Rendering main app - user authenticated');

  const tabs = [
    { id: 'tasks', label: 'Tasks', icon: '📋' },
    { id: 'analytics', label: 'Analytics', icon: '📊' },
    { id: 'sync', label: 'Data Sync', icon: '☁️' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* User Header */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Welcome back, {user?.firstName}!
              </h1>
              <p className="text-gray-600">@{user?.username}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Account created: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </div>
              <button
                onClick={logout}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'tasks' && <TaskList />}
          {activeTab === 'analytics' && <Analytics />}
          {activeTab === 'sync' && <DataSync />}
        </div>
      </div>
    </div>
  );
};

function App() {
  console.log('App: Component rendering...');
  
  return (
    <div>
      <h1 style={{ position: 'fixed', top: 0, left: 0, background: 'red', color: 'white', padding: '5px', zIndex: 9999, fontSize: '12px' }}>
        App Loaded ✅
      </h1>
      <AuthProvider>
        <TaskProvider>
          <AppContent />
        </TaskProvider>
      </AuthProvider>
    </div>
  );
}

export default App;