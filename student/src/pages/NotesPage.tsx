import { useState, useEffect } from 'react';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { BookOpen, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getUserNotes, createNoteOrder } from '@/services/notesService';
import { type Note } from '@/services/notesService';
import { useAuth } from '@/contexts/AuthContext';

export default function NotesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    studentPhone: '',
    guardianPhone: '',
    address: '',
    paymentMethod: 'cash',
  });

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const notesData = await getUserNotes();
      setNotes(notesData);
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyClick = (note: Note) => {
    setSelectedNote(note);
    setShowCheckout(true);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validatePhone = (phone: string) => {
    return /^01[0-9]{9}$/.test(phone);
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      toast({
        title: 'خطأ',
        description: 'برجاء إدخال الاسم',
        variant: 'destructive',
      });
      return;
    }

    if (!validatePhone(formData.studentPhone)) {
      toast({
        title: 'خطأ',
        description: 'رقم تليفون الطالب يجب أن يتكون من 11 رقم ويبدأ بـ 01',
        variant: 'destructive',
      });
      return;
    }

    if (!validatePhone(formData.guardianPhone)) {
      toast({
        title: 'خطأ',
        description: 'رقم تليفون ولي الأمر يجب أن يتكون من 11 رقم ويبدأ بـ 01',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.address.trim()) {
      toast({
        title: 'خطأ',
        description: 'برجاء إدخال العنوان',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedNote) {
      toast({
        title: 'خطأ',
        description: 'برجاء اختيار مذكرة',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Submit order
      await createNoteOrder({
        noteId: selectedNote._id,
        userId: user?.id || 'user_id_placeholder', // Use actual user ID
        name: formData.name,
        studentPhone: formData.studentPhone,
        guardianPhone: formData.guardianPhone,
        address: formData.address,
        paymentMethod: 'cash',
        status: 'pending',
        orderedAt: new Date().toISOString(),
      });

      toast({
        title: 'تم إرسال الطلب بنجاح',
        description: 'سنتواصل معك قريباً لتأكيد الطلب والتوصيل',
      });

      setShowCheckout(false);
      setFormData({
        name: '',
        studentPhone: '',
        guardianPhone: '',
        address: '',
        paymentMethod: 'cash',
      });
    } catch (error) {
      console.error('Error submitting order:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء إرسال الطلب. برجاء المحاولة مرة أخرى',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">جاري التحميل...</div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">المذكرات</h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <BookOpen className="w-5 h-5" />
            <span>{notes.length} مذكرة متاحة</span>
          </div>
        </div>

        {notes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            لا توجد مذكرات متاحة لمستواك الدراسي
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notes.map(note => (
              <article
                key={note._id}
                className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col h-full"
              >
                <div className="h-48 bg-muted overflow-hidden">
                  <img
                    src={note.image}
                    alt={`صورة ${note.title}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <div className="space-y-3 flex-grow">
                    <div className="text-xs text-accent font-medium">{note.year}</div>
                    <h3 className="text-lg font-bold text-foreground line-clamp-2 leading-tight">
                      {note.title}
                    </h3>
                    {note.courseId?.title && (
                      <div className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded inline-block">
                        كورس: {note.courseId.title}
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {note.description}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
                    <div className="text-2xl font-bold text-primary">
                      {note.price}
                      <span className="text-sm text-muted-foreground mr-1">ج.م</span>
                    </div>
                    <Button
                      onClick={() => handleBuyClick(note)}
                      className="gap-2 rounded-lg font-medium"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      اشتري الآن
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Checkout Dialog */}
        <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>إتمام طلب المذكرة</DialogTitle>
              <DialogDescription>
                {selectedNote?.title}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">الاسم الكامل</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="أدخل الاسم الكامل"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="studentPhone">تليفون الطالب</Label>
                <Input
                  id="studentPhone"
                  value={formData.studentPhone}
                  onChange={(e) => handleInputChange('studentPhone', e.target.value)}
                  placeholder="01XXXXXXXXX"
                  maxLength={11}
                />
                {formData.studentPhone && !validatePhone(formData.studentPhone) && (
                  <p className="text-xs text-destructive">
                    رقم التليفون يجب أن يتكون من 11 رقم ويبدأ بـ 01
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="guardianPhone">تليفون ولي الأمر</Label>
                <Input
                  id="guardianPhone"
                  value={formData.guardianPhone}
                  onChange={(e) => handleInputChange('guardianPhone', e.target.value)}
                  placeholder="01XXXXXXXXX"
                  maxLength={11}
                />
                {formData.guardianPhone && !validatePhone(formData.guardianPhone) && (
                  <p className="text-xs text-destructive">
                    رقم التليفون يجب أن يتكون من 11 رقم ويبدأ بـ 01
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">العنوان التفصيلي</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="أدخل العنوان التفصيلي للتوصيل"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>طريقة الدفع</Label>
                <RadioGroup
                  value={formData.paymentMethod}
                  onValueChange={(value) => handleInputChange('paymentMethod', value)}
                >
                  <div className="flex items-center space-x-2 space-x-reverse border border-border rounded-lg p-3">
                    <RadioGroupItem value="cash" id="cash" />
                    <Label htmlFor="cash" className="flex-1 cursor-pointer">
                      الدفع عند الاستلام
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="bg-muted rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>السعر:</span>
                  <span className="font-semibold">{selectedNote?.price} ج.م</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>رسوم التوصيل:</span>
                  <span className="font-semibold">20 ج.م</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between font-bold">
                  <span>الإجمالي:</span>
                  <span>{(selectedNote?.price || 0) + 20} ج.م</span>
                </div>
              </div>

              <Button onClick={handleSubmit} className="w-full">
                تأكيد الطلب
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}