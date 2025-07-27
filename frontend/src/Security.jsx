import React from 'react';
import {useState, useEffect} from 'react';
import StatusMessage, { useStatus } from './StatusMessage';


function Security({accessControl, setAccessControl}) {

    const [isSaving, setSaving] = useState(false);
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [editMode, setEditMode] = useState(false);
    const { status, setSuccessStatus, setErrorStatus, clearStatus } = useStatus();
    
    // Store original values for cancellation
    const [originalAccessControl, setOriginalAccessControl] = useState(false)
    const [originalUsername, setOriginalUsername] = useState('')
    const [originalPassword, setOriginalPassword] = useState('')

    const changeEditMode = (state) => {
        if (state) {
            // Entering edit mode - save current values
            setOriginalAccessControl(accessControl);
            setOriginalUsername(username);
            setOriginalPassword(password);
        } else {
            // Exiting edit mode (cancel) - restore original values
            setAccessControl(originalAccessControl);
            setUsername(originalUsername);
            setPassword(originalPassword);
        }
        setEditMode(state); 
    };

    const saveConfig = async () => {
        setSaving(true);
        try {
            const securityData = {
                accessControl,
                username,
                password
            };
            
            const response = await fetch('/api/security', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(securityData)
            });
            
            const result = await response.json();
            if (result.status === "success") {
                // Update original values after successful save
                setOriginalAccessControl(accessControl);
                setAccessControl(accessControl); // Ensure accessControl is set correctly
                setOriginalUsername(username);
                setOriginalPassword(password);
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
            <h2 className="mb-4"> Security Settings</h2>
            {editMode ? (
                <>
                    <div className="dropdown pb-3">
                        <div className="mb-3">
                            <h5 className="form-label">Access Control:</h5>
                            <button className="form-control btn btn-secondary dropdown-toggle" 
                                    type="button" 
                                    data-bs-toggle="dropdown" 
                                    aria-expanded="false"
                            >
                            {accessControl ? "Enabled" : "Disabled"}
                            </button>
                            <ul className="form-control dropdown-menu text-center">
                                <li><a className="dropdown-item" href="#" onClick={() => setAccessControl(true)}>Enable</a></li>
                                <li><a className="dropdown-item" href="#" onClick={() => setAccessControl(false)}>Disable</a></li>
                            </ul>
                        </div>
                        {accessControl ? (
                            <>
                                <div className="mb-3">
                                    <label className="form-label">Username</label>
                                    <input type="text" className="form-control" 
                                        name="username" value={username} onChange={(e) => setUsername(e.target.value)} />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Password</label>
                                    <input type="password" className="form-control" 
                                        name="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                                </div>
                            </>
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
                    <h5 className="form-label">Access Control:</h5>
                    <div className="form-control-plaintext">{accessControl ? "Enabled" : "Disabled"}</div>
                </div>
                {accessControl ? (
                    <>
                        <div className="mb-3">
                            <label className="form-label">Username</label>
                            <div className="form-control-plaintext">{username || 'Not set'}</div>
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Password</label>
                            <div className="form-control-plaintext">{password ? '••••••••' : 'Not set'}</div>
                        </div>
                    </>
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

export default Security;