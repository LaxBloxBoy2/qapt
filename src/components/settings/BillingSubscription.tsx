"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useUserSubscription } from "@/hooks/useSettings";

const plans = [
  {
    id: 'free',
    name: 'Free Plan',
    price: 0,
    currency: 'USD',
    interval: 'month',
    description: 'Perfect for getting started',
    features: {
      max_properties: 5,
      max_units: 25,
      max_tenants: 50,
      storage_gb: 1,
      team_members: 1,
      advanced_reports: false,
      api_access: false,
      priority_support: false,
    },
  },
  {
    id: 'pro',
    name: 'Pro Plan',
    price: 29,
    currency: 'USD',
    interval: 'month',
    description: 'For growing property portfolios',
    features: {
      max_properties: 25,
      max_units: 100,
      max_tenants: 200,
      storage_gb: 10,
      team_members: 5,
      advanced_reports: true,
      api_access: false,
      priority_support: true,
    },
  },
  {
    id: 'premium',
    name: 'Premium Plan',
    price: 79,
    currency: 'USD',
    interval: 'month',
    description: 'For large property management companies',
    features: {
      max_properties: 100,
      max_units: 500,
      max_tenants: 1000,
      storage_gb: 50,
      team_members: 20,
      advanced_reports: true,
      api_access: true,
      priority_support: true,
    },
  },
];

export function BillingSubscription() {
  const { data: subscription, isLoading } = useUserSubscription();

  const handleUpgrade = (planId: string) => {
    // TODO: Implement subscription upgrade
    console.log(`Upgrade to plan: ${planId}`);
  };

  const handleCancelSubscription = () => {
    // TODO: Implement subscription cancellation
    console.log('Cancel subscription');
  };

  const handleUpdatePayment = () => {
    // TODO: Implement payment method update
    console.log('Update payment method');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'trialing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'past_due': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'canceled': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!subscription) return null;

  const currentPlan = subscription.plan;
  const usageData = {
    properties: 3, // Mock data - would come from actual usage
    units: 12,
    tenants: 25,
    storage: 0.3,
  };

  return (
    <div className="space-y-6">
      {/* Current Subscription */}
      <Card>
        <CardHeader>
          <CardTitle>Current Subscription</CardTitle>
          <CardDescription>
            Manage your subscription and billing information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold">{currentPlan.name}</h3>
                <Badge className={getStatusColor(subscription.status)}>
                  {subscription.status}
                </Badge>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                {currentPlan.price === 0 ? 'Free' : `$${currentPlan.price}/${currentPlan.interval}`}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                {subscription.status === 'trialing' && subscription.trial_end
                  ? `Trial ends ${new Date(subscription.trial_end).toLocaleDateString()}`
                  : `Next billing: ${new Date(subscription.current_period_end).toLocaleDateString()}`}
              </p>
            </div>
            <div className="flex gap-2">
              {currentPlan.id !== 'premium' && (
                <Button onClick={() => handleUpgrade('premium')}>
                  <i className="ri-arrow-up-line mr-2" />
                  Upgrade
                </Button>
              )}
              {currentPlan.id !== 'free' && (
                <Button variant="outline" onClick={handleCancelSubscription}>
                  Cancel
                </Button>
              )}
            </div>
          </div>

          {subscription.cancel_at_period_end && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-center gap-2">
                <i className="ri-warning-line text-yellow-600 dark:text-yellow-400" />
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Your subscription will be canceled at the end of the current billing period.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Overview</CardTitle>
          <CardDescription>
            Track your current usage against plan limits.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Properties</span>
                <span>{usageData.properties} / {currentPlan.features.max_properties}</span>
              </div>
              <Progress 
                value={(usageData.properties / currentPlan.features.max_properties) * 100} 
                className="h-2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Units</span>
                <span>{usageData.units} / {currentPlan.features.max_units}</span>
              </div>
              <Progress 
                value={(usageData.units / currentPlan.features.max_units) * 100} 
                className="h-2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Tenants</span>
                <span>{usageData.tenants} / {currentPlan.features.max_tenants}</span>
              </div>
              <Progress 
                value={(usageData.tenants / currentPlan.features.max_tenants) * 100} 
                className="h-2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Storage</span>
                <span>{usageData.storage} GB / {currentPlan.features.storage_gb} GB</span>
              </div>
              <Progress 
                value={(usageData.storage / currentPlan.features.storage_gb) * 100} 
                className="h-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <Card>
        <CardHeader>
          <CardTitle>Available Plans</CardTitle>
          <CardDescription>
            Choose the plan that best fits your needs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`p-6 border rounded-lg ${
                  plan.id === currentPlan.id
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  <div className="text-2xl font-bold mt-2">
                    {plan.price === 0 ? 'Free' : `$${plan.price}`}
                    {plan.price > 0 && <span className="text-sm font-normal">/{plan.interval}</span>}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {plan.description}
                  </p>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span>Properties</span>
                    <span>{plan.features.max_properties}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Units</span>
                    <span>{plan.features.max_units}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tenants</span>
                    <span>{plan.features.max_tenants}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Storage</span>
                    <span>{plan.features.storage_gb} GB</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Team Members</span>
                    <span>{plan.features.team_members}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Advanced Reports</span>
                    <span>{plan.features.advanced_reports ? '✓' : '✗'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>API Access</span>
                    <span>{plan.features.api_access ? '✓' : '✗'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Priority Support</span>
                    <span>{plan.features.priority_support ? '✓' : '✗'}</span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  variant={plan.id === currentPlan.id ? "outline" : "default"}
                  disabled={plan.id === currentPlan.id}
                  onClick={() => handleUpgrade(plan.id)}
                >
                  {plan.id === currentPlan.id ? 'Current Plan' : 'Select Plan'}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
          <CardDescription>
            Manage your payment information and billing details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                <i className="ri-bank-card-line text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="font-medium">•••• •••• •••• 4242</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Expires 12/25</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleUpdatePayment}>
              <i className="ri-edit-line mr-2" />
              Update
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>
            View and download your past invoices.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <i className="ri-file-list-line text-4xl text-gray-400 dark:text-gray-600 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              No billing history available yet.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
