import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton, IonItem } from '@ionic/react';
import { useState } from 'react';

const Home: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [ocrResult, setOcrResult] = useState<string>("Waiting for scan...");
  const [loading, setLoading] = useState<boolean>(false);

  const handleFileChange = (event: any) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setOcrResult("Scanning... check backend terminal!");
    const formData = new FormData();
    formData.append('receipt', selectedFile);

    try {
      const response = await fetch('http://localhost:3000/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      // We are forcing it to print the ENTIRE backend response to the screen
      setOcrResult(JSON.stringify(data, null, 2)); 
      alert("Scan Successful!");

    } catch (error) {
      setOcrResult("ERROR: Backend connection failed.");
      alert("Error connecting to backend.");
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
      <IonContent className="ion-padding">
        <h2>1. Select Receipt</h2>
        <IonItem>
          <input type="file" accept="image/*" onChange={handleFileChange} />
        </IonItem>

        <IonButton 
          expand="block" 
          onClick={handleUpload} 
          disabled={!selectedFile || loading} 
          style={{ marginTop: '20px' }}
        >
          {loading ? 'Scanning...' : 'Upload & Scan'}
        </IonButton>

        {/* This box will NOW ALWAYS SHOW UP */}
        <div style={{ marginTop: '30px', padding: '15px', background: '#e0e0e0', borderRadius: '8px', border: '2px solid #333' }}>
          <h3>2. Raw JSON Output:</h3>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '14px', color: '#b30000', fontWeight: 'bold' }}>
            {ocrResult}
          </pre>
        </div>

      </IonContent>
    </IonPage>
  );
};

export default Home;