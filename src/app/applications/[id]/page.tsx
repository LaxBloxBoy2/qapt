"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApplication, useUpdateApplication, useAddApplicationNote } from "@/hooks/useApplications";
import MainLayout from "@/components/layout/MainLayout";
import { withAuth } from "@/components/auth/withAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  FileText,
  Download,
  MessageSquare,
  Calendar,
  DollarSign,
  User,
  Home,
  Phone,
  Mail
} from "lucide-react";
import { APPLICATION_STATUS_OPTIONS, EMPLOYMENT_STATUS_OPTIONS } from "@/types/application";
import { format } from "date-fns";
import Link from "next/link";

function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params?.id as string;

  const [newNote, setNewNote] = useState("");
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const { data: application, isLoading, error } = useApplication(applicationId);
  const updateApplication = useUpdateApplication();
  const addNote = useAddApplicationNote();

  const handleApprove = async () => {
    try {
      await updateApplication.mutateAsync({
        id: applicationId,
        updates: { status: 'approved' }
      });
      setShowApproveDialog(false);
      // TODO: Navigate to lease creation with pre-filled data
      router.push(`/leases/new?applicationId=${applicationId}`);
    } catch (error) {
      console.error("Error approving application:", error);
    }
  };

  const handleReject = async () => {
    try {
      await updateApplication.mutateAsync({
        id: applicationId,
        updates: { status: 'rejected' }
      });
      setShowRejectDialog(false);
    } catch (error) {
      console.error("Error rejecting application:", error);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      await addNote.mutateAsync({
        applicationId,
        note: newNote
      });
      setNewNote("");
    } catch (error) {
      console.error("Error adding note:", error);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    const statusOption = APPLICATION_STATUS_OPTIONS.find(opt => opt.value === status);
    return statusOption?.color || "bg-gray-100 text-gray-800";
  };

  const getEmploymentStatusLabel = (status: string) => {
    const option = EMPLOYMENT_STATUS_OPTIONS.find(opt => opt.value === status);
    return option?.label || status;
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !application) {
    return (
      <MainLayout>
        <div className="p-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Application Not Found</h2>
            <p className="text-gray-600 mt-2">
              {error?.message || "The application you're looking for doesn't exist."}
            </p>
            <Link href="/applications">
              <Button className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Applications
              </Button>
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/applications">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Applications
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {application.first_name} {application.last_name}
              </h1>
              <p className="text-gray-600">{application.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge className={getStatusBadgeColor(application.status)}>
              {APPLICATION_STATUS_OPTIONS.find(opt => opt.value === application.status)?.label}
            </Badge>

            {application.status === 'pending' && (
              <div className="flex gap-2">
                <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Approve Application</DialogTitle>
                    </DialogHeader>
                    <p>Are you sure you want to approve this application? This will create a new lease with the applicant's information.</p>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleApprove}>
                        Approve & Create Lease
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                  <DialogTrigger asChild>
                    <Button variant="destructive">
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Reject Application</DialogTitle>
                    </DialogHeader>
                    <p>Are you sure you want to reject this application? This action cannot be undone.</p>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                        Cancel
                      </Button>
                      <Button variant="destructive" onClick={handleReject}>
                        Reject Application
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </div>

        {/* Summary Panel */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Application Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <Home className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="font-medium">{application.unit?.name}</p>
                  <p className="text-sm text-gray-600">{application.unit?.properties?.address}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="font-medium">Move-in Date</p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(application.preferred_move_in_date), "MMM d, yyyy")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="font-medium">Monthly Income</p>
                  <p className="text-sm text-gray-600">${application.monthly_income.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">Profile Info</TabsTrigger>
            <TabsTrigger value="attachments">
              Attachments ({application.attachments?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="activity">
              Activity ({application.notes?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span>{application.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>{application.phone}</span>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Submitted</Label>
                    <p className="text-sm text-gray-600">
                      {format(new Date(application.submitted_at), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Background Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Background Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Employment Status</Label>
                    <p className="text-sm text-gray-600">
                      {getEmploymentStatusLabel(application.employment_status)}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Pets</Label>
                    <p className="text-sm text-gray-600">
                      {application.has_pets ? "Yes" : "No"}
                      {application.has_pets && application.pets_description && (
                        <span className="block mt-1">{application.pets_description}</span>
                      )}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Smoker</Label>
                    <p className="text-sm text-gray-600">
                      {application.is_smoker ? "Yes" : "No"}
                    </p>
                  </div>

                  {application.comments && (
                    <div>
                      <Label className="text-sm font-medium">Comments</Label>
                      <p className="text-sm text-gray-600">{application.comments}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="attachments">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Attachments
                </CardTitle>
              </CardHeader>
              <CardContent>
                {application.attachments && application.attachments.length > 0 ? (
                  <div className="space-y-3">
                    {application.attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-gray-500" />
                          <div>
                            <p className="font-medium">{attachment.name}</p>
                            <p className="text-sm text-gray-600">
                              {attachment.file_type} • {(attachment.file_size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <a href={attachment.file_url} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-8">No attachments uploaded</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Activity & Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add Note */}
                <div className="space-y-2">
                  <Label>Add Note</Label>
                  <Textarea
                    placeholder="Add a note about this application..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                  />
                  <Button onClick={handleAddNote} disabled={!newNote.trim() || addNote.isPending}>
                    {addNote.isPending ? "Adding..." : "Add Note"}
                  </Button>
                </div>

                {/* Notes List */}
                {application.notes && application.notes.length > 0 ? (
                  <div className="space-y-3">
                    {application.notes.map((note) => (
                      <div key={note.id} className="p-3 border rounded-lg">
                        <p className="text-sm">{note.note}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {format(new Date(note.created_at), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-4">No notes yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

export default withAuth(ApplicationDetailPage);
