import DashboardSection from "@/components/dashboard/DashboardSection";
import Header from "@/components/dashboard/Header";
import SkeletonImage from "@/components/dashboard/SkeletonImage";
import SocialButtons from "@/components/dashboard/SocialButtons";
import WalletComponents from "@/components/dashboard/WalletComponents";

export default async function Dashboard() {
  return (
    <main className="select-none">
      <div className="w-screen md:h-screen px-7 md:p-7 flex flex-col-reverse md:flex-row">
        <div className="w-full md:w-1/3 h-full  py-7 md:py-0 flex flex-col gap-4 items-center md:items-start">
          <DashboardSection
            text="Loyalty Program"
            image="/img/dashboard/section1.jpeg"
            redirect="/dashboard/loyalty"
            index={0}
          />

          <DashboardSection
            text="Coming Soon"
            image="/img/dashboard/section2.jpeg"
            disabled
            redirect="#"
            index={1}
          />

          <DashboardSection
            text="Coming Soon"
            image="/img/dashboard/section3.jpeg"
            disabled
            redirect="#"
            index={2}
          />

          <DashboardSection
            text="Coming Soon"
            image="/img/dashboard/section4.jpeg"
            disabled
            redirect="#"
            index={3}
          />
        </div>
        <div className="w-full md:w-1/3 h-screen md:h-full min-h-screen md:min-h-0 flex flex-col relative items-center text-center pt-7 md:pt-0">
          <Header title="Dashboard" />
          <SkeletonImage />
        </div>
        <div className="w-full absolute top-[130px] left-0 md:static md:w-1/3 flex flex-col-reverse md:flex-col justify-between items-center gap-10 md:items-end">
          <WalletComponents />
          <SocialButtons />
        </div>
      </div>
    </main>
  );
}
