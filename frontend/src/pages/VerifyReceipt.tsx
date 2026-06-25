import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonItem,
  IonInput,
  IonLabel,
  IonAlert,
} from '@ionic/react';
import { useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import './Home.css';

const VerifyReceipt: React.FC = () => {
  const history = useHistory();
  const location = useLocation<any>();

  const [receipt, setReceipt] = useState<any>(
    location.state?.receiptData || null
  );

  const previewUrl = location.state?.previewUrl || '';
  const fileName = location.state?.fileName || 'Uploaded Receipt';
  const transactionId = location.state?.transactionId || '';

  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  if (!receipt) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Verify Receipt</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent className="ion-padding page-bg">
          <div className="app-container">
            <div className="card">
              <h2>No receipt data found</h2>
              <IonButton onClick={() => history.push('/')}>
                Go Back
              </IonButton>
            </div>
          </div>
        </IonContent>
      </IonPage>
    );
  }

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
    setReceipt((prev: any) => ({
      ...prev,
      items: [
        ...(prev.items || []),
        {
          name: '',
          quantity: 1,
          unit_price: 0,
          total_price: 0,
          category: '',
        },
      ],
    }));
  };

  const deleteItem = (index: number) => {
    setReceipt((prev: any) => ({
      ...prev,
      items: (prev.items || []).filter((_: any, i: number) => i !== index),
    }));
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
  };

 const saveChanges = async () => {
  if (!transactionId) {
    setAlertMessage('Transaction ID missing. Cannot save changes.');
    setShowAlert(true);
    return;
  }

  try {
    const response = await fetch(
      `http://localhost:3000/receipt/${transactionId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(receipt),
      }
    );

    if (!response.ok) {
      throw new Error('Save failed');
    }

    const updatedReceipt = await response.json();

    setReceipt(updatedReceipt.receiptData || receipt);
    setAlertMessage('Changes saved successfully.');
    setShowAlert(true);
  } catch (error) {
    console.error('SAVE ERROR:', error);
    setAlertMessage('Unable to save changes.');
    setShowAlert(true);
  }
};

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(receipt, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = 'receipt-output.json';
    a.click();

    URL.revokeObjectURL(url);
  };

  const isPdf = fileName.toLowerCase().endsWith('.pdf');

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Verify Receipt</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding page-bg">
        <div className="verify-top-bar">
          <IonButton color="medium" onClick={() => history.push('/')}>
            Back
          </IonButton>

          <div className="verify-actions">
            <IonButton color="success" onClick={saveChanges}>
              Save Changes
            </IonButton>

            <IonButton onClick={downloadJson}>
              Download JSON
            </IonButton>
          </div>
        </div>

        <div className="verify-layout">
          <div className="card preview-panel">
            <h2 className="section-title">Receipt Preview</h2>
            <p className="selected-file-text">{fileName}</p>

            {previewUrl ? (
              isPdf ? (
                <iframe
                  src={previewUrl}
                  title="Receipt PDF"
                  className="verify-preview-frame"
                />
              ) : (
                <img
                  src={previewUrl}
                  alt="Receipt"
                  className="verify-preview-image"
                />
              )
            ) : (
              <p>No preview available.</p>
            )}
          </div>

          <div className="card form-panel">
            <h2 className="section-title">Editable Receipt Details</h2>

            <h3>Vendor Information</h3>

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

            <h3>Transaction Details</h3>

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

            <IonButton expand="block" color="medium" onClick={addItem}>
              + Add Item
            </IonButton>

            {(receipt.items || []).map((item: any, index: number) => (
              <div className="item-card" key={index}>
                <div className="item-card-header">
                  <h4>Item {index + 1}</h4>

                  <IonButton
                    color="danger"
                    size="small"
                    onClick={() => deleteItem(index)}
                  >
                    Delete
                  </IonButton>
                </div>

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
            ))}

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
            >
              Recalculate Totals
            </IonButton>
          </div>
        </div>

        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header="Message"
          message={alertMessage}
          buttons={['OK']}
        />
      </IonContent>
    </IonPage>
  );
};

export default VerifyReceipt;

