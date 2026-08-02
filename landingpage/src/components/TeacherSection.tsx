import { motion } from "framer-motion";
import { Award, BookOpen, Users, TrendingUp } from "lucide-react";
import teacherHero from "../../public/TeacherHero2.jpg";


const achievements = [
  {
    icon: Users,
    title: "500+ طالب",
    description: "طالب متفوق في جميع المراحل",
  },
  {
    icon: BookOpen,
    title: "50+ كورس",
    description: "كورسات تعليمية متخصصة",
  },
  {
    icon: Award,
    title: "15+ سنة",
    description: "خبرة في تدريس الرياضيات",
  },
  {
    icon: TrendingUp,
    title: "95%",
    description: "نسبة نجاح الطلاب",
  },
];

const TeacherSection = () => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <section id="about" className="py-20 bg-background overflow-x-hidden">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Teacher Image */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative w-full"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl w-full max-w-full">
              <img
                src={teacherHero}
                alt="المدرس"
                className="w-full h-auto object-cover max-w-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent" />
            </div>
            
    
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              لماذا تختارني كمدرس؟
            </h2>
            
            <p className="text-lg text-muted-foreground mb-6">
              مدرس رياضيات متخصص مع خبرة تزيد عن 15 عاماً في تدريس المراحل الإعدادية والثانوية.
              أسعى دائماً لتبسيط المفاهيم الرياضية المعقدة وجعلها سهلة الفهم لجميع الطلاب.
            </p>

            <p className="text-lg text-muted-foreground mb-8">
              منهجي التعليمي يركز على الفهم العميق وليس الحفظ، مما يساعد الطلاب على التفوق
              والثقة بأنفسهم في مادة الرياضيات. حققت نتائج متميزة مع مئات الطلاب الذين
              تحسنت درجاتهم بشكل ملحوظ.
            </p>

            {/* Achievements Grid */}
            <motion.div
              variants={container}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-6"
            >
              {achievements.map((achievement, index) => (
                <motion.div
                  key={index}
                  variants={item}
                  whileHover={{ scale: 1.05 }}
                  className="bg-card p-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  <achievement.icon className="text-primary mb-3" size={32} />
                  <h4 className="text-xl font-bold text-foreground mb-1">
                    {achievement.title}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {achievement.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default TeacherSection;