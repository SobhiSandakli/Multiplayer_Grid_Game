import { Component } from '@angular/core';

@Component({
  selector: 'app-main-page',
  templateUrl: './main-page.component.html',
  styleUrls: ['./main-page.component.scss'],
})
export class MainPageComponent {
  readonly title: string = 'Warriors of the Grid';

  readonly teamNumber: string = 'Équipe 213';
  readonly teamMembers: string[] = [
    'Sobhi Sandakli',
    'Rama Shannis',
    'Noëla Panier',
    'Mouneïssa Cisse',
    'Ali El-Akhras',
  ];

  // Disable the "Join a game" button for Sprint 1
  isJoinDisabled: boolean = true;

  constructor() {
    console.log(this.teamMembers);
  }


}
