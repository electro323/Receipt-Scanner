import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonItem,
  IonAlert,
  IonInput,
  IonLabel,
  IonModal,
} from '@ionic/react';
import { useState } from 'react';
import './Home.css';

const Home: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [ocrText, setOcrText] = useState<string>('Waiting for scan...');
  const [aiResult, setAiResult] = useState<string>('Waiting for scan...');
  const [receipt, setReceipt] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const [statusMessage, setStatusMessage] = useState<string>('Ready to upload');
  const [showOCR, setShowOCR] = useState(false);
  const [showJSON, setShowJSON] = useState(false);

  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [alertMessage, setAlertMessage] = useState<string>('');
  const [showAddItemModal, setShowAddItemModal] = useState(false);

const [newItem, setNewItem] = useState({
  name: '',
  quantity: 1,
  unit_price: 0,
  total_price: 0,
  category: '',
});

  const handleFileChange = (event: any) => {
  if (event.target.files.length === 0) return;

  const file = event.target.files[0];

  const allowedExtensions = ['jpg', 'jpeg', 'png', 'heic', 'pdf'];
  const fileExtension = file.name.split('.').pop()?.toLowerCase();

  if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
    setSelectedFile(null);
    setAlertMessage('Unsupported file type. Please upload JPG, PNG, HEIC, or PDF.');
    setShowAlert(true);
    setStatusMessage('Unsupported file selected.');
    return;
  }

  const maxSizeMB = 10;
  const fileSizeMB = file.size / (1024 * 1024);

  if (fileSizeMB > maxSizeMB) {
    setSelectedFile(null);
    setAlertMessage('File is too large. Please upload a file smaller than 10MB.');
    setShowAlert(true);
    setStatusMessage('File too large.');
    return;
  }

  setSelectedFile(file);
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

  const updateField = (section: string, field: string, value: any) => {
    setReceipt((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const updateItemField = (index: number, field: string, value: any) => {
    setReceipt((prev: any) => {
      const updatedItems = [...(prev.items || [])];

      updatedItems[index] = {
        ...updatedItems[index],
        [field]:
          field === 'name' || field === 'category'
            ? value
            : Number(value),
      };

      return {
        ...prev,
        items: updatedItems,
      };
    });
  };

 const addItem = () => {
  setShowAddItemModal(true);
};
const confirmAddItem = () => {
  setReceipt((prev: any) => ({
    ...prev,
    items: [...(prev.items || []), newItem],
  }));

  setNewItem({
    name: '',
    quantity: 1,
    unit_price: 0,
    total_price: 0,
    category: '',
  });

  setShowAddItemModal(false);

  setStatusMessage('New item added.');
};
  const deleteItem = (index: number) => {
    setReceipt((prev: any) => ({
      ...prev,
      items: (prev.items || []).filter((_: any, i: number) => i !== index),
    }));

    setStatusMessage('Item deleted.');
  };

  const recalculateTotals = () => {
    setReceipt((prev: any) => {
      const subtotal = (prev.items || []).reduce(
        (sum: number, item: any) => sum + Number(item.total_price || 0),
        0
      );

      const tax = Number(prev.totals?.tax || 0);
      const discounts = prev.totals?.discounts || [];

      const discountTotal = discounts.reduce(
        (sum: number, discount: any) => sum + Number(discount.amount || 0),
        0
      );

      const total = subtotal + tax - discountTotal;

      return {
        ...prev,
        totals: {
          ...prev.totals,
          subtotal,
          total,
        },
        payment: {
          ...prev.payment,
          amount: total,
        },
      };
    });

    setStatusMessage('Totals recalculated.');
  };

const applyCorrections = () => {
  if (!receipt) return;

  if (Number(receipt.totals?.total || 0) <= 0) {
    setAlertMessage('Total amount must be greater than 0.');
    setShowAlert(true);
    return;
  }

  if (Number(receipt.payment?.amount || 0) < 0) {
    setAlertMessage('Payment amount cannot be negative.');
    setShowAlert(true);
    return;
  }

  if (Number(receipt.totals?.tax || 0) < 0) {
    setAlertMessage('Tax amount cannot be negative.');
    setShowAlert(true);
    return;
  }

  const invalidItem = (receipt.items || []).find(
    (item: any) =>
      !item.name ||
      Number(item.quantity || 0) <= 0 ||
      Number(item.total_price || 0) < 0
  );

  if (invalidItem) {
    setAlertMessage(
      'Please check item details. Each item needs a name, valid quantity, and valid price.'
    );
    setShowAlert(true);
    return;
  }

  setAiResult(JSON.stringify(receipt, null, 2));
  setStatusMessage('Corrections applied. Final receipt JSON updated.');
  setAlertMessage('Corrections applied successfully.');
  setShowAlert(true);
};

  const handleUpload = async () => {
    if (!selectedFile) {
      setAlertMessage('Please select a receipt image first.');
      setShowAlert(true);
      return;
    }

    setLoading(true);
    setReceipt(null);
    setOcrText('Scanning OCR...');
    setAiResult('Waiting for OCR...');
    setStatusMessage('Uploading receipt...');

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
        setOcrText('Receipt could not be read.');
        setAiResult('AI processing skipped.');
        setStatusMessage('Receipt could not be read.');
        return;
      }

      setOcrText(data.rawText || 'No OCR text found.');
      setAiResult('AI Processing...');
      setStatusMessage('OCR complete. AI processing started...');

      const aiResponse = await fetch('http://localhost:3000/process-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: data.rawText }),
      });

      const aiData = await aiResponse.json();

      setReceipt(aiData);
      setAiResult(JSON.stringify(aiData, null, 2));
      setStatusMessage('Receipt ready for review.');
    } catch (error) {
      console.error(error);

      setAlertMessage('Error connecting to backend.');
      setShowAlert(true);

      setOcrText('Backend connection failed.');
      setAiResult('Backend connection failed.');
      setStatusMessage('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

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
              Upload a receipt, extract OCR text, review AI data, and correct fields.
            </p>
          </div>

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



            <IonButton
              expand="block"
              onClick={handleUpload}
              disabled={!selectedFile || loading}
              className="action-button"
            >
              {loading ? 'Processing...' : 'Upload & Scan'}
            </IonButton>
          </div>

          <div className="card">
            <h2 className="section-title">Processing Status</h2>
            <p className="status-text">{statusMessage}</p>
          </div>

          {receipt && (
            <>
              <div className="card">
                <h2 className="section-title">Receipt Summary</h2>

                <div className="summary-grid">
                  <div className="summary-item">
                    <div className="summary-label">Vendor</div>
                    <div className="summary-value">{receipt.vendor?.name || '-'}</div>
                  </div>

                  <div className="summary-item">
                    <div className="summary-label">Date</div>
                    <div className="summary-value">{receipt.transaction?.date || '-'}</div>
                  </div>

                  <div className="summary-item">
                    <div className="summary-label">Receipt No</div>
                    <div className="summary-value">
                      {receipt.transaction?.receipt_number || '-'}
                    </div>
                  </div>

                  <div className="summary-item total-highlight">
                    <div className="summary-label">Total</div>
                    <div className="summary-value">{receipt.totals?.total || 0}</div>
                  </div>
                </div>
              </div>

              <div className="card">
                <h2 className="section-title">Editable Receipt Details</h2>

                <h3>Vendor</h3>

                <IonItem>
                  <IonLabel position="stacked">Vendor Name</IonLabel>
                  <IonInput
                    value={receipt.vendor?.name || ''}
                    onIonInput={(e) => updateField('vendor', 'name', e.detail.value)}
                  />
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">Vendor Address</IonLabel>
                  <IonInput
                    value={receipt.vendor?.address || ''}
                    onIonInput={(e) => updateField('vendor', 'address', e.detail.value)}
                  />
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">Vendor Phone</IonLabel>
                  <IonInput
                    value={receipt.vendor?.phone || ''}
                    onIonInput={(e) => updateField('vendor', 'phone', e.detail.value)}
                  />
                </IonItem>

                <h3>Transaction</h3>

                <IonItem>
                  <IonLabel position="stacked">Date</IonLabel>
                  <IonInput
                    value={receipt.transaction?.date || ''}
                    onIonInput={(e) => updateField('transaction', 'date', e.detail.value)}
                  />
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">Time</IonLabel>
                  <IonInput
                    value={receipt.transaction?.time || ''}
                    onIonInput={(e) => updateField('transaction', 'time', e.detail.value)}
                  />
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">Receipt Number</IonLabel>
                  <IonInput
                    value={receipt.transaction?.receipt_number || ''}
                    onIonInput={(e) =>
                      updateField('transaction', 'receipt_number', e.detail.value)
                    }
                  />
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">Currency</IonLabel>
                  <IonInput
                    value={receipt.transaction?.currency || ''}
                    onIonInput={(e) =>
                      updateField('transaction', 'currency', e.detail.value)
                    }
                  />
                </IonItem>

                <h3>Items</h3>

                <IonButton
                  expand="block"
                  color="medium"
                  onClick={addItem}
                  className="action-button"
                >
                  + Add Item
                </IonButton>

                {receipt.items && receipt.items.length > 0 ? (
                  receipt.items.map((item: any, index: number) => (
                    <div className="item-card" key={index}>
                      <h4>Item {index + 1}</h4>

                      <IonButton
                        color="danger"
                        size="small"
                        onClick={() => deleteItem(index)}
                      >
                        Delete Item
                      </IonButton>

                      <IonItem>
                        <IonLabel position="stacked">Product Name</IonLabel>
                        <IonInput
                          value={item.name || ''}
                          onIonInput={(e) =>
                            updateItemField(index, 'name', e.detail.value)
                          }
                        />
                      </IonItem>

                      <IonItem>
                        <IonLabel position="stacked">Quantity</IonLabel>
                        <IonInput
                          type="number"
                          value={item.quantity || 1}
                          onIonInput={(e) =>
                            updateItemField(index, 'quantity', e.detail.value)
                          }
                        />
                      </IonItem>

                      <IonItem>
                        <IonLabel position="stacked">Unit Price</IonLabel>
                        <IonInput
                          type="number"
                          value={item.unit_price || 0}
                          onIonInput={(e) =>
                            updateItemField(index, 'unit_price', e.detail.value)
                          }
                        />
                      </IonItem>

                      <IonItem>
                        <IonLabel position="stacked">Total Price</IonLabel>
                        <IonInput
                          type="number"
                          value={item.total_price || 0}
                          onIonInput={(e) =>
                            updateItemField(index, 'total_price', e.detail.value)
                          }
                        />
                      </IonItem>

                      <IonItem>
                        <IonLabel position="stacked">Category</IonLabel>
                        <IonInput
                          value={item.category || ''}
                          onIonInput={(e) =>
                            updateItemField(index, 'category', e.detail.value)
                          }
                        />
                      </IonItem>
                    </div>
                  ))
                ) : (
                  <p>No items found.</p>
                )}

                <h3>Totals</h3>

                <IonItem>
                  <IonLabel position="stacked">Subtotal</IonLabel>
                  <IonInput
                    type="number"
                    value={receipt.totals?.subtotal || 0}
                    onIonInput={(e) =>
                      updateField('totals', 'subtotal', Number(e.detail.value))
                    }
                  />
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">Tax</IonLabel>
                  <IonInput
                    type="number"
                    value={receipt.totals?.tax || 0}
                    onIonInput={(e) =>
                      updateField('totals', 'tax', Number(e.detail.value))
                    }
                  />
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">Total</IonLabel>
                  <IonInput
                    type="number"
                    value={receipt.totals?.total || 0}
                    onIonInput={(e) =>
                      updateField('totals', 'total', Number(e.detail.value))
                    }
                  />
                </IonItem>

                <h3>Payment</h3>

                <IonItem>
                  <IonLabel position="stacked">Payment Method</IonLabel>
                  <IonInput
                    value={receipt.payment?.method || ''}
                    onIonInput={(e) => updateField('payment', 'method', e.detail.value)}
                  />
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">Payment Amount</IonLabel>
                  <IonInput
                    type="number"
                    value={receipt.payment?.amount || 0}
                    onIonInput={(e) =>
                      updateField('payment', 'amount', Number(e.detail.value))
                    }
                  />
                </IonItem>

                <IonButton
                  expand="block"
                  color="warning"
                  onClick={recalculateTotals}
                  className="action-button"
                >
                  Recalculate Totals
                </IonButton>

                <IonButton
                  expand="block"
                  color="success"
                  onClick={applyCorrections}
                  className="action-button"
                >
                  Apply Corrections
                </IonButton>
              </div>
            </>
          )}

          <div className="card">
            <div className="debug-header" onClick={() => setShowOCR(!showOCR)}>
              <span>{showOCR ? '▼' : '▶'} OCR Debug Text</span>
            </div>

            {showOCR && <pre className="debug-pre">{ocrText}</pre>}
          </div>

          <div className="card">
            <div className="debug-header" onClick={() => setShowJSON(!showJSON)}>
              <span>{showJSON ? '▼' : '▶'} Structured JSON</span>
            </div>

            {showJSON && <pre className="debug-pre">{aiResult}</pre>}
          </div>
          <IonModal isOpen={showAddItemModal}>
  <IonContent className="ion-padding">

    <h2>Add New Item</h2>

    <IonItem>
      <IonLabel position="stacked">Product Name</IonLabel>
      <IonInput
        value={newItem.name}
        onIonInput={(e) =>
          setNewItem({
            ...newItem,
            name: String(e.detail.value || ''),
          })
        }
      />
    </IonItem>

    <IonItem>
      <IonLabel position="stacked">Quantity</IonLabel>
      <IonInput
        type="number"
        value={newItem.quantity}
        onIonInput={(e) =>
          setNewItem({
            ...newItem,
            quantity: Number(e.detail.value || 1),
          })
        }
      />
    </IonItem>

    <IonItem>
      <IonLabel position="stacked">Unit Price</IonLabel>
      <IonInput
        type="number"
        value={newItem.unit_price}
        onIonInput={(e) =>
          setNewItem({
            ...newItem,
            unit_price: Number(e.detail.value || 0),
          })
        }
      />
    </IonItem>

    <IonItem>
      <IonLabel position="stacked">Total Price</IonLabel>
      <IonInput
        type="number"
        value={newItem.total_price}
        onIonInput={(e) =>
          setNewItem({
            ...newItem,
            total_price: Number(e.detail.value || 0),
          })
        }
      />
    </IonItem>

    <IonItem>
      <IonLabel position="stacked">Category</IonLabel>
      <IonInput
        value={newItem.category}
        onIonInput={(e) =>
          setNewItem({
            ...newItem,
            category: String(e.detail.value || ''),
          })
        }
      />
    </IonItem>

    <IonButton
      expand="block"
      color="success"
      onClick={confirmAddItem}
    >
      Done
    </IonButton>

    <IonButton
      expand="block"
      color="medium"
      onClick={() => setShowAddItemModal(false)}
    >
      Cancel
    </IonButton>

  </IonContent>
</IonModal>

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