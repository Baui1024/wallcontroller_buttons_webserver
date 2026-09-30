import React, { useState, useEffect } from 'react';

// Custom hook for status management
function useStatus(autoHideDuration = 5000) {
    const [status, setStatus] = useState(null);

    const setSuccessStatus = (message) => {
        setStatus({ type: 'success', text: message });
    };

    const setErrorStatus = (message) => {
        setStatus({ type: 'danger', text: message });
    };

    const setWarningStatus = (message) => {
        setStatus({ type: 'warning', text: message });
    };

    const setInfoStatus = (message) => {
        setStatus({ type: 'info', text: message });
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

    const icons = {
        success: 'bi-check-circle',
        danger: 'bi-x-circle',
        warning: 'bi-exclamation-triangle',
        info: 'bi-info-circle',
    };

    return (
        <div className={`mt-3 alert alert-${message.type} alert-dismissible fade show`} role="alert">
            <i className={`bi ${icons[message.type]} me-2`}></i>
            {message.text}
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
