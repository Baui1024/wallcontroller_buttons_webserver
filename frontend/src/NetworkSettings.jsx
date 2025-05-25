import React, { useState, useEffect } from 'react';


function NetworkSettings() {

    const [config, setConfig] = useState({ mode: '', ip: '', netmask: '', gateway: '' });
    const [editMode, setEditMode] = useState(true);
    const [current_config, setCurrentConfig] = useState({ mode: '', ip: '', netmask: '', gateway: '' });
    const [status, setStatus] = useState(null);

    useEffect(() => {
        fetch('/api/config')
        .then(res => res.json())
        .then(data => {
            setConfig(data);
            setCurrentConfig(data);
        })
        .catch(err => setStatus(`Failed to load: ${err}`));
    }, []);

    const handleChange = (e) => {
        console.log(e.target);
        const { name, value } = e.target;
        setConfig(prev => ({ ...prev, [name]: value }));
    };

    const changeEditMode = (state) => {
        setEditMode(state); 
        setConfig(current_config); // Reset to current config when exiting edit mode
    };

    useEffect(() => {
        console.log(config); // Reset status when config changes
    }, [config]);

    const saveConfig = async () => {
        try {
        setEditMode(false);
        const response = await fetch('/api/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
        });
        const result = await response.json();
        if (result.status === "success") {
            setStatus("✅ Saved successfully");
            setCurrentConfig(config); // Update current config only on success
        }else {
            setStatus("❌ Failed to save configuration");
        }
        } catch (err) {
        setStatus(`❌ Error: ${err.message}`);
        }
    };
    
    return (
        <>
            <div className="col col-12 wallcontroller__container">
                <h2 className="mb-4"> Device Network Settings</h2>


                {editMode ? (
                  <>
                    <div className="dropdown pb-3">
                        <h5 className="form-label">Mode:</h5>
                        <button className="form-control btn btn-secondary dropdown-toggle" 
                                type="button" 
                                data-bs-toggle="dropdown" 
                                aria-expanded="false"
                        >
                        {config.mode}
                        </button>
                        <ul className="form-control dropdown-menu text-center">
                            <li><a className="dropdown-item" href="#" onClick={() => setConfig({ ...current_config, mode: 'DHCP' })}>DHCP</a></li>
                            <li><a className="dropdown-item" href="#" onClick={() => setConfig(prev => ({ ...prev, mode: 'Static' }))}>Static</a></li>
                        </ul>
                    </div>
                    <div className="mb-3">
                      <h5 className="form-label">IP Address:</h5>
                      <input type="text" className={`form-control ${config.mode === "Static" ? '' : 'inactive'}`}
                        name="ip" value={config.ip}  onChange={handleChange} readOnly={config.mode !== "Static"} />
                    </div>
                    <div className="mb-3">
                      <h5 className="form-label">Netmask:</h5>
                      <input type="text" className={`form-control ${config.mode === "Static" ? '' : 'inactive'}`}
                        name="netmask" value={config.netmask}  onChange={handleChange} readOnly={config.mode !== "Static"} />
                    </div>
                    <div className="mb-3">
                      <h5 className="form-label">Gateway:</h5>
                      <input type="text" className={`form-control ${config.mode === "Static" ? '' : 'inactive'}`}
                        name="gateway" value={config.gateway}  onChange={handleChange} readOnly={config.mode !== "Static"} />
                    </div>
                    <span className="row align-items-center justify-content-between">
                        <button className="col m-2 btn btn-outline-secondary " onClick={() => changeEditMode(false)}>
                            Cancel
                        </button>
                        <button className="col m-2 btn btn-primary" onClick={saveConfig}>
                            Save
                        </button>
                    </span>
                  </>
                ) : (
                  <>
                    <div className="dropdown pb-3">
                    <h5 className="form-label">Mode:</h5>
                    <div className="form-control-plaintext">{current_config.mode}</div>
                    </div>
                    <div className="mb-3">
                      <h5 className="form-label">IP Address:</h5>
                      <div className="form-control-plaintext">{current_config.ip}</div>
                    </div>
                    <div className="mb-3">
                      <h5 className="form-label">Netmask:</h5>
                      <div className="form-control-plaintext">{current_config.netmask}</div>
                    </div>
                    <div className="mb-3">
                      <h5 className="form-label">Gateway:</h5>
                      <div className="form-control-plaintext">{current_config.gateway}</div>
                    </div>
                    <span className="row align-items-center justify-content-between">
                        <button className="col m-2 btn btn-primary" onClick={() => changeEditMode(true)}>
                            Edit
                        </button>
                    </span>
                  </>
                )}

                {status && <div className="mt-3 alert alert-info">{status}</div>}
            </div>
        </>
    )
}

export default NetworkSettings;