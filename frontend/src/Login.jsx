import {useState} from 'react';
import StatusMessage, { useStatus } from './StatusMessage';

function Login({ setAuthenticated, setPage, pages }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { status, setSuccessStatus, setErrorStatus, clearStatus } = useStatus();
    
    const handleLogin = async () => {
        try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const result = await response.json();
        if (result.status === "success") {
            setSuccessStatus(result.message);
            // Update authentication state and redirect to Network Settings
            setAuthenticated(true);
            setPage(pages[1]); // Navigate to "Network Settings"
        } else {
            setErrorStatus(result.error);
        }
        } catch (err) {
        setErrorStatus(`Error: ${err.message}`);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
    };
    
    return (
        <div className="login-container">
        <h2>Login</h2>
        <div className="mb-3">
            <label className="form-label">Username</label>
            <input type="text" className="form-control" value={username} onChange={(e) => setUsername(e.target.value)} onKeyDown={handleKeyPress} />
        </div>
        <div className="mb-3">
            <label className="form-label">Password</label>
            <input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={handleKeyPress} />
        </div>
        <button className="btn btn-primary" onClick={handleLogin}>Login</button>
        <StatusMessage message={status} onClear={clearStatus} />
        </div>
    );
}

export default Login;