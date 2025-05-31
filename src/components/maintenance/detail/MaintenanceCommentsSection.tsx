"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMaintenanceComments, useCreateMaintenanceComment } from "@/hooks/useMaintenance";

interface Comment {
  id: string;
  content: string;
  author: {
    name: string;
    type: 'tenant' | 'staff' | 'vendor';
  };
  created_at: string;
  is_internal: boolean;
}

interface MaintenanceCommentsSectionProps {
  requestId: string;
}

export function MaintenanceCommentsSection({ requestId }: MaintenanceCommentsSectionProps) {
  const { toast } = useToast();
  const [newComment, setNewComment] = useState("");
  const [isInternal, setIsInternal] = useState(false);

  // Use real database hooks
  const { data: comments = [], isLoading } = useMaintenanceComments(requestId);
  const createComment = useCreateMaintenanceComment();

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    try {
      await createComment.mutateAsync({
        requestId,
        content: newComment.trim(),
        isInternal
      });
      setNewComment("");
      setIsInternal(false);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAuthorColor = (type: string) => {
    switch (type) {
      case 'tenant': return 'bg-blue-100 text-blue-800';
      case 'staff': return 'bg-green-100 text-green-800';
      case 'vendor': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comments & Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Comment */}
        <div className="space-y-3">
          <Textarea
            placeholder="Add a comment or update..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            className="resize-none"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="internal"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="internal" className="text-sm text-muted-foreground">
                Internal note (not visible to tenant)
              </label>
            </div>
            <Button
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || createComment.isPending}
              size="sm"
            >
              {createComment.isPending ? "Posting..." : "Post Comment"}
            </Button>
          </div>
        </div>

        {/* Comments List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-4 text-muted-foreground">
              <p className="text-sm">Loading comments...</p>
            </div>
          ) : comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white font-semibold text-xs">
                  {getInitials(comment.user_type === 'team' ? 'Team Member' : comment.user_type === 'tenant' ? 'Tenant' : 'Vendor')}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {comment.user_type === 'team' ? 'Team Member' : comment.user_type === 'tenant' ? 'Tenant' : 'Vendor'}
                    </span>
                    <Badge className={`text-xs ${getAuthorColor(comment.user_type)}`}>
                      {comment.user_type}
                    </Badge>
                    {comment.is_internal && (
                      <Badge variant="outline" className="text-xs">
                        Internal
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(comment.created_at)}
                    </span>
                  </div>
                  <div className="text-sm bg-muted p-3 rounded-md">
                    <p className="whitespace-pre-wrap">{comment.content}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <i className="ri-chat-3-line text-4xl mb-2 block" />
              <p className="text-sm">No comments yet</p>
              <p className="text-xs">Be the first to add a comment or update</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
