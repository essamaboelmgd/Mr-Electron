import api from './api';

export interface Subscription {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  } | null;
  courseId: {
    _id: string;
    title: string;
    price: number;
    educationalLevel: {
      nameAr: string;
    };
  } | null;
  status: 'active' | 'pending' | 'rejected';
  paymentMethod: 'center' | 'vodafone' | 'code';
  vodafoneReceipt: string;
  subscribedAt: string;
  createdAt: string;
  updatedAt: string;
}

// Get all subscriptions with optional status filter
export const getSubscriptions = async (status?: string): Promise<Subscription[]> => {
  try {
    const params = status && status !== 'all' ? { status } : {};
    const response = await api.get('/subscriptions/admin/all', { params });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    throw error;
  }
};

// Update subscription status
export const updateSubscriptionStatus = async (
  subscriptionId: string,
  status: 'active' | 'rejected'
): Promise<Subscription> => {
  try {
    const response = await api.put(`/admin/subscriptions/${subscriptionId}/status`, { status });
    return response.data.data.subscription;
  } catch (error) {
    console.error('Error updating subscription status:', error);
    throw error;
  }
};