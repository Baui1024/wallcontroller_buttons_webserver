import React, { useState, useEffect, use } from 'react';
import 'bootstrap/dist/js/bootstrap.bundle.min.js'; 
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './App.css';
import NetworkSettings from './NetworkSettings';
import Navigation from './Navigation';
import Security from './Security';
import Login from './Login';
import Maintenance from './Maintenance';

function App() {
  const pages = ["Login","Network Settings", "Security", "Maintenance", ]
  const [page, setPage] = useState(pages[0]);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [accessControl, setAccessControl] = useState(false)

  // Check authentication status on app startup
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch('/api/auth/status');
        const result = await response.json();
        
        console.log('Auth status:', result);
        setAuthenticated(result.authenticated);
        setAccessControl(result.accessControl);
        if (result.authenticated && result.accessControl) {
          // User is authenticated, redirect to Network Settings
          setPage(pages[1]);
        } else if (result.authenticated && !result.accessControl) {
          // No access control, user can access without login
          setPage(pages[4]);
        } else {
          // Not authenticated, stay on login page
          setPage(pages[0]);
        }
      } catch (error) {
        console.error('Failed to check auth status:', error);
        setAuthenticated(false);
        setPage(pages[0]);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  useEffect(() => {

  }, [page]);

  useEffect(() => {
    if (!authenticated) {
      // If not authenticated, force to login page
      setPage(pages[0]);
    }
  }, [authenticated]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className='container-fluid d-flex justify-content-center align-items-center' style={{height: '100vh'}}>
        <div className='spinner-border' role='status'>
          <span className='visually-hidden'>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navigation
        setPage={setPage}
        page={page}
        pages={pages}
        accessControl={accessControl}
        authenticated={authenticated}
        setAuthenticated={setAuthenticated}
      />
      <div className='container-fluid wallcontroller__container'>
        {!authenticated ? ( <Login setAuthenticated={setAuthenticated} setPage={setPage} pages={pages} />) :
        page==pages[1] ? ( <NetworkSettings />) :
        page==pages[2] ? (<Security 
          setAccessControl={setAccessControl}
          accessControl={accessControl}
        />):
        page==pages[3] ? ( <Maintenance />) :
          <Maintenance />
        }
      </div>
    </>
  );
}

export default App;
