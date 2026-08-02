import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { ArrowLeft, Play } from "lucide-react";
import teacherHero from "../../public/TeacherHero.jpg";

const Hero = () => {
  // Get login URL from environment variables
  const loginUrl = import.meta.env.VITE_LOGIN_URL || "/login";

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat md:bg-fixed mobile-bg"
        style={{ backgroundImage: `url(${teacherHero})` }}
      />
      
      {/* Enhanced Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-primary/40 to-secondary/40" />

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-accent/10"
            style={{
              width: Math.random() * 200 + 100,
              height: Math.random() * 200 + 100,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [0, Math.random() * 100 - 50],
              y: [0, Math.random() * 100 - 50],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-5xl mx-auto"
        >
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-extrabold text-white mb- leading-tight"
          >
            رحلتك نحو التفوق في
            <span className="text-accent block mt-2 drop-shadow-lg">الرياضيات تبدا هنا</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-xl md:text-2xl text-white/90 mb-10 max-w-3xl mx-auto font-medium"
          >
            تعلم الرياضيات بطريقة مبسطة وممتعة
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
          >
            <Button
              size="lg"
              className="bg-accent text-foreground hover:bg-accent/90 text-lg px-8 py-6 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
              onClick={() => window.location.href = loginUrl}
            >
              ابدأ التعلم الآن
              <ArrowLeft className="mr-2" size={20} />
            </Button>
           
          </motion.div>

          {/* Enhanced Statistics */}
        
        </motion.div>
      </div>

      {/* Enhanced Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 1 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 rounded-full px-4 py-6 flex flex-col items-center"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-8 h-12 border-2 border-white/50 rounded-full flex items-start justify-center p-2 cursor-pointer"
        >
          <motion.div className="w-2 h-2 bg-white/50 rounded-full" />
        </motion.div>
        <div className="text-white/70 text-sm mt-2 text-center">مرر للأسفل</div>
      </motion.div>
    </section>
  );
};

export default Hero;