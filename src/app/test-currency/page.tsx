"use client";

import { useCurrencyFormatter } from '@/lib/currency';
import { useAppPreferences } from '@/hooks/useSettings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestCurrencyPage() {
  const { formatCurrency, formatCurrencyCompact, getCurrencySymbol, getCurrency } = useCurrencyFormatter();
  const { data: preferences } = useAppPreferences();

  const testAmounts = [1000, 1500.50, 2500, 10000, 50000];

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>🧪 Currency Formatter Test</CardTitle>
          <p className="text-sm text-gray-600">
            Testing currency formatting with user preferences
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Preferences */}
          <div>
            <h3 className="font-semibold mb-2">Current Preferences:</h3>
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
              <pre className="text-sm">
                {JSON.stringify(preferences, null, 2)}
              </pre>
            </div>
          </div>

          {/* Currency Info */}
          <div>
            <h3 className="font-semibold mb-2">Currency Info:</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                <p className="text-sm font-medium">Currency Code</p>
                <p className="text-lg">{getCurrency()}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded">
                <p className="text-sm font-medium">Currency Symbol</p>
                <p className="text-lg">{getCurrencySymbol()}</p>
              </div>
            </div>
          </div>

          {/* Test Amounts */}
          <div>
            <h3 className="font-semibold mb-2">Test Amounts:</h3>
            <div className="space-y-2">
              {testAmounts.map((amount) => (
                <div key={amount} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Raw: {amount}
                  </span>
                  <div className="flex gap-4">
                    <span className="font-medium">
                      Full: {formatCurrency(amount)}
                    </span>
                    <span className="font-medium">
                      Compact: {formatCurrencyCompact(amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
              🔍 How to Test:
            </h4>
            <ol className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
              <li>1. Go to Settings → App Preferences</li>
              <li>2. Change currency to GBP (British Pound)</li>
              <li>3. Click "Save Changes"</li>
              <li>4. Refresh this page</li>
              <li>5. Check if amounts show £ instead of $</li>
              <li>6. Go to Properties page to see if rent amounts use £</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
