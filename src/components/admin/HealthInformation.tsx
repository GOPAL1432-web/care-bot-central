
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, X, Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface HealthInfo {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string;
  created_at: string;
}

const HealthInformation: React.FC = () => {
  const [healthInfos, setHealthInfos] = useState<HealthInfo[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingInfo, setEditingInfo] = useState<HealthInfo | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    tags: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadHealthInformation();
  }, []);

  const loadHealthInformation = async () => {
    try {
      // Use type assertion to bypass TypeScript issues until types are regenerated
      const { data, error } = await (supabase as any)
        .from('health_information')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHealthInfos(data || []);
    } catch (error) {
      console.error('Error loading health information:', error);
      toast({
        title: "Error",
        description: "Failed to load health information",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (editingInfo) {
        const { error } = await (supabase as any)
          .from('health_information')
          .update(formData)
          .eq('id', editingInfo.id);

        if (error) throw error;
        
        toast({
          title: "Health information updated",
          description: "The health information has been updated successfully.",
        });
      } else {
        const { error } = await (supabase as any)
          .from('health_information')
          .insert([formData]);

        if (error) throw error;
        
        toast({
          title: "Health information added",
          description: "New health information has been added successfully.",
        });
      }

      setFormData({ title: '', description: '', category: '', tags: '' });
      setEditingInfo(null);
      setIsAddModalOpen(false);
      loadHealthInformation();
    } catch (error) {
      console.error('Error saving health information:', error);
      toast({
        title: "Error",
        description: "Failed to save health information",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (info: HealthInfo) => {
    setEditingInfo(info);
    setFormData({
      title: info.title,
      description: info.description,
      category: info.category,
      tags: info.tags
    });
    setIsAddModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await (supabase as any)
        .from('health_information')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Health information deleted",
        description: "The health information has been deleted successfully.",
      });
      loadHealthInformation();
    } catch (error) {
      console.error('Error deleting health information:', error);
      toast({
        title: "Error",
        description: "Failed to delete health information",
        variant: "destructive"
      });
    }
  };

  const resetModal = () => {
    setFormData({ title: '', description: '', category: '', tags: '' });
    setEditingInfo(null);
    setIsAddModalOpen(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Heart className="h-6 w-6 text-red-500" />
            <div>
              <CardTitle>Health Information Management</CardTitle>
              <CardDescription>Manage health tips and information for the AI chatbot</CardDescription>
            </div>
          </div>
          <Dialog open={isAddModalOpen} onOpenChange={(open) => {
            if (!open) resetModal();
            setIsAddModalOpen(open);
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Health Info
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingInfo ? 'Edit' : 'Add'} Health Information</DialogTitle>
                <DialogDescription>
                  {editingInfo ? 'Update the' : 'Create new'} health information for the AI chatbot.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Benefits of Regular Exercise"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="e.g., Fitness, Nutrition, Mental Health"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma separated)</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="e.g., exercise, cardio, strength training"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={6}
                    placeholder="Detailed health information and tips..."
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={resetModal}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Saving...' : editingInfo ? 'Update' : 'Add'} Information
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {healthInfos.map((info) => (
              <TableRow key={info.id}>
                <TableCell className="font-medium">{info.title}</TableCell>
                <TableCell>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                    {info.category}
                  </span>
                </TableCell>
                <TableCell className="max-w-xs">
                  <div className="flex flex-wrap gap-1">
                    {info.tags.split(',').slice(0, 3).map((tag, index) => (
                      <span key={index} className="px-1 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                        {tag.trim()}
                      </span>
                    ))}
                    {info.tags.split(',').length > 3 && (
                      <span className="px-1 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                        +{info.tags.split(',').length - 3}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="max-w-xs truncate">{info.description}</TableCell>
                <TableCell>{new Date(info.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(info)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(info.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {healthInfos.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No health information found. Add some health tips to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default HealthInformation;
