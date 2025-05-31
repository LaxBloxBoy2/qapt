"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  usePropertyDocumentCount,
  useLeaseDocumentCount,
  useTenantDocumentCount,
  usePropertyDocuments,
  useLeaseDocuments,
  useTenantDocuments
} from "@/hooks/useDocuments";
import { Document, documentCategoryConfig } from "@/types/document";
import { useState } from "react";
import { DocumentUploadForm } from "./DocumentUploadForm";

interface DocumentsWidgetProps {
  type: "property" | "lease" | "tenant";
  id: string;
  title?: string;
  showUploadButton?: boolean;
  showRecentDocuments?: boolean;
  maxDocuments?: number;
}

export function DocumentsWidget({
  type,
  id,
  title,
  showUploadButton = true,
  showRecentDocuments = true,
  maxDocuments = 3
}: DocumentsWidgetProps) {
  const [showUploadForm, setShowUploadForm] = useState(false);

  // Get document count based on type
  const { data: propertyCount, isLoading: propertyCountLoading } = usePropertyDocumentCount(
    type === "property" ? id : undefined
  );
  const { data: leaseCount, isLoading: leaseCountLoading } = useLeaseDocumentCount(
    type === "lease" ? id : undefined
  );
  const { data: tenantCount, isLoading: tenantCountLoading } = useTenantDocumentCount(
    type === "tenant" ? id : undefined
  );

  // Get recent documents based on type
  const { data: propertyDocs, isLoading: propertyDocsLoading } = usePropertyDocuments(
    type === "property" ? id : undefined,
    maxDocuments
  );
  const { data: leaseDocs, isLoading: leaseDocsLoading } = useLeaseDocuments(
    type === "lease" ? id : undefined,
    maxDocuments
  );
  const { data: tenantDocs, isLoading: tenantDocsLoading } = useTenantDocuments(
    type === "tenant" ? id : undefined,
    maxDocuments
  );

  // Determine which data to use
  const count = type === "property" ? propertyCount : type === "lease" ? leaseCount : tenantCount;
  const isCountLoading = type === "property" ? propertyCountLoading :
                        type === "lease" ? leaseCountLoading : tenantCountLoading;

  const documents = type === "property" ? propertyDocs : type === "lease" ? leaseDocs : tenantDocs;
  const isDocsLoading = type === "property" ? propertyDocsLoading :
                       type === "lease" ? leaseDocsLoading : tenantDocsLoading;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getCategoryBadge = (category: string) => {
    const config = documentCategoryConfig[category as keyof typeof documentCategoryConfig] || documentCategoryConfig.other;
    return (
      <Badge variant="outline" className={`${config.color} text-xs font-medium px-2 py-1 h-5`}>
        <i className={`${config.icon} h-3 w-3 mr-1`} />
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

  const downloadDocument = (document: Document) => {
    // Check if it's a placeholder URL
    if (document.file_url.includes('placeholder.com') || document.file_url.includes('via.placeholder')) {
      // For placeholder documents, show a helpful message
      alert(`This is a placeholder document: ${document.name}\n\nTo enable real file downloads:\n1. Go to Test Storage page\n2. Fix storage policies\n3. Re-upload documents`);
      return;
    }

    // For real files, open in new tab
    window.open(document.file_url, "_blank");
  };

  const getDefaultValues = () => {
    switch (type) {
      case "property":
        return { defaultPropertyId: id };
      case "lease":
        return { defaultLeaseId: id };
      case "tenant":
        return { defaultTenantId: id };
      default:
        return {};
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <i className="ri-file-line h-4 w-4 text-blue-600" />
              {title || "Documents"}
            </CardTitle>
            <div className="flex items-center gap-2">
              {isCountLoading ? (
                <Skeleton className="h-6 w-8" />
              ) : (
                <Badge variant="secondary" className="text-xs">
                  {count || 0}
                </Badge>
              )}
              {showUploadButton && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowUploadForm(true)}
                  className="h-7 px-2 text-xs"
                >
                  <i className="ri-upload-line h-3 w-3 mr-1" />
                  Upload
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {showRecentDocuments && (
            <>
              {isDocsLoading ? (
                <div className="space-y-2">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-2">
                      <Skeleton className="h-8 w-8 rounded" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-2 w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : !documents || documents.length === 0 ? (
                <div className="text-center py-4">
                  <i className="ri-file-line text-2xl text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">No documents yet</p>
                  {showUploadButton && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowUploadForm(true)}
                      className="mt-2 h-7 px-3 text-xs"
                    >
                      Upload First Document
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.map((document) => (
                    <div
                      key={document.id}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                      onClick={() => downloadDocument(document)}
                    >
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                          <i className={`${getFileIcon(document.file_type)} text-sm text-gray-600`} />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {getCategoryBadge(document.category)}
                        </div>
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {document.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(document.created_at)}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <i className="ri-download-line h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  ))}

                  {count && count > maxDocuments && (
                    <div className="text-center pt-2 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-blue-600 hover:text-blue-700"
                        onClick={() => window.location.href = `/documents?${type}_id=${id}`}
                      >
                        View all {count} documents
                        <i className="ri-arrow-right-line ml-1 h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {!showRecentDocuments && (
            <div className="text-center py-2">
              <div className="text-2xl font-bold text-gray-900">{count || 0}</div>
              <p className="text-xs text-gray-500">
                {count === 1 ? 'document' : 'documents'}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-blue-600 hover:text-blue-700 mt-1"
                onClick={() => window.location.href = `/documents?${type}_id=${id}`}
              >
                View all
                <i className="ri-arrow-right-line ml-1 h-3 w-3" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Form Dialog */}
      <DocumentUploadForm
        open={showUploadForm}
        onOpenChange={setShowUploadForm}
        {...getDefaultValues()}
      />
    </>
  );
}

// Compact version for smaller spaces
export function DocumentsCompactWidget({ type, id }: { type: "property" | "lease" | "tenant"; id: string }) {
  // Get document count based on type
  const { data: propertyCount } = usePropertyDocumentCount(type === "property" ? id : undefined);
  const { data: leaseCount } = useLeaseDocumentCount(type === "lease" ? id : undefined);
  const { data: tenantCount } = useTenantDocumentCount(type === "tenant" ? id : undefined);

  const count = type === "property" ? propertyCount : type === "lease" ? leaseCount : tenantCount;

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 px-3 text-xs"
      onClick={() => window.location.href = `/documents?${type}_id=${id}`}
    >
      <i className="ri-file-line h-3 w-3 mr-1" />
      {count || 0} docs
    </Button>
  );
}
