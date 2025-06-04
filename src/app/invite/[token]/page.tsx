"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/UserContext";

interface InvitationData {
  id: string;
  email: string;
  role: string;
  permissions: any;
  owner_name: string;
  status: string;
}

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user, signUp, signIn } = useUser();
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    password: '',
    confirmPassword: ''
  });

  const token = params?.token as string;

  useEffect(() => {
    if (token) {
      fetchInvitation();
    }
  }, [token]);

  const fetchInvitation = async () => {
    try {
      const response = await fetch(`/api/team/invitation/${token}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch invitation');
      }

      setInvitation(data.invitation);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Invalid or expired invitation",
        variant: "destructive",
      });
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!invitation) return;

    setAccepting(true);
    try {
      if (isNewUser) {
        // Create new account
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }

        const signUpResult = await signUp(
          invitation.email,
          formData.password,
          formData.fullName,
          'member'
        );

        if (signUpResult.error) {
          throw signUpResult.error;
        }

        toast({
          title: "Account Created",
          description: "Please check your email to verify your account, then return to accept the invitation.",
        });
      } else {
        // Accept invitation with existing account
        const response = await fetch(`/api/team/invitation/${token}/accept`, {
          method: 'POST',
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to accept invitation');
        }

        toast({
          title: "Invitation Accepted",
          description: "You have successfully joined the team!",
        });

        router.push('/dashboard');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to accept invitation",
        variant: "destructive",
      });
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <i className="ri-loader-line text-4xl text-gray-400 animate-spin mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <i className="ri-error-warning-line text-4xl text-red-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Invalid Invitation</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              This invitation link is invalid or has expired.
            </p>
            <Button onClick={() => router.push('/')}>
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-team-line text-2xl text-white" />
          </div>
          <CardTitle>Team Invitation</CardTitle>
          <CardDescription>
            You've been invited to join {invitation.owner_name}'s property management team
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Email:</p>
            <p className="font-medium">{invitation.email}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Role:</p>
            <p className="font-medium capitalize">{invitation.role}</p>
          </div>

          {user ? (
            // User is already logged in
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                You are logged in as {user.email}. Click below to accept the invitation.
              </p>
              <Button 
                onClick={handleAcceptInvitation} 
                disabled={accepting}
                className="w-full"
              >
                {accepting ? (
                  <>
                    <i className="ri-loader-line mr-2 animate-spin" />
                    Accepting...
                  </>
                ) : (
                  <>
                    <i className="ri-check-line mr-2" />
                    Accept Invitation
                  </>
                )}
              </Button>
            </div>
          ) : (
            // User needs to sign in or sign up
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button
                  variant={!isNewUser ? "default" : "outline"}
                  onClick={() => setIsNewUser(false)}
                  className="flex-1"
                >
                  Sign In
                </Button>
                <Button
                  variant={isNewUser ? "default" : "outline"}
                  onClick={() => setIsNewUser(true)}
                  className="flex-1"
                >
                  Create Account
                </Button>
              </div>

              {isNewUser && (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Create a password"
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="Confirm your password"
                    />
                  </div>
                </div>
              )}

              <Button 
                onClick={isNewUser ? handleAcceptInvitation : () => router.push('/auth/signin')}
                disabled={accepting || (isNewUser && (!formData.fullName || !formData.password))}
                className="w-full"
              >
                {accepting ? (
                  <>
                    <i className="ri-loader-line mr-2 animate-spin" />
                    {isNewUser ? 'Creating Account...' : 'Processing...'}
                  </>
                ) : (
                  <>
                    <i className={isNewUser ? "ri-user-add-line" : "ri-login-box-line"} className="mr-2" />
                    {isNewUser ? 'Create Account & Accept' : 'Sign In to Accept'}
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
