import { FeaturedExhibitions } from "@/components/FeaturedExhibitions";
import { FeaturedProjects } from "@/components/FeaturedProjects";
import { FeaturedArtists } from "@/components/FeaturedArtists";
import { Slider } from "@/components/Slider";
import { TerminalCTA } from "@/components/TerminalCTA";
import { QuickLink } from "@/components/Link";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { FEATURED_EXHIBITIONS, FEATURED_PROJECTS } from "@/app/lib/constants";

// Mark the page as static
export const dynamic = "force-static";

// If you need to revalidate the page periodically (optional)
export const revalidate = 3600; // revalidate every hour

async function getFeaturedData() {
  const { data: artists } = await supabase
    .from("artists")
    .select("*")
    .eq("live_in_production", true)
    .order("view_count", { ascending: false })
    .order("artist_name", { ascending: true })
    .limit(9);

  return {
    exhibitions: [...FEATURED_EXHIBITIONS],
    projects: [...FEATURED_PROJECTS],
    artists: artists || [],
  };
}

export default async function Home() {
  const { exhibitions, projects, artists } = await getFeaturedData();

  return (
    <>
      <section className="container">
        <div className="mb-[1.33vw]">
          <QuickLink
            href="/exhibitions"
            className="group flex items-center text-zinc-700 transition hover:text-zinc-950"
          >
            <h1>Exhibitions</h1>
            <ArrowRight
              className="-me-1 ms-1 mt-0.5 h-4 transition-transform group-hover:translate-x-1 lg:ms-2 lg:mt-1 lg:h-10"
              strokeWidth={1.75}
              aria-hidden="true"
            />
          </QuickLink>
        </div>
        <div className="relative w-full">
          <Slider slidesPerView={1}>
            {exhibitions.map((exhibition) => (
              <FeaturedExhibitions
                key={exhibition}
                exhibitions={[exhibition]}
              />
            ))}
          </Slider>
        </div>
      </section>

      <section className="container">
        <div className="mb-[1.33vw]">
          <QuickLink
            href="/artists"
            className="group flex items-center text-zinc-700 transition hover:text-zinc-950"
          >
            <h2>Featured Artists</h2>
            <ArrowRight
              className="-me-1 ms-1 mt-0.5 h-4 transition-transform group-hover:translate-x-1 lg:ms-2 lg:mt-1 lg:h-10"
              strokeWidth={1.75}
              aria-hidden="true"
            />
          </QuickLink>
        </div>
        <div className="relative w-full">
          <Slider slidesPerView={{ mobile: 2, tablet: 3, desktop: 4 }}>
            {artists.map((artist) => (
              <FeaturedArtists key={artist.id} artist={artist} />
            ))}
          </Slider>
        </div>
      </section>

      <section className="container">
        <div className="mb-[1.33vw]">
          <QuickLink
            href="/art-consulting"
            className="group flex items-center text-zinc-700 transition hover:text-zinc-950"
          >
            <h2>Art consulting</h2>
            <ArrowRight
              className="-me-1 ms-1 mt-0.5 h-4 transition-transform group-hover:translate-x-1 lg:ms-2 lg:mt-1 lg:h-10"
              strokeWidth={1.75}
              aria-hidden="true"
            />
          </QuickLink>
        </div>
        <div className="relative w-full">
          <Slider slidesPerView={{ mobile: 1, tablet: 2, desktop: 2 }}>
            {projects.map((project) => (
              <FeaturedProjects key={project} projects={[project]} />
            ))}
          </Slider>
        </div>
      </section>

      <TerminalCTA />
    </>
  );
}
