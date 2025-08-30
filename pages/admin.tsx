import { useState } from 'react';

export default function Admin() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');

  const runBatchProcess = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/admin/batch-process', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      setMessage(data.message || 'Batch processing completed');
    } catch (error) {
      setMessage('Error: ' + error.message);
    }
    setIsProcessing(false);
  };

  return (
    <div className="p-8">
      <h1>Admin Panel</h1>
      <button 
        onClick={runBatchProcess}
        disabled={isProcessing}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        {isProcessing ? 'Processing...' : 'Run Batch Feature Extraction'}
      </button>
      {message && <p className="mt-4">{message}</p>}
    </div>
  );
}