import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase';
import { Coins, AlertTriangle } from 'lucide-react';

interface CreditBalance {
  user_id: string;
  balance_credits: number;
  total_purchased_credits: number;
  total_spent_credits: number;
}

export function CreditBalanceDisplay({ showWarning = true }: { showWarning?: boolean }) {
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchBalance = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setLoading(false);
          return;
        }

        const { data, error: balanceError } = await supabase
          .from('credit_balances')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (balanceError) {
          throw balanceError;
        }

        if (mounted) {
          setBalance(data);
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Failed to load credit balance:', err);
        if (mounted) {
          setError(err.message || 'Failed to load balance');
          setLoading(false);
        }
      }
    };

    fetchBalance();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Coins className="h-4 w-4" />
        <span>Loading credits...</span>
      </div>
    );
  }

  if (error || !balance) {
    return null;
  }

  const isLow = balance.balance_credits < 10000;

  return (
    <div className="flex items-center gap-2">
      <Coins className="h-4 w-4 text-yellow-500" />
      <span className="text-sm font-medium">
        {(balance.balance_credits / 1000).toFixed(1)}K credits
      </span>
      {showWarning && isLow && (
        <span className="flex items-center gap-1 text-xs text-amber-600">
          <AlertTriangle className="h-3 w-3" />
          Low balance
        </span>
      )}
    </div>
  );
}
