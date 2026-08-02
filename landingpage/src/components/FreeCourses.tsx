import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { Play, BookOpen } from "lucide-react";
import VideoModal from "./VideoModal";

const stages = [
  "الصف الأول الإعدادي",
  "الصف الثاني الإعدادي",
  "الصف الثالث الإعدادي",
  "الصف الأول الثانوي",
  "الصف الثاني الثانوي",
  "الصف الثالث الثانوي",
];

const coursesData: Record<string, Array<{ title: string; description: string; videoId: string }>> = {
  "الصف الأول الإعدادي": [
    { title: "الأعداد الصحيحة", description: "فهم الأعداد الموجبة والسالبة", videoId: "dQw4w9WgXcQ" },
    { title: "الكسور العادية", description: "العمليات على الكسور", videoId: "dQw4w9WgXcQ" },
    { title: "المعادلات البسيطة", description: "حل المعادلات من الدرجة الأولى", videoId: "dQw4w9WgXcQ" },
  ],
  "الصف الثاني الإعدادي": [
    { title: "الأعداد النسبية", description: "التعامل مع الكسور والأعداد العشرية", videoId: "dQw4w9WgXcQ" },
    { title: "التناسب", description: "النسبة والتناسب الطردي والعكسي", videoId: "dQw4w9WgXcQ" },
    { title: "المثلثات", description: "خصائص المثلثات وأنواعها", videoId: "dQw4w9WgXcQ" },
  ],
  "الصف الثالث الإعدادي": [
    { title: "الجذور التربيعية", description: "حساب الجذور والأعداد غير النسبية", videoId: "dQw4w9WgXcQ" },
    { title: "نظرية فيثاغورس", description: "تطبيقات نظرية فيثاغورس", videoId: "dQw4w9WgXcQ" },
    { title: "الإحصاء", description: "المتوسط الحسابي والمنوال والوسيط", videoId: "dQw4w9WgXcQ" },
  ],
  "الصف الأول الثانوي": [
    { title: "الدوال", description: "مفهوم الدالة وأنواعها", videoId: "dQw4w9WgXcQ" },
    { title: "المتتابعات", description: "المتتابعات الحسابية والهندسية", videoId: "dQw4w9WgXcQ" },
    { title: "المثلثات الحادة", description: "النسب المثلثية", videoId: "dQw4w9WgXcQ" },
  ],
  "الصف الثاني الثانوي": [
    { title: "التفاضل", description: "النهايات والاشتقاق", videoId: "dQw4w9WgXcQ" },
    { title: "التكامل", description: "التكامل غير المحدود والمحدود", videoId: "dQw4w9WgXcQ" },
    { title: "الهندسة التحليلية", description: "معادلة الخط المستقيم والدائرة", videoId: "dQw4w9WgXcQ" },
  ],
  "الصف الثالث الثانوي": [
    { title: "التفاضل المتقدم", description: "تطبيقات التفاضل", videoId: "dQw4w9WgXcQ" },
    { title: "التكامل المتقدم", description: "التكامل بالتعويض والتجزئة", videoId: "dQw4w9WgXcQ" },
    { title: "الاحتمالات", description: "نظرية الاحتمالات وتطبيقاتها", videoId: "dQw4w9WgXcQ" },
  ],
};

const FreeCourses = () => {
  const [selectedStage, setSelectedStage] = useState(stages[0]);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

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

  return (
    <section id="free-courses" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            الكورسات المجانية
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            مجموعة متنوعة من الدروس المجانية لجميع المراحل الدراسية
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
          {coursesData[selectedStage].map((course, index) => (
            <motion.div
              key={index}
              variants={item}
              whileHover={{ y: -8 }}
              className="bg-card rounded-xl shadow-lg hover:shadow-2xl transition-all overflow-hidden group"
            >
              <div className="relative h-48 bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <BookOpen className="text-white" size={64} />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    onClick={() => setSelectedVideo(course.videoId)}
                    size="lg"
                    className="bg-accent text-foreground hover:bg-accent/90 rounded-full"
                  >
                    <Play className="ml-2" size={20} />
                    مشاهدة الدرس
                  </Button>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-foreground mb-2">{course.title}</h3>
                <p className="text-muted-foreground mb-4">{course.description}</p>
                <Button
                  onClick={() => setSelectedVideo(course.videoId)}
                  variant="outline"
                  className="w-full"
                >
                  <Play className="ml-2" size={18} />
                  مشاهدة
                </Button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <VideoModal
        isOpen={!!selectedVideo}
        onClose={() => setSelectedVideo(null)}
        videoId={selectedVideo || ""}
      />
    </section>
  );
};

export default FreeCourses;
