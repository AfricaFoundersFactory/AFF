import type { Resource, ResourceCategory, ResourceFormat, ResourceStage } from "@/types/resources";

export type ResourceFilters = {
  category?: ResourceCategory;
  format?: ResourceFormat;
  stage?: ResourceStage;
  search?: string;
};

export function filterResources(resources: Resource[], filters: ResourceFilters): Resource[] {
  return resources.filter((r) => {
    if (filters.category && r.category !== filters.category) return false;
    if (filters.format && r.format !== filters.format) return false;
    if (filters.stage && !r.stages.includes(filters.stage) && !r.stages.includes("ANY")) return false;
    if (filters.search) {
      const needle = filters.search.toLowerCase();
      const haystack = `${r.title.en} ${r.title.fr} ${r.description.en} ${r.description.fr}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });
}
