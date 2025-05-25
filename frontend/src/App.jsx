import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/js/bootstrap.bundle.min.js'; 
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './App.css';
import NetworkSettings from './NetworkSettings';


function App() {


  return (
    <div className='container-fluid wallcontroller__container'>
      <NetworkSettings />
    </div>
    
  );
}

export default App;
