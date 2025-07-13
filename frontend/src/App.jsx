import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/js/bootstrap.bundle.min.js'; 
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './App.css';
import NetworkSettings from './NetworkSettings';
import Navigation from './Navigation';

function App() {
  const [page, setPage] = useState('Network');

  return (
    <>
      <Navigation
        setPage={setPage}
        page={page}
      />
      <div className='container-fluid wallcontroller__container'>
         {page=="Network" ? ( <NetworkSettings />) : (<></>)}
      </div>
    </>
  );
}

export default App;
