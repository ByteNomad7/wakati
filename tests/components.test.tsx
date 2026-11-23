// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import en from "@/i18n/dictionaries/en";
import fr from "@/i18n/dictionaries/fr";
import { referenceCategories } from "@/lib/reference/categories";
import { referenceCities, referenceRegions } from "@/lib/reference/locations";
import { SearchForm } from "@/components/search/SearchForm";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ListingCard } from "@/components/listings/ListingCard";
import { EmptyState } from "@/components/listings/ListingStates";
import { BrowseByCity, HowItWorks } from "@/components/home/Sections";

afterEach(cleanup);

const catalog = {
  categories: referenceCategories(),
  cities: referenceCities(),
  regions: referenceRegions(),
};

describe("SearchForm", () => {
  it("submits a GET search to the localized search page with keyword, city and category", () => {
    render(<SearchForm variant="hero" locale="fr" dict={fr} {...catalog} />);
    const form = screen.getByRole("search", { name: fr.search.label });
    expect(form).toHaveAttribute("action", "/fr/search");
    expect(form).toHaveAttribute("method", "get");
    expect(within(form).getByRole("searchbox")).toHaveAttribute("name", "q");
    expect(within(form).getByRole("option", { name: "Tout le Cameroun" })).toHaveValue("");
    expect(within(form).getByRole("option", { name: "Voitures" })).toHaveValue("cars");
    expect(within(form).getByRole("button", { name: /Rechercher/ })).toHaveAttribute("type", "submit");
  });

  it("groups cities under their region so regions are never offered as cities", () => {
    const { container } = render(<SearchForm variant="hero" locale="en" dict={en} {...catalog} />);
    const group = container.querySelector('optgroup[label="South-West Region"]');
    expect([...group!.querySelectorAll("option")].map((o) => o.textContent)).toEqual(["Buea", "Limbe", "Kumba"]);
    const cityValues = [...container.querySelectorAll('select[name="city"] option')].map((o) => o.getAttribute("value"));
    expect(cityValues).not.toContain("littoral");
  });

  it("pre-fills values from the current query", () => {
    render(<SearchForm variant="hero" locale="en" dict={en} {...catalog} defaults={{ q: "fridge", city: "kribi" }} />);
    expect(screen.getByRole("searchbox")).toHaveValue("fridge");
    expect(screen.getByRole("option", { name: "Kribi" })).toHaveProperty("selected", true);
  });
});

describe("Footer", () => {
  it("links to business, support, policy and language pages", () => {
    render(<SiteFooter locale="en" dict={en} categories={catalog.categories} year={2026} />);
    expect(screen.getByRole("link", { name: "Terms of use" })).toHaveAttribute("href", "/en/legal/terms");
    expect(screen.getByRole("link", { name: "Privacy policy" })).toHaveAttribute("href", "/en/legal/privacy");
    expect(screen.getByRole("link", { name: "Prohibited items" })).toHaveAttribute("href", "/en/legal/prohibited-items");
    expect(screen.getByRole("link", { name: "Safety tips" })).toHaveAttribute("href", "/en/legal/safety");
    expect(screen.getByRole("link", { name: "Français" })).toHaveAttribute("href", "/fr");
    expect(screen.getByText("© 2026 Wakati. All rights reserved.")).toBeInTheDocument();
  });
});

describe("Homepage sections", () => {
  it("links each city to a shareable search URL and shows its region", () => {
    render(<BrowseByCity locale="fr" dict={fr} cities={catalog.cities} regions={catalog.regions} />);
    const link = screen.getByRole("link", { name: /Ngaoundéré/ });
    expect(link).toHaveAttribute("href", "/fr/search?city=ngaoundere");
    expect(within(link).getByText("Région Adamaoua")).toBeInTheDocument();
  });

  it("explains that Wakati does not handle payments", () => {
    render(<HowItWorks dict={en} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(screen.getByText(/does not handle payments/)).toBeInTheDocument();
  });
});

describe("Listings", () => {
  it("renders a listing card with an FCFA price, keeping the seller's original title", () => {
    render(
      <ListingCard
        locale="fr"
        dict={fr}
        listing={{
          id: "1", slug: "s", title: "Toyota Corolla 2015 – very clean", priceXaf: 4_200_000, isNegotiable: true,
          condition: "good", categoryId: "cars", citySlug: "douala", cityName: { en: "Douala", fr: "Douala" },
          neighbourhoodName: "Akwa", coverImageUrl: null, publishedAt: "2026-11-20T09:00:00Z", sellerType: "private",
        }}
      />,
    );
    expect(screen.getByText(/4\s200\s000\sFCFA/)).toBeInTheDocument();
    expect(screen.getByText("Négociable")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Toyota Corolla 2015 – very clean" })).toBeInTheDocument();
    expect(screen.getByText("Akwa, Douala")).toBeInTheDocument();
  });

  it("shows an honest empty state", () => {
    render(<EmptyState title={en.listings.emptyTitle} body={en.listings.emptyBody} />);
    expect(screen.getByRole("heading", { name: "No listings yet" })).toBeInTheDocument();
  });
});
