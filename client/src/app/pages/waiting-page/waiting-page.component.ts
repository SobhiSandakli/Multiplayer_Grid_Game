import { Component, OnInit } from '@angular/core';

const MIN_CODE = 1000;
const MAX_CODE = 9999;
@Component({
    selector: 'app-waiting-page',
    templateUrl: './waiting-page.component.html',
    standalone: true,
    styleUrls: ['./waiting-page.component.scss'],
})
export class WaitingViewComponent implements OnInit {
    accessCode: string = '';

    ngOnInit(): void {
        this.generateAccessCode();
    }

    generateAccessCode(): void {
        this.accessCode = Math.floor(Math.random() * (MAX_CODE - MIN_CODE + 1) + MIN_CODE).toString();
    }
}
