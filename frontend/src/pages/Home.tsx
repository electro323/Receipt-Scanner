import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonAlert,
  IonSpinner,
} from '@ionic/react';
import { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import './Home.css';

const Home: React.FC = () => {
  const history = useHistory();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  
  const [statusMessage, setStatusMessage] = useState<string>('Ready to upload');
  const [transactionId, setTransactionId] = useState<string>('');

  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [alertMessage, setAlertMessage] = useState<string>('');

  useEffect(() => {
    const savedTransactionId = localStorage.getItem('activeTransactionId');

    if (savedTransactionId) {
      setTransactionId(savedTransactionId);
      setLoading(true);
      setStatusMessage(
        `Transaction ID: ${savedTransactionId} | Checking processing status...`
      );

      startPolling(savedTransactionId);
    }
  }, []);

  const handleFileChange = (event: any) => {
    if (event.target.files.length === 0) return;

    const file = event.target.files[0];

    const allowedExtensions = ['jpg', 'jpeg', 'png', 'heic', 'pdf'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      setSelectedFile(null);
      setPreviewUrl('');
      setTransactionId('');
      localStorage.removeItem('activeTransactionId');

      setAlertMessage('Unsupported file type. Please upload JPG, PNG, HEIC, or PDF.');
      setShowAlert(true);
      setStatusMessage('Unsupported file selected.');
      return;
    }

    const maxSizeMB = 10;
    const fileSizeMB = file.size / (1024 * 1024);

    if (fileSizeMB > maxSizeMB) {
      setSelectedFile(null);
      setPreviewUrl('');
      setTransactionId('');
      localStorage.removeItem('activeTransactionId');

      setAlertMessage('File is too large. Please upload a file smaller than 10MB.');
      setShowAlert(true);
      setStatusMessage('File too large.');
      return;
    }

    const url = URL.createObjectURL(file);

    setSelectedFile(file);
    setPreviewUrl(url);
    setTransactionId('');
    localStorage.removeItem('activeTransactionId');
    setStatusMessage('Receipt selected. Ready to scan.');
  };

  const handleDrop = (event: any) => {
    event.preventDefault();

    if (event.dataTransfer.files.length === 0) return;

    const fakeEvent = {
      target: {
        files: event.dataTransfer.files,
      },
    };

    handleFileChange(fakeEvent);
  };

  const handleDragOver = (event: any) => {
    event.preventDefault();
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setAlertMessage('Please select a receipt file first.');
      setShowAlert(true);
      return;
    }

    setLoading(true);
    setTransactionId('');
    setStatusMessage('Uploading receipt and creating transaction ID...');

    const formData = new FormData();
    formData.append('receipt', selectedFile);
    

    try {
      const response = await fetch('http://localhost:3000/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success === false) {
        setAlertMessage(
          data.message || 'Receipt could not be read. Please upload a clearer image.'
        );
        setShowAlert(true);
        setStatusMessage('Receipt could not be read.');
        setLoading(false);
        return;
      }

      setTransactionId(data.transactionId);
      localStorage.setItem('activeTransactionId', data.transactionId);

      setStatusMessage(
        `Transaction ID: ${data.transactionId} | Processing started. You can refresh or check History later.`
      );

      startPolling(data.transactionId);
    } catch (error) {
      console.error('UPLOAD ERROR:', error);

      setAlertMessage('Error connecting to backend.');
      setShowAlert(true);
      setStatusMessage('Something went wrong.');
      setLoading(false);
    }
  };

  const startPolling = (id: string) => {
    let attempts = 0;
    const maxAttempts = 120;

    const interval = setInterval(async () => {
      attempts++;

      try {
        const response = await fetch(`http://localhost:3000/receipt/${id}`);
        const receipt = await response.json();

        if (!receipt || !receipt.transactionId) {
          setStatusMessage(`Transaction ID: ${id} | Waiting for receipt record...`);
          return;
        }

        if (receipt.status === 'processing') {
          setStatusMessage(
            `Transaction ID: ${id} | Still processing... Please wait.`
          );
        }

        if (receipt.status === 'completed') {
          clearInterval(interval);

          localStorage.removeItem('activeTransactionId');

          setStatusMessage('Processing completed. Opening verification page...');
          setLoading(false);

          const filePath = receipt.filePath
            ? receipt.filePath.replace(/\\/g, '/')
            : '';

          const savedPreviewUrl = filePath
            ? `http://localhost:3000/${filePath}`
            : previewUrl;

          history.push('/verify-receipt', {
            receiptData: receipt.receiptData,
            previewUrl: savedPreviewUrl,
            fileName: receipt.filePath || selectedFile?.name || 'Saved Receipt',
            fileType: selectedFile?.type || '',
            transactionId: receipt.transactionId,
          });
        }

        if (receipt.status === 'failed') {
          clearInterval(interval);

          localStorage.removeItem('activeTransactionId');

          setLoading(false);
          setStatusMessage('Processing failed.');
          setAlertMessage(
            receipt.error || 'Receipt processing failed. Please try another image.'
          );
          setShowAlert(true);
        }

        if (attempts >= maxAttempts) {
          clearInterval(interval);

          setLoading(false);
          setStatusMessage(
            `Transaction ID: ${id} | Still processing. Please check History later.`
          );
        }
      } catch (error) {
        console.error('POLLING ERROR:', error);

        if (attempts >= maxAttempts) {
          clearInterval(interval);
          setLoading(false);
          setStatusMessage(
            `Transaction ID: ${id} | Unable to check status. Please check History later.`
          );
        }
      }
    }, 3000);
  };

  const clearActiveTransaction = () => {
    localStorage.removeItem('activeTransactionId');
    setTransactionId('');
    setLoading(false);
    setStatusMessage('Ready to upload');
  };

  const isPdf = selectedFile?.name.toLowerCase().endsWith('.pdf');
  const isHeic = selectedFile?.name.toLowerCase().endsWith('.heic');

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Receipt Scanner</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding page-bg">
        <div className="app-container">
          <div className="hero-card">
            <h1 className="hero-title">AI Receipt Scanner</h1>
            <p className="hero-subtitle">
              Upload a receipt, get a transaction ID, verify extracted fields, save changes, and download JSON.
            </p>
          </div>

          {!loading && (
            <div
              className="card upload-box"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <h2 className="section-title">Upload Receipt</h2>

              <input
                id="receipt-upload"
                type="file"
                accept=".jpg,.jpeg,.png,.heic,.pdf"
                onChange={handleFileChange}
                hidden
              />

              <label htmlFor="receipt-upload" className="custom-upload-btn">
                Choose Receipt
              </label>

              <p className="selected-file-text">
                {selectedFile
                  ? `Selected file: ${selectedFile.name}`
                  : 'No file selected'}
              </p>

              <p className="drag-text">
                Drag and drop receipt here or choose a file
              </p>

              {previewUrl && (
                <div className="upload-preview">
                  {isPdf ? (
                    <iframe
                      src={previewUrl}
                      title="PDF Preview"
                      className="preview-frame"
                    />
                  ) : isHeic ? (
                    <div className="file-preview-box">
                      HEIC file selected. Preview may not be supported in browser.
                    </div>
                  ) : (
                    <img
                      src={previewUrl}
                      alt="Receipt Preview"
                      className="preview-image"
                    />
                  )}
                </div>
              )}

              {transactionId && (
                <div className="transaction-box">
                  <strong>Transaction ID:</strong> {transactionId}
                </div>
              )}

              <IonButton
                expand="block"
                onClick={handleUpload}
                disabled={!selectedFile || loading}
                className="action-button"
              >
                Upload & Scan
              </IonButton>

              <IonButton
                expand="block"
                color="medium"
                onClick={() => history.push('/history')}
              >
                View History
              </IonButton>
            </div>
          )}

          {loading && (
            <div className="upload-process-layout">
              <div className="card preview-section">
                <h2 className="section-title">Uploaded Receipt</h2>

                <p className="selected-file-text">
                  {selectedFile ? selectedFile.name : 'Receipt preview may be available in History'}
                </p>

                {previewUrl ? (
                  <div className="upload-preview processing-preview-box">
                    {isPdf ? (
                      <iframe
                        src={previewUrl}
                        title="PDF Preview"
                        className="preview-frame"
                      />
                    ) : isHeic ? (
                      <div className="file-preview-box">
                        HEIC file selected. Preview may not be supported in browser.
                      </div>
                    ) : (
                      <img
                        src={previewUrl}
                        alt="Receipt Preview"
                        className="preview-image"
                      />
                    )}
                  </div>
                ) : (
                  <p>No preview available after refresh. Use History after processing completes.</p>
                )}
              </div>

              <div className="card processing-section">
                <h2 className="section-title">Receipt Processing</h2>

                <IonSpinner name="crescent" />

                {transactionId && (
                  <div className="transaction-box">
                    <strong>Transaction ID:</strong> {transactionId}
                  </div>
                )}

                <p className="status-text">{statusMessage}</p>

                <div className="processing-steps">
                  <p>Receipt uploaded</p>
                  <p>Backend processing OCR and AI</p>
                  <p>Saving result to database</p>
                  <p>Opening verification page when complete</p>
                </div>

                <IonButton
                  expand="block"
                  color="medium"
                  onClick={() => history.push('/history')}
                >
                  View History
                </IonButton>

                
              </div>
            </div>
          )}

          <IonAlert
            isOpen={showAlert}
            onDidDismiss={() => setShowAlert(false)}
            header="Message"
            message={alertMessage}
            buttons={['OK']}
          />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;
