import React from 'react';
import { Home, ArrowLeft, Search, HelpCircle } from 'lucide-react';

const NotFound: React.FC = () => {
  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl text-center">
        {/* 404 Icon */}
        <div className="mb-8">
          <div className="text-8xl font-bold text-blue-600 mb-4">404</div>
          <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-10 h-10 text-blue-600" />
          </div>
        </div>

        {/* Content */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Page Not Found
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Oops! The page you're looking for doesn't exist or has been moved.
          </p>
          <p className="text-gray-500">
            Don't worry, you can still access your Brolostack Task Manager from the home page.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleGoHome}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Home className="w-5 h-5" />
            <span>Go to Home</span>
          </button>
          
          <button
            onClick={handleGoBack}
            className="flex items-center justify-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Go Back</span>
          </button>
        </div>

        {/* Help Section */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <HelpCircle className="w-5 h-5 text-gray-600" />
            <span className="font-medium text-gray-700">Need Help?</span>
          </div>
          <p className="text-sm text-gray-600">
            Visit our{' '}
            <a 
              href="https://github.com/Beunec/brolostack_task_manager" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 underline"
            >
              GitHub repository
            </a>{' '}
            for documentation and support.
          </p>
        </div>

        {/* Brolostack Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            🚀 Built with{' '}
            <a 
              href="https://github.com/Beunec/brolostack" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 underline font-medium"
            >
              Brolostack Framework
            </a>{' '}
            by{' '}
            <a 
              href="https://beunec.co" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 underline font-medium"
            >
              Beunec Technologies, Inc.
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
