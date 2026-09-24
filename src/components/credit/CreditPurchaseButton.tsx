import { useState } from 'react';
import { supabase } from '../../utils/supabase';
import { Button } from '../ui/button';

interface CreditPurchaseButtonProps {
  productId: string;
  productName: string;
  creditsAmount: number;
  priceUsd: number;
  className?: string;
}

export function CreditPurchaseButton({
  productId,
  productName,
  creditsAmount,
  priceUsd,
  className = '',
}: CreditPurchaseButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePurchase = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke(
        'create-credit-checkout',
        {
          body: { product_id: productId },
        }
      );

      if (functionError) {
        throw functionError;
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err: any) {
      console.error('Credit purchase error:', err);
      setError(err.message || 'Failed to start checkout');
      setLoading(false);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <Button
        onClick={handlePurchase}
        disabled={loading}
        className="w-full"
        variant="default"
      >
        {loading ? 'Redirecting...' : `Buy ${creditsAmount.toLocaleString()} Credits — $${(priceUsd / 100).toFixed(2)}`}
      </Button>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
}
