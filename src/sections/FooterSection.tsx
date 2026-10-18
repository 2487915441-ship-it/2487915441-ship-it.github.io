import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';

export default function FooterSection() {
  const { t } = useI18n();

  const homeNavItems = [
    { label: t.nav.origin, id: 'origin' },
    { label: t.nav.totem, id: 'totem' },
    { label: t.nav.field, id: 'field' },
    { label: t.nav.gallery, id: 'gallery' },
    { label: t.nav.guestbook, id: 'guestbook' },
  ];

  return (
    <footer className="relative w-full bg-[#0a0a0a] border-t border-bone/10">
      {/* Main footer content */}
      <div className="max-w-[1400px] mx-auto px-8 lg:px-16 py-20 lg:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Brand column */}
          <div className="lg:col-span-5">
            <div className="mb-6">
              <img
                src="/images/user/vi-01.webp"
                alt={t.footer.logoAlt}
                className="h-16 w-auto"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
            </div>
            <p className="font-accent text-[14px] text-bronze/70 tracking-[0.15em] uppercase mb-6">
              {t.footer.slogan}
            </p>
            <p className="font-ui text-[14px] text-bone/50 leading-[1.8] max-w-md">
              {t.footer.brandText}
            </p>
          </div>

          {/* Navigation column */}
          <div className="lg:col-span-3 lg:col-start-7">
            <h4 className="font-ui text-[12px] text-bone/30 tracking-[0.3em] uppercase mb-6">
              {t.footer.navTitle}
            </h4>
            <ul className="space-y-4">
              {homeNavItems.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="font-ui text-[14px] text-bone/60 hover:text-bone transition-colors duration-300"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
              <li>
                <Link
                  to="/knowledge-graph"
                  className="font-ui text-[14px] text-bronze/60 hover:text-bronze transition-colors duration-300"
                >
                  {t.nav.graph}
                </Link>
              </li>
              <li>
                <Link
                  to="/thesis"
                  className="font-ui text-[14px] text-bronze/60 hover:text-bronze transition-colors duration-300"
                >
                  {t.nav.thesis}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact/Info column */}
          <div className="lg:col-span-3">
            <h4 className="font-ui text-[12px] text-bone/30 tracking-[0.3em] uppercase mb-6">
              {t.footer.infoTitle}
            </h4>
            <ul className="space-y-4">
              <li className="font-ui text-[14px] text-bone/60">
                {t.footer.infoOrigin}
              </li>
              <li className="font-ui text-[14px] text-bone/60">
                {t.footer.infoMission}
              </li>
              <li className="font-ui text-[14px] text-bone/60">
                {t.footer.infoTotem}
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-bone/10">
        <div className="max-w-[1400px] mx-auto px-8 lg:px-16 py-6 flex flex-col lg:flex-row items-center justify-between gap-4">
          <p className="font-ui text-[11px] text-bone/30 tracking-wider">
            &copy; {new Date().getFullYear()} {t.footer.rights}
          </p>
          <div className="flex items-center gap-6">
            <Link
              to="/admin"
              className="font-ui text-[11px] text-bone/25 hover:text-bronze/70 tracking-wider transition-colors duration-300"
            >
              {t.footer.admin}
            </Link>
            <p className="font-ui text-[11px] text-bone/20 tracking-wider">
              {t.footer.tagline}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
