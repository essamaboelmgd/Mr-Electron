import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { register, setAuthToken, setAuthUser } from '@/services/authService';
import { getEducationalLevels } from '@/services/educationalLevelService';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    guardianPhone: '',
    gender: '' as '' | 'male' | 'female',
    educationalLevel: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [educationalLevels, setEducationalLevels] = useState<any[]>([]);

  // Fetch educational levels on component mount
  useEffect(() => {
    const fetchEducationalLevels = async () => {
      try {
        const response = await getEducationalLevels();
        setEducationalLevels(response.data);
      } catch (error) {
        console.error('Failed to fetch educational levels:', error);
        toast.error('فشل في تحميل المستويات الدراسية');
      }
    };

    fetchEducationalLevels();
  }, []);

  const validatePhone = (value: string, field: string) => {
    if (!value) return `${field} مطلوب`;
    if (!/^\d{11}$/.test(value)) return `${field} يجب أن يتكون من 11 رقم`;
    return '';
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'الاسم الكامل مطلوب';
    
    const phoneError = validatePhone(formData.phone, 'رقم تليفون الطالب');
    if (phoneError) newErrors.phone = phoneError;

    const guardianError = validatePhone(formData.guardianPhone, 'رقم تليفون ولي الأمر');
    if (guardianError) newErrors.guardianPhone = guardianError;

    if (!formData.educationalLevel) newErrors.educationalLevel = 'المستوي الدراسي مطلوب';
    
    if (!formData.gender) newErrors.gender = 'الجنس مطلوب';

    if (!formData.password) {
      newErrors.password = 'كلمة المرور مطلوبة';
    } else if (formData.password.length < 8) {
      newErrors.password = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'كلمات المرور غير متطابقة';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    try {
      const result = await register({
        name: formData.name,
        phone: formData.phone,
        guardianPhone: formData.guardianPhone,
        gender: formData.gender || 'male',
        educationalLevel: formData.educationalLevel,
        password: formData.password,
      });
      
      // Store token and user data in localStorage
      setAuthToken(result.token);
      setAuthUser(result.data.user);
      
      toast.success('تم إنشاء الحساب بنجاح');
      navigate('/dashboard');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'حدث خطأ أثناء إنشاء الحساب';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">genius</h1>
          <p className="text-sm text-muted-foreground">منصة تعليمية</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center">إنشاء حساب جديد</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">الاسم الكامل</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e => updateField('name', e.target.value)}
                placeholder="أدخل اسمك الكامل"
                className={errors.name ? 'border-danger' : ''}
              />
              {errors.name && <p className="text-sm text-danger mt-1">{errors.name}</p>}
            </div>

            <div>
              <Label htmlFor="phone">تليفون الطالب</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={e => updateField('phone', e.target.value)}
                placeholder="01XXXXXXXXX"
                maxLength={11}
                className={errors.phone ? 'border-danger' : ''}
              />
              {errors.phone && <p className="text-sm text-danger mt-1">{errors.phone}</p>}
            </div>

            <div>
              <Label htmlFor="guardianPhone">تليفون ولي الأمر</Label>
              <Input
                id="guardianPhone"
                type="tel"
                value={formData.guardianPhone}
                onChange={e => updateField('guardianPhone', e.target.value)}
                placeholder="01XXXXXXXXX"
                maxLength={11}
                className={errors.guardianPhone ? 'border-danger' : ''}
              />
              {errors.guardianPhone && <p className="text-sm text-danger mt-1">{errors.guardianPhone}</p>}
            </div>

            <div>
              <Label htmlFor="educationalLevel">المستوي الدراسي</Label>
              <Select value={formData.educationalLevel || undefined} onValueChange={value => updateField('educationalLevel', value)}>
                <SelectTrigger className={`w-full ${errors.educationalLevel ? 'border-danger' : ''}`}>
                  <SelectValue placeholder="اختر المستوي الدراسي" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {educationalLevels.map(level => (
                    <SelectItem key={level._id} value={level._id}>
                      {level.nameAr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.educationalLevel && <p className="text-sm text-danger mt-1">{errors.educationalLevel}</p>}
            </div>

            <div>
              <Label htmlFor="gender">الجنس</Label>
              <Select value={formData.gender || undefined} onValueChange={value => updateField('gender', value)}>
                <SelectTrigger className={`w-full ${errors.gender ? 'border-danger' : ''}`}>
                  <SelectValue placeholder="اختر الجنس" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="male">ذكر</SelectItem>
                  <SelectItem value="female">أنثى</SelectItem>
                </SelectContent>
              </Select>
              {errors.gender && <p className="text-sm text-danger mt-1">{errors.gender}</p>}
            </div>

            <div>
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={e => updateField('password', e.target.value)}
                placeholder="8 أحرف على الأقل"
                className={errors.password ? 'border-danger' : ''}
              />
              {errors.password && <p className="text-sm text-danger mt-1">{errors.password}</p>}
            </div>

            <div>
              <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={e => updateField('confirmPassword', e.target.value)}
                placeholder="أعد إدخال كلمة المرور"
                className={errors.confirmPassword ? 'border-danger' : ''}
              />
              {errors.confirmPassword && <p className="text-sm text-danger mt-1">{errors.confirmPassword}</p>}
            </div>

            <Button 
              type="submit" 
              className="w-full hover:scale-105 transition-all duration-200" 
              disabled={loading}
            >
              {loading ? 'جاري التحميل...' : 'إنشاء حساب'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Button 
              type="button" 
              variant="outline" 
              className="w-full bg-background text-foreground border border-primary hover:bg-primary/10 hover:scale-105 transition-all duration-200" 
              onClick={() => navigate('/login')}
            >
              لديك حساب بالفعل؟ تسجيل دخول
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}