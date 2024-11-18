import { Component } from '@angular/core';
import { SessionService } from '@app/services/session/session.service';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.scss'],
})
export class StatisticsComponent {
  faArrowLeft = faArrowLeft;
  showCharacterCreation = false;

  constructor(public sessionService: SessionService) {} }

// http://localhost:4200/#/statistics