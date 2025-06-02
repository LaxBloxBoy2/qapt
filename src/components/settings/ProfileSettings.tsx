"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@/contexts/UserContext";
import { useUpdateProfile, useUserProfile } from "@/hooks/useSettings";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

const profileSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
  company: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function ProfileSettings() {
  const { user, profile, refreshProfile } = useUser();
  const { data: profileData, isLoading: profileLoading, error: profileError } = useUserProfile();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Use profileData from hook if available, fallback to context profile
  const currentProfile = profileData || profile;

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: currentProfile?.full_name || "",
      phone: currentProfile?.phone || "",
      company: currentProfile?.company || "",
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfile.mutateAsync(data);
      reset(data);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 2MB.",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPG, PNG, GIF).",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to image_url bucket (which exists and is configured)
      const { error: uploadError } = await supabase.storage
        .from('image_url')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw new Error(uploadError.message);
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('image_url')
        .getPublicUrl(filePath);

      // Update the profile with the new avatar URL
      await updateProfile.mutateAsync({ avatar_url: publicUrl });

      // Refresh the UserContext to update all components
      await refreshProfile();

      toast({
        title: "Avatar updated",
        description: "Your profile photo has been updated successfully.",
      });
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Upload failed",
        description: error?.message || "Failed to upload avatar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.slice(0, 2).toUpperCase() || "U";
  };

  return (
    <div className="space-y-6">
      {/* Profile Photo */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Photo</CardTitle>
          <CardDescription>
            Update your profile photo. This will be visible to team members.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile?.avatar_url} alt={profile?.full_name} />
              <AvatarFallback className="text-lg">{getInitials()}</AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <Label htmlFor="avatar-upload" className="cursor-pointer">
                <Button variant="outline" disabled={isUploadingAvatar} asChild>
                  <span>
                    {isUploadingAvatar ? (
                      <>
                        <i className="ri-loader-line animate-spin mr-2" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <i className="ri-upload-line mr-2" />
                        Upload Photo
                      </>
                    )}
                  </span>
                </Button>
              </Label>
              <Input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={isUploadingAvatar}
              />
              <p className="text-xs text-muted-foreground">
                JPG, PNG or GIF. Max size 2MB.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Update your personal details and contact information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  {...register("full_name")}
                  placeholder="Enter your full name"
                />
                {errors.full_name && (
                  <p className="text-sm text-destructive">{errors.full_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  placeholder="Email from authentication"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed here. Contact support if needed.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  {...register("phone")}
                  placeholder="Enter your phone number"
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  {...register("company")}
                  placeholder="Enter your company name"
                />
                {errors.company && (
                  <p className="text-sm text-destructive">{errors.company.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={!isDirty || updateProfile.isPending}
              >
                {updateProfile.isPending ? (
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
          </form>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>
            Change your password to keep your account secure.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline">
            <i className="ri-lock-line mr-2" />
            Change Password
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            You'll receive an email with instructions to reset your password.
          </p>
        </CardContent>
      </Card>

      {/* Debug info - remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <Card>
          <CardHeader>
            <CardTitle>🔍 Profile Debug Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-xs space-y-2">
              <p><strong>Profile Loading:</strong> {profileLoading.toString()}</p>
              <p><strong>Profile Error:</strong> {profileError?.message || 'None'}</p>
              <p><strong>User ID:</strong> {user?.id}</p>
              <p><strong>User Email:</strong> {user?.email}</p>
              <p><strong>Context Profile:</strong> {JSON.stringify(profile, null, 2)}</p>
              <p><strong>Hook Profile:</strong> {JSON.stringify(profileData, null, 2)}</p>
              <p><strong>Current Profile:</strong> {JSON.stringify(currentProfile, null, 2)}</p>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={async () => {
                  console.log('🧪 Testing profile creation...');
                  try {
                    const { data, error } = await supabase
                      .from('user_profiles')
                      .upsert({
                        id: user?.id,
                        full_name: user?.email || 'Test User',
                        role: 'admin'
                      })
                      .select();

                    if (error) {
                      console.error('❌ Error creating profile:', error);
                      alert(`Error: ${error.message}`);
                    } else {
                      console.log('✅ Created profile:', data);
                      alert('✅ Profile created! Try updating again.');
                      window.location.reload();
                    }
                  } catch (err) {
                    console.error('Exception:', err);
                    alert(`Exception: ${err}`);
                  }
                }}
                className="text-xs"
              >
                🛠️ Create Profile
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={async () => {
                  console.log('🧪 Testing profile update...');
                  try {
                    const testData = { full_name: 'Test Update', company: 'Test Company' };
                    const result = await updateProfile.mutateAsync(testData);
                    console.log('🧪 Update result:', result);
                    alert('✅ Test update successful!');
                  } catch (error: any) {
                    console.error('🧪 Test failed:', error);
                    alert(`❌ Test failed: ${error?.message || 'Unknown error'}`);
                  }
                }}
                className="text-xs"
              >
                🧪 Test Update
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
