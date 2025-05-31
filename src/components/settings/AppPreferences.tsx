"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAppPreferences, useUpdatePreferences } from "@/hooks/useSettings";
import { useTheme } from "next-themes";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/contexts/UserContext";

const preferencesSchema = z.object({
  id: z.string().optional(),
  user_id: z.string().optional(),
  currency: z.enum(['USD', 'EUR', 'GBP']),
  date_format: z.enum(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']),
  timezone: z.string(),
  language: z.enum(['en', 'es', 'fr', 'de']),
  theme: z.enum(['light', 'dark', 'system']),
  default_country: z.string(),
  default_rent_status: z.enum(['active', 'inactive']),
  default_lease_term: z.number().min(1).max(60),
  default_currency_symbol: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

type PreferencesFormData = z.infer<typeof preferencesSchema>;

const currencies = [
  { value: 'USD', label: 'US Dollar ($)', symbol: '$' },
  { value: 'EUR', label: 'Euro (€)', symbol: '€' },
  { value: 'GBP', label: 'British Pound (£)', symbol: '£' },
];

const dateFormats = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (US Format)' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (European Format)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO Format)' },
];

const languages = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
];

const countries = [
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'ES', label: 'Spain' },
  { value: 'IT', label: 'Italy' },
  { value: 'AU', label: 'Australia' },
];

const leaseTerms = [
  { value: 6, label: '6 months' },
  { value: 12, label: '12 months' },
  { value: 18, label: '18 months' },
  { value: 24, label: '24 months' },
];

export function AppPreferences() {
  const { data: preferences, isLoading } = useAppPreferences();
  const updatePreferences = useUpdatePreferences();
  const { theme, setTheme } = useTheme();
  const { user } = useUser();

  // Default values to prevent undefined form state
  const defaultValues: PreferencesFormData = {
    currency: 'USD',
    date_format: 'MM/DD/YYYY',
    timezone: 'America/New_York',
    language: 'en',
    theme: 'system',
    default_country: 'US',
    default_rent_status: 'active',
    default_lease_term: 12,
    default_currency_symbol: '$',
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
    reset,
    trigger,
  } = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues,
    mode: 'onChange',
  });

  // Update form when preferences load
  React.useEffect(() => {
    if (preferences) {
      console.log('Loading preferences into form:', preferences);
      // Ensure theme has a valid value
      const safePreferences = {
        ...preferences,
        theme: preferences.theme || 'system'
      };
      console.log('Safe preferences with theme:', safePreferences);

      // Reset the form with the loaded preferences
      reset(safePreferences);

      // Force update all select values to ensure they display correctly
      setValue('currency', safePreferences.currency);
      setValue('date_format', safePreferences.date_format);
      setValue('language', safePreferences.language);
      setValue('theme', safePreferences.theme);
      setValue('default_country', safePreferences.default_country);
      setValue('default_rent_status', safePreferences.default_rent_status);
      setValue('default_lease_term', safePreferences.default_lease_term);
      setValue('default_currency_symbol', safePreferences.default_currency_symbol);

      console.log('✅ Form values set to:', {
        currency: safePreferences.currency,
        date_format: safePreferences.date_format,
        language: safePreferences.language,
        theme: safePreferences.theme
      });
    }
  }, [preferences, reset, setValue]);

  const onSubmit = async (data: PreferencesFormData) => {
    console.log('🚀 onSubmit function called!');
    console.log('🔄 Submitting preferences:', data);
    console.log('🔄 User:', user);
    console.log('🔄 updatePreferences mutation:', updatePreferences);

    try {
      // Only send the fields we want to update (exclude database metadata)
      const updateData = {
        currency: data.currency,
        date_format: data.date_format,
        timezone: data.timezone,
        language: data.language,
        theme: data.theme || 'system', // Ensure theme is never empty
        default_country: data.default_country,
        default_rent_status: data.default_rent_status,
        default_lease_term: data.default_lease_term,
        default_currency_symbol: data.default_currency_symbol,
      };

      console.log('🔧 Fixed theme value:', updateData.theme);

      console.log('✅ Submitting data:', updateData);

      // Use the mutation directly (it handles success/error toasts)
      updatePreferences.mutate(updateData, {
        onSuccess: (result) => {
          console.log('✅ Preferences saved successfully:', result);

          // Apply theme change immediately
          if (updateData.theme !== theme) {
            console.log('🎨 Applying theme change:', updateData.theme);
            setTheme(updateData.theme);
          }

          // Reset form dirty state with the saved data
          const safeResult = {
            ...result,
            theme: result.theme || 'system'
          };
          console.log('🔄 Resetting form with safe result:', safeResult);
          reset(safeResult);

          // Show success message
          alert('✅ Preferences saved successfully!');

          // Force a page refresh to ensure everything updates
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        },
        onError: (error: any) => {
          console.error('❌ Error saving preferences:', error);
          alert(`❌ Error saving preferences: ${error?.message || 'Unknown error'}`);
        }
      });

    } catch (error: any) {
      console.error("❌ Form submission error:", error);
      alert(`❌ Error: ${error?.message || 'Unknown error'}`);
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
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Regional Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Regional Settings</CardTitle>
            <CardDescription>
              Configure your regional preferences for currency, date format, and language.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select
                  value={watch('currency') || ''}
                  onValueChange={(value) => {
                    console.log('🔄 Currency changed to:', value);
                    setValue('currency', value as any, { shouldDirty: true });
                    // Automatically set the currency symbol when currency changes
                    const selectedCurrency = currencies.find(c => c.value === value);
                    if (selectedCurrency) {
                      setValue('default_currency_symbol', selectedCurrency.symbol, { shouldDirty: true });
                    }
                    trigger('currency');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem key={currency.value} value={currency.value}>
                        {currency.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Date Format</Label>
                <Select
                  value={watch('date_format') || ''}
                  onValueChange={(value) => {
                    console.log('🔄 Date format changed to:', value);
                    setValue('date_format', value as any, { shouldDirty: true });
                    trigger('date_format');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select date format" />
                  </SelectTrigger>
                  <SelectContent>
                    {dateFormats.map((format) => (
                      <SelectItem key={format.value} value={format.value}>
                        {format.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Language</Label>
                <Select
                  value={watch('language') || ''}
                  onValueChange={(value) => {
                    console.log('🔄 Language changed to:', value);
                    setValue('language', value as any, { shouldDirty: true });
                    trigger('language');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((language) => (
                      <SelectItem key={language.value} value={language.value}>
                        {language.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Default Country</Label>
                <Select
                  value={watch('default_country') || ''}
                  onValueChange={(value) => {
                    console.log('🔄 Default country changed to:', value);
                    setValue('default_country', value, { shouldDirty: true });
                    trigger('default_country');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.value} value={country.value}>
                        {country.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Customize the look and feel of the application.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Theme</Label>
              <Select
                value={watch('theme') || ''}
                onValueChange={(value) => {
                  console.log('🔄 Theme changed to:', value);
                  setValue('theme', value as any, { shouldDirty: true });
                  trigger('theme');
                }}
              >
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    <div className="flex items-center gap-2">
                      <i className="ri-sun-line" />
                      Light
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center gap-2">
                      <i className="ri-moon-line" />
                      Dark
                    </div>
                  </SelectItem>
                  <SelectItem value="system">
                    <div className="flex items-center gap-2">
                      <i className="ri-computer-line" />
                      System
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Default Values */}
        <Card>
          <CardHeader>
            <CardTitle>Default Values</CardTitle>
            <CardDescription>
              Set default values for new properties and leases to speed up data entry.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Default Rent Status</Label>
                <Select
                  value={watch('default_rent_status') || ''}
                  onValueChange={(value) => {
                    console.log('🔄 Default rent status changed to:', value);
                    setValue('default_rent_status', value as any, { shouldDirty: true });
                    trigger('default_rent_status');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Default Lease Term</Label>
                <Select
                  value={watch('default_lease_term')?.toString() || ''}
                  onValueChange={(value) => {
                    console.log('🔄 Default lease term changed to:', value);
                    setValue('default_lease_term', parseInt(value), { shouldDirty: true });
                    trigger('default_lease_term');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent>
                    {leaseTerms.map((term) => (
                      <SelectItem key={term.value} value={term.value.toString()}>
                        {term.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          {isDirty && (
            <Button
              type="button"
              variant="outline"
              onClick={() => reset()}
            >
              <i className="ri-refresh-line mr-2" />
              Reset
            </Button>
          )}
          <Button
            type="button"
            disabled={!isDirty || updatePreferences.isPending}
            className="min-w-[140px]"
            onClick={async (e) => {
              console.log('🔘 Save button clicked!');
              console.log('🔘 isDirty:', isDirty);
              console.log('🔘 isPending:', updatePreferences.isPending);
              console.log('🔘 Form values:', watch());
              console.log('🔘 Form errors:', errors);

              // Manually trigger form submission
              e.preventDefault();
              const formData = watch();
              console.log('🔘 Manually calling onSubmit with:', formData);
              await onSubmit(formData);
            }}
          >
            {updatePreferences.isPending ? (
              <>
                <i className="ri-loader-line animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <i className="ri-save-line mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>

        {/* Debug info - remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded text-xs space-y-2">
            <p><strong>Form State:</strong></p>
            <p>isDirty: {isDirty.toString()}</p>
            <p>isPending: {updatePreferences.isPending.toString()}</p>
            <p><strong>Loaded Preferences:</strong> {JSON.stringify(preferences, null, 2)}</p>
            <p><strong>Current Form Values:</strong> {JSON.stringify(watch(), null, 2)}</p>
            <p><strong>Individual Values:</strong></p>
            <p>Currency: {watch('currency')} | Date: {watch('date_format')} | Language: {watch('language')} | Theme: {watch('theme')}</p>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={async () => {
                  console.log('🔍 Running preferences debug test...');
                  try {
                    // Test direct database access
                    const { data: currentPrefs, error } = await supabase
                      .from('user_preferences')
                      .select('*')
                      .eq('user_id', user?.id);

                    console.log('Current preferences from DB:', currentPrefs);
                    if (error) console.error('DB Error:', error);

                    // Test the RPC function
                    const { data: rpcPrefs, error: rpcError } = await supabase
                      .rpc('get_user_preferences', { p_user_id: user?.id });

                    console.log('RPC function result:', rpcPrefs);
                    if (rpcError) console.error('RPC Error:', rpcError);

                  } catch (err) {
                    console.error('Debug test error:', err);
                  }
                }}
                className="text-xs"
              >
                🔍 Debug Test
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={async () => {
                  console.log('🛠️ Creating default preferences...');
                  try {
                    const { data, error } = await supabase
                      .from('user_preferences')
                      .upsert({
                        user_id: user?.id,
                        currency: 'USD',
                        date_format: 'MM/DD/YYYY',
                        timezone: 'America/New_York',
                        language: 'en',
                        theme: 'system',
                        default_country: 'US',
                        default_rent_status: 'active',
                        default_lease_term: 12,
                        default_currency_symbol: '$'
                      })
                      .select();

                    if (error) {
                      console.error('❌ Error creating preferences:', error);
                      alert(`Error: ${error.message}`);
                    } else {
                      console.log('✅ Created preferences:', data);
                      alert('✅ Default preferences created! Try saving again.');
                      window.location.reload();
                    }
                  } catch (err) {
                    console.error('Exception:', err);
                    alert(`Exception: ${err}`);
                  }
                }}
                className="text-xs"
              >
                🛠️ Create Defaults
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  window.open('/test-preferences', '_blank');
                }}
                className="text-xs"
              >
                🔧 Full Diagnostics
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={async () => {
                  console.log('🧪 Testing simple save...');
                  try {
                    console.log('🧪 Current form values:', watch());
                    console.log('🧪 User:', user);
                    console.log('🧪 updatePreferences hook:', updatePreferences);

                    // Test with minimal data
                    const testData = { currency: 'GBP', default_currency_symbol: '£' };
                    console.log('🧪 Test data:', testData);

                    const result = await updatePreferences.mutateAsync(testData);
                    console.log('🧪 Test result:', result);
                    alert('✅ Test successful! Check console for details.');
                  } catch (error: any) {
                    console.error('🧪 Test failed:', error);
                    alert(`❌ Test failed: ${error?.message || 'Unknown error'}`);
                  }
                }}
                className="text-xs"
              >
                🧪 Test Save
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
