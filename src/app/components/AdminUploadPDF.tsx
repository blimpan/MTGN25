import React, { useRef, useState, useEffect } from 'react';
import { useAuth } from './useAuth';

interface BlandareItem {
  name: string;
  displayName?: string;
  images: string[];
  timeCreated: string;
}

export default function AdminUploadPDF() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [blandare, setBlandare] = useState<BlandareItem[]>([]);
  const [loadingBlandare, setLoadingBlandare] = useState(false);
  const [manageError, setManageError] = useState<string | null>(null);
  const [manageSuccess, setManageSuccess] = useState<string | null>(null);
  const [customName, setCustomName] = useState<string>('');
  const { user } = useAuth();

  useEffect(() => {
    let isMounted = true;
    if (typeof window !== "undefined") {
      import('react-pdf').then(({ pdfjs }) => {
        if (isMounted && pdfjs && pdfjs.GlobalWorkerOptions) {
          pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
        }
      });
    }
    return () => { isMounted = false; };
  }, []);

  // Fetch existing bländare
  const fetchBlandare = async () => {
    if (!user) return;
    
    setLoadingBlandare(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/getBlandare', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Use the new detailed format
        setBlandare(data.blandare || []);
      }
    } catch (error) {
      console.error('Error fetching bländare:', error);
    } finally {
      setLoadingBlandare(false);
    }
  };

  // Load bländare on component mount
  useEffect(() => {
    if (user) {
      fetchBlandare();
    }
  }, [user]);

  // Delete bländare
  const handleDeleteBlandare = async (folderName: string) => {
    if (!confirm(`Are you sure you want to delete "Bländaren ${folderName}"? This action cannot be undone.`)) return;
    if (!user) return;

    // Clear previous messages
    setManageError(null);
    setManageSuccess(null);

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/deleteBlandare', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ folderName }),
      });

      if (response.ok) {
        const data = await response.json();
        setManageSuccess(`Bländare "${folderName}" deleted successfully!`);
        fetchBlandare(); // Refresh the list
      } else {
        const errorData = await response.json();
        setManageError(errorData.error || 'Failed to delete bländare');
      }
    } catch (error) {
      console.error('Error deleting bländare:', error);
      setManageError('Failed to delete bländare');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);
    setError(null);
    setManageError(null);
    setManageSuccess(null);

    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError('Please select a PDF file.');
      return;
    }
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are allowed.');
      return;
    }

    const pdfNameWithoutExtension = file.name.replace(/\.[^/.]+$/, '');
    setUploading(true);

    try {
      let token = null;
      if (user) {
        token = await user.getIdToken();
      }

      // Convert PDF to images
      const arrayBuffer = await file.arrayBuffer();
      const { pdfjs } = await import('react-pdf');
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      const images: Blob[] = [];
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        if (!context) {
          throw new Error('Could not get canvas 2D context');
        }
        await page.render({ canvasContext: context, viewport }).promise;
        
        // Convert canvas to blob
        const blob: Blob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'));
        images.push(blob);
      }

      const formData = new FormData();
      images.forEach((img, idx) => {
        formData.append('images[]', img, `page-${idx + 1}.png`);
      });
      formData.append('pdfName', pdfNameWithoutExtension);
      formData.append('displayName', customName);
      
      const res = await fetch('/api/createBlandare', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload failed');
      }
      
      setSuccess('PDF converted and images uploaded successfully!');
      fetchBlandare(); // Refresh the list after successful upload
      
      // Clear form
      setCustomName('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('sv-SE', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="w-full max-w-xl bg-white rounded-lg shadow-md p-6 space-y-6">
      {/* Upload New Bländare */}
      <div className="space-y-4">
        <form onSubmit={handleSubmit}>
          <h1 className="mb-3 text-2xl font-semibold text-center">Upload New Bländare</h1>
          
          <div className="space-y-2">
            <label className="block text-gray-700 font-semibold text-sm">Bländare Name</label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="ex. Bländaren 1, Bländaren 2, Slutaren etc"
              className="border border-gray-300 rounded-lg p-2 w-full text-sm"
              required
            />
            <p className="text-xs text-gray-500">
              This name will appear on the buttons in the bländare page
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-gray-700 font-semibold text-sm">Upload PDF</label>
            <input
              type="file"
              accept="application/pdf"
              className="border border-gray-300 rounded-lg p-2 w-full text-sm"
              ref={fileInputRef}
              required
            />
            <p className="text-xs text-gray-500">
              PDF will be converted to images and uploaded automatically
            </p>
          </div>
          <button
            type="submit"
            className="mt-3 w-full bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-200 text-sm"
            disabled={uploading}
          >
            {uploading ? 'Converting and Uploading...' : 'Upload Bländare'}
          </button>
          {success && <p className="text-green-600 mt-2">{success}</p>}
          {error && <p className="text-red-600 mt-2">{error}</p>}
        </form>
      </div>

      {/* Manage Existing Bländare */}
      <div className="border-t pt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Manage Existing Bländare</h2>
          <button
            onClick={fetchBlandare}
            disabled={loadingBlandare}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-200 disabled:bg-gray-400 text-sm"
          >
            {loadingBlandare ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        <div className="space-y-3 max-h-[30rem] overflow-y-auto">
          {blandare.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No bländare found</p>
          ) : (
            blandare.map((item, index) => (
              <div key={item.name} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {/* Preview thumbnail */}
                    {item.images && item.images.length > 0 && (
                      <img
                        src={item.images[0]}
                        alt={`${item.name} preview`}
                        className="w-12 h-16 object-cover rounded border"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900">
                        {item.displayName || `Bländaren ${index + 1}`}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Folder: {item.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.images?.length || 0} pages
                      </p>
                      <p className="text-xs text-gray-400">
                        Uploaded: {formatDate(item.timeCreated)}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleDeleteBlandare(item.name)}
                    className="bg-red-500 text-white text-sm px-4 py-2 rounded hover:bg-red-600 transition duration-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Success/Error messages for manage operations */}
        {manageError && <p className="text-red-500 text-sm mt-4">{manageError}</p>}
        {manageSuccess && <p className="text-green-500 text-sm mt-4">{manageSuccess}</p>}
      </div>
    </div>
  );
};

