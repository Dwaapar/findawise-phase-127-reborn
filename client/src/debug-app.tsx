import { useState, useEffect } from 'react';

const DebugApp = () => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    console.log('DebugApp mounted successfully');
  }, []);

  return (
    <div style={{ 
      padding: '20px', 
      background: '#f0f0f0', 
      fontFamily: 'Arial, sans-serif',
      minHeight: '100vh'
    }}>
      <h1>React App Debug Test</h1>
      <p>Status: {mounted ? 'MOUNTED SUCCESSFULLY' : 'MOUNTING...'}</p>
      <p>Current URL: {typeof window !== 'undefined' ? window.location.href : 'Server-side'}</p>
      <p>Pathname: {typeof window !== 'undefined' ? window.location.pathname : 'Server-side'}</p>
      
      <div style={{ marginTop: '20px' }}>
        <a href="/fitness-transformation-quiz" style={{ marginRight: '10px', color: 'blue' }}>
          Fitness Quiz
        </a>
        <a href="/investment-calculator" style={{ marginRight: '10px', color: 'blue' }}>
          Investment Calculator
        </a>
        <a href="/admin" style={{ marginRight: '10px', color: 'blue' }}>
          Admin Dashboard
        </a>
      </div>
      
      <div style={{ marginTop: '20px', background: 'white', padding: '10px', border: '1px solid #ccc' }}>
        <h3>Test Interactive Module</h3>
        <p>This is a basic test to verify React is working.</p>
        <button 
          onClick={() => alert('React event handlers working!')}
          style={{ padding: '10px', background: 'blue', color: 'white', border: 'none' }}
        >
          Test Click
        </button>
      </div>
    </div>
  );
};

export default DebugApp;