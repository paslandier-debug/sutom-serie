// script.js
// utilise le chemin relatif au serveur hôte
const SERVER_URL = '/api';
//xxx const SERVER_URL = 'http://localhost:3000/api';
const MAX_ESSAIS = 6;

let motCibleLongueur = 0;
let premiereLettre = '';
let essaisCourants = [];
let ligneActuelleIndex = 0;
let jeuTermine = false;
// Nouveau : Stocke l'état des lettres sur le clavier
let etatClavier = {}; 

// Définition du clavier QWERTY standard (pour la francophonie)
const CLAVIER_LAYOUT = [
    ['A', 'Z', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['Q', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M'],
    ['ENTRÉE', 'W', 'X', 'C', 'V', 'B', 'N', 'EFFACER']
];

// --- NOUVELLES FONCTIONS CLAVIER ---

// Fonction pour générer le clavier virtuel
function creerClavier() {
    const container = document.getElementById('clavier-container');
    container.innerHTML = '';
    etatClavier = {}; // Réinitialiser l'état des lettres

    CLAVIER_LAYOUT.forEach(ligneTouches => {
        const ligneDiv = document.createElement('div');
        ligneDiv.className = 'clavier-ligne';

        ligneTouches.forEach(lettre => {
            const touche = document.createElement('button');
            touche.className = 'clavier-touche';
            touche.textContent = lettre;
            
            // Attacher l'écouteur d'événement
            touche.addEventListener('click', () => gererToucheClavier(lettre));

            if (lettre === 'ENTRÉE' || lettre === 'EFFACER') {
                touche.classList.add('touche-speciale');
            }

            ligneDiv.appendChild(touche);
        });
        container.appendChild(ligneDiv);
    });
}

// Fonction pour mettre à jour l'état du clavier après un essai
function mettreAJourClavier(resultatVerification) {
    resultatVerification.forEach(res => {
        const lettre = res.lettre;
        const statut = res.statut;
        
        // La première lettre (bien placée) est toujours spéciale et ne doit pas être grisées
        if (lettre === premiereLettre && statut !== 'bien_place') {
            // Dans le vrai Sutom, la première lettre est toujours considérée comme 'bien_place'
            // si elle est proposée correctement. On laisse le statut 'bien_place' prévaloir
            return;
        }

        // Si le statut actuel est 'bien_place', il prévaut
        if (etatClavier[lettre] === 'bien_place') {
            return;
        }
        // Si le statut actuel est 'mal_place', le nouveau statut 'bien_place' prévaut
        if (etatClavier[lettre] === 'mal_place' && statut === 'bien_place') {
             etatClavier[lettre] = statut;
             return;
        }
        // Si le statut est 'absente', il ne peut pas être remplacé par 'mal_place' ou 'bien_place'
        if (etatClavier[lettre] === 'absente' && (statut === 'mal_place' || statut === 'bien_place')) {
            // Le nouveau statut est plus informatif
             etatClavier[lettre] = statut;
             return;
        }
        // Si la lettre n'a pas encore de statut ou si le nouveau statut est plus pertinent
        if (!etatClavier[lettre] || statut === 'bien_place' || (statut === 'mal_place' && etatClavier[lettre] !== 'absente')) {
            etatClavier[lettre] = statut;
        }
    });

    // Appliquer les classes CSS aux touches
    document.querySelectorAll('.clavier-touche').forEach(touche => {
        const lettre = touche.textContent;
        if (etatClavier[lettre]) {
            // Retirer les anciennes classes de statut
            touche.classList.remove('bien_place', 'mal_place', 'absente');
            // Ajouter la nouvelle classe de statut
            touche.classList.add(etatClavier[lettre]);
        }
    });
}

//=========================================
// script.js

// Fonction pour gérer les clics sur le clavier virtuel
// script.js (Fonction pour gérer les clics sur le clavier virtuel)

function gererToucheClavier(touche) {
    const input = document.getElementById('proposition-input');
    // NOTE : On utilise la valeur de l'input, mais on sait que la première lettre
    // sera ajoutée plus tard par le script.
    const valeurActuelleSansPremiere = input.value.toUpperCase(); 
    let nouvellePropositionSansPremiere = valeurActuelleSansPremiere;

    if (jeuTermine) return;

    if (touche === 'ENTRÉE') {
        // La soumission sera gérée plus tard dans gererSoumission
        document.getElementById('sutom-form').dispatchEvent(new Event('submit'));
        return; 
        
    } else if (touche === 'EFFACER') {
        // Effacer le dernier caractère
        nouvellePropositionSansPremiere = valeurActuelleSansPremiere.slice(0, -1);
        
    } else if (touche.length === 1 && valeurActuelleSansPremiere.length < (motCibleLongueur - 1)) { 
        // L'input caché ne doit contenir que (longueur - 1) caractères
        nouvellePropositionSansPremiere = valeurActuelleSansPremiere + touche;
        
    } else {
        return;
    }
    
    // 1. Mettre à jour la valeur de l'input réel (pour suivre l'état interne)
    input.value = nouvellePropositionSansPremiere;
    
    // 2. Mettre à jour l'affichage de la grille en temps réel
    // On ajoute la première lettre pour l'affichage uniquement :
    mettreAJourAffichageSaisie(premiereLettre + nouvellePropositionSansPremiere); 
    
    // Réinitialiser le message d'erreur
    if (touche.length === 1) {
        document.getElementById('message').textContent = '';
    }
}
//=========================================
// 
// Fonction pour gérer les clics sur le clavier virtuel
//xxx function gererToucheClavier(touche) {
//xxx    const input = document.getElementById('proposition-input');
//xxx    const valeurActuelle = input.value.toUpperCase();

//xxx    if (jeuTermine) return;

//xxx    if (touche === 'ENTRÉE') {
        // Simuler la soumission du formulaire
//xxx        document.getElementById('sutom-form').dispatchEvent(new Event('submit'));
//xxx    } else if (touche === 'EFFACER') {
        // Effacer le dernier caractère
//xxx        input.value = valeurActuelle.slice(0, -1);
//xxx    } else if (touche.length === 1 && valeurActuelle.length < motCibleLongueur) {
//xxx        // Ajouter la lettre, mais seulement si la première lettre est respectée
//xxx        const nouvelleProposition = valeurActuelle + touche;
//xxx        
//xxx        if (nouvelleProposition.length === 1 && nouvelleProposition !== premiereLettre) {
//xxx            document.getElementById('message').textContent = `Le mot doit commencer par la lettre '${premiereLettre}'.`;
//xxx            return; 
//xxx        }
//xxx
//xxx        // Ajouter la lettre à l'input
//xxx        input.value = nouvelleProposition;
//xxx        document.getElementById('message').textContent = ''; // Effacer le message d'erreur
//xxx    }
//xxx}

// --- Fonctions de l'Interface Utilisateur ---

// 1. Initialiser la grille HTML
function creerGrille(longueur) {
    const container = document.getElementById('grille-container');
    container.innerHTML = '';
    
    // Créer la grille de 6 essais
    for (let i = 0; i < MAX_ESSAIS; i++) {
        const ligne = document.createElement('div');
        ligne.className = 'ligne';
        ligne.id = `ligne-${i}`;
        // PL ajout 10/12 16:51
        if (i === 0) {
            ligne.classList.add('ligne-active'); // Marque la première ligne
        }

        for (let j = 0; j < longueur; j++) {
            const caseDiv = document.createElement('div');
            caseDiv.className = 'case';
            caseDiv.id = `case-${i}-${j}`;
            
            // Afficher la première lettre sur la première case de chaque ligne
            if (j === 0) {
                caseDiv.classList.add('premiere_lettre');
                caseDiv.textContent = premiereLettre;
            } else {
                caseDiv.textContent = '';
            }

            ligne.appendChild(caseDiv);
        }
        container.appendChild(ligne);
    }
}

// 2. Afficher la proposition du joueur dans la grille
async function afficherResultat(resultatVerification, gagne) {
    const ligne = document.getElementById(`ligne-${ligneActuelleIndex}`);

    // Retirer le statut "active" de la ligne actuelle
    if (ligne) {
        ligne.classList.remove('ligne-active');
    }
    
    resultatVerification.forEach((res, index) => {
        const caseDiv = ligne.querySelector(`#case-${ligneActuelleIndex}-${index}`);
        caseDiv.textContent = res.lettre;
        caseDiv.classList.add(res.statut);
        
        if (index === 0) {
             caseDiv.classList.remove('absente', 'mal_place'); 
             caseDiv.classList.add('premiere_lettre');
        }
    });
    //xxx ligneActuelleIndex++;
    // 1. Mettre à jour le clavier après l'affichage de la ligne
    mettreAJourClavier(resultatVerification); 

    ligneActuelleIndex++;
    
    // PL ajout 10/12 16:51
    const prochaineLigne = document.getElementById(`ligne-${ligneActuelleIndex}`);
    if (prochaineLigne) {
        prochaineLigne.classList.add('ligne-active');
    }

    // 2. Vérification de la victoire/défaite (déplacée ici pour utiliser 'gagne')
    if (gagne) {
        document.getElementById('message').textContent = 'Félicitations ! Vous avez trouvé le mot !';
        jeuTermine = true;
    } else if (ligneActuelleIndex >= MAX_ESSAIS) {
        document.getElementById('message').textContent = 'Dommage ! Vous avez épuisé tous vos essais.';
        jeuTermine = true;
    } else {
        document.getElementById('message').textContent = '';
    }
}

// Affichage des lettres dans la grille au fur et à mesure

function mettreAJourAffichageSaisie(proposition) {
    const ligne = document.getElementById(`ligne-${ligneActuelleIndex}`);
    if (!ligne) return; // Si l'index de ligne est hors limites

    // On parcourt toutes les cases de la ligne actuelle
    for (let i = 0; i < motCibleLongueur; i++) {
        const caseDiv = ligne.querySelector(`#case-${ligneActuelleIndex}-${i}`);
        
        if (!caseDiv) continue;
        
        let lettre = proposition[i] ? proposition[i].toUpperCase() : '';

        // La première case est fixe et ne doit pas être écrasée
        if (i === 0) {
            caseDiv.textContent = premiereLettre;
        } else {
            // Afficher la lettre ou laisser vide
            caseDiv.textContent = lettre;
        }

        // Ajouter une classe "active" pour styler la case en cours de saisie
        if (i < proposition.length && i > 0) {
            caseDiv.classList.add('active-saisie');
        } else {
            caseDiv.classList.remove('active-saisie');
        }
    }
}

// 3. Charger les données du mot cible depuis le serveur
async function chargerMotCible(longueur) {
    try {
        const response = await fetch(`${SERVER_URL}/mot-cible/${longueur}`);
        if (!response.ok) {
            throw new Error('Erreur de chargement du mot cible.');
        }
        const data = await response.json();
        motCibleLongueur = data.longueur;
        premiereLettre = data.premiereLettre.toUpperCase();
        
        // Mettre à jour l'info affichée
        document.getElementById('info').textContent = `Mot de ${motCibleLongueur} lettres. Commence par : ${premiereLettre}.`;
        
        creerGrille(motCibleLongueur);
        
    } catch (error) {
        console.error('Erreur:', error);
        document.getElementById('message').textContent = 'Erreur de connexion au serveur ou de chargement du mot du jour.';
    }
}

// 4. Initialiser un nouveau jeu
function chargerNouveauJeu() {
    const select = document.getElementById('longueur-select');
    const longueur = parseInt(select.value, 10);
    
    motCibleLongueur = 0;
    premiereLettre = '';
    ligneActuelleIndex = 0;
    jeuTermine = false;
    etatClavier = {}; // Réinitialiser le clavier

    document.getElementById('message').textContent = '';
    document.getElementById('proposition-input').value = '';

    creerClavier(); // <-- Créer le clavier
    chargerMotCible(longueur);
}


// --- Logique du Jeu et Soumission ---

// script.js (Fonction pour gérer la soumission du formulaire)

async function gererSoumission(event) {
    event.preventDefault();

    if (jeuTermine) {
        document.getElementById('message').textContent = "Le jeu est terminé.";
        return;
    }
    
    const input = document.getElementById('proposition-input');
    // Récupère la partie du mot tapée par l'utilisateur (sans la première lettre)
    let propositionSaisie = input.value.toUpperCase().trim();
    
    // --- NOUVEAU : CONSTRUCTION DU MOT COMPLET ---
    let proposition = premiereLettre + propositionSaisie;
    input.value = ''; // Efface l'input après la soumission

    if (proposition.length !== motCibleLongueur) {
        document.getElementById('message').textContent = `Le mot doit avoir ${motCibleLongueur} lettres.`;
        return;
    }
    
    // NOTE : La vérification de la première lettre n'est plus nécessaire ici
    // car on l'ajoute automatiquement.

    try {
        const response = await fetch(`${SERVER_URL}/verifier`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ proposition, longueur: motCibleLongueur })
        });
        

        if (!response.ok) {
            const errorData = await response.json();
            document.getElementById('message').textContent = `Erreur: ${errorData.message}`;
            return;
        }

        const data = await response.json();
        
        // Appel de la fonction d'affichage mise à jour
        afficherResultat(data.resultat, data.gagne); 

    } catch (error) {
        console.error('Erreur de vérification:', error);
        document.getElementById('message').textContent = 'Erreur lors de la communication avec le serveur.';
    }
}


// --- Initialisation ---

// Attacher l'écouteur d'événement à la soumission du formulaire
document.getElementById('sutom-form').addEventListener('submit', gererSoumission);

// Attacher l'écouteur pour la mise à jour en temps réel de l'input (saisie physique)
document.getElementById('proposition-input').addEventListener('input', (e) => {
    // Limiter la longueur au mot cible
    const proposition = e.target.value.toUpperCase().slice(0, motCibleLongueur);
    e.target.value = proposition; // Assurer que l'input est tronqué
    
    // Mettre à jour la grille visuellement
    mettreAJourAffichageSaisie(proposition);
});

// Charger le jeu initial au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    chargerNouveauJeu();
});