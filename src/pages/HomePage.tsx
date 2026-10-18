import Navbar from '../components/Navbar';
import HeroSection from '../sections/HeroSection';
import OriginSection from '../sections/OriginSection';
import ScrollSlideshowSection from '../sections/ScrollSlideshowSection';
import TotemSection from '../sections/TotemSection';
import FieldSection from '../sections/FieldSection';
import GallerySection from '../sections/GallerySection';
import GuestbookSection from '../sections/GuestbookSection';
import FooterSection from '../sections/FooterSection';

export default function HomePage() {
  return (
    <div className="relative">
      <Navbar />
      <main>
        <HeroSection />
        <OriginSection />
        <ScrollSlideshowSection />
        <TotemSection />
        <FieldSection />
        <GallerySection />
        <GuestbookSection />
      </main>
      <FooterSection />
    </div>
  );
}
