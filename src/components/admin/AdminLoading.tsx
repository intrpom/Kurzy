import React from 'react';

const AdminLoading: React.FC = () => {
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        <p className="mt-4 text-gray-600">Načítání...</p>
      </div>
    </div>
  );
};

export default AdminLoading;
