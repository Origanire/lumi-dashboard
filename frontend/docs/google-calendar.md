# Google Calendar dans Lumi

## Se connecter en tant qu'utilisateur

Une fois l'application configurée par la personne qui la déploie :

1. Ouvrir Lumi et se connecter à son compte Lumi.
2. Ouvrir **Ajouter un widget** et ajouter **Agenda · Échéances du mois** ou **Agenda · Semaine et jour**.
3. Dans le widget, cliquer sur **Connecter Google Calendar**.
4. Dans la fenêtre Google, sélectionner le compte Google qui contient l'agenda à utiliser.
5. Lire puis accepter l'autorisation d'accès aux événements Google Calendar.

Lumi affiche alors les événements de l'agenda principal du compte Google sélectionné. Le bouton **+ Événement** permet aussi d'en créer depuis Lumi. Le bouton **Déconnecter** retire la connexion de la page ; il ne révoque pas l'autorisation Google. Pour révoquer complètement cette autorisation, ouvrir [les connexions du compte Google](https://myaccount.google.com/connections) et supprimer Lumi.

Le jeton Google reste en mémoire uniquement pendant la session de la page. Il est supprimé lorsque l'on se déconnecte de Lumi, change de compte ou recharge la page. Il faut alors reconnecter Google Calendar.

## Configuration de l'application

Deux widgets sont disponibles dans **Ajouter un widget** :

- **Agenda · Échéances du mois** : événements du mois sélectionné encore en cours ou à venir, avec nom, dates, échéance, priorité et labels. Le sélecteur mois/année permet de naviguer et une option affiche les événements passés.
- **Agenda · Semaine et jour** : semaine du lundi au dimanche, jour actuel mis en évidence, vue quotidienne et navigation par date. Le bouton `+` de chaque journée préremplit la date de création.

Les deux vues partagent la connexion à l’agenda Google principal du compte choisi. **+ Événement** permet de créer un rendez-vous à n’importe quelle date (semaine, mois ou année), avec heures ou journée entière, priorité, labels techniques séparés par des virgules, échéance facultative, lieu et description. Sans échéance explicite, la fin de l’événement est affichée comme échéance. Les événements de plusieurs jours apparaissent sur chaque journée concernée. Les horaires utilisent le fuseau du navigateur, affiché dans le widget.

Les priorités, labels et échéances sont conservés dans les propriétés privées Google de l’événement (`lumiPriority`, `lumiLabels`, `lumiDeadline`). Google Calendar conserve ces métadonnées mais son interface ne les affiche pas comme champs natifs. Les événements créés ailleurs apparaissent avec une priorité normale. La modification et la suppression restent accessibles via le lien de l’événement vers Google Calendar.

## Configuration Google Cloud (une fois pour l’application)

1. Ouvrir [Google Cloud Console](https://console.cloud.google.com/) et sélectionner ou créer le projet Lumi.
2. Activer **Google Calendar API** dans la bibliothèque des API.
3. Configurer l’écran de consentement **Google Auth Platform** : nom de l’application, adresse d’assistance et audience. Pour un projet externe en mode test, ajouter les comptes Google utilisés dans **Utilisateurs de test**.
4. Créer un **ID client OAuth 2.0**, type **Application Web**. Ajouter les origines JavaScript autorisées : `http://localhost`, `http://localhost:5174` et, si utilisé, `http://127.0.0.1:5174`. En production, ajouter l’origine HTTPS exacte du frontend. Ce flux utilise une fenêtre Google, sans route de redirection OAuth backend.
5. Déclarer l’autorisation `https://www.googleapis.com/auth/calendar.events` pour lire et créer les événements. La publication pour d’autres utilisateurs peut nécessiter la vérification Google des autorisations demandées.
6. Copier uniquement l’identifiant client **public** dans le fichier `.env` à la racine :

   ```dotenv
   VITE_GOOGLE_CLIENT_ID=IDENTIFIANT.apps.googleusercontent.com
   ```

7. Redémarrer `npm run dev`. Les utilisateurs pourront ensuite suivre la procédure de connexion ci-dessus.

Aucun secret client, mot de passe Gmail ou mot de passe d’application SMTP n’est nécessaire pour Calendar. Les variables préfixées `VITE_` sont publiques : ne jamais y mettre un secret. Vite charge désormais le `.env` de la racine, commun au projet ; seules les variables `VITE_` sont exposées au navigateur.

## Sessions et synchronisation

Le jeton Google reste uniquement en mémoire et n’est jamais enregistré dans `localStorage`, dans la disposition du dashboard ou dans la base Lumi. Il disparaît à la déconnexion Lumi, au changement de compte ou au rechargement de la page. À son expiration, le widget propose de reconnecter Google. **Déconnecter** ferme la connexion locale aux deux widgets ; pour retirer définitivement l’autorisation de l’application, utiliser [les connexions du compte Google](https://myaccount.google.com/connections).

La liste est actualisée après une création, au retour sur la fenêtre et chaque minute lorsque la page est visible. Un bouton **Actualiser** est disponible. Les instances récurrentes sont développées par Google et toutes les pages de résultats sont chargées. Les événements annulés sont exclus. En cas de panne, aucune donnée d’exemple ne remplace silencieusement l’agenda réel.

## Vérification

```bash
npm run test -w frontend
npm run build -w frontend
```

Les tests automatisés couvrent les limites de mois/année, les journées entières et leur fin exclusive, les événements de plusieurs jours, le changement d’heure, les métadonnées, la pagination et les erreurs réseau/authentification. Une validation réelle nécessite un identifiant OAuth et le consentement dans la fenêtre Google : créer un événement de test depuis Lumi, vérifier sa présence dans Google Calendar et dans les deux widgets, puis le supprimer dans Google Calendar.

Références officielles : [modèle OAuth navigateur](https://developers.google.com/identity/oauth2/web/guides/use-token-model), [identifiant client](https://developers.google.com/identity/oauth2/web/guides/get-google-api-clientid), [liste des événements](https://developers.google.com/workspace/calendar/api/v3/reference/events/list), [création](https://developers.google.com/workspace/calendar/api/v3/reference/events/insert), [propriétés privées](https://developers.google.com/workspace/calendar/api/guides/extended-properties).
