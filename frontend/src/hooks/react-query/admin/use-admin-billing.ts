import { backendApi } from '@/lib/api-client';
import { useMutation, useQuery } from '@tanstack/react-query';

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

interface SetTierRequest {
  account_id: string;
  tier_name: string;
  grant_credits: boolean;
  reason: string;
}

interface SetTierResponse {
  success: boolean;
  account_id: string;
  old_tier: string;
  new_tier: string;
  tier_display_name: string;
  credits_granted: number;
  new_balance: number;
  monthly_credits: number;
}

interface GenerateCustomerLinkRequest {
  account_id: string;
  price_id?: string;
  tier_name?: string;
  success_url?: string;
  cancel_url?: string;
}

interface GenerateCustomerLinkResponse {
  success: boolean;
  checkout_url: string;
  session_id: string;
  account_id: string;
  price_id: string;
}

interface LinkSubscriptionRequest {
  account_id: string;
  stripe_subscription_id: string;
  skip_credit_grant?: boolean;
}

interface LinkSubscriptionResponse {
  success: boolean;
  account_id: string;
  subscription_id: string;
  customer_id: string;
  tier: string;
  tier_display_name: string;
  status: string;
  credits_granted: number;
  new_balance: number;
  current_period_end: string;
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

export function useSetUserTier() {
  return useMutation<SetTierResponse, Error, SetTierRequest>({
    mutationFn: async (request: SetTierRequest) => {
      const response = await backendApi.post('/admin/billing/set-tier', request);
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data;
    },
  });
}

export function useGenerateCustomerLink() {
  return useMutation<GenerateCustomerLinkResponse, Error, GenerateCustomerLinkRequest>({
    mutationFn: async (request: GenerateCustomerLinkRequest) => {
      const response = await backendApi.post('/admin/billing/generate-customer-link', request);
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data;
    },
  });
}

export function useLinkSubscription() {
  return useMutation<LinkSubscriptionResponse, Error, LinkSubscriptionRequest>({
    mutationFn: async (request: LinkSubscriptionRequest) => {
      const response = await backendApi.post('/admin/billing/link-subscription', request);
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data;
    },
  });
}
