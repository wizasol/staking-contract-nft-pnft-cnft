import Footer from "@/components/navigation/Footer";
import Cards from "@/components/sections/Cards";
import Description from "@/components/sections/Description";
import Hero from "@/components/sections/Hero";
import MarqueeSection from "@/components/sections/MarqueeSection";
import Preloader from "@/components/sections/Preloader";
import Roadmap from "@/components/sections/Roadmap";
import Wallet from "@/components/sections/Wallet";
import Image from "next/image";

export default async function Home() {
  return (
    <>
      <main>
        <Preloader />
        <div className="home-content transition-all duration-1000 delay-500 opacity-0">
          <Hero />
          <Description />
          <Cards />
          <Roadmap />
          <div className="w-full lg:pb-8">
            <Image
              src="/img/divisore.png"
              alt="Bozo"
              width={2560}
              height={1440}
              className=""
            />
          </div>
          <MarqueeSection />
          <Wallet />
        </div>
      </main>
      <Footer />
    </>
  );
}
