
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Search } from 'lucide-react';

interface SearchHistoryItem {
  id: string;
  search_term: string;
  search_type: string;
  created_at: string;
}

interface RecentSearchesProps {
  onSearchClick?: (searchTerm: string) => void;
  refreshTrigger?: number;
}

const RecentSearches: React.FC<RecentSearchesProps> = ({ onSearchClick, refreshTrigger }) => {
  const [recentSearches, setRecentSearches] = useState<SearchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchRecentSearches();
    }
  }, [user, refreshTrigger]);

  const fetchRecentSearches = async () => {
    try {
      const { data, error } = await supabase
        .from('search_history')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching recent searches:', error);
        return;
      }

      setRecentSearches(data || []);
    } catch (error) {
      console.error('Error fetching recent searches:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Searches
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recentSearches.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Searches
          </CardTitle>
          <CardDescription>Your recent searches will appear here</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">No recent searches found. Try searching for a disease or symptom!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Recent Searches
        </CardTitle>
        <CardDescription>Last {recentSearches.length} searches</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {recentSearches.map((search) => (
            <div
              key={search.id}
              className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2 flex-1">
                <Search className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">{search.search_term}</span>
                <span className="text-xs text-gray-500">({search.search_type})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">
                  {formatTime(search.created_at)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSearchClick?.(search.search_term)}
                  className="text-xs"
                >
                  Search again
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentSearches;
