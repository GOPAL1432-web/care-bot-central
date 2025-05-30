
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, X } from 'lucide-react';

interface HealthTip {
  id: string;
  title: string;
  description: string;
  category: string;
  createdAt: Date;
}

const HealthManagement: React.FC = () => {
  const [healthTips, setHealthTips] = useState<HealthTip[]>([
    {
      id: '1',
      title: 'Stay Hydrated',
      description: 'Drink at least 8 glasses of water daily to maintain proper hydration.',
      category: 'General',
      createdAt: new Date()
    },
    {
      id: '2',
      title: 'Regular Exercise',
      description: 'Engage in at least 30 minutes of moderate exercise daily.',
      category: 'Fitness',
      createdAt: new Date()
    }
  ]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTip, setEditingTip] = useState<HealthTip | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingTip) {
      setHealthTips(prev => prev.map(tip => 
        tip.id === editingTip.id 
          ? { ...tip, ...formData }
          : tip
      ));
      toast({
        title: "Health tip updated",
        description: "The health tip has been updated successfully.",
      });
    } else {
      const newTip: HealthTip = {
        id: Date.now().toString(),
        ...formData,
        createdAt: new Date()
      };
      setHealthTips(prev => [...prev, newTip]);
      toast({
        title: "Health tip added",
        description: "New health tip has been added successfully.",
      });
    }

    setFormData({ title: '', description: '', category: '' });
    setEditingTip(null);
    setIsAddModalOpen(false);
  };

  const handleEdit = (tip: HealthTip) => {
    setEditingTip(tip);
    setFormData({
      title: tip.title,
      description: tip.description,
      category: tip.category
    });
    setIsAddModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setHealthTips(prev => prev.filter(tip => tip.id !== id));
    toast({
      title: "Health tip deleted",
      description: "The health tip has been deleted successfully.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Health Management</CardTitle>
            <CardDescription>Manage health tips and wellness content</CardDescription>
          </div>
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Health Tip
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white">
              <DialogHeader>
                <DialogTitle>{editingTip ? 'Edit' : 'Add'} Health Tip</DialogTitle>
                <DialogDescription>
                  {editingTip ? 'Update the' : 'Create a new'} health tip for users.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingTip ? 'Update' : 'Add'} Tip
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
              <TableHead>Description</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {healthTips.map((tip) => (
              <TableRow key={tip.id}>
                <TableCell className="font-medium">{tip.title}</TableCell>
                <TableCell>{tip.category}</TableCell>
                <TableCell className="max-w-xs truncate">{tip.description}</TableCell>
                <TableCell>{tip.createdAt.toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(tip)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(tip.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default HealthManagement;
