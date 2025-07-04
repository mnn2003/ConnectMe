import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import { CallStateProvider } from './contexts/CallStateContext';
import { IncomingCallProvider } from './contexts/IncomingCallContext';
import { CallProvider } from './contexts/CallContext';
import AuthPage from './pages/AuthPage';
import ChatPage from './pages/ChatPage';

const AppRoutes: React.FC = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ConnectMe...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/auth" 
        element={currentUser ? <Navigate to="/" replace /> : <AuthPage />} 
      />
      <Route 
        path="/" 
        element={currentUser ? <ChatPage /> : <Navigate to="/auth" replace />} 
      />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <ChatProvider>
          <CallStateProvider>
            <IncomingCallProvider>
              <CallProvider>
                <div className="App">
                  <AppRoutes />
                  <Toaster 
                    position="top-right"
                    toastOptions={{
                      duration: 3000,
                      style: {
                        background: '#363636',
                        color: '#fff',
                      },
                    }}
                  />
                </div>
              </CallProvider>
            </IncomingCallProvider>
          </CallStateProvider>
        </ChatProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;