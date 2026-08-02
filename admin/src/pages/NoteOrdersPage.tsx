import { useEffect, useState } from 'react';
import { useNavigate } from '@/lib/router';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { updateNoteOrderStatus, getAllNoteOrders } from '@/services/notesService';
import { Eye } from 'lucide-react';

interface NoteOrder {
  _id: string;
  noteId: string | {
    _id: string;
    title: string;
  };
  userId: string | {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  name: string;
  studentPhone: string;
  guardianPhone: string;
  address: string;
  paymentMethod: 'cash';
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered';
  orderedAt: string;
  createdAt: string;
  updatedAt: string;
}

export default function NoteOrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<NoteOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<NoteOrder | null>(null);
  const [newStatus, setNewStatus] = useState<'pending' | 'confirmed' | 'shipped' | 'delivered'>('pending');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const { orders: ordersData } = await getAllNoteOrders(1, 100); // Load all orders
      setOrders(ordersData);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('حدث خطأ أثناء تحميل طلبات المذكرات');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!currentOrder) return;
    
    try {
      const response = await updateNoteOrderStatus(currentOrder._id, newStatus);
      setOrders(orders.map(order => order._id === currentOrder._id ? response : order));
      toast.success('تم تحديث حالة الطلب بنجاح');
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('حدث خطأ أثناء تحديث حالة الطلب');
    }
  };

  const openStatusDialog = (order: NoteOrder) => {
    setCurrentOrder(order);
    setNewStatus(order.status);
    setIsDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500">قيد الانتظار</Badge>;
      case 'confirmed':
        return <Badge className="bg-blue-500">مؤكد</Badge>;
      case 'shipped':
        return <Badge className="bg-purple-500">تم الشحن</Badge>;
      case 'delivered':
        return <Badge className="bg-green-500">تم التسليم</Badge>;
      default:
        return <Badge className="bg-gray-500">غير معروف</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNoteTitle = (noteId: string | { _id: string; title: string } | null) => {
    if (!noteId) {
      return 'مذكرة غير معروفة';
    }
    if (typeof noteId === 'string') {
      return 'مذكرة غير معروفة';
    }
    return noteId.title;
  };

  const getUserName = (userId: string | { _id: string; name: string; email: string; phone: string } | null) => {
    if (!userId) {
      return 'مستخدم غير معروف';
    }
    if (typeof userId === 'string') {
      return 'مستخدم غير معروف';
    }
    return userId.name;
  };

  const getNoteId = (noteId: string | { _id: string; title: string } | null) => {
    if (!noteId) {
      return null;
    }
    if (typeof noteId === 'string') {
      return noteId;
    }
    return noteId._id;
  };

  const filteredOrders = orders.filter(order => {
    const noteTitle = getNoteTitle(order.noteId);
    const userName = getUserName(order.userId);
    
    const matchesSearch = noteTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.studentPhone.includes(searchTerm) ||
                         order.guardianPhone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-screen">
          <div>جاري التحميل...</div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <h1 className="text-3xl font-bold text-foreground">طلبات المذكرات</h1>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-1/3">
            <Input
              placeholder="بحث عن طلب..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full md:w-48">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="pending">قيد الانتظار</SelectItem>
                <SelectItem value="confirmed">مؤكد</SelectItem>
                <SelectItem value="shipped">تم الشحن</SelectItem>
                <SelectItem value="delivered">تم التسليم</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            لا توجد طلبات متاحة
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المذكرة</TableHead>
                  <TableHead>الطالب</TableHead>
                  <TableHead>رقم الطالب</TableHead>
                  <TableHead>رقم ولي الأمر</TableHead>
                  <TableHead>العنوان</TableHead>
                  <TableHead>تاريخ الطلب</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order._id}>
                    <TableCell className="font-medium">{getNoteTitle(order.noteId)}</TableCell>
                    <TableCell>{getUserName(order.userId) || order.name}</TableCell>
                    <TableCell>{order.studentPhone}</TableCell>
                    <TableCell>{order.guardianPhone}</TableCell>
                    <TableCell>{order.address}</TableCell>
                    <TableCell>{formatDate(order.orderedAt)}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            const noteId = getNoteId(order.noteId);
                            if (noteId) {
                              navigate(`/notes/detail/${noteId}`);
                            }
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => openStatusDialog(order)}
                        >
                          تحديث الحالة
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Status Update Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تحديث حالة الطلب</DialogTitle>
          </DialogHeader>
          
          {currentOrder && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>المذكرة</Label>
                <p className="text-muted-foreground">{getNoteTitle(currentOrder.noteId)}</p>
              </div>
              
              <div className="space-y-2">
                <Label>الطالب</Label>
                <p className="text-muted-foreground">{getUserName(currentOrder.userId) || currentOrder.name}</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">الحالة الجديدة</Label>
                <Select 
                  value={newStatus} 
                  onValueChange={(value) => setNewStatus(value as 'pending' | 'confirmed' | 'shipped' | 'delivered')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">قيد الانتظار</SelectItem>
                    <SelectItem value="confirmed">مؤكد</SelectItem>
                    <SelectItem value="shipped">تم الشحن</SelectItem>
                    <SelectItem value="delivered">تم التسليم</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                  إلغاء
                </Button>
                <Button onClick={handleUpdateStatus} className="flex-1">
                  تحديث
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
