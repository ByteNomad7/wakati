/**
 * English UI strings. This file defines the dictionary shape; the French
 * dictionary must satisfy the same type, so a missing key fails type checking.
 * User-generated content (listing titles, descriptions) is never translated here.
 */
import { errorMessages } from "./errors";

const en = {
  meta: {
    siteName: "Wakati",
    tagline: "Buy • Sell • Find Locally",
    homeTitle: "Wakati – Buy, sell and find locally in Cameroon",
    homeDescription:
      "Wakati is a classifieds marketplace for Cameroon. Discover vehicles, property, electronics, furniture, services and more from people near you.",
    searchTitle: "Search listings",
    categoryTitle: "{category} in Cameroon",
    categoryDescription:
      "Browse {category} listings from people and businesses across Cameroon on Wakati.",
  },
  nav: {
    skipToContent: "Skip to main content",
    primary: "Main navigation",
    categories: "Categories",
    allCategories: "All categories",
    postAd: "Post an ad",
    login: "Log in",
    register: "Register",
    favorites: "Favourites",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    language: "Language",
    switchLanguage: "Changer la langue en français",
    home: "Home",
    account: "Account",
  },
  search: {
    label: "Search Wakati",
    placeholder: "What are you looking for?",
    keyword: "Keyword",
    city: "City",
    allCities: "All of Cameroon",
    category: "Category",
    allCategories: "All categories",
    allInCategory: "All in {category}",
    submit: "Search",
    resultsTitle: "Search results",
    resultsFor: "Results for “{query}”",
    inCity: "in {city}",
    inCategory: "in {category}",
    sort: "Sort by",
    sortNewest: "Newest",
    sortPriceAsc: "Price: low to high",
    sortPriceDesc: "Price: high to low",
    minPrice: "Min price (FCFA)",
    maxPrice: "Max price (FCFA)",
    resultCount: "{count} listings",
    resultCountOne: "1 listing",
    previous: "Previous",
    next: "Next",
    pageOf: "Page {page} of {total}",
    invalidQuery: "Some filters were not valid and have been ignored.",
  },
  hero: {
    title: "Find what you need. Sell what you don't.",
    subtitle:
      "Discover vehicles, property, electronics, furniture, services and more from people across Cameroon.",
  },
  home: {
    popularCategories: "Popular categories",
    popularCategoriesLead: "Start browsing from the categories people use most.",
    seeAllCategories: "See all categories",
    latestListings: "Latest listings",
    latestListingsLead: "Fresh ads from sellers across Cameroon.",
    featuredListings: "Featured listings",
    browseByCity: "Browse by city",
    browseByCityLead: "Find buyers and sellers close to you.",
    viewAll: "View all",
  },
  listings: {
    negotiable: "Negotiable",
    noImage: "No photo",
    postedOn: "Posted {date}",
    emptyTitle: "No listings yet",
    emptyBody:
      "Wakati is just getting started. Be one of the first to post an ad and reach buyers in your city.",
    emptySearchTitle: "No listings match your search",
    emptySearchBody:
      "Try a different keyword, choose another city, or remove some filters.",
    clearFilters: "Clear filters",
    placeholderBadge: "Layout placeholder",
    placeholderNote:
      "Development preview only. These boxes show card layout and are not real listings.",
    businessSeller: "Business",
    privateSeller: "Private seller",
  },
  howItWorks: {
    title: "How Wakati works",
    lead: "Wakati connects buyers and sellers. Deals are agreed directly between you.",
    steps: [
      {
        title: "Post or search",
        body: "Create a free ad with photos, a price in FCFA and your city, or search for what you need.",
      },
      {
        title: "Connect directly",
        body: "Buyers contact sellers using the contact options each seller chooses to share.",
      },
      {
        title: "Meet and decide",
        body: "Inspect the item in person, agree on the price, and complete the deal on your terms.",
      },
    ],
    note: "Wakati does not handle payments, delivery or escrow.",
  },
  safety: {
    title: "Stay safe when buying and selling",
    lead: "A few simple habits go a long way.",
    tips: [
      "Meet in a busy public place during the day, and bring someone with you if you can.",
      "Inspect the item carefully before paying. Check that documents match for vehicles and property.",
      "Never send money or Mobile Money in advance to someone you have not met.",
      "Do not share passwords, PINs or verification codes with anyone.",
      "Report listings that look suspicious so our team can review them.",
    ],
    readMore: "Read our safety tips",
  },
  postCta: {
    title: "Post your first ad",
    body: "Have something to sell or a service to offer? Reach people in your city.",
    button: "Post an ad",
  },
  cities: {
    regionLabel: "{region} Region",
  },
  category: {
    subcategories: "Subcategories",
    listingsIn: "Listings in {category}",
    reviewNotice:
      "Ads in this category are reviewed by our team before they appear publicly.",
    breadcrumb: "Breadcrumb",
  },
  footer: {
    about:
      "Wakati is a classifieds marketplace connecting buyers and sellers across Cameroon.",
    marketplace: "Marketplace",
    browseCategories: "Browse categories",
    support: "Support",
    safetyTips: "Safety tips",
    contact: "Contact support",
    legal: "Legal",
    terms: "Terms of use",
    privacy: "Privacy policy",
    prohibited: "Prohibited items",
    languages: "Languages",
    rights: "© {year} Wakati. All rights reserved.",
    intermediary:
      "Wakati is an intermediary and is not a party to transactions between users.",
  },
  comingSoon: {
    badge: "Coming in the next release",
    loginTitle: "Log in",
    registerTitle: "Create an account",
    favoritesTitle: "Favourites",
    postAdTitle: "Post an ad",
    body: "This part of Wakati is being built and is not available yet. You can browse categories and search in the meantime.",
    backHome: "Back to the homepage",
  },
  legal: {
    draftBanner: "Draft – pending legal review",
    draftBody:
      "This document is a placeholder. It has not been approved and does not yet set out Wakati's binding terms or practices.",
    lastUpdated: "Status: draft placeholder",
    docs: {
      terms: {
        title: "Terms of use",
        sections: [
          "Who operates Wakati and how to contact the operator",
          "Wakati's role as an intermediary between buyers and sellers",
          "Account eligibility and responsibilities",
          "Rules for posting listings and acceptable content",
          "Moderation, removal of listings and account restrictions",
          "Limitation of liability",
          "Governing law and dispute resolution",
        ],
      },
      privacy: {
        title: "Privacy policy",
        sections: [
          "Data controller identity and contact details",
          "Personal data collected (account, listings, contact numbers, device data)",
          "Purposes and legal bases for processing",
          "How contact details are shown to other users, and consent",
          "Retention periods",
          "Data sharing and hosting providers",
          "Your rights and how to exercise them",
        ],
      },
      safety: {
        title: "Safety tips",
        sections: [
          "Meeting buyers and sellers safely",
          "Inspecting items, vehicles and property documents",
          "Avoiding advance-payment and Mobile Money scams",
          "Protecting your account and personal information",
          "How to report a suspicious listing or user",
        ],
      },
      "prohibited-items": {
        title: "Prohibited and restricted items",
        sections: [
          "Items that may never be listed",
          "Regulated items that require review or are restricted",
          "Job listings: eligibility rules",
          "Consequences of listing prohibited items",
        ],
      },
    },
    outlineHeading: "Planned sections (to be written and approved)",
  },
  errors: errorMessages.en,
  common: {
    loading: "Loading…",
    devDataNotice:
      "Development notice: the listing database is not connected (Supabase environment variables are missing). Showing reference data only.",
  },
};

type Widen<T> = T extends string
  ? string
  : T extends ReadonlyArray<infer U>
    ? ReadonlyArray<Widen<U>>
    : T extends object
      ? { [K in keyof T]: Widen<T[K]> }
      : T;

export type Dictionary = Widen<typeof en>;

export default en satisfies Dictionary;
