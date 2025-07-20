import React, { useState, useEffect } from 'react';
import StatusMessage, { useStatus } from './StatusMessage';


function Maintenance() {

    const { status, setSuccessStatus, setErrorStatus, clearStatus } = useStatus();
    const [version, setVersion] = useState('0.0.0');
    const [buildDate, setBuildDate] = useState('1970-01-01');
    const [components, setComponents] = useState({});

    useEffect(() => {
        const fetchVersion = async () => {
            try {
                const response = await fetch('/api/version');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setVersion(data.firmware_version);
                setBuildDate(data.build_date);
                setComponents(data.components);
            } catch (error) {
                console.error('Failed to fetch version:', error);
            }
        };

        fetchVersion();
    }, []);

    return (
    <>
        <div className="col col-12 wallcontroller__container"></div>
        <h2 className="mb-4"> Maintenance</h2>
        <div className="mb-3">
            <h5 className="form-label">Firmware Version:</h5>
            <span className="">{version}</span>
        </div>
        <div className="mb-3">
            <h5 className="form-label">Firmware Details:</h5>
            <span className="">{JSON.stringify(components, null, 2)}</span>
        </div>
        <div className="mb-3">
            <h5 className="form-label">Firmware Upload:</h5>
            <input type="file" accept=".bin" />
        </div>
    </>
  );
}

export default Maintenance;