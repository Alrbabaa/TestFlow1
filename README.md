# TestFlow — Firebase + Vercel

TestFlow is a Vite/React client application using Firebase Authentication and
Cloud Firestore only. There is no Express server, Cloud Run service, Cloud SQL
database, Drizzle ORM, Firebase Admin SDK, service-account key, or runtime secret.

## Firestore collections

- users/{uid}: role. A user can create only their own developer_pending profile.
- developerRequests/{uid}: developer name, team/company, email, approval status.
- publicCampaigns/{campaignId}: public campaign data; never contains testUrl.
- campaignPrivate/{campaignId}: testUrl, owner id, internal notes; developer/admin only.
- applications/{campaignId}_{emailKey}: anonymous tester applications; never publicly readable.
- bugReports/{id} and feedback/{id}: reserved developer/admin-scoped collections.

The authoritative access controls are firestore.rules, not the React UI. The
two approved administrator UIDs are contained in the Rules and used by the
client only for routing.

## Local setup

1. Copy .env.example to .env.local.
2. Fill the six VITE_FIREBASE_* variables with Firebase Web app configuration
   for project gen-lang-client-0485544867.
3. Enable Authentication > Sign-in method > Google in Firebase Console.
4. Run npm install and npm run dev.

## Deploy Firestore Rules and indexes

Install Firebase CLI, authenticate as a Firebase project administrator, then:

    npm install -g firebase-tools
    firebase login
    firebase use gen-lang-client-0485544867
    firebase deploy --only firestore:rules,firestore:indexes

Create Firestore in Firebase Console in Production mode before deploying Rules.
Never leave Firebase's temporary test Rules enabled.

## Deploy on Vercel

1. Push this repository to GitHub.
2. Vercel > Add New > Project > import the repository.
3. Select Vite; build command npm run build; output directory dist.
4. Add all VITE_FIREBASE_* variables for Production, Preview, and Development.
   These are public Firebase web identifiers, not service-account credentials.
5. Deploy. vercel.json rewrites every route to index.html, so refresh works for
   /admin, /developer, and /campaign/rawnak.

## First campaign: Rawnak / رونق

1. Sign in from the discreet admin link in the footer with either approved UID.
2. Open /admin, create Rawnak / رونق, set slug rawnak, then enter its private
   Google Play closed-test or TestFlight URL.
3. Share https://YOUR-VERCEL-DOMAIN.vercel.app/campaign/rawnak.

The public campaign page exposes only public details and an anonymous tester
form. The test URL remains in campaignPrivate and cannot be read from the
public route.

## Anonymous duplicate constraint

The client lowercases email and writes the deterministic document id
campaignId_emailKey; Rules deny overwriting it, which prevents normal retries
and duplicate form submissions. Firestore Rules cannot normalize/hash arbitrary
email text, so fully adversary-proof identity deduplication is impossible with
unauthenticated writes alone. If that stricter guarantee is needed later, use a
trusted verification backend; it cannot be safely invented in this free,
backend-free architecture.
