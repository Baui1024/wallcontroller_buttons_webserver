import React, { useState, useEffect } from 'react';
import StatusMessage, { useStatus } from './StatusMessage';
import Upload from './Upload';

function Maintenance() {

    const { status, setSuccessStatus, setErrorStatus, clearStatus } = useStatus();
    const [version, setVersion] = useState('0.0.0');
    const [buildDate, setBuildDate] = useState('1970-01-01');
    const [components, setComponents] = useState({});


    const fetchVersion = async () => {
        try {
            // Create AbortController for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

            const response = await fetch('/api/version', {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId); // Clear timeout if request succeeds
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            setVersion(result.firmware_version);
            setBuildDate(result.build_date);
            setComponents(result.components);
            return true;
        } catch (error) {
            if (error.name === 'AbortError') {
                console.error('Request timed out after 5 seconds');
            } else {
                console.error('Failed to fetch version:', error);
            }
            return false;
        }
    };
    useEffect(() => {
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
        <Upload fetchVersion={fetchVersion} />
    </>
  );
}

export default Maintenance;