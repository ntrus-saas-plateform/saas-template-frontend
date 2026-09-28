export type Locale = "en" | "fr";

const messages = {
  en: {
    "shell.search": "Search…",
    "shell.signOut": "Sign out",
    "shell.offline": "You're offline",
    "shell.activity": "Activity",
    "auth.signIn": "Sign in",
    "auth.signInTitle": "Sign in",
    "auth.signInDescription":
      "Sign in with your organization account to open your workspace.",
    "auth.continue": "Continue",
    "auth.welcomeBack": "Welcome to your WorkSpace",
    "auth.noAccount": "Don't have an account yet?",
    "auth.signUp": "Sign up",
    "auth.emailPlaceholder": "email address",
    "auth.passwordPlaceholder": "Password",
    "auth.login": "Login",
    "auth.or": "OR",
    "auth.secureSession": "",
    "auth.welcomeEdge": "Welcome to the Edge",
    "auth.brandSupport":
      "A focused workspace for tenants, users, and organizations.",
    "auth.brandTagline": "Welcome to the Edge",
    "auth.brandFootnote": "Authorized access only",
    "auth.errorDenied": "Sign-in was cancelled or denied. You can try again.",
    "auth.errorInvalidState":
      "This sign-in link is no longer valid. Please start again.",
    "auth.errorFailed":
      "We could not complete sign-in. Please try again or contact your administrator.",
    "auth.unavailableTitle": "Sign-in temporarily unavailable",
    "auth.unavailableDescription":
      "We cannot start authentication right now. Please try again shortly or contact your administrator.",
    "auth.contactAdmin": "If the problem continues, contact your IT administrator.",
    "auth.configRequired": "Configuration required",
    "auth.selectOrgTitle": "Choose an organization",
    "auth.selectOrgDescription":
      "Select the organization you want to work in. Your permissions apply to the organization you select.",
    "auth.workspaceErrorTitle": "We couldn't open your workspace",
    "auth.workspaceErrorDescription":
      "Something went wrong while loading your session. Your data is safe — try again in a moment.",
    "access.restricted": "Access restricted",
    "customers.title": "Customers",
    "commerce.title": "Commerce",
    "pharmacy.title": "Pharmacy",
    "identity.title": "Identity",
    "admin.title": "Admin",
    "common.retry": "Retry",
    "common.cancel": "Cancel",
    "common.confirm": "Confirm",
    "common.save": "Save",
    "common.create": "Create",
    "common.export": "Export CSV",
    "settings.title": "Settings",
    "settings.general": "General",
    "settings.company": "Company",
    "settings.localization": "Localization",
    "settings.billing": "Billing",
    "settings.security": "Security",
    "settings.audit": "Audit",
  },
  fr: {
    "shell.search": "Rechercher…",
    "shell.signOut": "Se déconnecter",
    "shell.offline": "Vous êtes hors ligne",
    "shell.activity": "Activité",
    "auth.signIn": "Connexion",
    "auth.signInTitle": "Connexion",
    "auth.signInDescription":
      "Connectez-vous avec le compte de votre organisation pour ouvrir votre espace.",
    "auth.continue": "Continuer",
    "auth.welcomeBack": "Welcome to your WorkSpace",
    "auth.noAccount": "Don't have an account yet?",
    "auth.signUp": "Sign up",
    "auth.emailPlaceholder": "email address",
    "auth.passwordPlaceholder": "Password",
    "auth.login": "Login",
    "auth.or": "OR",
    "auth.secureSession": "",
    "auth.welcomeEdge": "Welcome to the Edge",
    "auth.brandSupport":
      "Un espace de travail pour les tenants, les utilisateurs et les organisations.",
    "auth.brandTagline": "Welcome to the Edge",
    "auth.brandFootnote": "Accès réservé",
    "auth.errorDenied":
      "La connexion a été annulée ou refusée. Vous pouvez réessayer.",
    "auth.errorInvalidState":
      "Ce lien de connexion n’est plus valide. Veuillez recommencer.",
    "auth.errorFailed":
      "Nous n’avons pas pu terminer la connexion. Réessayez ou contactez votre administrateur.",
    "auth.unavailableTitle": "Connexion temporairement indisponible",
    "auth.unavailableDescription":
      "Nous ne pouvons pas démarrer l’authentification pour le moment. Réessayez sous peu ou contactez votre administrateur.",
    "auth.contactAdmin":
      "Si le problème continue, contactez votre administrateur informatique.",
    "auth.configRequired": "Configuration requise",
    "auth.selectOrgTitle": "Choisir une organisation",
    "auth.selectOrgDescription":
      "Sélectionnez l’organisation dans laquelle vous souhaitez travailler. Vos droits s’appliquent à l’organisation choisie.",
    "auth.workspaceErrorTitle": "Impossible d’ouvrir votre espace",
    "auth.workspaceErrorDescription":
      "Un problème est survenu lors du chargement de votre session. Vos données sont en sécurité — réessayez dans un instant.",
    "access.restricted": "Accès restreint",
    "customers.title": "Clients",
    "commerce.title": "Commerce",
    "pharmacy.title": "Pharmacie",
    "identity.title": "Identité",
    "admin.title": "Administration",
    "common.retry": "Réessayer",
    "common.cancel": "Annuler",
    "common.confirm": "Confirmer",
    "common.save": "Enregistrer",
    "common.create": "Créer",
    "common.export": "Exporter CSV",
    "settings.title": "Paramètres",
    "settings.general": "Général",
    "settings.company": "Société",
    "settings.localization": "Localisation",
    "settings.billing": "Facturation",
    "settings.security": "Sécurité",
    "settings.audit": "Audit",
  },
} as const;

export type MessageKey = keyof (typeof messages)["en"];

export function t(locale: Locale, key: MessageKey): string {
  return messages[locale][key] ?? messages.en[key] ?? key;
}

export function detectLocale(): Locale {
  if (typeof navigator === "undefined") return "en";
  return navigator.language.toLowerCase().startsWith("fr") ? "fr" : "en";
}
