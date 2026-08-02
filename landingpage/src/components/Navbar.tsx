import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { Menu, X, GraduationCap } from "lucide-react";
import Logo from "../../public/logo3.png";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "الرئيسية", href: "#home" },
    { name: "الكورسات المجانية", href: "#free-courses" },
    { name: "الكورسات المدفوعة", href: "#paid-courses" },
    { name: "عن المدرس", href: "#about" },
  ];

  // Get URLs from environment variables
  const loginUrl = import.meta.env.VITE_LOGIN_URL || "/login";
  const signupUrl = import.meta.env.VITE_SIGNUP_URL || "/register";

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-primary/95 backdrop-blur-sm shadow-lg"
          : "bg-gradient-to-b from-primary/80 to-transparent"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Auth Buttons - Desktop */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="outline" size="sm" className=" text-red-400 border-white/50 hover:bg-white hover:text-primary" asChild>
              <a href={loginUrl}>
                تسجيل دخول
              </a>
            </Button>
            <Button size="sm" className="bg-accent text-foreground hover:bg-accent/90" asChild>
              <a href={signupUrl}>
                إنشاء حساب
              </a>
            </Button>
          </div>

          {/* Nav Links - Desktop */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-white hover:text-accent transition-colors font-semibold"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Logo */}
          <div className="flex items-center gap-2">
            <img src={Logo} alt="Logo" className="w-36 h-36" />
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-white p-2"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden pb-6 border-t border-white/20 mt-2 text-center bg-gradient-to-b from-primary/95 to-primary/80"
          >
            <div className="flex flex-col gap-4 mt-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-white hover:text-accent transition-colors font-semibold"
                >
                  {link.name}
                </a>
              ))}
              <div className="flex flex-col gap-2 mt-4">
                <Button variant="outline" size="sm" className="border-white/50 hover:bg-white hover:text-primary bg-white" asChild>
                  <a href={loginUrl}>
                    تسجيل دخول
                  </a>
                </Button>
                <Button size="sm" className="bg-accent text-foreground hover:bg-accent/90" asChild>
                  <a href={signupUrl}>
                    إنشاء حساب
                  </a>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
};

export default Navbar;