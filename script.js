// script.js
const SERVER_URL = 'http://localhost:3000/api';
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

// Fonction pour gérer les clics sur le clavier virtuel
function gererToucheClavier(touche) {
    const input = document.getElementById('proposition-input');
    const valeurActuelle = input.value.toUpperCase();

    if (jeuTermine) return;

    if (touche === 'ENTRÉE') {
        // Simuler la soumission du formulaire
        document.getElementById('sutom-form').dispatchEvent(new Event('submit'));
    } else if (touche === 'EFFACER') {
        // Effacer le dernier caractère
        input.value = valeurActuelle.slice(0, -1);
    } else if (touche.length === 1 && valeurActuelle.length < motCibleLongueur) {
        // Ajouter la lettre, mais seulement si la première lettre est respectée
        const nouvelleProposition = valeurActuelle + touche;
        
        if (nouvelleProposition.length === 1 && nouvelleProposition !== premiereLettre) {
            document.getElementById('message').textContent = `Le mot doit commencer par la lettre '${premiereLettre}'.`;
            return; 
        }

        // Ajouter la lettre à l'input
        input.value = nouvelleProposition;
        document.getElementById('message').textContent = ''; // Effacer le message d'erreur
    }
}

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
//xxx    const ligne = document.getElementById(`ligne-${ligneActuelleIndex}`);
//xxx    
//xxx    resultatVerification.forEach((res, index) => {
//xxx        const caseDiv = ligne.querySelector(`#case-${ligneActuelleIndex}-${index}`);
//xxx        caseDiv.textContent = res.lettre;
//xxx        caseDiv.classList.add(res.statut); // Ajoute 'bien_place', 'mal_place', ou 'absente'
//xxx        
//xxx        // La première lettre doit toujours rester 'premiere_lettre'
//xxx        if (index === 0) {
//xxx             caseDiv.classList.remove('absente', 'mal_place'); 
//xxx             caseDiv.classList.add('premiere_lettre');
//xxx        }
//xxx    });

    
 // pl ajout ci-dessous pour le clavier   
    const ligne = document.getElementById(`ligne-${ligneActuelleIndex}`);
    
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

async function gererSoumission(event) {
    event.preventDefault();

    if (jeuTermine) {
        document.getElementById('message').textContent = "Le jeu est terminé.";
        return;
    }
    
    const input = document.getElementById('proposition-input');
    let proposition = input.value.toUpperCase().trim();
    input.value = '';

    if (proposition.length !== motCibleLongueur) {
        document.getElementById('message').textContent = `Le mot doit avoir ${motCibleLongueur} lettres.`;
        return;
    }
    if (proposition.charAt(0) !== premiereLettre) {
        document.getElementById('message').textContent = `Le mot doit commencer par la lettre '${premiereLettre}'.`;
        return;
    }

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

// Charger le jeu initial au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    chargerNouveauJeu();
});