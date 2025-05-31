"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDocumentStats } from "@/hooks/useDocuments";
import { documentCategoryConfig, documentStatusConfig } from "@/types/document";

export function DocumentStatsCards() {
  const { data: stats, isLoading, isError } = useDocumentStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (isError || !stats) {
    // Return simplified stats on error
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <i className="ri-file-line text-2xl text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">--</div>
                <p className="text-xs text-gray-500">Loading...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const topCategory = Object.entries(stats.byCategory).sort(([,a], [,b]) => b - a)[0];
  const activeDocuments = stats.byStatus.active || 0;
  const expiredDocuments = stats.byStatus.expired || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Documents */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Total Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <i className="ri-file-line text-2xl text-blue-600" />
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <p className="text-xs text-gray-500">All documents</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Documents */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Active Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <i className="ri-check-line text-2xl text-green-600" />
            <div>
              <div className="text-2xl font-bold text-gray-900">{activeDocuments}</div>
              <p className="text-xs text-gray-500">Currently active</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Uploads */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Recent Uploads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <i className="ri-upload-line text-2xl text-purple-600" />
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.recentUploads}</div>
              <p className="text-xs text-gray-500">Last 7 days</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Category */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Top Category</CardTitle>
        </CardHeader>
        <CardContent>
          {topCategory ? (
            <div className="flex items-center gap-2">
              <i className={`${documentCategoryConfig[topCategory[0] as keyof typeof documentCategoryConfig]?.icon || 'ri-file-line'} text-2xl text-orange-600`} />
              <div>
                <div className="text-2xl font-bold text-gray-900">{topCategory[1]}</div>
                <p className="text-xs text-gray-500">
                  {documentCategoryConfig[topCategory[0] as keyof typeof documentCategoryConfig]?.label || topCategory[0]}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <i className="ri-file-line text-2xl text-gray-400" />
              <div>
                <div className="text-2xl font-bold text-gray-900">0</div>
                <p className="text-xs text-gray-500">No documents</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Breakdown */}
      {Object.keys(stats.byStatus).length > 0 && (
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.byStatus).map(([status, count]) => {
                const config = documentStatusConfig[status as keyof typeof documentStatusConfig];
                return (
                  <Badge key={status} variant="outline" className={`${config?.color || 'bg-gray-100 text-gray-800'} px-3 py-1`}>
                    {config?.label || status}: {count}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Breakdown */}
      {Object.keys(stats.byCategory).length > 0 && (
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.byCategory)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 6)
                .map(([category, count]) => {
                  const config = documentCategoryConfig[category as keyof typeof documentCategoryConfig];
                  return (
                    <Badge key={category} variant="outline" className={`${config?.color || 'bg-gray-100 text-gray-800'} px-3 py-1`}>
                      <i className={`${config?.icon || 'ri-file-line'} mr-1 h-3 w-3`} />
                      {config?.label || category}: {count}
                    </Badge>
                  );
                })}
              {Object.keys(stats.byCategory).length > 6 && (
                <Badge variant="outline" className="bg-gray-100 text-gray-800 px-3 py-1">
                  +{Object.keys(stats.byCategory).length - 6} more
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts */}
      {expiredDocuments > 0 && (
        <Card className="md:col-span-2 border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-800 flex items-center gap-2">
              <i className="ri-alert-line h-4 w-4" />
              Attention Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-700">
              You have {expiredDocuments} expired document{expiredDocuments > 1 ? 's' : ''} that may need attention.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
