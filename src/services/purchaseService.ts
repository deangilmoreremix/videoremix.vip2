import { supabase } from '../utils/supabaseClient';

export interface UserAppAccess {
  id: string;
  user_id: string;
  app_slug: string;
  purchase_id?: string;
  access_type: 'subscription' | 'lifetime' | 'trial';
  granted_at: string;
  expires_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Purchase {
  id: string;
  user_id?: string;
  email: string;
  platform: string;
  platform_transaction_id: string;
  platform_customer_id?: string;
  product_id?: string;
  product_name: string;
  product_sku?: string;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'refunded' | 'failed';
  purchase_date: string;
  is_subscription?: boolean;
  created_at: string;
}

export interface PurchaseWithProduct extends Purchase {
  product?: ProductCatalog;
}

export interface ProductCatalog {
  id: string;
  name: string;
  slug: string;
  sku?: string;
  description: string;
  product_type: 'subscription' | 'one_time';
  apps_granted: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const purchaseService = {
  /**
   * Check if user has access to a specific app
   */
  async checkUserHasAccess(userId: string, appSlug: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_app_access')
        .select('*')
        .eq('user_id', userId)
        .eq('app_slug', appSlug)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error checking user access:', error);
        return false;
      }

      if (!data) {
        return false;
      }

      if (data.expires_at) {
        const expiresAt = new Date(data.expires_at);
        const now = new Date();
        return expiresAt > now;
      }

      return true;
    } catch (error) {
      console.error('Error in checkUserHasAccess:', error);
      return false;
    }
  },

  /**
   * Get all apps the user has purchased/access to
   */
  async getUserPurchasedApps(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('user_app_access')
        .select('app_slug')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching user purchased apps:', error);
        return [];
      }

      if (!data) {
        return [];
      }

      const appSlugs = data
        .filter(access => {
          if (access.expires_at) {
            const expiresAt = new Date(access.expires_at);
            const now = new Date();
            return expiresAt > now;
          }
          return true;
        })
        .map(access => access.app_slug);

      return appSlugs;
    } catch (error) {
      console.error('Error in getUserPurchasedApps:', error);
      return [];
    }
  },

  /**
   * Get full user app access details
   */
  async getUserAppAccessDetails(userId: string): Promise<UserAppAccess[]> {
    try {
      const { data, error } = await supabase
        .from('user_app_access')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('granted_at', { ascending: false });

      if (error) {
        console.error('Error fetching user app access details:', error);
        return [];
      }

      return (data as UserAppAccess[]) || [];
    } catch (error) {
      console.error('Error in getUserAppAccessDetails:', error);
      return [];
    }
  },

  /**
   * Get all user purchases
   */
  async getAllUserPurchases(userId: string): Promise<Purchase[]> {
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', userId)
        .order('purchase_date', { ascending: false });

      if (error) {
        console.error('Error fetching user purchases:', error);
        return [];
      }

      return (data as Purchase[]) || [];
    } catch (error) {
      console.error('Error in getAllUserPurchases:', error);
      return [];
    }
  },

  /**
   * Get purchase by email (for users who purchased before signing up)
   */
  async getPurchasesByEmail(email: string): Promise<Purchase[]> {
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .eq('email', email.toLowerCase())
        .order('purchase_date', { ascending: false });

      if (error) {
        console.error('Error fetching purchases by email:', error);
        return [];
      }

      return (data as Purchase[]) || [];
    } catch (error) {
      console.error('Error in getPurchasesByEmail:', error);
      return [];
    }
  },

  /**
   * Record a new purchase and grant app access
   */
  async recordPurchase(
    userId: string | null,
    email: string,
    platform: string,
    platformTransactionId: string,
    productName: string,
    amount: number,
    currency: string,
    appSlugs: string[],
    stripeData?: {
      paymentIntentId?: string;
      invoiceId?: string;
      customerId?: string;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const purchaseData: any = {
        user_id: userId,
        email: email.toLowerCase(),
        platform,
        platform_transaction_id: platformTransactionId,
        product_name: productName,
        amount,
        currency,
        status: 'completed',
        purchase_date: new Date().toISOString(),
      };

      if (stripeData) {
        purchaseData.stripe_payment_intent_id = stripeData.paymentIntentId;
        purchaseData.stripe_invoice_id = stripeData.invoiceId;
        purchaseData.stripe_customer_id = stripeData.customerId;
      }

      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .insert(purchaseData)
        .select()
        .single();

      if (purchaseError) {
        console.error('Error recording purchase:', purchaseError);
        return { success: false, error: purchaseError.message };
      }

      if (userId && appSlugs.length > 0) {
        const accessRecords = appSlugs.map(appSlug => ({
          user_id: userId,
          app_slug: appSlug,
          purchase_id: purchase.id,
          access_type: 'lifetime' as const,
          is_active: true,
        }));

        const { error: accessError } = await supabase
          .from('user_app_access')
          .insert(accessRecords);

        if (accessError) {
          console.error('Error granting app access:', accessError);
          return { success: false, error: accessError.message };
        }
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error in recordPurchase:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Grant app access to a user (for admin use or post-purchase processing)
   */
  async grantAppAccess(
    userId: string,
    appSlugs: string[],
    accessType: 'subscription' | 'lifetime' | 'trial' = 'lifetime',
    purchaseId?: string,
    expiresAt?: Date
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const accessRecords = appSlugs.map(appSlug => ({
        user_id: userId,
        app_slug: appSlug,
        purchase_id: purchaseId,
        access_type: accessType,
        expires_at: expiresAt?.toISOString(),
        is_active: true,
      }));

      const { error } = await supabase
        .from('user_app_access')
        .insert(accessRecords);

      if (error) {
        console.error('Error granting app access:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error in grantAppAccess:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Revoke app access from a user
   */
  async revokeAppAccess(
    userId: string,
    appSlug: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('user_app_access')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('app_slug', appSlug);

      if (error) {
        console.error('Error revoking app access:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error in revokeAppAccess:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get product catalog items
   */
  async getProductCatalog(): Promise<ProductCatalog[]> {
    try {
      const { data, error } = await supabase
        .from('products_catalog')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error fetching product catalog:', error);
        return [];
      }

      return (data as ProductCatalog[]) || [];
    } catch (error) {
      console.error('Error in getProductCatalog:', error);
      return [];
    }
  },

  /**
   * Get product by slug
   */
  async getProductBySlug(slug: string): Promise<ProductCatalog | null> {
    try {
      const { data, error } = await supabase
        .from('products_catalog')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error fetching product by slug:', error);
        return null;
      }

      return data as ProductCatalog | null;
    } catch (error) {
      console.error('Error in getProductBySlug:', error);
      return null;
    }
  },

  /**
   * Check if user has any active purchases
   */
  async hasAnyPurchases(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_app_access')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .limit(1);

      if (error) {
        console.error('Error checking for purchases:', error);
        return false;
      }

      return (data?.length || 0) > 0;
    } catch (error) {
      console.error('Error in hasAnyPurchases:', error);
      return false;
    }
  },

  /**
   * Get user purchases with product catalog details
   */
  async getUserPurchasesWithProducts(userId: string): Promise<PurchaseWithProduct[]> {
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          *,
          product:products_catalog(*)
        `)
        .eq('user_id', userId)
        .order('purchase_date', { ascending: false });

      if (error) {
        console.error('Error fetching user purchases with products:', error);
        return [];
      }

      return (data as PurchaseWithProduct[]) || [];
    } catch (error) {
      console.error('Error in getUserPurchasesWithProducts:', error);
      return [];
    }
  },
};

export default purchaseService;
