import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { ResourceCategoryList, ResourceTypeList } from "@/components/resources/ResourceCategoryList";
import { ComingSoonBadge } from "@/components/resources/ComingSoonBadge";

export async function ResourcesTeaserSection() {
  const t = await getTranslations("home.resources");
  const tRoot = await getTranslations();
  const categories = tRoot.raw("resourceCategories") as string[];
  const types = tRoot.raw("resourceTypes") as string[];

  return (
    <section className="relative z-[2] flex flex-col items-center px-6 pb-16 sm:px-10 sm:pb-24 lg:px-[120px] lg:pb-[150px]">
      <Container className="!px-0" narrow>
        <div className="mx-auto mb-9 max-w-xl text-center sm:mb-12">
          <h2 className="font-heading text-2xl font-semibold leading-[1.25] text-aff-text sm:text-[38px]">
            {t("headline")}
          </h2>
        </div>
      </Container>
      <Container className="!px-0" narrow>
        <div className="mx-auto mb-6 max-w-[1000px]">
          <ResourceCategoryList categories={categories} />
        </div>
        <div className="mx-auto mb-5 max-w-[820px]">
          <ResourceTypeList types={types} />
        </div>
      </Container>
      <ComingSoonBadge label={t("comingSoon")} />
    </section>
  );
}
