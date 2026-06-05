import React from "react";
import AdminBulkImport from "./AdminBulkImport";

export const AdminPersonalizerImport: React.FC = () => {
  return (
    <div className="space-y-6">
      <AdminBulkImport />

      <div className="bg-gray-800/70 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
          <span className="text-blue-400 mr-2">ℹ️</span>
          Import Instructions
        </h3>
        <ul className="text-sm text-gray-300 space-y-2 list-disc list-inside">
          <li>Upload the Personalizer purchase CSV file exported from Zaxxa</li>
          <li>
            The system will automatically create user accounts for new customers
          </li>
          <li>
            Purchases will be matched to product catalog and app access will be
            granted
          </li>
          <li>
            Monthly subscriptions will have expiration dates calculated
            automatically
          </li>
          <li>
            Refunded and pending transactions will be skipped or marked
            accordingly
          </li>
          <li>Users will be created with secure random passwords</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminPersonalizerImport;
