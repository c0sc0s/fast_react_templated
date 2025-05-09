import { SiteHeader } from "@/components/Siteheader";
import { SectionCards } from "./SectionCards";
import { ChartAreaInteractive } from "./ChartArea";

// src/pages/Home.tsx
export default function Home() {
    return (
        <div className="rounded-lg bg-background ">
            <SiteHeader />
            <div className="flex flex-1 flex-col">
                <div className="@container/main flex flex-1 flex-col gap-2">
                    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                        <SectionCards />
                        <div className="px-4 lg:px-6">
                            <ChartAreaInteractive />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}