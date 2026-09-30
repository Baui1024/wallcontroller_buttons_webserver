import React from 'react';
import {useState, useEffect} from 'react';
import StatusMessage, { useStatus } from './StatusMessage';

// 24 random bytes as URL-safe base64 (32 characters)
const generateToken = () => {
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_');
};

function WebSocketToken() {

    const [isSaving, setSaving] = useState(false);
    const [enabled, setEnabled] = useState(false)
    const [token, setToken] = useState('')
    const [showToken, setShowToken] = useState(false)
    const [editMode, setEditMode] = useState(false);
    const { status, setSuccessStatus, setErrorStatus, clearStatus } = useStatus();

    // Store original values for cancellation
    const [originalEnabled, setOriginalEnabled] = useState(false)
    const [originalToken, setOriginalToken] = useState('')

    useEffect(() => {
        fetch('/api/ws_token')
            .then(response => response.json())
            .then(result => {
                setEnabled(result.enabled);
                setToken(result.token);
            })
            .catch(err => setErrorStatus(`Error: ${err.message}`));
    }, []);

    const changeEditMode = (state) => {
        if (state) {
            // Entering edit mode - save current values
            setOriginalEnabled(enabled);
            setOriginalToken(token);
        } else {
            // Exiting edit mode (cancel) - restore original values
            setEnabled(originalEnabled);
            setToken(originalToken);
        }
        setEditMode(state);
    };

    const enable = () => {
        setEnabled(true);
        if (!token) {
            setToken(generateToken());
        }
    };

    const copyToken = async () => {
        try {
            await navigator.clipboard.writeText(token);
            setSuccessStatus('Token copied to clipboard');
        } catch {
            setErrorStatus('Copy failed, please select and copy the token manually');
        }
    };

    const saveConfig = async () => {
        setSaving(true);
        try {
            const response = await fetch('/api/ws_token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled, token })
            });

            const result = await response.json();
            if (result.status === "success") {
                setOriginalEnabled(enabled);
                setOriginalToken(token);
                setEditMode(false);
                setSuccessStatus(result.message);
            } else {
                setErrorStatus(result.message);
            }
        } catch (err) {
            setErrorStatus(`Error: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

  return (
    <>
        <div className="col col-12 wallcontroller__container">
            <h2 className="mb-4"> WebSocket Token</h2>
            <p className="text-muted">
                When enabled, Q-SYS needs to authenticate using this token.
            </p>
            {editMode ? (
                <>
                    <div className="dropdown pb-3">
                        <div className="mb-3">
                            <h5 className="form-label">Token Authentication:</h5>
                            <button className="form-control btn btn-secondary dropdown-toggle"
                                    type="button"
                                    data-bs-toggle="dropdown"
                                    aria-expanded="false"
                            >
                            {enabled ? "Enabled" : "Disabled"}
                            </button>
                            <ul className="form-control dropdown-menu text-center">
                                <li><a className="dropdown-item" href="#" onClick={enable}>Enable</a></li>
                                <li><a className="dropdown-item" href="#" onClick={() => setEnabled(false)}>Disable</a></li>
                            </ul>
                        </div>
                        {enabled ? (
                            <div className="mb-3">
                                <label className="form-label">Token</label>
                                <div className="input-group">
                                    <input type="text" className="form-control font-monospace"
                                        name="token" value={token} onChange={(e) => setToken(e.target.value)} />
                                    <button className="btn btn-outline-secondary" type="button" onClick={() => setToken(generateToken())}>
                                        Generate
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <></>
                        )}
                    </div>
                    <span className="row align-items-center justify-content-between">
                        <button className="col m-2 btn btn-outline-secondary " onClick={() => changeEditMode(false)}>
                            Cancel
                        </button>
                        <button className="col m-2 btn btn-primary" onClick={saveConfig}>
                        {isSaving ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Saving...
                        </>
                        ) : (
                            'Save'
                        )}
                            </button>
                    </span>
                </>
            ) : (
            <>
                <div className="dropdown pb-3">
                    <h5 className="form-label">Token Authentication:</h5>
                    <div className="form-control-plaintext">{enabled ? "Enabled" : "Disabled"}</div>
                </div>
                {enabled ? (
                    <div className="mb-3">
                        <label className="form-label">Token</label>
                        <div className="input-group">
                            <input type={showToken ? "text" : "password"} className="form-control font-monospace"
                                value={token} readOnly />
                            <button className="btn btn-outline-secondary" type="button" onClick={() => setShowToken(!showToken)}>
                                {showToken ? 'Hide' : 'Show'}
                            </button>
                            <button className="btn btn-outline-secondary" type="button" onClick={copyToken}>
                                Copy
                            </button>
                        </div>
                    </div>
                ) : (
                    <></>
                )}
                <span className="row align-items-center justify-content-between">
                    <button className="col m-2 btn btn-primary" onClick={() => changeEditMode(true)}>
                        Edit
                    </button>
                </span>
            </>
            )}
            <StatusMessage message={status} onClear={clearStatus} />
        </div>
    </>
  );
}

export default WebSocketToken;
