
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Search, Calendar, Clock, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

interface SearchHistoryItem {
  id: string;
  search_term: string;
  search_type: string;
  created_at: string;
}

interface GroupedSearch {
  date: string;
  searches: SearchHistoryItem[];
}

const SearchHistory: React.FC = () => {
  const { user } = useAuth();
  const [searchHistory, setSearchHistory] = useState<GroupedSearch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSearchHistory();
    }
  }, [user]);

  const fetchSearchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('search_history')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching search history:', error);
        return;
      }

      // Group searches by date
      const grouped = groupSearchesByDate(data || []);
      setSearchHistory(grouped);
    } catch (error) {
      console.error('Error fetching search history:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupSearchesByDate = (searches: SearchHistoryItem[]): GroupedSearch[] => {
    const groups: { [key: string]: SearchHistoryItem[] } = {};

    searches.forEach(search => {
      const date = new Date(search.created_at).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(search);
    });

    return Object.entries(groups).map(([date, searches]) => ({
      date,
      searches: searches.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }));
  };

  const deleteSearch = async (searchId: string) => {
    try {
      const { error } = await supabase
        .from('search_history')
        .delete()
        .eq('id', searchId);

      if (error) {
        console.error('Error deleting search:', error);
        toast.error('Failed to delete search');
        return;
      }

      toast.success('Search deleted');
      fetchSearchHistory(); // Refresh the list
    } catch (error) {
      console.error('Error deleting search:', error);
      toast.error('Failed to delete search');
    }
  };

  const clearAllHistory = async () => {
    if (!confirm('Are you sure you want to clear all search history?')) return;

    try {
      const { error } = await supabase
        .from('search_history')
        .delete()
        .eq('user_id', user?.id);

      if (error) {
        console.error('Error clearing history:', error);
        toast.error('Failed to clear history');
        return;
      }

      toast.success('Search history cleared');
      setSearchHistory([]);
    } catch (error) {
      console.error('Error clearing history:', error);
      toast.error('Failed to clear history');
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Please log in to view your search history.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/">
              <Button className="w-full">Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Search className="w-8 h-8 text-blue-600" />
                Search History
              </h1>
              <p className="text-gray-600 mt-2">
                View and manage your search history
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={clearAllHistory}
                disabled={searchHistory.length === 0}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </Button>
              <Link to="/">
                <Button variant="outline">
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : searchHistory.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No Search History</CardTitle>
              <CardDescription>
                You haven't performed any searches yet. Go to the dashboard to start searching.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/">
                <Button>Start Searching</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {searchHistory.map((group, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    {group.date}
                  </CardTitle>
                  <CardDescription>
                    {group.searches.length} searches
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {group.searches.map((search) => (
                      <div
                        key={search.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Search className="w-4 h-4 text-gray-500" />
                          <div>
                            <span className="font-medium text-gray-900">{search.search_term}</span>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Clock className="w-3 h-3" />
                              <span>{formatTime(search.created_at)}</span>
                              <span>•</span>
                              <span className="capitalize">{search.search_type}</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteSearch(search.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default SearchHistory;
