import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { getSubscriptions, updateSubscriptionStatus } from '@/services/subscriptionsService';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Subscription {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  } | null;
  courseId: {
    _id: string;
    title: string;
    price: number;
    educationalLevel: {
      nameAr: string;
    };
  } | null;
  status: 'active' | 'pending' | 'rejected';
  paymentMethod: 'center' | 'vodafone' | 'code';
  vodafoneReceipt: string;
  subscribedAt: string;
  createdAt: string;
  updatedAt: string;
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortField, setSortField] = useState<string>('subscribedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [confirmDialog, setConfirmDialog] = useState<{open: boolean, subscriptionId: string | null, status: 'active' | 'rejected' | null}>({open: false, subscriptionId: null, status: null});

  useEffect(() => {
    loadSubscriptions();
  }, [statusFilter, searchTerm, sortField, sortDirection]);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const data = await getSubscriptions(statusFilter);
      
      // Apply search filter
      let filteredData = data.filter(sub => sub !== null);
      if (searchTerm) {
        filteredData = data.filter(sub => 
          sub && 
          ((sub.userId && 
            (sub.userId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sub.userId.email.toLowerCase().includes(searchTerm.toLowerCase()))) ||
          (sub.courseId && 
            sub.courseId.title.toLowerCase().includes(searchTerm.toLowerCase())))
        );
      }
      
      // Apply sorting
      const sortedData = [...filteredData].sort((a, b) => {
        // Handle null values
        if (!a || !b) return 0;
        
        let aValue: any, bValue: any;
        
        switch (sortField) {
          case 'student':
            aValue = a.userId ? a.userId.name : '';
            bValue = b.userId ? b.userId.name : '';
            break;
          case 'course':
            aValue = a.courseId ? a.courseId.title : '';
            bValue = b.courseId ? b.courseId.title : '';
            break;
          case 'price':
            aValue = a.courseId ? a.courseId.price : 0;
            bValue = b.courseId ? b.courseId.price : 0;
            break;
          case 'date':
            aValue = new Date(a.subscribedAt).getTime();
            bValue = new Date(b.subscribedAt).getTime();
            break;
          default:
            aValue = new Date(a.subscribedAt).getTime();
            bValue = new Date(b.subscribedAt).getTime();
        }
        
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
      
      setSubscriptions(sortedData);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
      toast.error('حدث خطأ أثناء تحميل الاشتراكات');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (subscriptionId: string, status: 'active' | 'rejected') => {
    try {
      const updatedSubscription = await updateSubscriptionStatus(subscriptionId, status);
      toast.success('تم تحديث حالة الاشتراك بنجاح');
      
      // Update the subscription in the state
      setSubscriptions(prev => 
        prev.map(sub => 
          sub && sub._id === subscriptionId ? updatedSubscription : sub
        )
      );
      
      setConfirmDialog({open: false, subscriptionId: null, status: null});
    } catch (error) {
      console.error('Error updating subscription status:', error);
      toast.error('حدث خطأ أثناء تحديث حالة الاشتراك');
      setConfirmDialog({open: false, subscriptionId: null, status: null});
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">مفعل</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">قيد الانتظار</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500">مرفوض</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'center':
        return 'المركز';
      case 'vodafone':
        return 'فودافون كاش';
      case 'code':
        return 'كود';
      default:
        return method;
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const openConfirmDialog = (subscriptionId: string, status: 'active' | 'rejected') => {
    setConfirmDialog({open: true, subscriptionId, status});
  };

  const closeConfirmDialog = () => {
    setConfirmDialog({open: false, subscriptionId: null, status: null});
  };

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
          <h1 className="text-3xl font-bold text-foreground">إدارة الاشتراكات</h1>
          <Button onClick={loadSubscriptions}>تحديث البيانات</Button>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-1/3">
            <Input
              placeholder="بحث عن طالب أو كورس..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full md:w-48">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="تصفية بالحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="pending">قيد الانتظار</SelectItem>
                <SelectItem value="active">مفعل</SelectItem>
                <SelectItem value="rejected">مرفوض</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {subscriptions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            لا توجد اشتراكات متاحة
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('student')}>
                    الطالب {sortField === 'student' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('course')}>
                    الكورس {sortField === 'course' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead>المستوى الدراسي</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('price')}>
                    السعر {sortField === 'price' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead>طريقة الدفع</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('date')}>
                    تاريخ الاشتراك {sortField === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map((subscription) => (
                  subscription && (
                    <TableRow key={subscription._id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{subscription.userId?.name || 'غير متوفر'}</div>
                          <div className="text-sm text-muted-foreground">{subscription.userId?.email || ''}</div>
                          <div className="text-sm text-muted-foreground">{subscription.userId?.phone || ''}</div>
                        </div>
                      </TableCell>
                      <TableCell>{subscription.courseId?.title || 'غير متوفر'}</TableCell>
                      <TableCell>{subscription.courseId?.educationalLevel.nameAr || 'غير متوفر'}</TableCell>
                      <TableCell>{subscription.courseId ? `${subscription.courseId.price} جنيه` : 'غير متوفر'}</TableCell>
                      <TableCell>{getPaymentMethodText(subscription.paymentMethod)}</TableCell>
                      <TableCell>{getStatusBadge(subscription.status)}</TableCell>
                      <TableCell>{new Date(subscription.subscribedAt).toLocaleDateString('ar-EG')}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {subscription.status === 'pending' && (
                            <>
                              <Button 
                                size="sm" 
                                onClick={() => openConfirmDialog(subscription._id, 'active')}
                              >
                                تفعيل
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => openConfirmDialog(subscription._id, 'rejected')}
                              >
                                رفض
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={closeConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد تحديث الحالة</DialogTitle>
            <DialogDescription>
              {confirmDialog.status === 'active' 
                ? 'هل أنت متأكد أنك تريد تفعيل هذا الاشتراك؟' 
                : 'هل أنت متأكد أنك تريد رفض هذا الاشتراك؟'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeConfirmDialog}>
              إلغاء
            </Button>
            <Button 
              onClick={() => {
                if (confirmDialog.subscriptionId && confirmDialog.status) {
                  handleUpdateStatus(confirmDialog.subscriptionId, confirmDialog.status);
                }
              }}
            >
              تأكيد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}