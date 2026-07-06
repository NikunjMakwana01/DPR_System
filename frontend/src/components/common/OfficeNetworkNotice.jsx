import { WifiOff } from 'lucide-react';

export default function OfficeNetworkNotice() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 rounded-full bg-amber-100 p-4 dark:bg-amber-900/30">
        <WifiOff className="h-10 w-10 text-amber-600 dark:text-amber-400" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
        Office Network Required
      </h2>
      <p className="mt-3 max-w-md text-gray-600 dark:text-gray-400">
        This application can only be accessed from the office network.
      </p>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
        Please connect to the office WiFi to use attendance, DPR, and other features.
      </p>
    </div>
  );
}
