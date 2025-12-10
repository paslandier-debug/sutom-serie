// server.js


const express = require('express');
const cors = require('cors');
const fs = require('fs'); // Si vous utilisez fs pour lire un fichier
const path = require('path'); // <-- AJOUTEZ CETTE LIGNE
const app = express();
const port = process.env.PORT || 3000;

// Middleware pour analyser le corps des requêtes en JSON
app.use(express.json());
// Middleware pour permettre les requêtes depuis le frontend (pour le développement)
app.use(cors());
// --- NOUVELLE LIGNE ESSENTIELLE ---
// Sert tous les fichiers du répertoire actuel (où se trouvent index.html, script.js, style.css)
// lorsque l'utilisateur accède à la racine du site.
app.use(express.static(__dirname));

// Utilisation d'un nom de variable plus descriptif pour la structure objet
let DICTIONNAIRE_PAR_LONGUEUR = {}; 

// Chemin vers le fichier dictionnaire.json
const cheminDictionnaire = path.join(__dirname, 'dictionnaire_sutom.json');

try {
    // 1. Lecture synchrone du contenu du fichier (chaîne JSON)
    const contenuJson = fs.readFileSync(cheminDictionnaire, 'utf8');
    
    // 2. Conversion de la chaîne JSON en un OBJET JavaScript
    const dictionnaireBrut = JSON.parse(contenuJson);

    // 3. Stockage et nettoyage
    if (typeof dictionnaireBrut === 'object' && dictionnaireBrut !== null) {
        DICTIONNAIRE_PAR_LONGUEUR = {};
        
        // Parcourir l'objet pour s'assurer que les mots sont bien en majuscules
        for (const longueur in dictionnaireBrut) {
            if (Array.isArray(dictionnaireBrut[longueur])) {
                DICTIONNAIRE_PAR_LONGUEUR[longueur] = dictionnaireBrut[longueur].map(
                    mot => mot.trim().toUpperCase()
                );
            }
        }
    } else {
        throw new Error("Le fichier JSON n'est pas un objet valide.");
    }
    
    console.log(`Dictionnaire chargé. Longueurs disponibles : ${Object.keys(DICTIONNAIRE_PAR_LONGUEUR).join(', ')}`);

} catch (error) {
    console.error("Erreur critique lors du chargement ou du parsing du dictionnaire JSON:", error.message);
    process.exit(1);
}



// Fonction pour obtenir les mots pour une longueur donnée
function getMotsParLongueur(longueur) {
    // MAINTENANT, nous accédons directement à la clé de l'objet
    // On convertit 'longueur' en chaîne car les clés JSON sont des chaînes ("6", "7", etc.)
    return DICTIONNAIRE_PAR_LONGUEUR[String(longueur)] || [];
}

// Fonction pour déterminer le mot du jour
function getMotDuJour(longueur) {
    const motsPossibles = getMotsParLongueur(longueur);
    if (motsPossibles.length === 0) return null;

    // Calculer un index basé sur le jour de l'année
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = (now - start) + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
    const oneDay = 1000 * 60 * 60 * 24;
    const jourDeLAnnee = Math.floor(diff / oneDay);

    const index = jourDeLAnnee % motsPossibles.length;
    return motsPossibles[index];
}

// Mots quotidiens stockés en mémoire
const motsQuotidiens = {
    6: getMotDuJour(6),
    7: getMotDuJour(7),
    8: getMotDuJour(8),
    9: getMotDuJour(9)
};

// Logique de vérification de Sutom
function verifierMot(proposition, motCible) {
    const resultat = [];
    const motCibleArray = motCible.toUpperCase().split('');
    const propositionArray = proposition.toUpperCase().split('');
    const lettresRestantes = {};

    // 1. Initialiser le comptage des lettres dans le mot cible
    motCibleArray.forEach(lettre => {
        lettresRestantes[lettre] = (lettresRestantes[lettre] || 0) + 1;
    });

    // 2. Traiter les lettres BIEN PLACÉES (vertes)
    for (let i = 0; i < propositionArray.length; i++) {
        const lettre = propositionArray[i];
        if (lettre === motCibleArray[i]) {
            resultat[i] = { lettre: lettre, statut: 'bien_place' };
            lettresRestantes[lettre]--;
        }
    }

    // 3. Traiter les lettres MAL PLACÉES (jaunes) et ABSENTES (grises)
    for (let i = 0; i < propositionArray.length; i++) {
        // Ignorer les lettres déjà marquées comme bien placées
        if (resultat[i] && resultat[i].statut === 'bien_place') continue;

        const lettre = propositionArray[i];

        if (lettresRestantes[lettre] > 0) {
            // Lettre présente dans le mot cible, mais mal placée
            resultat[i] = { lettre: lettre, statut: 'mal_place' };
            lettresRestantes[lettre]--;
        } else {
            // Lettre absente ou toutes les occurrences ont déjà été trouvées
            resultat[i] = { lettre: lettre, statut: 'absente' };
        }
    }

    return resultat;
}

// --- ROUTES API ---

// Route pour obtenir la première lettre et la longueur du mot du jour
app.get('/api/mot-cible/:longueur', (req, res) => {
    const longueur = parseInt(req.params.longueur, 10);
    const motCible = motsQuotidiens[longueur];

    if (!motCible) {
        return res.status(404).send({ message: "Aucun mot cible trouvé pour cette longueur." });
    }

    // On n'envoie que la première lettre et la longueur au client
    res.json({
        longueur: motCible.length,
        premiereLettre: motCible.charAt(0)
    });
});

// Route pour vérifier une proposition
app.post('/api/verifier', (req, res) => {
    const { proposition, longueur } = req.body;
    const motCible = motsQuotidiens[longueur];

    if (!motCible) {
        return res.status(404).send({ message: "Mot cible non défini pour cette longueur." });
    }

    if (proposition.length !== motCible.length) {
        return res.status(400).send({ message: "La proposition n'a pas la bonne longueur." });
    }
    
    // Simplification: en vrai Sutom, il faut vérifier que le mot existe dans le DICTIONNAIRE.
    // Pour cet exemple, on suppose que le mot proposé est valide.
    
    const resultatVerification = verifierMot(proposition, motCible);

    res.json({
        resultat: resultatVerification,
        gagne: proposition.toUpperCase() === motCible.toUpperCase()
    });
});


// Démarrer le serveur
app.listen(port, () => {
    console.log(`Server Sutom en cours d'exécution sur le port ${port}`);
    console.log('Mots du jour (ne pas les révéler au joueur) :');
    console.log(`  6 lettres: ${motsQuotidiens[6]}`);
    console.log(`  7 lettres: ${motsQuotidiens[7]}`);
    console.log(`  8 lettres: ${motsQuotidiens[8]}`);
    console.log(`  9 lettres: ${motsQuotidiens[9]}`);
});