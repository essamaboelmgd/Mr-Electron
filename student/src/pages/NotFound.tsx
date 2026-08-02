import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, Search } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center max-w-md px-4">
        <div className="text-9xl font-bold text-accent mb-4">404</div>
        <h1 className="text-3xl font-bold text-foreground mb-4">الصفحة غير موجودة</h1>
        <p className="text-lg text-muted-foreground mb-8">
          عذراً، الصفحة التي تبحث عنها غير متاحة أو تم نقلها
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => navigate('/dashboard')} className="gap-2">
            <Home className="w-4 h-4" />
            العودة للرئيسية
          </Button>
          <Button variant="outline" onClick={() => navigate('/courses')} className="gap-2">
            <Search className="w-4 h-4" />
            تصفح الكورسات
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
