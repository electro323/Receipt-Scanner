import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonInput,
  IonItem,
  IonLabel,
  IonAlert,
  IonSpinner,
} from '@ionic/react';
import { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import './Home.css';

const History: React.FC = () => {
  const history = useHistory();

  const [receipts, setReceipts] = useState<any[]>([]);
  const [searchId, setSearchId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [alertMessage, setAlertMessage] = useState<string>('');

  const loadReceipts = async () => {
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/receipts');
      const data = await response.json();

      if (Array.isArray(data)) {
        setReceipts(data);
      } else {
        setReceipts([]);
      }
    } catch (error) {
      console.error('HISTORY LOAD ERROR:', error);
      setAlertMessage('Unable to load receipt history.');
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  const searchReceipt = async () => {
    if (!searchId.trim()) {
      setAlertMessage('Please enter a transaction ID.');
      setShowAlert(true);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `http://localhost:3000/receipt/${searchId.trim()}`
      );

      const data = await response.json();

      if (!data || !data.transactionId) {
        setAlertMessage('No receipt found with this transaction ID.');
        setShowAlert(true);
        return;
      }

      openReceipt(data);
    } catch (error) {
      console.error('SEARCH ERROR:', error);
      setAlertMessage('Unable to search receipt.');
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  const openReceipt = (receipt: any) => {
    if (receipt.status !== 'completed') {
      setAlertMessage(
        `This receipt is currently ${receipt.status}. Please check again later.`
      );
      setShowAlert(true);
      return;
    }

    history.push('/verify-receipt', {
      receiptData: receipt.receiptData,
      previewUrl: `http://localhost:3000/${receipt.filePath.replace(/\\/g, '/')}`,
      fileName: receipt.filePath || 'Saved Receipt',
      transactionId: receipt.transactionId,
    });
  };

  const downloadJson = (receipt: any) => {
    if (!receipt.receiptData) {
      setAlertMessage('No completed JSON available for this receipt.');
      setShowAlert(true);
      return;
    }

    const blob = new Blob([JSON.stringify(receipt.receiptData, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = `${receipt.transactionId}.json`;
    a.click();

    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    loadReceipts();
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Receipt History</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding page-bg">
        <div className="app-container">
          <div className="hero-card">
            <h1 className="hero-title">Receipt History</h1>
            <p className="hero-subtitle">
              Search receipts using transaction ID or view recently scanned receipts.
            </p>
          </div>

          <div className="card">
            <h2 className="section-title">Search by Transaction ID</h2>

            <IonItem>
              <IonLabel position="stacked">Transaction ID</IonLabel>
              <IonInput
                value={searchId}
                placeholder="Example: TXN-1782364961653"
                onIonInput={(e) => setSearchId(String(e.detail.value || ''))}
              />
            </IonItem>

            <IonButton
              expand="block"
              onClick={searchReceipt}
              className="action-button"
            >
              Search Receipt
            </IonButton>
          </div>

          <div className="card">
            <div className="history-header">
              <h2 className="section-title">Recent Receipts</h2>

              <IonButton color="medium" onClick={loadReceipts}>
                Refresh
              </IonButton>
            </div>

            {loading && <IonSpinner name="crescent" />}

            {!loading && receipts.length === 0 && (
              <p>No receipts found.</p>
            )}

            {!loading &&
              receipts.map((receipt: any) => (
                <div className="history-card" key={receipt.transactionId}>
                  <div>
                    <h3>{receipt.transactionId}</h3>

                    <p>
                      <strong>Status:</strong> {receipt.status}
                    </p>

                    <p>
                      <strong>Vendor:</strong>{' '}
                      {receipt.receiptData?.vendor?.name || '-'}
                    </p>

                    <p>
                      <strong>Date:</strong>{' '}
                      {receipt.receiptData?.transaction?.date || '-'}
                    </p>

                    <p>
                      <strong>Total:</strong>{' '}
                      {receipt.receiptData?.totals?.total || '-'}
                    </p>
                  </div>

                  <div className="history-actions">
                    <IonButton
                      color="primary"
                      onClick={() => openReceipt(receipt)}
                    >
                      View
                    </IonButton>

                    <IonButton
                      color="success"
                      onClick={() => downloadJson(receipt)}
                      disabled={receipt.status !== 'completed'}
                    >
                      Download JSON
                    </IonButton>
                  </div>
                </div>
              ))}
          </div>

          <IonButton
            expand="block"
            color="medium"
            onClick={() => history.push('/')}
          >
            Back to Upload
          </IonButton>

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

export default History;

