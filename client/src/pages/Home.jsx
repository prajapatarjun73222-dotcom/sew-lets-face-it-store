import Hero from '../components/home/Hero';
import ShopByCategory from '../components/home/ShopByCategory';
import FeaturedCollection from '../components/home/FeaturedCollection';
import BrandBanner from '../components/home/BrandBanner';
import BrandStory from '../components/home/BrandStory';
import CustomBanner from '../components/home/CustomBanner';
import Craftsmanship from '../components/home/Craftsmanship';
import InstagramGallery from '../components/home/InstagramGallery';
import Newsletter from '../components/home/Newsletter';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function Home() {
  useDocumentTitle();
  return (
    <>
      <Hero />
      <ShopByCategory />
      <FeaturedCollection />
      <BrandStory />
      <CustomBanner />
      <Craftsmanship />
      <InstagramGallery />
      <BrandBanner />
      <Newsletter />
    </>
  );
}
