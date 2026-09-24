import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase';
import { CreditPurchaseButton } from '../components/credit/CreditPurchaseButton';
import { CreditBalanceDisplay } from '../components/credit/CreditBalanceDisplay';
import { Coins, History, Zap } from 'lucide-react';

interface CreditTransaction {
  id: string;
  amount_credits: number;
  balance_after_credits: number;
  type: string;
  source: string | null;
  created_at: string;
  metadata: Record<string, any>;
}

interface CreditBalance {
  balance_credits: number;
  total_purchased_credits: number;
  total_spent_credits: number;
}

const CREDIT_PRODUCTS = [
  {
    id: 'starter',
    name: 'Starter',
    description: '500K AI credits - perfect for trying out the platform',
    creditsAmount: 500000,
    priceUsd: 500,
  },
  {
    id: 'pro',
    name: 'Pro',
    description: '2.5M AI credits - for regular users and small projects',
    creditsAmount: 2500000,
    priceUsd: 2000,
  },
  {
    id: 'business',
    name: 'Business',
    description: '8M AI credits - for power users and teams',
    creditsAmount: 8000000,
    priceUsd: 5000,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: '35M AI credits - for heavy usage and enterprises',
    creditsAmount: 35000000,
    priceUsd: 20000,
  },
];

const APP_ID = 'videoremixvip';

export function CreditsPage() {
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setLoading(false);
          return;
        }

        const [balanceResult, transactionsResult] = await Promise.all([
          supabase
            .from('credit_balances', { schema: 'credits' })
            .select('*')
            .eq('user_id', user.id)
            .eq('app_id', APP_ID)
            .maybeSingle(),
          supabase
            .from('credit_transactions', { schema: 'credits' })
            .select('*')
            .eq('user_id', user.id)
            .eq('app_id', APP_ID)
            .order('created_at', { ascending: false })
            .limit(50),
        ]);

        if (balanceResult.error) throw balanceResult.error;
        if (transactionsResult.error) throw transactionsResult.error;

        if (mounted) {
          setBalance(balanceResult.data);
          setTransactions(transactionsResult.data || []);
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Failed to load credits data:', err);
        if (mounted) {
          setError(err.message || 'Failed to load credits');
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading credits...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <CreditBalanceDisplay showWarning={false} />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">AI Credits</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Purchase credits to power your AI apps. Credits are deducted based on actual token usage.
          </p>
        </div>

        {/* Usage Estimates */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-12">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-blue-900">Usage Estimates</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-blue-800 font-medium">GPT-4o</p>
              <p className="text-blue-600">~100K tokens ≈ 500K credits</p>
            </div>
            <div>
              <p className="text-blue-800 font-medium">GPT-4o-mini</p>
              <p className="text-blue-600">~100K tokens ≈ 15K credits</p>
            </div>
            <div>
              <p className="text-blue-800 font-medium">DALL-E 3</p>
              <p className="text-blue-600">1 image ≈ 4K credits</p>
            </div>
          </div>
        </div>

        {/* Buy Credits Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Buy Credits</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {CREDIT_PRODUCTS.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{product.description}</p>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900">
                    {(product.creditsAmount / 1000).toLocaleString()}K
                  </span>
                  <span className="text-gray-600 ml-2">credits</span>
                </div>
                <div className="mb-4">
                  <span className="text-2xl font-bold text-blue-600">
                    ${(product.priceUsd / 100).toFixed(2)}
                  </span>
                </div>
                <CreditPurchaseButton
                  productId={product.id}
                  productName={product.name}
                  creditsAmount={product.creditsAmount}
                  priceUsd={product.priceUsd}
                />
              </div>
            ))}
          </div>
        </div>

        {/* How to Use Credits */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-12 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">How to Use Platform Credits</h2>
          <p className="text-gray-600 mb-4">
            Instead of bringing your own OpenAI API key, you can use platform credits to power your AI apps.
            Credits are automatically deducted based on your actual token usage.
          </p>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Buy credits using the options above</li>
            <li>Open any AI app in the platform</li>
            <li>Toggle "Use platform credits" in the app settings</li>
            <li>Start using the app - credits are deducted automatically</li>
          </ol>
        </div>

        {/* Transaction History */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <History className="h-6 w-6 text-gray-600" />
            <h2 className="text-2xl font-bold text-gray-900">Transaction History</h2>
          </div>
          {transactions.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center border border-gray-200">
              <Coins className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No transactions yet. Buy credits to get started!</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Balance After
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Source
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((tx) => (
                      <tr key={tx.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(tx.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                          {tx.type.replace('_', ' ')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={
                              tx.amount_credits > 0
                                ? 'text-green-600 font-medium'
                                : 'text-red-600 font-medium'
                            }
                          >
                            {tx.amount_credits > 0 ? '+' : ''}
                            {tx.amount_credits.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {tx.balance_after_credits.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {tx.source || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
