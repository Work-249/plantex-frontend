import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './contexts/AuthContext';
import { LoadingProvider } from './contexts/LoadingContext';
import { TestResumeProvider } from './contexts/TestResumeContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PlantechXLoader from './components/UI/PlantechXLoader';
import GlobalLoader from './components/UI/GlobalLoader';
import apiService from './services/api';
import toast from 'react-hot-toast';

function App() {
  const { state, dispatch } = useAuth();
  const [minLoadingComplete, setMinLoadingComplete] = useState(false);

  useEffect(() => {
    const minLoadingTime = setTimeout(() => {
      setMinLoadingComplete(true);
    }, 3000);

    return () => clearTimeout(minLoadingTime);
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');

      if (token && userStr) {
        try {
          dispatch({ type: 'LOGIN_START' });

          const currentUser = await apiService.getCurrentUser();

          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: { user: currentUser, token }
          });

          toast.success(`Welcome back, ${currentUser?.name || 'User'}!`);

        } catch (error) {
          console.error('Token validation failed:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          dispatch({ type: 'LOGOUT' });

          toast.error('Session expired. Please log in again.');
        }
      } else {
        dispatch({ type: 'LOGOUT' });
      }
    };

    initializeAuth();
  }, [dispatch]);

  if (state.loading || !minLoadingComplete) {
    return <PlantechXLoader message="Initializing PlantechX..." />;
  }

  // ❌ Authentication error (invalid credentials, etc.)
  if (state.error && !state.user) {
    toast.error(state.error);

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Authentication Error</h2>
            <p className="text-red-600 mb-4">{state.error}</p>
            <button
              onClick={() => {
                dispatch({ type: 'CLEAR_ERROR' });
                dispatch({ type: 'LOGOUT' });
              }}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <LoadingProvider>
      <TestResumeProvider>
        <div className="App min-h-screen bg-gray-50">
          {/* ✅ Toast container */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: { borderRadius: '10px', fontWeight: 500 },
              success: { style: { background: '#ecfdf5', color: '#065f46' } },
              error: { style: { background: '#fef2f2', color: '#991b1b' } },
            }}
          />

          {/* Main App */}
          {state.user ? <Dashboard /> : <Login />}
          <GlobalLoader />
        </div>
      </TestResumeProvider>
    </LoadingProvider>
  );
}

export default App;