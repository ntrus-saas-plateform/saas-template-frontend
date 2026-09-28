# MASTER UX/UI SPECIFICATION

# ERP ENTERPRISE — DESIGN SYSTEM, GLOBAL SHELL, IDENTITY, BACKOFFICE & BUSINESS APPLICATIONS

> **Fichier :** `edge-frontend/docs/MASTER-UX-UI-SPECIFICATION.md`  
> **Version / revue :** 1.1.0 — 2026-09-04  
> **Statut :** contrat UX/UI **obligatoire** pour `edge-frontend/`  
> **Référencé par :** [`MASTER-PROMPT-EDGE-FRONTEND.md`](./MASTER-PROMPT-EDGE-FRONTEND.md)  
> **Contrats API :** [`DOCUMENTATION-COMPLETE-FRONTEND-API.md`](./DOCUMENTATION-COMPLETE-FRONTEND-API.md) · [`openapi.json`](./openapi.json) · [`OPENAPI-SCHEMAS-REFERENCE.md`](./OPENAPI-SCHEMAS-REFERENCE.md)  
> **Alignement identité :** un tenant (Host + session/JWT) · plusieurs organisations du même tenant · rôles/permissions **par organisation** · **FORBIDDEN v1 :** Tenant Switcher end-user  
> **Données Shell :** context / capabilities / org switch = endpoints Platform Core documentés dans le contrat API (pas de fixtures)

---

## 1. VISION UX

L'ERP doit être conçu comme un **Business Operating System**.

Il ne doit pas ressembler à :

* un vieux logiciel comptable ;
* un dashboard SaaS générique ;
* un ensemble de CRUD ;
* une collection de pages avec sidebar ;
* une application remplie de cartes inutiles.

Il doit donner l'impression d'utiliser :

> un environnement professionnel extrêmement puissant, rapide, intelligent et parfaitement organisé.

L'expérience doit satisfaire simultanément cinq profils :

```text
NOVICE
→ comprend immédiatement où aller

UTILISATEUR RÉGULIER
→ travaille rapidement

UTILISATEUR EXPERT
→ utilise raccourcis, commandes, bulk actions et recherche

MANAGER
→ voit rapidement KPI, alertes, anomalies et décisions

ADMINISTRATEUR
→ contrôle configuration, sécurité, permissions et organisation
```

---

## 2. PRINCIPES UX FONDAMENTAUX

Le produit doit respecter ces principes :

### 2.1 Clarity over decoration

Chaque élément visuel doit avoir une fonction.

### 2.2 Density without clutter

Beaucoup d'informations doivent pouvoir être affichées sans surcharge visuelle.

### 2.3 Progressive disclosure

Afficher immédiatement l'essentiel.

Les détails avancés apparaissent à la demande.

### 2.4 Minimum clicks

Une opération fréquente doit nécessiter le moins d'étapes possible.

### 2.5 Context preservation

L'utilisateur ne doit jamais perdre :

* son tenant ;
* son organisation ;
* son application ;
* son filtre ;
* sa recherche ;
* sa position dans un workflow.

### 2.6 Predictability

Une même action doit fonctionner de la même manière partout.

### 2.7 Feedback immédiat

Chaque action doit produire un feedback clair.

### 2.8 Recoverability

Une erreur utilisateur ne doit pas détruire son travail.

### 2.9 Keyboard first

Les utilisateurs experts doivent pouvoir travailler presque entièrement au clavier.

### 2.10 Mobile first

Le mobile n'est pas une version miniature du desktop.

Il possède sa propre stratégie d'interaction.

---

## 3. PHILOSOPHIE VISUELLE

Le design doit être :

* premium ;
* moderne ;
* professionnel ;
* dense ;
* minimaliste ;
* extrêmement lisible ;
* légèrement tactile ;
* très structuré.

Éviter :

* gradients excessifs ;
* glassmorphism omniprésent ;
* énormes cartes ;
* ombres lourdes ;
* couleurs criardes ;
* animations décoratives ;
* espaces inutiles ;
* interfaces "marketing".

L'ERP doit ressembler à un **outil de travail**, pas à une landing page.

---

## 4. DENSITÉ D'INFORMATION

La densité est une fonctionnalité.

Prévoir trois niveaux :

```text
COMPACT
COMFORTABLE
SPACIOUS
```

### Compact

Pour :

* comptables ;
* opérateurs ;
* inventory managers ;
* utilisateurs intensifs.

### Comfortable

Mode par défaut.

### Spacious

Pour :

* nouveaux utilisateurs ;
* écrans tactiles ;
* utilisateurs recherchant plus de lisibilité.

La préférence est persistée par utilisateur.

---

## 5. GRILLE VISUELLE

Utiliser une grille cohérente.

Desktop :

```text
Header
────────────────────────────────────────────

Sidebar │ Main Content
        │
        │
        │
```

La zone principale doit être flexible.

Éviter les largeurs fixes excessives.

---

## 6. GLOBAL APPLICATION SHELL

Le Shell est la structure permanente.

```text
┌─────────────────────────────────────────────────────┐
│ Logo │ App │ Search │ Commands │ Alerts │ User     │
├───────────────┬─────────────────────────────────────┤
│               │                                     │
│ Navigation    │           Workspace                 │
│               │                                     │
│               │                                     │
│               │                                     │
├───────────────┴─────────────────────────────────────┤
│ Status / Context / optional footer                  │
└─────────────────────────────────────────────────────┘
```

---

## 7. TOP BAR

La Top Bar doit contenir uniquement les éléments globaux.

Ordre recommandé :

```text
[App Launcher]
[Current App]
[Organization]
[Global Search]
[Command Palette]
[Tasks]
[Notifications]
[Help]
[User]
```

Le **tenant** est affiché dans le contexte (indicateur / profil), pas comme un switcher libre.

---

## 8. APP LAUNCHER

Le bouton d'application ouvre un panneau moderne.

```text
┌──────────────────────────────────────┐
│ Applications                         │
│ [ Search applications... ]           │
│                                      │
│ ★ Core                               │
│ ★ Inventory                          │
│   Sales                              │
│   POS                                │
│   Accounting                         │
│   HR                                 │
│                                      │
│ Recent                               │
│ ──────────────────────────────────── │
│ Inventory                            │
│ Customers                            │
└──────────────────────────────────────┘
```

Fonctions :

* recherche ;
* favoris ;
* récents ;
* catégories ;
* statut ;
* raccourcis clavier.

---

## 9. ORGANIZATION SWITCHER

Il doit être extrêmement visible mais discret.

Exemple :

```text
Premium Pharma
Bujumbura ▼
```

Au clic :

```text
┌────────────────────────────────────┐
│ Current organization               │
│                                    │
│ ✓ Bujumbura                        │
│   Main pharmacy                    │
│                                    │
│   Gitega                           │
│   Branch                           │
│                                    │
│   Ngozi                            │
│   Branch                           │
│                                    │
│ [Search...]                        │
└────────────────────────────────────┘
```

Afficher :

* nom ;
* code ;
* localisation ;
* statut ;
* éventuellement avatar/logo.

Uniquement les organisations du **même tenant** auxquelles l’utilisateur a accès.  
Après sélection : validation BFF + refresh session/JWT + recalcul permissions **de cette org**.

---

## 10. CONTEXT INDICATOR

L'utilisateur doit toujours savoir :

```text
Tenant
Organization
Application
```

Exemple :

```text
Premium Pharma
/
Bujumbura
/
Inventory
```

Cela réduit fortement les erreurs opérationnelles.

---

## 11. GLOBAL SEARCH

La recherche doit être une des fonctionnalités principales.

Design :

```text
┌──────────────────────────────────────────────┐
│ 🔍 Search products, customers, invoices...  │
└──────────────────────────────────────────────┘
```

Ctrl+K ou Cmd+K.

Résultats regroupés :

```text
Applications
Pages
Products
Customers
Orders
Invoices
Employees
Reports
Commands
```

---

## 12. SEARCH RESULT DESIGN

Exemple :

```text
Products
────────────────────────
Paracetamol 500mg
SKU: MED-000123
Stock: 120

Paracetamol 1g
SKU: MED-000124
Stock: 80

Customers
────────────────────────
Pharmacie ABC
...
```

Chaque résultat doit afficher :

* type ;
* nom ;
* contexte ;
* statut ;
* raccourci ;
* action possible.

---

## 13. COMMAND PALETTE

Le Command Palette est le "terminal UX" de l'ERP.

Exemple :

```text
┌─────────────────────────────────────────────┐
│ > Create customer                           │
├─────────────────────────────────────────────┤
│ Create Customer                         ↵   │
│ Create Product                          ↵   │
│ Create Invoice                          ↵   │
│ Switch organization                     ↵   │
│ Open Inventory                          ↵   │
│ Toggle compact mode                     ↵   │
└─────────────────────────────────────────────┘
```

Support :

* navigation ;
* création ;
* changement de contexte (organisation / application) ;
* actions ;
* recherche ;
* paramètres.

---

## 14. SIDEBAR

La sidebar ne doit pas devenir une liste interminable.

Structure :

```text
Overview

Workspace
  Dashboard
  Tasks
  Activity

Management
  Products
  Inventory
  Customers

Reports

Administration
  Settings
```

Les éléments doivent être :

* permission-aware ;
* entitlement-aware ;
* organization-aware ;
* feature-aware.

---

## 15. SIDEBAR COLLAPSED

Mode compact :

```text
🏠
📦
👥
💰
📊
⚙
```

Tooltip au hover.

Prévoir raccourci :

```text
Ctrl + B
```

---

## 16. MOBILE NAVIGATION

Sur mobile, ne jamais reproduire la sidebar desktop.

Utiliser :

```text
┌─────────────────────────┐
│ App       Search    ⋮   │
├─────────────────────────┤
│                         │
│       Workspace         │
│                         │
├─────────────────────────┤
│ Home Inventory More     │
└─────────────────────────┘
```

Bottom navigation pour les actions principales.

Drawer pour le reste.

---

## 17. PAGE HEADER

Chaque page métier doit avoir une structure cohérente :

```text
Breadcrumb
Title
Description
Status
Primary action
Secondary actions
```

Exemple :

```text
Inventory / Adjustments

Stock Adjustments
Manage stock corrections and approvals.

[+ Create Adjustment] [Export] [...]
```

---

## 18. ACTION HIERARCHY

Une page doit avoir :

### Primary action

Une seule action dominante.

### Secondary actions

Actions importantes mais moins fréquentes.

### Overflow

Actions rares.

Ne jamais afficher 12 boutons simultanément.

---

## 19. DATA TABLES

Les tables sont centrales dans un ERP.

Elles doivent être extrêmement puissantes.

Fonctions :

* sorting ;
* filtering ;
* column visibility ;
* resizing ;
* pinning ;
* grouping ;
* pagination ;
* infinite scrolling selon cas ;
* selection ;
* bulk actions ;
* export ;
* saved views ;
* density ;
* keyboard navigation.

---

## 20. TABLE DESIGN

Exemple :

```text
┌────┬────────────────┬──────────┬────────┬────────────┐
│ □  │ Product        │ SKU      │ Stock  │ Status     │
├────┼────────────────┼──────────┼────────┼────────────┤
│ □  │ Paracetamol    │ MED-001  │ 120    │ Available  │
│ □  │ Amoxicillin    │ MED-002  │ 20     │ Low stock  │
│ □  │ Ibuprofen      │ MED-003  │ 0      │ Out        │
└────┴────────────────┴──────────┴────────┴────────────┘
```

---

## 21. TABLE TOOLBAR

```text
[Search]
[Filter]
[Views]
[Columns]
[Group]
[Export]
[Bulk Actions]
```

Les actions apparaissent contextuellement.

---

## 22. FILTER SYSTEM

Le système de filtres doit être avancé.

Exemple :

```text
Filters

Status       [Low stock]
Warehouse    [Bujumbura]
Category     [Antibiotics]
Expiry       [< 90 days]
```

Afficher les filtres actifs sous forme de chips :

```text
Status: Low stock ×
Warehouse: Bujumbura ×
```

---

## 23. SAVED VIEWS

Un utilisateur doit pouvoir enregistrer :

```text
My Low Stock
Expiring Soon
My Warehouse
Pending Approval
```

Chaque vue conserve :

* colonnes ;
* filtres ;
* tri ;
* groupement ;
* densité.

---

## 24. BULK ACTIONS

Après sélection :

```text
3 selected

[Export]
[Assign]
[Approve]
[Archive]
[Delete]
```

Les actions interdites doivent être absentes.

---

## 25. CONFIRMATION UX

Pour une action dangereuse :

```text
Delete 18 products?

This action cannot be undone.

[Cancel] [Delete]
```

Pour les actions importantes, préférer une confirmation contextualisée plutôt qu'un simple "Are you sure?".

---

## 26. UNDO

Lorsque possible :

```text
Adjustment archived.

[Undo]
```

L'undo réduit fortement les frictions.

---

## 27. DRAWERS

Utiliser les drawers pour les tâches rapides.

Exemple :

```text
┌───────────────────────────────────────┐
│ Product details                   ×   │
│                                       │
│ Name                                  │
│ SKU                                   │
│ Stock                                 │
│ Supplier                              │
│                                       │
│ [Edit Product]                        │
└───────────────────────────────────────┘
```

Avantage :

L'utilisateur conserve le contexte de la liste.

---

## 28. FULL PAGE

Utiliser une page complète pour :

* workflows complexes ;
* formulaires longs ;
* création avancée ;
* édition complexe ;
* dashboards ;
* transactions critiques.

---

## 29. MODALS

Limiter les modals.

Utiliser une modal pour :

* confirmation ;
* action courte ;
* choix simple ;
* opération critique.

Ne jamais mettre une application entière dans une modal.

---

## 30. FORMS

Les formulaires doivent être construits autour du métier.

Ne pas simplement afficher 30 inputs.

Regrouper :

```text
Basic Information
Pricing
Inventory
Supplier
Compliance
Advanced
```

---

## 31. FORM LAYOUT

Desktop :

```text
┌──────────────────────┬─────────────────────┐
│ Main information     │ Context / Summary   │
│                      │                     │
│ Fields               │ Status              │
│                      │ Validation          │
│                      │ Actions             │
└──────────────────────┴─────────────────────┘
```

---

## 32. SMART FORM UX

Prévoir :

* auto-save lorsque approprié ;
* draft ;
* validation temps réel ;
* dépendances entre champs ;
* suggestions ;
* valeurs par défaut ;
* historique ;
* unsaved changes warning.

---

## 33. INLINE EDITING

Pour les données simples :

```text
Quantity: 120
         ↓
Quantity: [120] ✓
```

Éviter de forcer l'utilisateur à ouvrir une page complète pour chaque petite modification.

---

## 34. DETAIL PAGES

Une fiche doit avoir une hiérarchie claire.

```text
Header
 ├── Identity
 ├── Status
 ├── Primary actions

Tabs
 ├── Overview
 ├── Transactions
 ├── Documents
 ├── Activity
 └── Audit
```

---

## 35. ACTIVITY TIMELINE

Exemple :

```text
Today

10:43
Jean approved adjustment

09:21
Marie modified stock

Yesterday
Invoice created
```

Chaque événement peut afficher :

* utilisateur ;
* date ;
* action ;
* ressource ;
* détails ;
* source.

---

## 36. AUDIT UI

L'audit doit être lisible.

```text
Product updated

Changed by:
John Doe

Before
Price: 12,000

After
Price: 13,500
```

Afficher les changements clairement.

---

## 37. STATUS SYSTEM

Utiliser un système cohérent :

```text
SUCCESS
INFO
WARNING
DANGER
NEUTRAL
```

Ne pas dépendre uniquement de la couleur.

Ajouter :

* icône ;
* texte ;
* éventuellement tooltip.

---

## 38. BADGES

Les badges servent à :

* statut ;
* état ;
* catégorie ;
* niveau ;
* permission contextuelle.

Ne pas transformer chaque donnée en badge.

---

## 39. NOTIFICATIONS

Le Notification Center :

```text
Notifications

Inventory
Low stock detected

Accounting
Invoice approved

Tasks
3 approvals pending
```

Catégories :

* system ;
* security ;
* workflow ;
* business ;
* informational.

---

## 40. TASK CENTER

Le centre de tâches doit être orienté action.

```text
Pending tasks

Approve stock adjustment
Due today

Review supplier invoice
Due tomorrow

Complete inventory count
```

Cliquer doit ouvrir directement l'action.

---

## 41. DASHBOARD

Le dashboard ne doit pas être une collection de KPI décoratifs.

Chaque widget doit répondre à une question métier.

Exemple :

```text
Revenue
Stock value
Low stock
Pending approvals
Cash position
Outstanding invoices
```

---

## 42. DASHBOARD PERSONALIZATION

Permettre :

* drag & drop ;
* resize ;
* hide ;
* reorder ;
* favorite ;
* reset defaults.

Mais conserver des defaults métier pertinents.

---

## 43. WIDGET DESIGN

Un widget :

```text
┌──────────────────────────────┐
│ Low Stock              ⋯     │
│                              │
│ 27 products                  │
│                              │
│ ↑ 8% vs last week            │
│                              │
│ View products →              │
└──────────────────────────────┘
```

Le widget doit être actionnable.

---

## 44. EMPTY STATES

Jamais :

```text
No data.
```

Préférer :

```text
No stock adjustments yet.

Create your first adjustment to start
tracking inventory corrections.

[Create Adjustment]
```

Le CTA n’apparaît que si autorisé pour l’organisation active.

---

## 45. LOADING STATES

Utiliser :

* skeleton ;
* progressive loading ;
* optimistic updates lorsque sûr ;
* placeholders cohérents.

Éviter les spinners plein écran.

---

## 46. ERROR STATES

Exemple :

```text
We couldn't load inventory.

Your data is safe.

[Retry]
```

Afficher une explication utile.

---

## 47. OFFLINE / DEGRADED

Pour les applications supportant offline :

```text
Offline

Changes will sync automatically
when connection is restored.
```

Afficher clairement :

```text
Synced
Pending
Failed
```

---

## 48. RESPONSIVE DESIGN

Breakpoints adaptés aux usages.

### Mobile

Priorité :

* navigation ;
* recherche ;
* actions ;
* lecture rapide ;
* formulaires courts.

### Tablet

Priorité :

* listes ;
* workflows ;
* POS ;
* opérations terrain.

### Desktop

Priorité :

* densité ;
* tables ;
* multi-panel ;
* analytics.

---

## 49. MOBILE ERP

Mobile ne doit pas être :

```text
desktop shrinking
```

Il faut repenser :

* navigation ;
* actions ;
* tables ;
* filtres ;
* formulaires ;
* drawers ;
* scanning ;
* workflows.

---

## 50. MOBILE TABLES

Sur mobile :

```text
Product
Paracetamol 500mg

Stock
120 units

Status
Available
```

Utiliser des cards/list rows lorsque nécessaire.

Mais permettre une vraie table horizontale pour les utilisateurs experts.

---

## 51. MOBILE QUICK ACTIONS

Bottom action bar :

```text
[Save]
[Scan]
[Add]
[More]
```

Les actions fréquentes doivent rester accessibles avec le pouce.

---

## 52. MOBILE SEARCH

Recherche globale accessible immédiatement :

```text
🔍 Search anything
```

Support :

* produit ;
* client ;
* facture ;
* commande ;
* code-barres ;
* SKU.

---

## 53. SCANNER UX

Pour ERP pharma/POS :

```text
[ Scan barcode ]
```

Après scan :

```text
Product found

Paracetamol 500mg
Stock: 120

[View]
[Add]
[Sell]
```

Une opération de scan doit être extrêmement rapide.

---

## 54. POS UX

Le POS mobile doit être conçu comme un outil opérationnel.

Structure :

```text
┌────────────────────────────┐
│ Search / Scan              │
├────────────────────────────┤
│ Products                   │
│                            │
│ Cart                       │
│ ─────────────────────────  │
│ Total                      │
│                            │
│ [Pay]                      │
└────────────────────────────┘
```

---

## 55. POS ONE-HAND UX

Les actions critiques doivent être accessibles dans la zone du pouce.

Éviter :

* menus cachés ;
* petites icônes ;
* actions éloignées.

---

## 56. KEYBOARD UX

Prévoir des raccourcis :

```text
Ctrl/Cmd + K → Command Palette
Ctrl/Cmd + B → Sidebar
/ → Search
N → New
E → Edit
Esc → Close
Enter → Confirm
```

Les raccourcis doivent être visibles dans les menus.

---

## 57. COMMAND DISCOVERY

Exemple :

```text
Create Product
N
```

Le raccourci est affiché à droite.

---

## 58. ACCESSIBILITY

WCAG 2.2 AA minimum.

Prévoir :

* keyboard navigation ;
* focus visible ;
* screen readers ;
* semantic HTML ;
* ARIA lorsque nécessaire ;
* contrast ;
* reduced motion ;
* touch target size ;
* error identification ;
* accessible forms.

---

## 59. FOCUS MANAGEMENT

Après :

```text
modal opened
```

focus → modal.

Après fermeture :

focus → bouton déclencheur.

Après suppression :

focus → élément suivant.

---

## 60. MOTION DESIGN

Utiliser Motion pour les animations web.

Les animations doivent être :

* rapides ;
* fonctionnelles ;
* prévisibles.

Exemples :

```text
Drawer
Dropdown
Modal
Page transition
Toast
List insertion
```

Éviter les animations longues.

Respecter :

```text
prefers-reduced-motion
```

---

## 61. MICRO-INTERACTIONS

Exemples :

* bouton enregistré ;
* validation ;
* changement de statut ;
* élément sélectionné ;
* copie réussie ;
* action terminée.

Le feedback doit être subtil.

---

## 62. TOASTS

Utiliser les toasts pour les confirmations non bloquantes.

```text
✓ Product updated
```

Avec action si pertinente :

```text
✓ Product archived
[Undo]
```

---

## 63. DESIGN TOKENS

Créer des tokens pour :

```text
spacing
radius
typography
font sizes
font weights
shadows
borders
colors
motion
z-index
density
```

Aucun composant métier ne doit inventer ses propres valeurs.

---

## 64. TYPOGRAPHY

La typographie doit privilégier :

* lisibilité ;
* chiffres ;
* tableaux ;
* informations denses.

Les nombres doivent être très lisibles.

Pour les KPI :

```text
1,245,890
```

alignement numérique cohérent.

---

## 65. ICONOGRAPHY

Utiliser un système unique.

Lucide Icons par exemple.

Les icônes :

* doivent avoir une signification claire ;
* ne doivent pas remplacer systématiquement les labels ;
* doivent être cohérentes.

---

## 66. COLOR SYSTEM

Le système doit avoir :

```text
Primary
Secondary
Success
Warning
Danger
Info
Neutral
```

Et surtout :

```text
background
surface
surface-elevated
border
text-primary
text-secondary
text-muted
```

Prévoir dark mode.

---

## 67. DARK MODE

Le dark mode doit être conçu, pas simplement inversé.

Respecter :

* contraste ;
* hiérarchie ;
* surfaces ;
* borders ;
* status colors.

---

## 68. TENANT BRANDING

Le tenant peut personnaliser :

* logo ;
* favicon ;
* couleur principale ;
* nom ;
* branding ;
* éventuellement thème.

Mais le branding ne doit jamais casser la lisibilité du système.

---

## 69. THEMING

Prévoir :

```text
Light
Dark
System
High Contrast
```

et éventuellement :

```text
Compact
Comfortable
Spacious
```

---

## 70. SETTINGS UX

Les paramètres doivent être structurés :

```text
Settings

Account
Preferences
Appearance
Notifications
Security

Organization
Members
Roles
Permissions
Locations

Applications
Inventory
Accounting
POS
...

Administration
Integrations
Audit
System
```

---

## 71. USER PROFILE

Menu utilisateur :

```text
John Doe
john@example.com

Organization
Bujumbura

Preferences
Settings
Security

Keyboard shortcuts
Help

Sign out
```

Pas de « Switch Tenant » end-user par défaut.

---

## 72. SECURITY UX

Les informations importantes doivent être visibles :

```text
Session active
MFA enabled
Last login
Active devices
```

Prévoir :

* session management ;
* MFA ;
* password ;
* trusted devices ;
* login history.

---

## 73. ORGANIZATION ADMIN UX

Administrateur :

```text
Organization
│
├── General
├── Members
├── Teams
├── Roles
├── Permissions
├── Locations
├── Warehouses
├── Applications
├── Billing
├── Integrations
└── Audit
```

---

## 74. USER MANAGEMENT

La liste des utilisateurs doit permettre :

```text
Name
Email
Status
Organizations
Roles
Last activity
```

Actions :

```text
View
Edit
Suspend
Reset access
Manage roles
```

---

## 75. ROLE MANAGEMENT

Interface :

```text
Role: Inventory Manager

Permissions

☑ Inventory
   ☑ Read
   ☑ Create
   ☑ Update
   ☑ Adjust
   ☐ Approve

Scope

☑ Organization A
☐ Organization B

Warehouses

☑ WH-A
☐ WH-B
```

Cette UI doit rendre RBAC/ABAC compréhensible — et rappeler que les droits effectifs sont **par organisation**.

---

## 76. PERMISSION UX

Ne pas afficher une énorme liste incompréhensible.

Utiliser une hiérarchie :

```text
Inventory
  Products
  Stock
  Counts
  Adjustments
  Transfers
```

Puis :

```text
Read
Create
Update
Delete
Approve
Export
```

---

## 77. CAPABILITY EXPLANATION

Lorsque l'utilisateur ne peut pas effectuer une action, expliquer pourquoi lorsque cela est pertinent.

Exemple :

```text
Create Adjustment

You don't have permission to create stock
adjustments in this warehouse.
```

ou :

```text
Accounting isn't included in your subscription.
```

---

## 78. NO ACCESS PAGE

Design :

```text
┌────────────────────────────────────┐
│ Access restricted                 │
│                                    │
│ You don't have permission to view │
│ this resource.                    │
│                                    │
│ [Go back]                          │
└────────────────────────────────────┘
```

---

## 79. SUBSCRIPTION LOCKED UX

Si module non souscrit :

```text
Accounting

Not included in your current plan.

[View plans]
```

Le bouton dépend évidemment des permissions de gestion d'abonnement.

---

## 80. APPLICATION HEALTH UX

Dans l'App Switcher :

```text
Inventory       ●
Accounting      ⚠
HR              🔒
POS             ●
```

Ne pas dépendre uniquement de la couleur.

---

## 81. APPLICATION MAINTENANCE UX

```text
Inventory is temporarily unavailable.

We're performing maintenance.

Other applications remain available.

[Back to Core]
```

---

## 82. GLOBAL ERROR UX

Créer un système d'erreurs cohérent :

```text
AuthenticationError
TenantError
OrganizationError
AuthorizationError
NetworkError
ApplicationError
ValidationError
ConflictError
RateLimitError
ServerError
```

Chaque type possède son UI.

---

## 83. NETWORK UX

En cas de perte réseau :

```text
Connection lost

Trying to reconnect...
```

Puis :

```text
Connected
```

Éviter de faire paniquer l'utilisateur.

---

## 84. CONFLICT UX

Si deux utilisateurs modifient la même ressource :

```text
This record was modified by another user.

[Reload]
[Review changes]
```

Ne jamais écraser silencieusement les données.

---

## 85. LONG-RUNNING OPERATIONS

Pour :

* imports ;
* exports ;
* rapports ;
* synchronisations ;
* traitements massifs.

Ne pas bloquer l'écran.

Afficher :

```text
Export started

You can continue working.

[View task]
```

---

## 86. GLOBAL JOB CENTER

Centraliser les opérations longues :

```text
Tasks

Export Products       70%
Import Customers      Done
Generate Report       Running
Sync Inventory        Failed
```

---

## 87. IMPORT UX

Workflow :

```text
Upload
 ↓
Map columns
 ↓
Validate
 ↓
Preview
 ↓
Import
 ↓
Result
```

---

## 88. VALIDATION IMPORT

Afficher :

```text
1,250 rows

Valid: 1,220
Warnings: 20
Errors: 10
```

Puis permettre :

```text
Download errors
Fix
Retry
```

---

## 89. GLOBAL BREADCRUMBS

Les breadcrumbs doivent être utiles :

```text
Inventory
/
Products
/
Paracetamol
```

Pas :

```text
Home / Dashboard / Application / Module / Page
```

Éviter la pollution.

---

## 90. MULTI-PANEL WORKSPACE

Pour utilisateurs experts :

```text
┌──────────────┬─────────────────────┬──────────────┐
│ List         │ Detail              │ Context      │
│              │                     │              │
│ Products     │ Paracetamol         │ Stock        │
│              │                     │ Activity     │
└──────────────┴─────────────────────┴──────────────┘
```

Permettre de redimensionner.

---

## 91. SPLIT VIEW

Idéal pour :

* commandes ;
* factures ;
* clients ;
* produits ;
* tickets.

Cliquer une ligne → détail sans quitter la liste.

---

## 92. CONTEXTUAL ACTION BAR

Lorsqu'une ressource est sélectionnée :

```text
Product
Paracetamol

[Edit] [Duplicate] [Adjust Stock] [...]
```

Les actions dépendent des permissions **de l’organisation active**.

---

## 93. RECENTLY USED

Le système doit mémoriser :

```text
Recent applications
Recent pages
Recent records
Recent searches
```

Cela accélère énormément le travail quotidien.

---

## 94. FAVORITES

Permettre :

```text
★ Inventory
★ Stock adjustments
★ Daily sales
★ Cash report
```

---

## 95. PERSONAL WORKSPACE

Chaque utilisateur peut avoir :

```text
My dashboard
My tasks
My favorites
My recent items
My saved views
```

---

## 96. GLOBAL QUICK CREATE

Un bouton global :

```text
+
```

ouvre :

```text
Create

Customer
Product
Order
Invoice
Adjustment
Employee
...
```

Uniquement les actions autorisées.

---

## 97. CONTEXTUAL QUICK CREATE

Dans Inventory :

```text
+ Create
```

doit prioriser :

```text
Product
Stock Adjustment
Transfer
Count
```

---

## 98. USER ONBOARDING

Pour nouveaux utilisateurs :

```text
Welcome to Inventory

Let's get you started.

1. Add your first warehouse
2. Import products
3. Create stock
```

Mais ne jamais imposer un onboarding inutile aux utilisateurs expérimentés.

---

## 99. HELP SYSTEM

Prévoir un Help Center contextuel.

Sur une page :

```text
?
```

affiche :

```text
Stock Adjustments

Learn how adjustments work.

Keyboard shortcuts
Common workflows
Documentation
```

---

## 100. CONTEXTUAL TOOLTIP

Les tooltips servent à expliquer :

* icônes ;
* champs complexes ;
* statuts ;
* restrictions ;
* raccourcis.

Pas à remplacer des labels importants.

---

## 101. BUSINESS INTELLIGENCE UX

Les dashboards analytiques doivent permettre :

```text
Time range
Comparison
Filters
Drill down
Export
```

Cliquer sur :

```text
Low stock: 27
```

→ ouvre les 27 produits concernés.

---

## 102. DRILL-DOWN

Chaque KPI important doit être explicable.

```text
Revenue
$1.2M
```

Cliquer :

```text
Revenue breakdown
├── Pharmacy A
├── Pharmacy B
└── Pharmacy C
```

---

## 103. DATA VISUALIZATION

Utiliser les graphiques uniquement lorsqu'ils ajoutent de l'information.

Types :

* line ;
* bar ;
* area ;
* donut ;
* scatter ;
* heatmap.

Éviter les graphiques décoratifs.

---

## 104. MOBILE ANALYTICS

Sur mobile :

```text
Revenue
1.2M

↑ 12%

[View details]
```

Les graphiques doivent rester lisibles.

---

## 105. UX POUR OPÉRATEURS

Les utilisateurs opérationnels doivent avoir :

* gros raccourcis ;
* actions rapides ;
* scanning ;
* recherche ;
* workflows courts ;
* peu de configuration.

---

## 106. UX POUR MANAGERS

Les managers doivent avoir :

```text
KPIs
Alerts
Approvals
Exceptions
Tasks
Trends
```

Le système doit mettre les anomalies en avant.

---

## 107. UX POUR ADMINISTRATEURS

Les administrateurs doivent avoir :

```text
System health
Users
Security
Applications
Entitlements
Roles
Audit
Integrations
Configuration
```

---

## 108. EXCEPTION-FIRST DESIGN

L'ERP ne doit pas uniquement montrer ce qui va bien.

Il doit mettre en avant :

```text
Low stock
Expired products
Pending approvals
Failed payments
Overdue invoices
Integration failures
Security events
```

C'est une des différences majeures entre un dashboard décoratif et un véritable ERP.

---

## 109. INFORMATION PRIORITY

Chaque écran doit suivre :

```text
1. What is happening?
2. What requires attention?
3. What can I do?
4. What details do I need?
5. What history exists?
```

---

## 110. ZERO DEAD-END

Chaque page doit proposer une prochaine action logique.

Exemple :

```text
No products

Import products
or
Create product
```

Pas simplement :

```text
No data.
```

---

## 111. CONSISTENCY

Les mêmes concepts doivent avoir la même UX partout.

Exemple :

```text
Search
Filter
Export
Create
Edit
Delete
Approve
More
```

doivent être visuellement et fonctionnellement cohérents.

---

## 112. DESIGN SYSTEM COMPONENT LIBRARY

Créer une bibliothèque :

```text
Button
IconButton
Input
Select
Combobox
DatePicker
DataTable
Drawer
Dialog
Popover
Tooltip
Tabs
Badge
Avatar
Card
Command
Breadcrumb
Pagination
Toast
Alert
EmptyState
Skeleton
DropdownMenu
ContextMenu
FileUpload
Scanner
Timeline
Chart
KPI
```

---

## 113. BUSINESS COMPONENT LIBRARY

Au-dessus des primitives :

```text
EntityHeader
EntityList
EntityDetails
EntityStatus
PermissionGate
ScopeSelector
OrganizationSwitcher
ApplicationSwitcher
GlobalSearch
TaskCenter
NotificationCenter
AuditTimeline
ApprovalPanel
ActivityFeed
BulkActionBar
SavedViewSelector
ContextIndicator
```

---

## 114. APPLICATION SDK UI

Chaque application doit pouvoir réutiliser :

```text
<AppShellContext>
<PermissionGate>
<OrganizationContext>
<ApplicationContext>
<SearchProvider>
<CommandProvider>
<DashboardWidget>
```

sans réimplémenter le Shell.

---

## 115. DESIGN CONTRACT ENTRE SHELL ET APPLICATIONS

Le Shell fournit :

```text
Header
Navigation
Context
Auth
Permissions
Search
Commands
Notifications
Tasks
Theme
UI primitives
```

L'application fournit :

```text
Pages
Business components
Business forms
Business workflows
Business data
Business rules
```

---

## 116. NE PAS TRANSFORMER LE SHELL EN MONOLITHE

Le Shell ne doit pas connaître :

```text
Inventory business logic
Accounting business logic
HR business logic
```

Il ne connaît que :

```text
Manifest
Capabilities
Navigation
Commands
Widgets
Contracts
```

---

## 117. APPLICATION MANIFEST UX

Chaque application doit déclarer :

```text
name
icon
description
version
status
required entitlement
required permissions
navigation
commands
search
widgets
```

Le Shell utilise ces informations pour construire l'expérience.

---

## 118. APPLICATION SWITCHING

Lors du changement d'application :

```text
Core
 ↓
Inventory
```

ne pas afficher un écran de chargement global si ce n'est pas nécessaire.

Préférer :

```text
Shell remains visible
Application workspace loads
```

Cela donne une impression de système fluide.

---

## 119. PRESERVATION OF CONTEXT

Si l'utilisateur quitte :

```text
Inventory / Products
filter = low-stock
page = 3
```

puis revient :

restaurer autant que raisonnablement possible :

```text
filter
view
sort
selected organization
```

---

## 120. PERMISSION-AWARE UX

Ne jamais afficher :

```text
Create
```

puis dire après clic :

```text
403
```

lorsque le frontend connaît déjà la permission.

Le bouton doit normalement être absent ou disabled avec explication selon le contexte.

Mais le backend reste l'autorité finale.

---

## 121. DISABLED VS HIDDEN

Utiliser :

### Hidden

Lorsque l'action n'a aucun sens pour l'utilisateur.

### Disabled

Lorsque l'action est pertinente mais momentanément indisponible.

Exemple :

```text
Approve
```

visible mais disabled :

```text
Waiting for required information.
```

---

## 122. RESPONSIVE PERMISSION UX

Les permissions doivent être identiques sur :

```text
Desktop
Tablet
Mobile
```

Seule la présentation change.

---

## 123. TOUCH UX

Minimum :

```text
44 × 44 px
```

pour les contrôles tactiles importants.

---

## 124. TABLET UX

La tablette est idéale pour :

* inventory ;
* warehouse ;
* POS ;
* field operations.

Prévoir :

* split view ;
* scan ;
* large touch targets ;
* keyboard support si clavier connecté.

---

## 125. PERFORMANCE UX

Objectif :

L'utilisateur doit avoir l'impression que l'ERP est instantané.

Utiliser :

* streaming SSR ;
* skeletons ;
* prefetching ;
* route preloading ;
* code splitting ;
* lazy loading ;
* virtualization ;
* optimistic updates ;
* cache intelligent.

---

## 126. PERCEIVED PERFORMANCE

Même lorsqu'une opération prend du temps :

```text
Saving...
```

puis :

```text
Saved ✓
```

Ne jamais laisser l'utilisateur se demander :

> Est-ce que mon action a fonctionné ?

---

## 127. DATA PREFETCHING

Lorsqu'une page indique :

```text
Product
```

précharger intelligemment :

```text
Product details
Stock
Recent activity
```

sans charger inutilement tout l'ERP.

---

## 128. SKELETON DESIGN

Le skeleton doit reproduire la structure finale.

Éviter un simple :

```text
Loading...
```

plein écran.

---

## 129. ACCESSIBLE COLOR

Un statut :

```text
Low stock
```

doit être lisible même sans perception de la couleur.

Utiliser :

```text
⚠ Low stock
```

et non uniquement un badge jaune.

---

## 130. LOCALIZATION

Prévoir dès le départ :

* français ;
* anglais ;
* kirundi ;
* éventuellement kinyarwanda selon marché.

Tous les textes UI doivent être internationalisables.

Ne jamais hardcoder les textes métier dans les composants.

---

## 131. DATE / TIME

Respecter :

```text
timezone tenant
timezone organization
timezone user
```

selon le contexte.

---

## 132. CURRENCY

Les montants doivent respecter :

```text
currency
locale
precision
format
```

et être clairement identifiés.

---

## 133. NUMBER FORMATTING

Les quantités :

```text
1,250
```

Les montants :

```text
1,250,000 BIF
```

Le format doit respecter la locale.

---

## 134. FORMATTING MÉTIER

Les produits pharma peuvent nécessiter :

```text
Batch
Expiry date
GTIN
SKU
Unit
Dosage
Strength
```

Ces informations doivent être hiérarchisées et non affichées toutes au même niveau.

---

## 135. DENSE PHARMACEUTICAL UI

Pour Inventory :

```text
Product
Batch
Expiry
Stock
Reserved
Available
Warehouse
Status
```

L'utilisateur expert doit pouvoir afficher ces colonnes simultanément.

Mais les utilisateurs moins expérimentés doivent pouvoir utiliser une vue simplifiée.

---

## 136. EXPIRY UX

Une date proche doit être explicitement signalée :

```text
Expiry
28 days
⚠
```

Et non uniquement :

```text
2026-10-02
```

---

## 137. STOCK UX

Afficher :

```text
On hand
Reserved
Available
Incoming
Reorder point
```

avec une hiérarchie claire.

---

## 138. WORKFLOW UX

Les workflows complexes doivent afficher leur progression.

Exemple :

```text
Draft
 ↓
Submitted
 ↓
Reviewed
 ↓
Approved
 ↓
Posted
```

---

## 139. APPROVAL UX

Un approbateur doit voir :

```text
What?
Who?
Why?
Amount?
Impact?
Evidence?
```

avant :

```text
Approve
Reject
Request changes
```

---

## 140. APPROVAL SIDE PANEL

```text
Approval required

Stock adjustment #ADJ-1023

Requested by:
John Doe

Reason:
Damaged products

Impact:
-12 units

[Reject]
[Approve]
```

---

## 141. AUDITABILITY UX

Pour toute opération sensible :

```text
Who
When
What
Before
After
Why
```

doit être facilement accessible.

---

## 142. CONFIRMATION INTELLIGENTE

Pour les opérations critiques :

```text
Approve stock adjustment?

12 units will be removed from
Warehouse Bujumbura.

[Cancel]
[Approve adjustment]
```

Montrer l'impact réel.

---

## 143. ERROR PREVENTION

Le meilleur message d'erreur est celui qui n'arrive jamais.

Exemple :

Si quantité > stock disponible :

```text
Available: 8

Quantity: [12]

⚠ Only 8 units available.
```

---

## 144. INLINE VALIDATION

Valider tôt mais ne pas harceler l'utilisateur.

Ne pas afficher :

```text
Required
```

avant même qu'il ait commencé à remplir.

---

## 145. AUTOSAVE

Pour les documents longs :

```text
Saving...
Saved 14:32
```

Permettre :

```text
Restore draft
```

---

## 146. UNSAVED CHANGES

Si l'utilisateur quitte :

```text
You have unsaved changes.

[Stay]
[Discard]
```

---

## 147. DATA LOSS PROTECTION

Prévoir :

* draft recovery ;
* autosave ;
* navigation warning ;
* retry ;
* idempotency ;
* duplicate submission protection.

---

## 148. DOUBLE CLICK PROTECTION

Après action :

```text
Approve
```

désactiver immédiatement le bouton jusqu'à confirmation.

---

## 149. IDEMPOTENT UX

Les actions sensibles doivent afficher clairement :

```text
Processing...
```

et empêcher les doubles soumissions.

---

## 150. FINAL DESIGN PHILOSOPHY

Le résultat final doit donner cette impression :

```text
                 ERP BUSINESS OS

        ┌─────────────────────────────┐
        │ Identity / Organization     │
        ├─────────────────────────────┤
        │ Application Shell           │
        │                             │
        │ Search / Commands           │
        │ Navigation                  │
        │                             │
        │ Business Workspace          │
        │                             │
        │ Data / Workflow / Analytics │
        │                             │
        └─────────────────────────────┘
```

L'utilisateur doit pouvoir :

```text
CONNECT
   ↓
SELECT ORGANIZATION
   ↓
SEE ONLY WHAT HE CAN ACCESS
   ↓
SEARCH ANYTHING
   ↓
NAVIGATE INSTANTLY
   ↓
EXECUTE ACTIONS RAPIDLY
   ↓
WORK WITH HIGH DATA DENSITY
   ↓
SWITCH CONTEXT WITHOUT LOSING STATE
   ↓
UNDERSTAND ERRORS
   ↓
RECOVER FROM MISTAKES
   ↓
AUDIT EVERYTHING IMPORTANT
```

---

## 151. CRITÈRE ULTIME DE QUALITÉ

L'ERP ne doit pas être évalué uniquement par :

```text
"Est-ce que la page fonctionne ?"
```

mais par :

```text
"Combien de temps faut-il à un utilisateur
expérimenté pour accomplir son travail ?"

"Combien d'erreurs peut-il faire ?"

"Comprend-il immédiatement son contexte ?"

"Peut-il travailler au clavier ?"

"Peut-il travailler efficacement sur mobile ?"

"Peut-il récupérer après une erreur ?"

"Peut-il comprendre pourquoi il n'a pas accès ?"

"Peut-il passer d'une application à une autre
sans perdre son contexte ?"

"Le système met-il en évidence les exceptions
qui nécessitent une décision ?"
```

Le résultat recherché est donc :

**forte densité + faible charge cognitive + navigation instantanée + contexte permanent + actions intelligentes + personnalisation + accessibilité + sécurité + performance.**

---

## 152. DESIGN SYSTEM FINAL

La hiérarchie complète doit être :

```text
DESIGN TOKENS
       ↓
PRIMITIVE UI
       ↓
COMPOSITE UI
       ↓
BUSINESS COMPONENTS
       ↓
APPLICATION PATTERNS
       ↓
GLOBAL SHELL
       ↓
BUSINESS APPLICATIONS
       ↓
COMPLETE ERP EXPERIENCE
```

Et non :

```text
Page
 ├── Button
 ├── Card
 ├── Table
 └── random CSS
```

---

## 153. ARCHITECTURE UX FINALE

```text
                         USER
                           │
                           ▼
                    IDENTITY UX
                           │
                           ▼
                 ORGANIZATION UX
                           │
                           ▼
                 TENANT CONTEXT
                           │
                           ▼
               GLOBAL APPLICATION SHELL
                           │
        ┌──────────────────┼───────────────────┐
        ▼                  ▼                   ▼
   APP SWITCHER       GLOBAL SEARCH       COMMAND PALETTE
        │                  │                   │
        └──────────────────┼───────────────────┘
                           ▼
                    NAVIGATION ENGINE
                           │
                           ▼
                 CAPABILITY / ACCESS
                           │
                           ▼
                   APPLICATION UX
                           │
        ┌──────────────────┼───────────────────┐
        ▼                  ▼                   ▼
      TABLES            FORMS              WORKFLOWS
        │                  │                   │
        └──────────────────┼───────────────────┘
                           ▼
                    BUSINESS ACTION
                           │
                           ▼
                     FEEDBACK
                           │
                           ▼
                     AUDIT / ACTIVITY
```

Cette architecture doit être appliquée à **toutes les applications du produit**, avec une cohérence absolue entre Core, Inventory, Sales, Purchasing, CRM, Accounting, HR, POS, Analytics, etc.
