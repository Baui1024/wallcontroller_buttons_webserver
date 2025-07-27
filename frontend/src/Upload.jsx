
import React, { useState, useEffect } from 'react';
import StatusMessage, { useStatus } from './StatusMessage';

function Upload({ fetchVersion }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const { status, setSuccessStatus, setErrorStatus, clearStatus } = useStatus();
  const [firmwareUploaded, setFirmwareUploaded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [firmwareUpgradeStarted, setFirmwareUpgradeStarted] = useState(false);
  const [firmwareProgress, setFirmwareProgress] = useState(0);
  const [firmwareUpdateCompleted, setFirmwareUpdateCompleted] = useState(false);

  const preventDefaults = event => {
    event.preventDefault();
    event.stopPropagation();
  };

  const highlight = event =>
    event.target.classList.add('highlight');
  
  const unhighlight = event =>
    event.target.classList.remove('highlight');

  const getInputAndGalleryRefs = element => {
    const zone = element.closest('.upload_dropZone') || false;
    const gallery = zone.querySelector('.upload_gallery') || false;
    const input = zone.querySelector('input[type="file"]') || false;
    return {input: input, gallery: gallery};
  }

  const handleDrop = event => {
    const dataRefs = getInputAndGalleryRefs(event.target);
    dataRefs.files = event.dataTransfer.files;
    handleFiles(dataRefs);
  }


  const eventHandlers = zone => {

    const dataRefs = getInputAndGalleryRefs(zone);
    if (!dataRefs.input) return;

    // Prevent default drag behaviors
    ;['dragenter', 'dragover', 'dragleave', 'drop'].forEach(event => {
      zone.addEventListener(event, preventDefaults, false);
      document.body.addEventListener(event, preventDefaults, false);
    });

    // Highlighting drop area when item is dragged over it
    ;['dragenter', 'dragover'].forEach(event => {
      zone.addEventListener(event, highlight, false);
    });
    ;['dragleave', 'drop'].forEach(event => {
      zone.addEventListener(event, unhighlight, false);
    });

    // Handle dropped files
    zone.addEventListener('drop', handleDrop, false);

    // Handle browse selected files
    dataRefs.input.addEventListener('change', event => {
      dataRefs.files = event.target.files;
      handleFiles(dataRefs);
    }, false);

  }

  // Initialize dropzones when component mounts
  useEffect(() => {
    const dropZones = document.querySelectorAll('.upload_dropZone');
    for (const zone of dropZones) {
      eventHandlers(zone);
    }
  }, []);

  // Progress updater when firmware upgrade starts
  useEffect(() => {
    let progressInterval;
    let serverCheckInterval;
    
    if (firmwareUpgradeStarted) {
      // Start progress from 0 and increment every 2 seconds
      setFirmwareProgress(0);
      progressInterval = setInterval(() => {
        setFirmwareProgress(prev => {
          if (prev >= 99) {
            clearInterval(progressInterval);
            
            // Start checking server availability when we reach 99%
            serverCheckInterval = setInterval(async () => {
              try {
                let result = await fetchVersion(); // Try to reach the server
                console.log('Checking server availability...', result);
                if (result) {
                    // If successful, complete to 100% and stop checking
                    setFirmwareProgress(100);
                    setFirmwareUpdateCompleted(true);
                    setFirmwareUploaded(false); // Reset firmware uploaded status
                    setIsUploading(false); // Stop loading
                    setFirmwareUpgradeStarted(false); // Reset upgrade state
                    clearInterval(serverCheckInterval);
                    setSuccessStatus('Firmware upgrade completed successfully! The device is now running the new firmware.');
                }
                } catch (error) {
                // Server not reachable yet, keep checking
                console.log('Server not reachable yet, continuing to check...');
              }
            }, 3000); // Check every 3 seconds
            
            return 99;
          }
          return prev + 1;
        });
      }, 3000); // Update every 3 seconds
    }

    // Cleanup intervals when component unmounts or upgrade stops
    return () => {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      if (serverCheckInterval) {
        clearInterval(serverCheckInterval);
      }
    };
  }, [firmwareUpgradeStarted, fetchVersion]);


  // Check for binary files (.bin extension)
  // Double checks the input "accept" attribute
  const isBinaryFile = file => 
    file.name.toLowerCase().endsWith('.bin') || file.type === 'application/octet-stream';


  function previewFiles(dataRefs) {
    if (!dataRefs.gallery) return;
    // Only show the first file since we only allow one
    const file = dataRefs.files[0];
    if (file) {
      let fileDiv = document.createElement('div');
      fileDiv.className = 'upload_file mt-2 p-3 border rounded';
      fileDiv.innerHTML = `
        <i class="bi bi-file-earmark-binary me-2"></i>
        <strong>${file.name}</strong>
        <br>
        <small class="text-muted">Size: ${(file.size / 1024 / 1024).toFixed(2)} MB</small>
      `;
      dataRefs.gallery.appendChild(fileDiv);
    }
  }

  const binaryUpload = async (dataRefs) => {
    try {
        // Multiple source routes, so double check validity
        if (!dataRefs.files || !dataRefs.input) return;

        const name = dataRefs.input.getAttribute('data-post-name');
        if (!name) return;

        const formData = new FormData();
        formData.append(name, dataRefs.files[0]); // Only upload first file for firmware
        setFirmwareUploaded(false); // Reset firmware uploaded status
        setIsUploading(true); // Start loading

        const response = await fetch("/api/firmware_upload", {
            method: 'POST',
            body: formData
        })
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        console.log('posted: ', result);
        if (result.status === 'success') {
            setSuccessStatus(`Firmware uploaded successfully!`);
        } else {
            setErrorStatus(`Upload failed: ${result.message}`);
        }
    } catch (error) {
        console.error('errored: ', error);
        setErrorStatus(`Upload error: ${error.message}`);
    } finally {
        setIsUploading(false); // Stop loading regardless of success or failure
        setFirmwareUploaded(true); // Set firmware uploaded status
    }
  }

  const StartUpgrade = async () => {
    clearStatus(); // Clear any previous messages
    try {
        const response = await fetch('/api/firmware_update');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        if (result.status === 'success') {
            setSuccessStatus('Firmware upgrade started successfully. The device will reboot shortly.');
            // Set upgrade started state after 2 seconds
            setTimeout(() => {
                setFirmwareUpgradeStarted(true);
            }, 2000);
        } else {
            setErrorStatus(`Upgrade failed: ${result.error}`);
        }
    } catch (error) {
        console.error('Failed to get version:', error);
    }
}

  // Handle both selected and dropped files
  const handleFiles = dataRefs => {

    let files = [...dataRefs.files];

    // Only take the first file if multiple are selected/dropped
    if (files.length > 1) {
      files = [files[0]];
      console.log('Multiple files detected, only processing the first one');
    }

    // Remove unaccepted file types
    files = files.filter(item => {
      if (!isBinaryFile(item)) {
        console.log('Not a binary file, ', item.type);
      }
      return isBinaryFile(item) ? item : null;
    });

    if (!files.length) return;
    
    // Store the selected file in state
    setSelectedFile(files[0]);
    dataRefs.files = files;

    // Clear previous previews before showing new one
    if (dataRefs.gallery) {
      dataRefs.gallery.innerHTML = '';
    }

    previewFiles(dataRefs);
    // Don't auto-upload, wait for user to click Upload button
  };

  const handleUpload = () => {
    if (!selectedFile) {
      setErrorStatus('Please select a firmware file before uploading.');
      return;
    }

    const input = document.querySelector('#upload_firmware_bin');
    if (!input) return;

    const dataRefs = {
      input: input,
      files: [selectedFile],
      gallery: document.querySelector('.upload_gallery')
    };

    clearStatus(); // Clear any previous messages
    binaryUpload(dataRefs);
  };

  const handleClear = () => {
    setSelectedFile(null);
    clearStatus();
    const input = document.querySelector('#upload_firmware_bin');
    if (input) {
      input.value = ''; // Clear the file input
    }
    const gallery = document.querySelector('.upload_gallery');
    if (gallery) {
      gallery.innerHTML = ''; // Clear the gallery
    }
  };

  return (
        <div className="mb-3">
            <h5 className="form-label">Firmware Update:</h5>
            {!firmwareUpgradeStarted ? (
                <>
                <form>  <fieldset class="upload_dropZone text-center mb-3 p-4">
                    <i className="bi bi-upload" style={{fontSize: '60px'}}></i>
                    <p className="small my-2">Drag &amp; Drop firmware (.bin) file inside dashed region<br/><i>or</i></p>

                    <input id="upload_firmware_bin" data-post-name="firmware" className="position-absolute invisible" type="file" accept=".bin,application/octet-stream" />

                    <label className="btn btn-primary mb-3" for="upload_firmware_bin">Choose firmware file</label>

                    <div className="upload_gallery d-flex flex-wrap justify-content-center gap-3 mb-0"></div>

                </fieldset>

                </form>           
                {firmwareUploaded ? (
                <span className="row align-items-center justify-content-between">
                    <button className="col btn btn-primary ms-2" onClick={StartUpgrade}>
                        Firmware Uploaded! Click to Upgrade
                    </button>
                </span>
                ) : 
                <span className="row align-items-center justify-content-between">                
                    <button className="col btn btn-secondary" onClick={handleClear} disabled={isUploading}>Clear</button>
                    <button className="col btn btn-primary ms-2" onClick={handleUpload} disabled={isUploading}>
                    {isUploading ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Uploading...
                        </>
                    ) : (
                        'Upload'
                    )}
                    </button>
                </span>
                }
                <p className="text-muted mt-2">Firmware files must be in binary format (.bin) and less than 20 MB in size.</p>
                <p className="text-muted">After uploading, the device will automatically reboot to apply the new firmware.</p>
                <p className="text-muted">Ensure you have a backup of your current firmware before uploading a new one.</p>
                <StatusMessage message={status} onClear={clearStatus} />
            </>) :
            (
                <>
                <p className="text-muted">
                  {firmwareProgress < 99 
                    ? "Firmware upgrade in progress... This can take a couple of minutes."
                    : firmwareProgress === 99 
                    ? "Firmware upgrade almost complete. Waiting for device to restart..."
                    : "Firmware upgrade completed successfully!"
                  }
                </p>
                <div className="progress" role="progressbar" aria-label="Firmware upgrade progress" aria-valuenow={firmwareProgress} aria-valuemin="0" aria-valuemax="100">
                    <div className="progress-bar" style={{ width: `${firmwareProgress}%` }}>{firmwareProgress}%</div>
                </div>
                {firmwareUpdateCompleted && (
                  <div className="alert alert-success mt-3" role="alert">
                    <i className="bi bi-check-circle me-2"></i>
                    Firmware update completed successfully! The device is now running the new firmware.
                  </div>
                )}
                </>
            )}
        </div>
    );
}

export default Upload;