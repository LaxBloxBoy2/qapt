"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useDocuments, useDeleteDocument } from "@/hooks/useDocuments";
import { useGetProperties } from "@/hooks/useProperties";
import { useTenants } from "@/hooks/useTenants";
import { useLeases } from "@/hooks/useLeases";
import { DocumentWithRelations, DocumentFilters, documentCategoryConfig, documentStatusConfig } from "@/types/document";
import { DocumentUploadForm } from "./DocumentUploadForm";
import { DocumentStatsCards } from "./DocumentStatsCards";

export function DocumentsList() {
  const [filters, setFilters] = useState<DocumentFilters>({});
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentWithRelations | null>(null);

  const { data: documents, isLoading, error, isError } = useDocuments(filters);
  const { data: properties } = useGetProperties();
  const { data: tenants } = useTenants();
  const { data: leases } = useLeases();
  const deleteDocument = useDeleteDocument();

  const handleDelete = (document: DocumentWithRelations) => {
    setSelectedDocument(document);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (selectedDocument) {
      await deleteDocument.mutateAsync(selectedDocument.id);
      setShowDeleteDialog(false);
      setSelectedDocument(null);
    }
  };

  const downloadDocument = (document: DocumentWithRelations) => {
    // Check if it's a placeholder URL
    if (document.file_url.includes('placeholder.com') || document.file_url.includes('via.placeholder')) {
      // For placeholder documents, show a message instead of opening blank page
      alert(`This is a placeholder document: ${document.name}\n\nTo enable real file downloads:\n1. Go to Test Storage page\n2. Fix storage policies\n3. Re-upload documents`);
      return;
    }

    // For real files, open in new tab
    window.open(document.file_url, "_blank");
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown size";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
    return `${Math.ceil(diffDays / 365)} years ago`;
  };

  const getCategoryBadge = (category: string) => {
    const config = documentCategoryConfig[category as keyof typeof documentCategoryConfig] || documentCategoryConfig.other;
    return (
      <Badge variant="outline" className={`${config.color} text-xs font-medium px-2 py-1 h-6`}>
        <i className={`${config.icon} h-3 w-3 mr-1`} />
        {config.label}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const config = documentStatusConfig[status as keyof typeof documentStatusConfig] || documentStatusConfig.active;
    return (
      <Badge variant="outline" className={`${config.color} text-xs font-medium px-2 py-1 h-6`}>
        {config.label}
      </Badge>
    );
  };

  const getFileIcon = (fileType?: string) => {
    if (!fileType) return "ri-file-line";

    if (fileType.includes("pdf")) return "ri-file-pdf-line";
    if (fileType.includes("word") || fileType.includes("document")) return "ri-file-word-line";
    if (fileType.includes("excel") || fileType.includes("spreadsheet")) return "ri-file-excel-line";
    if (fileType.includes("image")) return "ri-image-line";
    if (fileType.includes("text")) return "ri-file-text-line";

    return "ri-file-line";
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <div className="flex items-start gap-6">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-32" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <div className="flex items-center gap-6">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <i className="ri-error-warning-line text-4xl text-red-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Documents</h3>
          <p className="text-gray-500 mb-6">
            {error?.message || "There was an error loading your documents. Please try again."}
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
            >
              <i className="ri-refresh-line mr-2 h-4 w-4" />
              Refresh Page
            </Button>
            <Button onClick={() => setShowUploadForm(true)}>
              <i className="ri-upload-line mr-2 h-4 w-4" />
              Upload Document
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Stats Cards */}
      <DocumentStatsCards />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Documents</h2>
          <p className="text-sm text-gray-500 mt-1">Manage and organize all your property documents</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {documents?.length || 0} {documents?.length === 1 ? 'document' : 'documents'}
          </span>
          <Button onClick={() => setShowUploadForm(true)}>
            <i className="ri-upload-line mr-2 h-4 w-4" />
            Upload Document
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search documents..."
            value={filters.search || ""}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="bg-white"
          />
        </div>

        <Select value={filters.category || "all"} onValueChange={(value) => setFilters({ ...filters, category: value === "all" ? undefined : value })}>
          <SelectTrigger className="w-[180px] bg-white">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.entries(documentCategoryConfig).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                <div className="flex items-center gap-2">
                  <i className={`${config.icon} h-4 w-4`} />
                  {config.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.status || "all"} onValueChange={(value) => setFilters({ ...filters, status: value === "all" ? undefined : value })}>
          <SelectTrigger className="w-[150px] bg-white">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.entries(documentStatusConfig).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.property_id || "all"} onValueChange={(value) => setFilters({ ...filters, property_id: value === "all" ? undefined : value })}>
          <SelectTrigger className="w-[180px] bg-white">
            <SelectValue placeholder="All Properties" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Properties</SelectItem>
            {properties?.map((property) => (
              <SelectItem key={property.id} value={property.id}>
                {property.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Documents Grid */}
      {!documents || documents.length === 0 ? (
        <div className="text-center py-12">
          <i className="ri-file-line text-4xl text-gray-400 mb-4" />
          <p className="text-gray-500">No documents found</p>
          <Button className="mt-4" onClick={() => setShowUploadForm(true)}>
            Upload Your First Document
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((document) => (
            <Card key={document.id} className="group hover:shadow-lg hover:border-blue-200 transition-all duration-200 border border-gray-200 bg-white">
              <CardContent className="p-5">
                <div className="flex items-start gap-6">
                  {/* File Icon */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <i className={`${getFileIcon(document.file_type)} text-xl text-gray-600`} />
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 min-w-0">
                    {/* Header Row */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getCategoryBadge(document.category)}
                        <h3 className="font-semibold text-gray-900 text-lg hover:text-blue-600 cursor-pointer transition-colors" onClick={() => downloadDocument(document)}>
                          {document.name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(document.status)}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                              <i className="ri-more-line h-4 w-4 text-gray-500" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => downloadDocument(document)} className="text-sm">
                              <i className="ri-download-line mr-2 h-4 w-4" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => window.open(document.file_url, "_blank")} className="text-sm">
                              <i className="ri-external-link-line mr-2 h-4 w-4" />
                              Open in New Tab
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600 text-sm" onClick={() => handleDelete(document)}>
                              <i className="ri-delete-bin-line mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Description */}
                    {document.description && (
                      <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-2">
                        {document.description}
                      </p>
                    )}

                    {/* Bottom Row - Associations, File Info, Date */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        {/* Associations */}
                        {document.property && (
                          <div className="flex items-center gap-2 text-sm">
                            <i className="ri-building-line h-4 w-4 text-gray-400" />
                            <span className="font-medium text-gray-700">{document.property.name}</span>
                          </div>
                        )}

                        {document.tenant && (
                          <div className="flex items-center gap-2 text-sm">
                            <i className="ri-user-line h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">{document.tenant.first_name} {document.tenant.last_name}</span>
                          </div>
                        )}

                        {/* File Info */}
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <i className="ri-file-line h-4 w-4" />
                          <span>{formatFileSize(document.file_size)}</span>
                        </div>

                        {/* Tags */}
                        {document.tags && document.tags.length > 0 && (
                          <div className="flex items-center gap-1">
                            {document.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {document.tags.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{document.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Date */}
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <i className="ri-calendar-line h-4 w-4" />
                        <span>{formatRelativeDate(document.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Form Dialog */}
      <DocumentUploadForm
        open={showUploadForm}
        onOpenChange={setShowUploadForm}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
              {selectedDocument && (
                <div className="mt-2 p-2 bg-muted rounded">
                  <strong>{selectedDocument.name}</strong>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
