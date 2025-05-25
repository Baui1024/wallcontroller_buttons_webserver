import React, { useState, useEffect } from 'react';


function NetworkSettings() {

    const [config, setConfig] = useState({ mode: '', ip: '', netmask: '', gateway: '' });
    const [original_config, setOriginalConfig] = useState({ mode: '', ip: '', netmask: '', gateway: '' });
    const [status, setStatus] = useState(null);

    useEffect(() => {
        fetch('/api/config')
        .then(res => res.json())
        .then(data => {
            setConfig(data);
            setOriginalConfig(data);
        })
        .catch(err => setStatus(`Failed to load: ${err}`));
    }, []);

    const handleChange = (e) => {
        console.log(e.target);
        const { name, value } = e.target;
        setConfig(prev => ({ ...prev, [name]: value }));
    };

    useEffect(() => {
        console.log(config); // Reset status when config changes
    }, [config]);

    const saveConfig = async () => {
        try {
        const response = await fetch('/api/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
        });
        const result = await response.json();
        setStatus(result.status === "ok" ? "✅ Saved successfully" : "❌ Failed");
        } catch (err) {
        setStatus(`❌ Error: ${err.message}`);
        }
    };
    
    return (
        <>
            <div className="col col-12 wallcontroller__container">
                <h2 className="mb-4"> Device Network Settings</h2>

                <div className="dropdown">
                    <label className="form-label">Mode</label>
                    <button className="form-control btn btn-secondary dropdown-toggle" 
                            type="button" 
                            data-bs-toggle="dropdown" 
                            aria-expanded="false"
                    >
                    {config.mode}
                    </button>
                     <ul className="form-control dropdown-menu">
                        <li><a className="dropdown-item" href="#" onClick={() => setConfig({ ...original_config, mode: 'DHCP' })}>DHCP</a></li>
                        <li><a className="dropdown-item" href="#" onClick={() => setConfig(prev => ({ ...prev, mode: 'Static' }))}>Static</a></li>
                    </ul>
                </div>

                <div className="mb-3">
                    <label className="form-label">IP Address</label>
                    <input type="text" className={`form-control ${config.mode === "Static" ? '' : 'inactive'}`}
                        name="ip" value={`${config.mode === "Static" ? config.ip : original_config.ip}`} onChange={handleChange} />
                </div>

                <div className="mb-3">
                    <label className="form-label">Netmask</label>
                    <input type="text" className={`form-control ${config.mode === "Static" ? '' : 'inactive'}`}
                        name="netmask" value={config.netmask} onChange={handleChange} />
                </div>

                <div className="mb-3">
                    <label className="form-label">Gateway</label>
                    <input type="text" className={`form-control ${config.mode === "Static" ? '' : 'inactive'}`}
                        name="gateway" value={config.gateway} onChange={handleChange} />
                </div>

                <button className="btn btn-primary" onClick={saveConfig}>
                    💾 Save
                </button>

                {status && <div className="mt-3 alert alert-info">{status}</div>}
            </div>
        </>
    )
}

export default NetworkSettings;