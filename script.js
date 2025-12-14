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
let KEY_MOT_DU_JOUR_PREFIX_6 = '';
let KEY_MOT_DU_JOUR_PREFIX_7 = '';
let KEY_MOT_DU_JOUR_PREFIX_8 = '';
let KEY_MOT_DU_JOUR_PREFIX_9 = '';
// Nouveau : Stocke l'état des lettres sur le clavier
let etatClavier = {}; 

// --- NOUVELLES CONSTANTES DE STOCKAGE (avec prefixes) ---
const KEY_ETAT_JEU_PREFIX = 'sutom_etat_jeu_'; 
const KEY_MOT_DU_JOUR_PREFIX = 'sutom_mot_du_jour_'; 
const KEY_HISTORIQUE = 'sutom_historique'; 

// Définition du clavier QWERTY standard (pour la francophonie)
const CLAVIER_LAYOUT = [
    ['A', 'Z', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['Q', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M'],
    ['ENTRÉE', 'W', 'X', 'C', 'V', 'B', 'N', '-', '⌫']
];

// ===============================================
// ======== FONCTIONS UTILITAIRES
// ===============================================

// Retourne la date du jour au format AAAA-MM-JJ (pour la comparaison)
function getDateDuJour() {
    const d = new Date();
    // Utiliser le fuseau horaire local (ajusté pour la compatibilité FR/CA pour le format YYYY-MM-DD)
    return d.toLocaleDateString('fr-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
}

// Fonction utilitaire pour obtenir la clé de stockage spécifique à la longueur
function getEtatJeuKey(longueur) {
    return KEY_ETAT_JEU_PREFIX + longueur;
}

function getMotDuJourKey(longueur) {
    return KEY_MOT_DU_JOUR_PREFIX + longueur;
}

// ===============================================
// ======== FONCTIONS DE SAUVEGARDE ET CHARGEMENT
// ===============================================

function sauvegarderEtatJeu() {
    if (motCibleLongueur === 0) return;

    const etat = {
        motCibleLongueur: motCibleLongueur,
        premiereLettre:premiereLettre,
        essaisCourants: essaisCourants,
        ligneActuelleIndex: ligneActuelleIndex,
        jeuTermine: jeuTermine,
        etatClavier: etatClavier
    };
    // Utilise la clé spécifique à la longueur actuelle
    localStorage.setItem(getEtatJeuKey(motCibleLongueur), JSON.stringify(etat));
}

function effacerEtatJeu() {
    if (motCibleLongueur === 0) return;
    // Utilise la clé spécifique à la longueur actuelle
    localStorage.removeItem(getEtatJeuKey(motCibleLongueur));
}

function sauvegarderHistorique(gagne) {
    const historiqueRaw = localStorage.getItem(KEY_HISTORIQUE) || '[]';
    const historique = JSON.parse(historiqueRaw);
    
    const partieTerminee = {
        date: new Date().toISOString(),
        motCibleLongueur: motCibleLongueur,
        premiereLettre: premiereLettre,
        essais: essaisCourants, 
        victoire: gagne
    };
    
    historique.push(partieTerminee);
    localStorage.setItem(KEY_HISTORIQUE, JSON.stringify(historique));
}

// ===============================================
// ======== FONCTIONS DE GESTION DE L'HISTORIQUE
// ===============================================

function afficherHistorique() {
    const historiqueRaw = localStorage.getItem(KEY_HISTORIQUE) || '[]';
    const historique = JSON.parse(historiqueRaw);
    const listeDiv = document.getElementById('historique-liste');
    
    // Vérification essentielle car l'élément n'est pas dans le HTML fourni
    if (!listeDiv) {
        console.error("Erreur: L'élément 'historique-liste' est introuvable. Veuillez mettre à jour votre index.html.");
        return;
    }
    
    listeDiv.innerHTML = '';
    
    if (historique.length === 0) {
        listeDiv.innerHTML = '<p>Aucune partie terminée enregistrée dans l\'historique.</p>';
    } else {
        // Afficher les parties du plus récent au plus ancien
        historique.reverse().forEach((partie, index) => {
            const item = document.createElement('div');
            
            const classeStatut = partie.victoire ? 'victoire' : 'defaite';
            const statutTexte = partie.victoire ? 'VICTOIRE' : 'DÉFAITE';
            const tentatives = partie.essais.length;
            const date = new Date(partie.date).toLocaleDateString('fr-FR');
            
            item.className = `partie-item ${classeStatut}`;
            item.innerHTML = `
                <div>
                    <strong>${statutTexte}</strong> (${partie.motCibleLongueur} lettres)
                </div>
                <div>
                    ${tentatives} essai(s) - ${date}
                </div>
            `;
            listeDiv.appendChild(item);
        });
    }

    const modale = document.getElementById('historique-modale');
    if (modale) {
        modale.style.display = 'block';
    } else {
         console.error("Erreur: L'élément 'historique-modale' est introuvable. Veuillez mettre à jour votre index.html.");
    }
}

function fermerHistorique() {
    const modale = document.getElementById('historique-modale');
    if(modale) modale.style.display = 'none';
}

function effacerToutHistorique() {
    if (confirm("Êtes-vous sûr de vouloir effacer tout votre historique de jeu ? Cette action est irréversible.")) {
        localStorage.removeItem(KEY_HISTORIQUE);
        afficherHistorique(); 
    }
}

window.onclick = function(event) {
    const modale = document.getElementById('historique-modale');
    if (modale && event.target === modale) {
        fermerHistorique();
    }
}

// ===============================================
// ======== FONCTIONS CLAVIER
// ===============================================

function creerClavier() {
    const container = document.getElementById('clavier-container');
    container.innerHTML = '';
    etatClavier = {}; 

    CLAVIER_LAYOUT.forEach(ligneTouches => {
        const ligneDiv = document.createElement('div');
        ligneDiv.className = 'clavier-ligne';

        ligneTouches.forEach(lettre => {
            const touche = document.createElement('button');
            touche.className = 'clavier-touche';
            touche.textContent = lettre;
            
            touche.addEventListener('click', () => gererToucheClavier(lettre));

            if (lettre === 'ENTRÉE' || lettre === '⌫') { 
                touche.classList.add('touche-speciale');
            }

            ligneDiv.appendChild(touche);
        });
        container.appendChild(ligneDiv);
    });
}

function mettreAJourClavier(resultatVerification) {
    resultatVerification.forEach(res => {
        const lettre = res.lettre;
        const statut = res.statut;
        
        if (lettre === premiereLettre && statut !== 'bien_place') {
            return;
        }

        const statutActuel = etatClavier[lettre];

        if (statut === 'bien_place') {
            etatClavier[lettre] = statut;
        } else if (statut === 'mal_place' && statutActuel !== 'bien_place') {
            etatClavier[lettre] = statut;
        } else if (statut === 'absente' && statutActuel === undefined) {
             etatClavier[lettre] = statut;
        }
    });

    document.querySelectorAll('.clavier-touche').forEach(touche => {
        const lettre = touche.textContent;
        if (etatClavier[lettre]) {
            touche.classList.remove('bien_place', 'mal_place', 'absente');
            touche.classList.add(etatClavier[lettre]);
        }
    });
}

function gererToucheClavier(touche) {
    const input = document.getElementById('proposition-input');
    const valeurActuelleSansPremiere = input.value.toUpperCase(); 
    let nouvellePropositionSansPremiere = valeurActuelleSansPremiere;

    if (jeuTermine) return;

    if (touche === 'ENTRÉE') {
        document.getElementById('sutom-form').dispatchEvent(new Event('submit'));
        return; 
        
    } else if (touche === '⌫') {
        nouvellePropositionSansPremiere = valeurActuelleSansPremiere.slice(0, -1);
        
    } else if (touche.length === 1 && valeurActuelleSansPremiere.length < (motCibleLongueur - 1)) { 
        nouvellePropositionSansPremiere = valeurActuelleSansPremiere + touche;
        
    } else {
        return;
    }
    
    input.value = nouvellePropositionSansPremiere;
    mettreAJourAffichageSaisie(premiereLettre + nouvellePropositionSansPremiere); 
    
    if (touche.length === 1) {
        document.getElementById('message').textContent = '';
    }
}

// ===============================================
// ======== FONCTIONS D'INTERFACE UTILISATEUR
// ===============================================

function creerGrille(longueur) {
    const container = document.getElementById('grille-container');
    container.innerHTML = '';
    
    for (let i = 0; i < MAX_ESSAIS; i++) {
        const ligne = document.createElement('div');
        ligne.className = 'ligne';
        ligne.id = `ligne-${i}`;
        
        for (let j = 0; j < longueur; j++) {
            const caseDiv = document.createElement('div');
            caseDiv.className = 'case';
            caseDiv.id = `case-${i}-${j}`;
            
            if (j === 0) {
            // Première lettre
                caseDiv.dataset.lettre = premiereLettre; // STOCKER DANS L'ATTRIBUT
                caseDiv.textContent = ''; // LAISSER VIDE
            } else {
                // Autres cases
                caseDiv.dataset.lettre = ''; // L'attribut est vide par défaut
                caseDiv.textContent = ''; // LAISSER VIDE
            }

            ligne.appendChild(caseDiv);
        }
        container.appendChild(ligne);
    }
}

function mettreAJourLigneActive() {
    // Retirer 'ligne-active' partout
    document.querySelectorAll('.ligne').forEach(l => l.classList.remove('ligne-active'));
    
    // Mettre à jour la ligne active
    const prochaineLigne = document.getElementById(`ligne-${ligneActuelleIndex}`);
    if (prochaineLigne && !jeuTermine) {
        prochaineLigne.classList.add('ligne-active');
    }
    
    // --- GESTION DE L'ÉTAT D'ACTIVATION DES INPUTS/CLAVIER ---
    const input = document.getElementById('proposition-input');
    const submitButton = document.getElementById('sutom-form').querySelector('button[type="submit"]');

    if (input && submitButton) {
        // Désactiver l'input et le bouton si le jeu est terminé
        input.disabled = jeuTermine;
        submitButton.disabled = jeuTermine;
        // Vider l'input si le jeu est terminé
        if (jeuTermine) input.value = '';
    }
    
    // Désactiver/Activer visuellement le clavier (voir style.css)
    const clavier = document.getElementById('clavier-container');
    if (clavier) {
        clavier.classList.toggle('jeu-termine', jeuTermine);
    }
}

// Affiche un essai existant (pour la reprise ou la partie terminée)
function afficherEssaiRepris(resultatVerification, indexLigne) {
    const ligne = document.getElementById(`ligne-${indexLigne}`);
    if (!ligne) return;

    ligne.classList.remove('ligne-active');

    resultatVerification.forEach((res, index) => {
        const caseDiv = ligne.querySelector(`#case-${indexLigne}-${index}`);
        if (caseDiv) {
            caseDiv.textContent = res.lettre;
            caseDiv.classList.add(res.statut);
            
            if (index === 0) {
                 caseDiv.classList.remove('absente', 'mal_place'); 
                 caseDiv.classList.add('premiere_lettre');
            }
        }
    });
}

// Affiche la grille d'une partie terminée trouvée dans l'historique
function afficherGrilleTerminee(longueur, date, premiereLettreCible) {
    const historiqueRaw = localStorage.getItem(KEY_HISTORIQUE) || '[]';
    const historique = JSON.parse(historiqueRaw);
    
    // Convertir la date de l'historique en AAAA-MM-JJ pour la comparaison
    const dateFormatee = date; 

    // Trouver la partie correspondante 
    const partieTrouvee = historique.find(p => 
        p.motCibleLongueur === longueur && 
        p.premiereLettre === premiereLettreCible &&
        new Date(p.date).toLocaleDateString('fr-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-') === dateFormatee
    );

    if (partieTrouvee) {
        // Réinitialisation des variables locales pour l'affichage
        motCibleLongueur = partieTrouvee.motCibleLongueur;
        premiereLettre = partieTrouvee.premiereLettre;
        jeuTermine = true; // Marquer le jeu comme terminé
        
        // 1. Créer la grille et réinitialiser le clavier
        creerGrille(motCibleLongueur);
        creerClavier(); // Réinitialise l'étatClavier
        
        const tousLesResultats = [];
        
        // 2. Afficher chaque essai de la partie terminée
        partieTrouvee.essais.forEach((resultat, indexLigne) => {
            afficherEssaiRepris(resultat, indexLigne);
            tousLesResultats.push(...resultat);
        });
        
        // 3. Mettre à jour le clavier avec les statuts finaux
        mettreAJourClavier(tousLesResultats);

        // 4. Afficher le message final
        let message = `Le mot de ${longueur} lettres du jour est déjà terminé.`;
        if (partieTrouvee.victoire) {
             message += " (VICTOIRE)";
        } else {
             message += " (DÉFAITE)";
        }
        document.getElementById('message').textContent = message;
        
    } else {
        // Cas d'erreur : le mot est marqué comme terminé, mais on ne trouve pas les essais dans l'historique
        creerGrille(longueur); 
        document.getElementById('message').textContent = `Le mot d'aujourd'hui est terminé, mais l'historique des essais n'est pas disponible.`;
    }

    // Le disabling se fait ici
    mettreAJourLigneActive(); 
}


async function afficherResultat(resultatVerification, gagne) {
    const ligne = document.getElementById(`ligne-${ligneActuelleIndex}`);

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
    
    mettreAJourClavier(resultatVerification); 

    ligneActuelleIndex++;
    
    // Vérification de la victoire/défaite 
    if (gagne) {
        document.getElementById('message').textContent = 'Félicitations ! Vous avez trouvé le mot !';
        jeuTermine = true;
    } else if (ligneActuelleIndex >= MAX_ESSAIS) {
        document.getElementById('message').textContent = 'Dommage ! Vous avez épuisé tous vos essais.';
        jeuTermine = true;
    } else {
        document.getElementById('message').textContent = '';
    }
    
    mettreAJourLigneActive(); 
}

function mettreAJourAffichageSaisie(proposition) {
    const ligne = document.getElementById(`ligne-${ligneActuelleIndex}`);
    if (!ligne) return; 

    for (let i = 0; i < motCibleLongueur; i++) {
        const caseDiv = ligne.querySelector(`#case-${ligneActuelleIndex}-${i}`);
        
        if (!caseDiv) continue;
        
        let lettre = proposition[i] ? proposition[i].toUpperCase() : '';

        if (i === 0) {
            caseDiv.dataset.lettre = premiereLettre;
            caseDiv.textContent = ''; // Vider le contenu
        } else {
            caseDiv.dataset.lettre = lettre;
            caseDiv.textContent = ''; 
        }

        // Ajouter une classe "active" pour styler la case en cours de saisie
        if (i < proposition.length && i > 0) {
            caseDiv.classList.add('active-saisie');
        } else {
            caseDiv.classList.remove('active-saisie');
        }
    }
}

// ===============================================
// ======== LOGIQUE DE CHARGEMENT DU MOT
// ===============================================

async function chargerMotCible(longueur) {
    // La longueur doit être valide (>= 4)
    if (longueur < 4) return;

    const dateJour = getDateDuJour();
    const motDuJourKey = getMotDuJourKey(longueur);
    const motDuJourSauvegarde = localStorage.getItem(motDuJourKey);
    
    // 1. VÉRIFICATION DU MOT DU JOUR TERMINÉ
    if (motDuJourSauvegarde) {
        const motSauvegarde = JSON.parse(motDuJourSauvegarde);
        
        if (motSauvegarde.date === dateJour && motSauvegarde.termine) {
            
            // SI TERMINÉE, ON RÉAFFICHE IMMÉDIATEMENT L'HISTORIQUE ET ON BLOQUE
            motCibleLongueur = motSauvegarde.longueur;
            premiereLettre = motSauvegarde.premiereLettre;

            document.getElementById('info').textContent = `Mot de ${longueur} lettres. Commence par : ${motSauvegarde.premiereLettre}.`;
            
            // Reconstruit la grille, affiche les essais de l'historique et bloque le jeu.
            afficherGrilleTerminee(longueur, dateJour, motSauvegarde.premiereLettre);
            
            return; 
        }
    }
    
    // 2. TENTATIVE DE CHARGEMENT D'UNE PARTIE EN COURS (KEY_ETAT_JEU_X)
    const etatSauvegarde = localStorage.getItem(getEtatJeuKey(longueur));

    if (etatSauvegarde) {
        // Si on a un état sauvegardé pour cette longueur (partie en cours), on le charge.
        const etat = JSON.parse(etatSauvegarde);
        
        motCibleLongueur = etat.motCibleLongueur;
        premiereLettre = etat.premiereLettre;
        essaisCourants = etat.essaisCourants;
        ligneActuelleIndex = etat.ligneActuelleIndex;
        jeuTermine = etat.jeuTermine;
        etatClavier = etat.etatClavier || {}; 
        
        document.getElementById('longueur-select').value = String(motCibleLongueur);
        document.getElementById('info').textContent = `Mot de ${motCibleLongueur} lettres. Commence par : ${premiereLettre}.`;
        
        creerGrille(motCibleLongueur);
        essaisCourants.forEach((resultat, index) => {
            afficherEssaiRepris(resultat, index); 
        });
        
        const tousLesResultats = essaisCourants.reduce((acc, current) => acc.concat(current), []);
        mettreAJourClavier(tousLesResultats); 
        mettreAJourLigneActive();

        document.getElementById('message').textContent = 'Partie en cours (chargée).';

        return; // Reprise réussie
    }


    // 3. CHARGEMENT D'UN NOUVEAU MOT VIA API
    
    // Réinitialisation complète des variables locales pour la NOUVELLE partie
    essaisCourants = [];
    ligneActuelleIndex = 0;
    jeuTermine = false;
    etatClavier = {}; 
    
    try {
        const response = await fetch(`${SERVER_URL}/mot-cible/${longueur}`);
        if (!response.ok) {
            
            // Afficher une erreur si le serveur ne renvoie pas 200 OK
            let errorMsg = 'Erreur de chargement du mot cible (Vérifiez le terminal du serveur).';
            try {
                const errorData = await response.json();
                errorMsg = errorData.message || errorMsg;
            } catch (e) {
                // Si la réponse n'est pas un JSON, on garde l'erreur par défaut.
            }

            document.getElementById('message').textContent = errorMsg;
            throw new Error(errorMsg);
        }
        const data = await response.json();
        
        motCibleLongueur = data.longueur;
        premiereLettre = data.premiereLettre.toUpperCase();
        
        document.getElementById('info').textContent = `Mot de ${motCibleLongueur} lettres. Commence par : ${premiereLettre}.`;
        
        creerGrille(motCibleLongueur);
        creerClavier(); // pour s'assurer que l'étatClavier est vide
        
        // Enregistrer le mot du jour (non terminé) pour cette longueur
        const nouveauMotDuJour = {
            date: dateJour,
            longueur: motCibleLongueur,
            termine: false, 
            premiereLettre: premiereLettre 
        };
        localStorage.setItem(motDuJourKey, JSON.stringify(nouveauMotDuJour));
        
        sauvegarderEtatJeu(); // utilise la nouvelle clé
        mettreAJourLigneActive();
        
    } catch (error) {
        console.error('Erreur:', error);
        // Si la grille n'apparaît pas ici, c'est que l'appel API a échoué.
        if (document.getElementById('message').textContent === '') {
             document.getElementById('message').textContent = 'Erreur lors du chargement du jeu (problème de serveur/réseau).';
        }
    }
}

// Fonction appelée par le bouton "Nouveau Mot du Jour" et le sélecteur
function chargerNouveauJeu() {
    const select = document.getElementById('longueur-select');
    const longueur = parseInt(select.value, 10);
    
    // On s'appuie entièrement sur chargerMotCible pour vérifier l'état et charger.
    
    document.getElementById('message').textContent = '';
    document.getElementById('proposition-input').value = '';
    
    creerClavier(); 
    chargerMotCible(longueur);
}


// ===============================================
// ======== LOGIQUE DU JEU ET SOUMISSION
// ===============================================

async function gererSoumission(event) {
    event.preventDefault();

    if (jeuTermine) {
        document.getElementById('message').textContent = "Le jeu est terminé.";
        return;
    }
    
    const input = document.getElementById('proposition-input');
    let propositionSaisie = input.value.toUpperCase().trim();
    
    let propositionAvecAccents = premiereLettre + propositionSaisie;
    let propositionNormalisee = propositionAvecAccents; 
    
    if (propositionAvecAccents.length !== motCibleLongueur) {
        document.getElementById('message').textContent = `Le mot doit avoir ${motCibleLongueur} lettres.`;
        return;
    }
    
    input.value = ''; 


    try {
        const response = await fetch(`${SERVER_URL}/verifier`, {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ proposition: propositionNormalisee, longueur: motCibleLongueur })
        });

        if (!response.ok) {
            const errorData = await response.json(); 
            document.getElementById('message').textContent = `Erreur: ${errorData.message}`;
            
            const propositionSaisieRetour = propositionAvecAccents.substring(1); 
            input.value = propositionSaisieRetour;
            mettreAJourAffichageSaisie(propositionAvecAccents); 
            
            return;
        }

        const data = await response.json();
        
        // AJOUT : Sauvegarder l'essai
        essaisCourants.push(data.resultat); 
                
        afficherResultat(data.resultat, data.gagne); 

        sauvegarderEtatJeu(); // SAUVEGARDER L'ÉTAT DU JEU APRÈS LE COMMUT

        if (jeuTermine) {
            // NOUVEAU : Marquer le mot du jour comme terminé (pour cette longueur)
            const motDuJourKey = getMotDuJourKey(motCibleLongueur);
            const motDuJourSauvegarde = JSON.parse(localStorage.getItem(motDuJourKey));
            
            if (motDuJourSauvegarde) {
                motDuJourSauvegarde.termine = true;
                localStorage.setItem(motDuJourKey, JSON.stringify(motDuJourSauvegarde));
            }
            
            sauvegarderHistorique(data.gagne);
            effacerEtatJeu(); // utilise la clé spécifique à la longueur
        }
        
    } catch (error) {
        console.error('Erreur de vérification (réseau):', error);
        document.getElementById('message').textContent = 'Erreur lors de la communication avec le serveur.';
    }
}

// ===============================================
// ======== INITIALISATION
// ===============================================

document.getElementById('sutom-form').addEventListener('submit', gererSoumission);

document.getElementById('proposition-input').addEventListener('input', (e) => {
    const proposition = e.target.value.toUpperCase().slice(0, motCibleLongueur - 1); // -1 car la première lettre est fixe
    e.target.value = proposition; 
    
    mettreAJourAffichageSaisie(premiereLettre + proposition);
});

document.addEventListener('DOMContentLoaded', () => {
    // Obtenir la longueur par défaut/sélectionnée.
    const longueurInitiale = parseInt(document.getElementById('longueur-select').value, 10);
    
    // Appeler directement chargerMotCible qui gère la reprise d'état (si existant) ou la partie terminée.
    // Il gère aussi l'appel à creerClavier.
    chargerMotCible(longueurInitiale); 
    
    // Ajouter l'écouteur pour le changement de longueur
    document.getElementById('longueur-select').addEventListener('change', chargerNouveauJeu);
});