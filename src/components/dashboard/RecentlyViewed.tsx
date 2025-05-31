"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

interface RecentlyViewedItem {
  id: string;
  type: 'property' | 'unit' | 'tenant' | 'lease';
  title: string;
  subtitle: string;
  url: string;
  viewedAt: string;
  icon: string;
}

export function RecentlyViewed() {
  const [recentItems, setRecentItems] = useState<RecentlyViewedItem[]>([]);
  const router = useRouter();

  useEffect(() => {
    // Load recently viewed items from localStorage
    const loadRecentItems = () => {
      try {
        const stored = localStorage.getItem('qapt-recently-viewed');
        if (stored) {
          const items = JSON.parse(stored) as RecentlyViewedItem[];
          // Sort by viewedAt and take the most recent 5
          const sortedItems = items
            .sort((a, b) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime())
            .slice(0, 5);
          setRecentItems(sortedItems);
        }
      } catch (error) {
        console.error('Error loading recently viewed items:', error);
      }
    };

    loadRecentItems();

    // Listen for storage changes (when items are added from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'qapt-recently-viewed') {
        loadRecentItems();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'property': return 'ri-building-line';
      case 'unit': return 'ri-home-line';
      case 'tenant': return 'ri-user-line';
      case 'lease': return 'ri-file-text-line';
      default: return 'ri-file-line';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'property': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'unit': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'tenant': return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      case 'lease': return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const clearRecentItems = () => {
    localStorage.removeItem('qapt-recently-viewed');
    setRecentItems([]);
  };

  const handleItemClick = (item: RecentlyViewedItem) => {
    router.push(item.url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <i className="ri-history-line text-primary" />
            Recently Viewed
          </div>
          {recentItems.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearRecentItems}
              className="text-xs"
            >
              <i className="ri-delete-bin-line mr-1" />
              Clear
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recentItems.length === 0 ? (
          <div className="text-center py-8">
            <i className="ri-history-line text-4xl text-gray-400 dark:text-gray-600 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              No recently viewed items yet.
            </p>
            <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">
              Items you view will appear here for quick access.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentItems.map((item) => (
              <div
                key={`${item.type}-${item.id}-${item.viewedAt}`}
                className="group cursor-pointer p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                onClick={() => handleItemClick(item)}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${getTypeColor(item.type)}`}>
                    <i className={`${getTypeIcon(item.type)} text-sm`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                          {item.title}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                          {item.subtitle}
                        </p>
                      </div>
                      <i className="ri-arrow-right-s-line text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors flex-shrink-0" />
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded capitalize">
                        {item.type}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-500">
                        {formatDistanceToNow(new Date(item.viewedAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Navigation */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/properties')}
              className="text-xs"
            >
              <i className="ri-building-line mr-1" />
              Properties
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/tenants')}
              className="text-xs"
            >
              <i className="ri-user-line mr-1" />
              Tenants
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Utility function to add items to recently viewed (to be used in other components)
export function addToRecentlyViewed(item: Omit<RecentlyViewedItem, 'viewedAt'>) {
  try {
    const stored = localStorage.getItem('qapt-recently-viewed');
    let items: RecentlyViewedItem[] = stored ? JSON.parse(stored) : [];
    
    // Remove existing item with same id and type
    items = items.filter(existing => !(existing.id === item.id && existing.type === item.type));
    
    // Add new item at the beginning
    items.unshift({
      ...item,
      viewedAt: new Date().toISOString()
    });
    
    // Keep only the most recent 10 items
    items = items.slice(0, 10);
    
    localStorage.setItem('qapt-recently-viewed', JSON.stringify(items));
  } catch (error) {
    console.error('Error saving recently viewed item:', error);
  }
}
