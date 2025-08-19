"use client"
import React, { useState, useEffect } from 'react';
import { useAuth } from '../useAuth';

interface BlandareItem {
  name: string;
  displayName?: string;
  images: string[];
  timeCreated: string;
}

interface ManageBlandareProps {
  refreshTrigger?: number;
}

export default function ManageBlandare({ refreshTrigger }: ManageBlandareProps) {
  const { user } = useAuth();
  const [blandare, setBlandare] = useState<BlandareItem[]>([]);
  const [loadingBlandare, setLoadingBlandare] = useState(false);
  const [manageError, setManageError] = useState<string | null>(null);
  const [manageSuccess, setManageSuccess] = useState<string | null>(null);

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
        setBlandare(data.blandare || []);
      }
    } catch (error) {
      console.error('Error fetching bländare:', error);
    } finally {
      setLoadingBlandare(false);
    }
  };

  // Load bländare on component mount and when refreshTrigger changes
  useEffect(() => {
    if (user) {
      fetchBlandare();
    }
  }, [user, refreshTrigger]);

  // Delete bländare
  const handleDeleteBlandare = async (folderName: string) => {
    if (!confirm(`Are you sure you want to delete "Bländaren ${folderName}"? This action cannot be undone.`)) return;
    if (!user) return;

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
  );
}
