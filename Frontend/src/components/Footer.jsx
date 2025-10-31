import {
  Mail,
  Phone,
  MapPin,
  Instagram,
  Facebook,
  Twitter,
} from "lucide-react";
import LogoIcon from "./LogoIcon.jsx";

const Footer = () => {
  const footerLinks = [
    {
      title: "Combos",
      links: [
        { text: "Fiesta Patronal", url: "/combos/1" },
        { text: "Madrugada del 24", url: "/combos/2" },
        { text: "Estacional", url: "/combos/3" },
        { text: "Personalizar Combo", url: "/create-combo" },
        { text: "Todos los Combos", url: "/" },
      ],
    },
    {
      title: "Cuenta",
      links: [
        { text: "Mi Perfil", url: "/profile" },
        { text: "Mis Pedidos", url: "/orders" },
        { text: "Favoritos", url: "/favorites" },
        { text: "Historial", url: "/history" },
      ],
    },
    {
      title: "Soporte",
      links: [
        { text: "Centro de Ayuda", url: "/help" },
        { text: "Contacto", url: "/contact" },
        { text: "Términos de Uso", url: "/terms" },
        { text: "Política de Privacidad", url: "/privacy" },
      ],
    },
  ];

  return (
    <div className="px-6 md:px-16 lg:px-24 xl:px-32 mt-24 bg-sky-50">
      <div className="flex flex-col md:flex-row items-start justify-between gap-10 py-10 border-b border-sky-200 text-gray-600">
        {/* Logo y descripción */}
        <div className="max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <LogoIcon className="h-10 w-10 text-sky-500" aria-label="La Cazuela Chapina logo" />
            <div className="flex flex-col leading-tight">
              <span className="text-base font-semibold text-sky-500">La Cazuela</span>
              <span className="text-lg font-bold text-gray-800">Chapina</span>
            </div>
          </div>
          <p className="text-gray-600 leading-relaxed mb-6">
            Descubre nuestros combos tradicionales de tamales y bebidas guatemaltecas.
            Personaliza tu pedido con tamales por unidad, media docena o docena, y bebidas
            en vasos de 12oz o jarros de 1 litro. ¡Únete a nuestra comunidad gastronómica!
          </p>

          {/* Información de contacto */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-sky-500" />
              <span>info@lacazuelachapina.com</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-sky-500" />
              <span>+502 2222-2222</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-sky-500" />
              <span>Guatemala, Guatemala</span>
            </div>
          </div>
        </div>

        {/* Enlaces */}
        <div className="flex flex-wrap justify-between w-full md:w-[60%] gap-8">
          {footerLinks.map((section, index) => (
            <div key={index} className="min-w-[150px]">
              <h3 className="font-semibold text-base text-gray-800 mb-4">
                {section.title}
              </h3>
              <ul className="text-sm space-y-2">
                {section.links.map((link, i) => (
                  <li key={i}>
                      <a
                      href={link.url}
                      className="hover:text-sky-500 transition-colors duration-200"
                    >
                      {link.text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Footer inferior */}
      <div className="py-6 flex flex-col md:flex-row items-center justify-between">
        <p className="text-sm text-gray-500 mb-4 md:mb-0">
          Copyright {new Date().getFullYear()} © La Cazuela Chapina. Todos
          los derechos reservados.
        </p>

        {/* Redes sociales */}
        <div className="flex items-center gap-4">
          <a
            href="#"
            className="w-8 h-8 bg-sky-100 hover:bg-sky-200 rounded-full flex items-center justify-center transition-colors"
            aria-label="Facebook"
          >
            <Facebook className="w-4 h-4 text-sky-600" />
          </a>
          <a
            href="#"
            className="w-8 h-8 bg-sky-100 hover:bg-sky-200 rounded-full flex items-center justify-center transition-colors"
            aria-label="Instagram"
          >
            <Instagram className="w-4 h-4 text-sky-600" />
          </a>
          <a
            href="#"
            className="w-8 h-8 bg-sky-100 hover:bg-sky-200 rounded-full flex items-center justify-center transition-colors"
            aria-label="Twitter"
          >
            <Twitter className="w-4 h-4 text-sky-600" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default Footer;
