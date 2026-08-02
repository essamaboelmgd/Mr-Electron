import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { Play, Lock, CreditCard } from "lucide-react";
import VideoModal from "./VideoModal";

const stages = [
  "الصف الأول الإعدادي",
  "الصف الثاني الإعدادي",
  "الصف الثالث الإعدادي",
  "الصف الأول الثانوي",
  "الصف الثاني الثانوي",
  "الصف الثالث الثانوي",
];

const paidCoursesData: Record<string, Array<{ title: string; description: string; videoId: string }>> = {
  "الصف الأول الإعدادي": [
    { title: "الأعداد الصحيحة المدفوعة", description: "فهم الأعداد الموجبة والسالبة بشكل متقدم", videoId: "dQw4w9WgXcQ" },
    { title: "الكسور العادية المدفوعة", description: "العمليات على الكسور بتمارين إضافية", videoId: "dQw4w9WgXcQ" },
    { title: "المعادلات البسيطة المدفوعة", description: "حل المعادلات من الدرجة الأولى مع تمارين", videoId: "dQw4w9WgXcQ" },
  ],
  "الصف الثاني الإعدادي": [
    { title: "الأعداد النسبية المدفوعة", description: "التعامل مع الكسور والأعداد العشرية متقدم", videoId: "dQw4w9WgXcQ" },
    { title: "التناسب المدفوع", description: "النسبة والتناسب الطردي والعكسي مع أمثلة", videoId: "dQw4w9WgXcQ" },
    { title: "المثلثات المدفوعة", description: "خصائص المثلثات وأنواعها مع تمارين", videoId: "dQw4w9WgXcQ" },
  ],
  "الصف الثالث الإعدادي": [
    { title: "الجذور التربيعية المدفوعة", description: "حساب الجذور والأعداد غير النسبية متقدم", videoId: "dQw4w9WgXcQ" },
    { title: "نظرية فيثاغورس المدفوعة", description: "تطبيقات نظرية فيثاغورس مع تمارين", videoId: "dQw4w9WgXcQ" },
    { title: "الإحصاء المدفوع", description: "المتوسط الحسابي والمنوال والوسيط متقدم", videoId: "dQw4w9WgXcQ" },
  ],
  "الصف الأول الثانوي": [
    { title: "الدوال المدفوعة", description: "مفهوم الدالة وأنواعها مع تطبيقات", videoId: "dQw4w9WgXcQ" },
    { title: "المتتابعات المدفوعة", description: "المتتابعات الحسابية والهندسية متقدم", videoId: "dQw4w9WgXcQ" },
    { title: "المثلثات الحادة المدفوعة", description: "النسب المثلثية مع تمارين", videoId: "dQw4w9WgXcQ" },
  ],
  "الصف الثاني الثانوي": [
    { title: "التفاضل المدفوع", description: "النهايات والاشتقاق مع أمثلة", videoId: "dQw4w9WgXcQ" },
    { title: "التكامل المدفوع", description: "التكامل غير المحدود والمحدود متقدم", videoId: "dQw4w9WgXcQ" },
    { title: "الهندسة التحليلية المدفوعة", description: "معادلة الخط المستقيم والدائرة مع تمارين", videoId: "dQw4w9WgXcQ" },
  ],
  "الصف الثالث الثانوي": [
    { title: "التفاضل المتقدم المدفوع", description: "تطبيقات التفاضل مع تمارين", videoId: "dQw4w9WgXcQ" },
    { title: "التكامل المتقدم المدفوع", description: "التكامل بالتعويض والتجزئة متقدم", videoId: "dQw4w9WgXcQ" },
    { title: "الاحتمالات المدفوعة", description: "نظرية الاحتمالات وتطبيقاتها مع أمثلة", videoId: "dQw4w9WgXcQ" },
  ],
};

const PaidCourseContent = () => {
  const [selectedStage, setSelectedStage] = useState(stages[0]);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [showSubscriptionMessage, setShowSubscriptionMessage] = useState(false);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  const handleCourseClick = (videoId: string) => {
    // Show subscription message instead of playing video directly
    setShowSubscriptionMessage(true);
  };

  return (
    <section id="paid-courses" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-accent text-foreground px-4 py-2 rounded-full mb-4">
            <CreditCard size={20} />
            <span className="font-bold">محتوى مدفوع - يتطلب اشتراك</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            الكورسات المدفوعة
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            مجموعة متنوعة من الدروس المدفوعة لجميع المراحل الدراسية
          </p>
        </motion.div>

        {/* Stage Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-3 mb-12"
        >
          {stages.map((stage) => (
            <Button
              key={stage}
              onClick={() => setSelectedStage(stage)}
              variant={selectedStage === stage ? "default" : "outline"}
              className={
                selectedStage === stage
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "hover:bg-primary/10"
              }
            >
              {stage}
            </Button>
          ))}
        </motion.div>

        {/* Courses Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {paidCoursesData[selectedStage].map((course, index) => (
            <motion.div
              key={index}
              variants={item}
              whileHover={{ y: -8 }}
              className="bg-card rounded-xl shadow-lg hover:shadow-2xl transition-all overflow-hidden group relative"
            >
              {/* Subscription indicator */}
              <div className="absolute top-3 right-3 bg-accent text-foreground rounded-full p-2 z-10">
                <Lock size={20} />
              </div>
              
              <div className="relative h-48 bg-gradient-to-br from-primary/80 to-secondary/80 flex items-center justify-center">
                <Lock className="text-white" size={64} />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Button
                    onClick={() => handleCourseClick(course.videoId)}
                    size="lg"
                    className="bg-accent text-foreground hover:bg-accent/90 rounded-full"
                  >
                    <CreditCard className="ml-2" size={20} />
                    يتطلب اشتراك
                  </Button>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
                  {course.title}
                  <span className="bg-accent text-xs text-foreground px-2 py-1 rounded">مدفوع</span>
                </h3>
                <p className="text-muted-foreground mb-4">{course.description}</p>
                <Button
                  onClick={() => handleCourseClick(course.videoId)}
                  variant="outline"
                  className="w-full"
                >
                  <Lock className="ml-2" size={18} />
                  اشترك للوصول
                </Button>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Subscription Message Modal */}
        {showSubscriptionMessage && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-card rounded-xl shadow-2xl p-8 max-w-md w-full"
            >
              <div className="text-center">
                <div className="bg-accent/20 text-accent w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CreditCard size={32} />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">يتطلب اشتراك</h3>
                <p className="text-muted-foreground mb-6">
                  هذا المحتوى متاح فقط لمشتركي الكورسات المدفوعة. يرجى الاشتراك للوصول إلى جميع الدروس.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => setShowSubscriptionMessage(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    إغلاق
                  </Button>
                  <Button
                    onClick={() => {
                      // Redirect to login URL from environment variables
                      const loginUrl = import.meta.env.VITE_LOGIN_URL || "/login";
                      window.location.href = loginUrl;
                    }}
                    className="flex-1 bg-accent text-foreground hover:bg-accent/90"
                  >
                    <CreditCard className="ml-2" size={18} />
                    اشترك الآن
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      <VideoModal
        isOpen={!!selectedVideo}
        onClose={() => setSelectedVideo(null)}
        videoId={selectedVideo || ""}
      />
    </section>
  );
};

export default PaidCourseContent;