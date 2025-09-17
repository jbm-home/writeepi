import { Component } from '@angular/core';
import { SharedModule } from '../shared.module.js';

@Component({
  selector: 'protagonist',
  imports: [SharedModule],
  templateUrl: './protagonist.component.html',
  styleUrl: './protagonist.component.scss'
})
export class ProtagonistComponent {
  expanded = { type: '', index: -1 };

  toggleExpand(type: string, index: number) {
    if (this.expanded.type === type && this.expanded.index === index) {
      this.expanded = { type: '', index: -1 }; // collapse
    } else {
      this.expanded = { type, index }; // expand
    }
  }
  phases = [
    { title: 'Situation initiale', question: "À quoi ressemble le quotidien du personnage avant que l’histoire ne commence ?", answer: '' },
    { title: 'Déclencheur', question: "Quel événement vient perturber ce quotidien ?", answer: '' },
    { title: 'Hésitation', question: "Pourquoi le personnage doute-t-il ou refuse-t-il de s’engager ?", answer: '' },
    { title: 'Aide / Inspiration', question: "Qui ou quoi lui donne la motivation pour avancer ?", answer: '' },
    { title: 'Premier pas', question: "Quel moment marque le vrai départ de son aventure ?", answer: '' },
    { title: 'Découvertes et obstacles', question: "Quelles premières épreuves, rencontres ou difficultés surviennent ?", answer: '' },
    { title: 'Confrontation majeure', question: "Quel défi important force le personnage à se dépasser ?", answer: '' },
    { title: 'Épreuve centrale', question: "Quel moment critique met en jeu ses forces et ses faiblesses les plus profondes ?", answer: '' },
    { title: 'Résultat / Transformation', question: "Que gagne-t-il ou perd-il après cette épreuve ?", answer: '' },
    { title: 'Retour vers l’équilibre', question: "Comment le personnage revient-il à une forme de stabilité ?", answer: '' },
    { title: 'Changement final', question: "Quelle transformation durable s’est opérée en lui ?", answer: '' },
    { title: 'Transmission', question: "Que partage-t-il ou transmet-il à son entourage après ce parcours ?", answer: '' },
  ];

  archetypes = [
    { title: 'Personnage principal', question: "Quel est son objectif ? Qu’est-ce qui l’empêche d’y parvenir ?", answer: '' },
    { title: 'Opposant', question: "Qu’est-ce qu’il veut ? Pourquoi s’oppose-t-il au personnage principal ?", answer: '' },
    { title: 'Guide', question: "Que transmet-il ? Quelle limite l’empêche d’agir directement ?", answer: '' },
    { title: 'Allié', question: "Comment aide-t-il ? Qu’attend-il en retour ?", answer: '' },
    { title: 'Figure déclencheuse', question: "Quel rôle joue-t-il dans le départ de l’histoire ?", answer: '' },
    { title: 'Obstacle', question: "En quoi ralentit-il ou complique-t-il la progression ?", answer: '' },
    { title: 'Double / reflet', question: "En quoi ressemble-t-il au personnage principal ? En quoi diffère-t-il ?", answer: '' },
    { title: 'Figure instable', question: "Qu’est-ce qui le rend imprévisible ?", answer: '' },
  ];

  relations = [
    { title: 'Lien affectif', question: "Qu’est-ce qui unit ces deux personnages émotionnellement ?", answer: '' },
    { title: 'Collaboration', question: "Quel objectif commun les rassemble ?", answer: '' },
    { title: 'Rivalité', question: "Qu’est-ce qui les oppose ? Qui veut surpasser l’autre ?", answer: '' },
    { title: 'Trahison', question: "Pourquoi l’un pourrait-il trahir l’autre ?", answer: '' },
    { title: 'Relation d’autorité', question: "Qui enseigne ou domine ? Quelles tensions en découlent ?", answer: '' },
    { title: 'Relation familiale', question: "Quelle dynamique familiale influence leur parcours ?", answer: '' },
  ];
}
