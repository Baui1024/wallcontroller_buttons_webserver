import React, { useState, useEffect } from 'react';

// Custom hook for status management
function useStatus(autoHideDuration = 5000) {
    const [status, setStatus] = useState(null);

    const setSuccessStatus = (message) => {
        setStatus(`✅  ${message}`);
    };

    const setErrorStatus = (message) => {
        setStatus(`❌  ${message}`);
    };

    const setWarningStatus = (message) => {
        setStatus(`⚠️  ${message}`);
    };

    const setInfoStatus = (message) => {
        setStatus(message);
    };

    const clearStatus = () => {
        setStatus(null);
    };

    return {
        status,
        setStatus,
        setSuccessStatus,
        setErrorStatus,
        setWarningStatus,
        setInfoStatus,
        clearStatus,
        autoHideDuration
    };
}

function StatusMessage({ message, onClear, autoHideDuration = 5000 }) {
    const [visible, setVisible] = useState(!!message);

    useEffect(() => {
        if (message) {
            setVisible(true);
            
            if (autoHideDuration > 0) {
                const timer = setTimeout(() => {
                    setVisible(false);
                    if (onClear) {
                        onClear();
                    }
                }, autoHideDuration);

                // Cleanup timer if component unmounts or message changes
                return () => clearTimeout(timer);
            }
        } else {
            setVisible(false);
        }
    }, [message, autoHideDuration, onClear]);

    if (!visible || !message) {
        return null;
    }

    // Determine alert type based on message content
    const getAlertClass = (msg) => {
        if (msg.includes('✅')) return 'alert-success';
        if (msg.includes('❌')) return 'alert-danger';
        if (msg.includes('⚠️')) return 'alert-warning';
        return 'alert-info';
    };

    return (
        <div className={`mt-3 alert ${getAlertClass(message)} alert-dismissible fade show`} role="alert">
            {message}
            <button 
                type="button" 
                className="btn-close" 
                aria-label="Close"
                onClick={() => {
                    setVisible(false);
                    if (onClear) {
                        onClear();
                    }
                }}
            ></button>
        </div>
    );
}

export default StatusMessage;
export { useStatus };
