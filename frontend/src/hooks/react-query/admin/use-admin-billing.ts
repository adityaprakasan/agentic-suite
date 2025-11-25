import { backendApi } from '@/lib/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface CreditAdjustmentRequest {
  account_id: string;
  amount: number;
  reason: string;
  is_expiring: boolean;
  notify_user: boolean;
}

interface RefundRequest {
  account_id: string;
  amount: number;
  reason: string;
  is_expiring: boolean;
  stripe_refund: boolean;
  payment_intent_id?: string;
}

// New interfaces for plan management
interface SetPlanRequest {
  account_id: string;
  tier: 'tier_basic' | 'tier_plus' | 'tier_ultra';
  reason: string;
  grant_credits?: boolean;
  credit_type?: 'expiring' | 'non_expiring';
  billing_period_days?: number;
}

interface SetPlanResponse {
  success: boolean;
  message: string;
  account_id: string;
  previous_tier: string;
  new_tier: string;
  credits_granted: number;
  credit_type: string | null;
  current_balance: number;
  billing_cycle_anchor: string;
  next_credit_grant: string;
  is_upgrade: boolean;
  is_downgrade: boolean;
}

interface LinkSubscriptionRequest {
  account_id: string;
  stripe_subscription_id: string;
  stripe_customer_id?: string;
  reason: string;
}

interface LinkSubscriptionResponse {
  success: boolean;
  message: string;
  account_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string | null;
  previous_tier: string;
  subscription_tier: string;
  credits_granted: number;
  current_balance: number;
  billing_cycle_anchor: string;
  next_credit_grant: string;
  is_upgrade: boolean;
  is_same_tier: boolean;
}

interface CreateCheckoutLinkRequest {
  account_id: string;
  tier: 'tier_basic' | 'tier_plus' | 'tier_ultra';
  payer_email?: string;
  return_url: string;
}

interface CreateCheckoutLinkResponse {
  success: boolean;
  checkout_url: string;
  checkout_session_id: string;
  account_id: string;
  tier: string;
  tier_display_name: string;
  monthly_credits: number;
  payer_email: string | null;
  expires_at: string | null;
}

interface TierInfo {
  name: string;
  display_name: string;
  monthly_credits: number;
  project_limit: number;
  can_purchase_credits: boolean;
}

export function useUserBillingSummary(userId: string | null) {
  return useQuery({
    queryKey: ['admin', 'billing', 'user', userId],
    queryFn: async () => {
      if (!userId) return null;
      const response = await backendApi.get(`/admin/billing/user/${userId}/summary`);
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data;
    },
    enabled: !!userId,
  });
}

interface TransactionParams {
  userId: string;
  page?: number;
  page_size?: number;
  type_filter?: string;
}

export function useAdminUserTransactions(params: TransactionParams) {
  return useQuery({
    queryKey: ['admin', 'billing', 'transactions', params.userId, params.page, params.page_size, params.type_filter],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.page_size) searchParams.append('page_size', params.page_size.toString());
      if (params.type_filter) searchParams.append('type_filter', params.type_filter);
      
      const response = await backendApi.get(`/admin/billing/user/${params.userId}/transactions?${searchParams.toString()}`);
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data;
    },
    enabled: !!params.userId,
    staleTime: 30000,
  });
}

export function useAdjustCredits() {
  return useMutation({
    mutationFn: async (request: CreditAdjustmentRequest) => {
      const response = await backendApi.post('/admin/billing/credits/adjust', request);
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data;
    },
  });
}

export function useProcessRefund() {
  return useMutation({
    mutationFn: async (request: RefundRequest) => {
      const response = await backendApi.post('/admin/billing/refund', request);
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data;
    },
  });
}

// ============================================================================
// PLAN MANAGEMENT HOOKS
// ============================================================================

/**
 * Fetch available tiers for admin plan management
 */
export function useAvailableTiers() {
  return useQuery({
    queryKey: ['admin', 'billing', 'tiers'],
    queryFn: async () => {
      const response = await backendApi.get('/admin/billing/tiers');
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data as { tiers: TierInfo[] };
    },
    staleTime: 60000, // Tiers don't change often
  });
}

/**
 * Set a user's subscription plan manually
 * 
 * Handles:
 * - Fresh onboarding (none → paid tier)
 * - Upgrades (lower → higher tier)
 * - Downgrades (higher → lower tier, no credits)
 * 
 * Safeguards:
 * - Same tier rejection
 * - 24-hour cooldown
 * - Downgrade = no credits
 */
export function useSetUserPlan() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (request: SetPlanRequest): Promise<SetPlanResponse> => {
      const response = await backendApi.post('/admin/billing/set-plan', request);
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate user-related queries
      queryClient.invalidateQueries({ queryKey: ['admin', 'billing', 'user', variables.account_id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'billing', 'transactions', variables.account_id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

/**
 * Link an existing Stripe subscription to a user account
 * 
 * Use when:
 * - Third party paid via generic payment link
 * - Subscription created outside normal flow
 * 
 * Safeguards:
 * - Verifies subscription in Stripe
 * - Same tier = no credits
 * - Higher tier = upgrade with credits
 */
export function useLinkSubscription() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (request: LinkSubscriptionRequest): Promise<LinkSubscriptionResponse> => {
      const response = await backendApi.post('/admin/billing/link-subscription', request);
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate user-related queries
      queryClient.invalidateQueries({ queryKey: ['admin', 'billing', 'user', variables.account_id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'billing', 'transactions', variables.account_id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

/**
 * Create a Stripe checkout link for third-party payment
 * 
 * The link includes account_id in metadata so webhooks auto-link
 * the subscription when payment completes.
 */
export function useCreateCheckoutLink() {
  return useMutation({
    mutationFn: async (request: CreateCheckoutLinkRequest): Promise<CreateCheckoutLinkResponse> => {
      const response = await backendApi.post('/admin/billing/create-checkout-link', request);
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data;
    },
  });
}
