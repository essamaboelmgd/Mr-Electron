import { MessageCircle } from 'lucide-react';

const whatsappUrl = 'https://wa.me/201062772291';

export const PlatformFooter = () => (
  <footer className="platform-footer">
    <span>Mr Electron · منصة العلوم</span>
    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label="التواصل مع Essam Abo Elmgd على واتساب">
      <MessageCircle size={15} aria-hidden="true" />
      <span>Developed by Essam Abo Elmgd</span>
    </a>
  </footer>
);
