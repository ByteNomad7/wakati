import type { Dictionary } from "./en";
import { errorMessages } from "./errors";

/** Textes de l'interface en français. Doit respecter exactement le type Dictionary. */
const fr: Dictionary = {
  meta: {
    siteName: "Wakati",
    tagline: "Acheter • Vendre • Trouver près de chez vous",
    homeTitle: "Wakati – Achetez, vendez et trouvez près de chez vous au Cameroun",
    homeDescription:
      "Wakati est une plateforme de petites annonces pour le Cameroun. Découvrez véhicules, immobilier, électronique, meubles, services et plus encore près de chez vous.",
    searchTitle: "Rechercher des annonces",
    categoryTitle: "{category} au Cameroun",
    categoryDescription:
      "Parcourez les annonces {category} de particuliers et d'entreprises partout au Cameroun sur Wakati.",
  },
  nav: {
    skipToContent: "Aller au contenu principal",
    primary: "Navigation principale",
    categories: "Catégories",
    allCategories: "Toutes les catégories",
    postAd: "Publier une annonce",
    login: "Se connecter",
    register: "S'inscrire",
    favorites: "Favoris",
    openMenu: "Ouvrir le menu",
    closeMenu: "Fermer le menu",
    language: "Langue",
    switchLanguage: "Switch language to English",
    home: "Accueil",
    account: "Compte",
  },
  search: {
    label: "Rechercher sur Wakati",
    placeholder: "Que recherchez-vous ?",
    keyword: "Mot-clé",
    city: "Ville",
    allCities: "Tout le Cameroun",
    category: "Catégorie",
    allCategories: "Toutes les catégories",
    allInCategory: "Tout dans {category}",
    submit: "Rechercher",
    resultsTitle: "Résultats de recherche",
    resultsFor: "Résultats pour « {query} »",
    inCity: "à {city}",
    inCategory: "dans {category}",
    sort: "Trier par",
    sortNewest: "Plus récentes",
    sortPriceAsc: "Prix croissant",
    sortPriceDesc: "Prix décroissant",
    minPrice: "Prix min. (FCFA)",
    maxPrice: "Prix max. (FCFA)",
    resultCount: "{count} annonces",
    resultCountOne: "1 annonce",
    previous: "Précédent",
    next: "Suivant",
    pageOf: "Page {page} sur {total}",
    invalidQuery: "Certains filtres n'étaient pas valides et ont été ignorés.",
  },
  hero: {
    title: "Trouvez ce qu'il vous faut. Vendez ce dont vous n'avez plus besoin.",
    subtitle:
      "Découvrez véhicules, immobilier, électronique, meubles, services et plus encore, proposés par des particuliers partout au Cameroun.",
  },
  home: {
    popularCategories: "Catégories populaires",
    popularCategoriesLead: "Commencez par les catégories les plus consultées.",
    seeAllCategories: "Voir toutes les catégories",
    latestListings: "Dernières annonces",
    latestListingsLead: "Les annonces récentes de vendeurs partout au Cameroun.",
    featuredListings: "Annonces à la une",
    browseByCity: "Parcourir par ville",
    browseByCityLead: "Trouvez des acheteurs et des vendeurs près de chez vous.",
    viewAll: "Tout voir",
  },
  listings: {
    negotiable: "Négociable",
    noImage: "Pas de photo",
    postedOn: "Publiée le {date}",
    emptyTitle: "Aucune annonce pour le moment",
    emptyBody:
      "Wakati vient de démarrer. Soyez parmi les premiers à publier une annonce et à toucher des acheteurs dans votre ville.",
    emptySearchTitle: "Aucune annonce ne correspond à votre recherche",
    emptySearchBody:
      "Essayez un autre mot-clé, choisissez une autre ville ou retirez certains filtres.",
    clearFilters: "Effacer les filtres",
    placeholderBadge: "Maquette de mise en page",
    placeholderNote:
      "Aperçu de développement uniquement. Ces blocs illustrent la mise en page et ne sont pas de vraies annonces.",
    businessSeller: "Professionnel",
    privateSeller: "Particulier",
  },
  howItWorks: {
    title: "Comment fonctionne Wakati",
    lead: "Wakati met en relation acheteurs et vendeurs. Les accords se concluent directement entre vous.",
    steps: [
      {
        title: "Publiez ou recherchez",
        body: "Créez une annonce gratuite avec photos, prix en FCFA et ville, ou recherchez ce qu'il vous faut.",
      },
      {
        title: "Contactez directement",
        body: "Les acheteurs contactent les vendeurs via les moyens de contact que chaque vendeur choisit de partager.",
      },
      {
        title: "Rencontrez et décidez",
        body: "Examinez l'article en personne, convenez du prix et concluez l'affaire selon vos conditions.",
      },
    ],
    note: "Wakati ne gère ni les paiements, ni la livraison, ni le séquestre.",
  },
  safety: {
    title: "Achetez et vendez en toute sécurité",
    lead: "Quelques bons réflexes font toute la différence.",
    tips: [
      "Rencontrez-vous dans un lieu public fréquenté, en journée, et venez accompagné si possible.",
      "Examinez l'article avant de payer. Pour les véhicules et l'immobilier, vérifiez que les documents correspondent.",
      "N'envoyez jamais d'argent ou de Mobile Money à l'avance à une personne que vous n'avez pas rencontrée.",
      "Ne communiquez jamais vos mots de passe, codes PIN ou codes de vérification.",
      "Signalez les annonces suspectes afin que notre équipe puisse les examiner.",
    ],
    readMore: "Lire nos conseils de sécurité",
  },
  postCta: {
    title: "Publiez votre première annonce",
    body: "Vous avez quelque chose à vendre ou un service à proposer ? Touchez les gens de votre ville.",
    button: "Publier une annonce",
  },
  cities: {
    regionLabel: "Région {region}",
  },
  category: {
    subcategories: "Sous-catégories",
    listingsIn: "Annonces : {category}",
    reviewNotice:
      "Les annonces de cette catégorie sont vérifiées par notre équipe avant d'être publiées.",
    breadcrumb: "Fil d'Ariane",
  },
  footer: {
    about:
      "Wakati est une plateforme de petites annonces qui met en relation acheteurs et vendeurs partout au Cameroun.",
    marketplace: "Annonces",
    browseCategories: "Parcourir les catégories",
    support: "Assistance",
    safetyTips: "Conseils de sécurité",
    contact: "Contacter l'assistance",
    legal: "Informations légales",
    terms: "Conditions d'utilisation",
    privacy: "Politique de confidentialité",
    prohibited: "Articles interdits",
    languages: "Langues",
    rights: "© {year} Wakati. Tous droits réservés.",
    intermediary:
      "Wakati est un intermédiaire et n'est pas partie aux transactions entre utilisateurs.",
  },
  comingSoon: {
    badge: "Disponible dans la prochaine version",
    loginTitle: "Se connecter",
    registerTitle: "Créer un compte",
    favoritesTitle: "Favoris",
    postAdTitle: "Publier une annonce",
    body: "Cette partie de Wakati est en cours de développement et n'est pas encore disponible. En attendant, vous pouvez parcourir les catégories et effectuer des recherches.",
    backHome: "Retour à l'accueil",
  },
  auth: {
    confirmedTitle: "Adresse e-mail confirmée",
    confirmedBody: "Merci. Votre adresse e-mail est confirmée et vous êtes connecté.",
    errorTitle: "Ce lien n'a pas fonctionné",
    invalidBody: "Le lien est invalide ou a déjà été utilisé. Veuillez en demander un nouveau.",
    expiredBody: "Le lien a expiré. Les liens sont valables une heure. Veuillez en demander un nouveau.",
    unavailableBody: "La connexion n'est pas disponible pour le moment. Veuillez réessayer plus tard.",
    continue: "Continuer sur Wakati",
  },
  legal: {
    draftBanner: "Projet – en attente de validation juridique",
    draftBody:
      "Ce document est provisoire. Il n'a pas été approuvé et ne constitue pas encore les conditions ou pratiques contraignantes de Wakati.",
    lastUpdated: "Statut : projet provisoire",
    docs: {
      terms: {
        title: "Conditions d'utilisation",
        sections: [
          "Identité de l'exploitant de Wakati et coordonnées",
          "Rôle de Wakati comme intermédiaire entre acheteurs et vendeurs",
          "Conditions d'accès aux comptes et responsabilités",
          "Règles de publication des annonces et contenus acceptables",
          "Modération, retrait d'annonces et restrictions de compte",
          "Limitation de responsabilité",
          "Droit applicable et règlement des litiges",
        ],
      },
      privacy: {
        title: "Politique de confidentialité",
        sections: [
          "Identité du responsable du traitement et coordonnées",
          "Données personnelles collectées (compte, annonces, numéros de contact, données de l'appareil)",
          "Finalités et bases légales du traitement",
          "Affichage des coordonnées aux autres utilisateurs et consentement",
          "Durées de conservation",
          "Partage des données et hébergeurs",
          "Vos droits et comment les exercer",
        ],
      },
      safety: {
        title: "Conseils de sécurité",
        sections: [
          "Rencontrer acheteurs et vendeurs en sécurité",
          "Vérifier les articles, véhicules et documents immobiliers",
          "Éviter les arnaques au paiement anticipé et au Mobile Money",
          "Protéger votre compte et vos informations personnelles",
          "Comment signaler une annonce ou un utilisateur suspect",
        ],
      },
      "prohibited-items": {
        title: "Articles interdits et réglementés",
        sections: [
          "Articles qui ne peuvent jamais être publiés",
          "Articles réglementés soumis à vérification ou restreints",
          "Offres d'emploi : règles d'éligibilité",
          "Conséquences de la publication d'articles interdits",
        ],
      },
    },
    outlineHeading: "Sections prévues (à rédiger et à faire valider)",
  },
  errors: errorMessages.fr,
  common: {
    previewBanner: "Aperçu de développement · données de test uniquement · non public",
    loading: "Chargement…",
    devDataNotice:
      "Avis de développement : la base de données des annonces n'est pas connectée (variables d'environnement Supabase manquantes). Seules les données de référence sont affichées.",
  },
};

export default fr;
