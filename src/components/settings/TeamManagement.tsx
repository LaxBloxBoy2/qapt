"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useTeamMembers, useInviteTeamMember } from "@/hooks/useSettings";

const permissions = [
  { key: 'properties', label: 'Properties', description: 'View and manage properties' },
  { key: 'tenants', label: 'Tenants', description: 'View and manage tenant information' },
  { key: 'leases', label: 'Leases', description: 'View and manage lease agreements' },
  { key: 'finances', label: 'Finances', description: 'View financial data and transactions' },
  { key: 'maintenance', label: 'Maintenance', description: 'Manage maintenance requests' },
  { key: 'reports', label: 'Reports', description: 'Generate and view reports' },
];

export function TeamManagement() {
  const { data: teamMembers = [], isLoading } = useTeamMembers();
  const inviteTeamMember = useInviteTeamMember();
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'member' as 'admin' | 'member',
    permissions: {
      properties: true,
      tenants: true,
      leases: true,
      finances: false,
      maintenance: true,
      reports: false,
    },
  });

  const handleInvite = async () => {
    if (!inviteForm.email.trim()) {
      return;
    }

    try {
      await inviteTeamMember.mutateAsync(inviteForm);

      // Reset form and close dialog on success
      setIsInviteDialogOpen(false);
      setInviteForm({
        email: '',
        role: 'member',
        permissions: {
          properties: true,
          tenants: true,
          leases: true,
          finances: false,
          maintenance: true,
          reports: false,
        },
      });
    } catch (error) {
      // Error is handled by the mutation hook
      console.error('Invitation failed:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'member': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Team Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Manage team access and permissions for your property management account.
              </CardDescription>
            </div>
            <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <i className="ri-user-add-line mr-2" />
                  Invite Member
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Invite Team Member</DialogTitle>
                  <DialogDescription>
                    Send an invitation to join your property management team.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter email address"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select
                      value={inviteForm.role}
                      onValueChange={(value) => setInviteForm({ ...inviteForm, role: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label>Permissions</Label>
                    <div className="space-y-2">
                      {permissions.map((permission) => (
                        <div key={permission.key} className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-sm font-medium">{permission.label}</Label>
                            <p className="text-xs text-muted-foreground">{permission.description}</p>
                          </div>
                          <Switch
                            checked={inviteForm.permissions[permission.key as keyof typeof inviteForm.permissions]}
                            onCheckedChange={(checked) =>
                              setInviteForm({
                                ...inviteForm,
                                permissions: {
                                  ...inviteForm.permissions,
                                  [permission.key]: checked,
                                },
                              })
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleInvite}
                      disabled={inviteTeamMember.isPending || !inviteForm.email.trim()}
                    >
                      {inviteTeamMember.isPending ? (
                        <>
                          <i className="ri-loader-line mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <i className="ri-mail-send-line mr-2" />
                          Send Invitation
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {teamMembers.length === 0 ? (
            <div className="text-center py-8">
              <i className="ri-team-line text-4xl text-gray-400 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No team members yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Invite team members to help manage your properties.
              </p>
              <Button onClick={() => setIsInviteDialogOpen(true)}>
                <i className="ri-user-add-line mr-2" />
                Invite Your First Member
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <i className="ri-user-line text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{member.full_name}</h4>
                        <Badge variant="outline" className={getRoleColor(member.role)}>
                          {member.role}
                        </Badge>
                        <Badge variant="outline" className={getStatusColor(member.status)}>
                          {member.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                      {member.last_active && (
                        <p className="text-xs text-muted-foreground">
                          Last active: {new Date(member.last_active).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <i className="ri-edit-line" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <i className="ri-more-line" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Team Settings</CardTitle>
          <CardDescription>
            Configure team-wide settings and permissions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base font-medium">Allow team members to invite others</Label>
              <p className="text-sm text-muted-foreground">
                Let team members with admin role invite new members
              </p>
            </div>
            <Switch defaultChecked={false} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base font-medium">Require approval for new members</Label>
              <p className="text-sm text-muted-foreground">
                New team members need approval before accessing the account
              </p>
            </div>
            <Switch defaultChecked={true} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base font-medium">Enable activity logging</Label>
              <p className="text-sm text-muted-foreground">
                Track team member actions for audit purposes
              </p>
            </div>
            <Switch defaultChecked={true} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
