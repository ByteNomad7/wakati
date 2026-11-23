/**
 * Error strings live in their own small module so the client-side error
 * boundary can import them without shipping the full dictionaries.
 */
export const errorMessages = {
  en: {
    notFoundTitle: "Page not found",
    notFoundBody: "The page you are looking for does not exist or has moved.",
    genericTitle: "Something went wrong",
    genericBody: "We could not load this page. Please try again.",
    retry: "Try again",
    backHome: "Back to the homepage",
  },
  fr: {
    notFoundTitle: "Page introuvable",
    notFoundBody: "La page que vous recherchez n'existe pas ou a été déplacée.",
    genericTitle: "Une erreur est survenue",
    genericBody: "Impossible de charger cette page. Veuillez réessayer.",
    retry: "Réessayer",
    backHome: "Retour à l'accueil",
  },
};
