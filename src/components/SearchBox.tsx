
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

interface SearchBoxProps {
  onSearch?: (searchTerm: string) => void;
}

const SearchBox: React.FC<SearchBoxProps> = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const { user } = useAuth();

  const handleSearch = async () => {
    if (!searchTerm.trim() || !user) return;

    setIsSearching(true);
    try {
      // Save search to history
      const { error } = await supabase
        .from('search_history')
        .insert({
          user_id: user.id,
          search_term: searchTerm.trim(),
          search_type: 'disease'
        });

      if (error) {
        console.error('Error saving search history:', error);
        toast.error('Failed to save search history');
      } else {
        toast.success(`Searching for "${searchTerm}"`);
        onSearch?.(searchTerm);
        setSearchTerm('');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="flex gap-2 w-full max-w-md">
      <Input
        type="text"
        placeholder="Search for diseases, symptoms..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyPress={handleKeyPress}
        className="flex-1"
      />
      <Button 
        onClick={handleSearch} 
        disabled={!searchTerm.trim() || isSearching}
        className="px-4"
      >
        <Search className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default SearchBox;
