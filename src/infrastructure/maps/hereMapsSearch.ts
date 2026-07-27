export interface HereSearchResult {
  id: string;
  title: string;
  address: string;
  latitude: number;
  longitude: number;
}

interface HereSearchItem {
  id?: string;
  title?: string;
  resultType?: string;
  position?: { lat?: number; lng?: number };
  address?: { label?: string };
}

interface HereSearchResponse {
  items?: HereSearchItem[];
}

function mapSearchItems(response: HereSearchResponse): HereSearchResult[] {
  return (response.items ?? [])
    .filter(
      (item) =>
        Number.isFinite(item.position?.lat) &&
        Number.isFinite(item.position?.lng),
    )
    .map((item, index) => ({
      id: item.id ?? `${item.position!.lat},${item.position!.lng}-${index}`,
      title: item.title ?? item.address?.label ?? "Selected location",
      address: item.address?.label ?? item.title ?? "Address not available",
      latitude: item.position!.lat!,
      longitude: item.position!.lng!,
    }));
}

async function getJson(
  url: URL,
  signal?: AbortSignal,
): Promise<HereSearchResponse> {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(
      response.status === 429
        ? "HERE Maps request limit reached. Please try again shortly."
        : "HERE Maps location service is unavailable.",
    );
  }
  return response.json() as Promise<HereSearchResponse>;
}

export async function autosuggestHereLocations(
  query: string,
  latitude: number,
  longitude: number,
  apiKey: string,
  signal?: AbortSignal,
): Promise<HereSearchResult[]> {
  const url = new URL(
    "https://autosuggest.search.hereapi.com/v1/autosuggest",
  );
  url.searchParams.set("q", query);
  url.searchParams.set("at", `${latitude},${longitude}`);
  url.searchParams.set("limit", "5");
  url.searchParams.set("lang", "en-US");
  url.searchParams.set("apiKey", apiKey);
  return mapSearchItems(await getJson(url, signal));
}

export async function reverseGeocodeHereLocation(
  latitude: number,
  longitude: number,
  apiKey: string,
  signal?: AbortSignal,
): Promise<HereSearchResult | null> {
  const url = new URL(
    "https://revgeocode.search.hereapi.com/v1/revgeocode",
  );
  url.searchParams.set("at", `${latitude},${longitude}`);
  url.searchParams.set("limit", "1");
  url.searchParams.set("lang", "en-US");
  url.searchParams.set("apiKey", apiKey);
  return mapSearchItems(await getJson(url, signal))[0] ?? null;
}

