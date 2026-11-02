import { FaWhatsapp } from 'react-icons/fa';
import { whatsapp } from '@/app/lib/constants';

const WhatsAppFloatingButton = () => (
  <a
    href={whatsapp}
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Chat on WhatsApp"
    className="fixed bottom-25 right-5 z-50 p-3 rounded-full bg-green-500 text-white shadow-lg hover:shadow-xl transition-transform hover:scale-110"
  >
    <FaWhatsapp size={28} />
  </a>
);

export default WhatsAppFloatingButton;
