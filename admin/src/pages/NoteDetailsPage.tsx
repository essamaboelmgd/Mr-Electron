import { useEffect, useState } from 'react';
import { useParams, useNavigate } from '@/lib/router';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { getNoteById } from '@/services/notesService';
import { ArrowLeft } from 'lucide-react';

interface Note {
  _id: string;
  title: string;
  educationalLevel: string;
  courseId: string;
  description: string;
  price: number;
  image: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function NoteDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadNoteDetails(id);
    }
  }, [id]);

  const loadNoteDetails = async (noteId: string) => {
    try {
      setLoading(true);
      const noteData = await getNoteById(noteId);
      setNote(noteData);
    } catch (error) {
      console.error('Error loading note details:', error);
      toast.error('حدث خطأ أثناء تحميل تفاصيل المذكرة');
    } finally {
      setLoading(false);
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

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return <Badge className="bg-green-500">مفعل</Badge>;
    }
    return <Badge className="bg-red-500">غير مفعل</Badge>;
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

  if (!note) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-screen">
          <div>لم يتم العثور على المذكرة</div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            العودة
          </Button>
          <h1 className="text-3xl font-bold text-foreground">تفاصيل المذكرة</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4">{note.title}</h2>
              <div className="prose max-w-none">
                <p className="text-muted-foreground whitespace-pre-wrap">{note.description}</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">معلومات المذكرة</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">المرحلة الدراسية</p>
                  <p className="font-medium">{note.educationalLevel}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">السعر</p>
                  <p className="font-medium">{note.price} ج.م</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">الحالة</p>
                  <div className="mt-1">
                    {getStatusBadge(note.isActive)}
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">تاريخ الإنشاء</p>
                  <p className="font-medium">{formatDate(note.createdAt)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">آخر تحديث</p>
                  <p className="font-medium">{formatDate(note.updatedAt)}</p>
                </div>
              </div>
            </div>

            {note.image && (
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">صورة المذكرة</h3>
                <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                  <img 
                    src={note.image} 
                    alt={note.title} 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
