import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { Check, ArrowLeft } from "lucide-react";

const paidCourses = [
  {
    title: "الكورس الشامل - إعدادي",
    price: "999 جنيه",
    features: [
      "جميع دروس المرحلة الإعدادية",
      "50+ فيديو تعليمي",
      "اختبارات وتمارين تفاعلية",
      "دعم فني مباشر",
      "شهادة إتمام معتمدة",
    ],
  },
  {
    title: "الكورس الشامل - ثانوي",
    price: "1499 جنيه",
    features: [
      "جميع دروس المرحلة الثانوية",
      "100+ فيديو تعليمي",
      "مراجعات نهائية شاملة",
      "حصص أونلاين مباشرة",
      "ضمان النجاح والتفوق",
    ],
    featured: true,
  },
  {
    title: "كورس الثانوية العامة",
    price: "1999 جنيه",
    features: [
      "تحضير متكامل للثانوية العامة",
      "امتحانات محاكاة",
      "استراتيجيات حل الأسئلة",
      "متابعة فردية مستمرة",
      "ضمان درجات عالية",
    ],
  },
];

const PaidCourses = () => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  const handleViewAllCourses = () => {
    // Scroll to the paid course content section
    const element = document.getElementById("paid-course-content");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="paid-courses" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            الكورسات المدفوعة
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            استثمر في مستقبلك الأكاديمي مع كورساتنا المتخصصة
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto"
        >
          {paidCourses.map((course, index) => (
            <motion.div
              key={index}
              variants={item}
              whileHover={{ y: -12 }}
              className={`relative bg-card rounded-2xl shadow-lg hover:shadow-2xl transition-all overflow-hidden ${
                course.featured ? "border-4 border-accent" : ""
              }`}
            >
              {course.featured && (
                <div className="absolute top-4 left-4 bg-accent text-foreground px-4 py-1 rounded-full text-sm font-bold">
                  الأكثر مبيعاً
                </div>
              )}

              <div className="p-8">
                <h3 className="text-2xl font-bold text-foreground mb-4">{course.title}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-primary">{course.price}</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {course.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <Check className="text-success flex-shrink-0 mt-1" size={20} />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  size="lg"
                  className={`w-full ${
                    course.featured
                      ? "bg-accent text-foreground hover:bg-accent/90"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }`}
                >
                  اشترك الآن
                  <ArrowLeft className="mr-2" size={20} />
                </Button>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12"
        >
          <Button
            onClick={handleViewAllCourses}
            size="lg"
            variant="outline"
            className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
          >
            عرض جميع الكورسات المدفوعة
            <ArrowLeft className="mr-2" size={20} />
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default PaidCourses;