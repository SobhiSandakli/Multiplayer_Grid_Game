import { Component, EventEmitter, Output } from '@angular/core';
import { Game } from '@app/interfaces/game-model.interface';
import { SessionService } from '@app/services/session/session.service';
@Component({
    selector: 'app-import',
    templateUrl: './import.component.html',
    styleUrl: './import.component.scss',
})
export class ImportComponent {
    @Output() closeModalEvent = new EventEmitter<void>();
    @Output() importGameEvent = new EventEmitter<Game>();
    fileName: string | null = null;
    selectedFile: File | null = null;
    constructor(private sessionService: SessionService) {}

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.selectedFile = input.files[0];
            this.fileName = this.selectedFile.name;
        }
    }

    onImport(): void {
        if (!this.selectedFile) return;
        const fileReader = new FileReader();
        fileReader.onload = () => {
            try {
                const fileContent = fileReader.result as string;
                const gameData = JSON.parse(fileContent);
                this.importGameEvent.emit(gameData);
                this.closeModalEvent.emit();
            } catch (error) {
                this.handleError(error as Error, 'Failed to import game');
            }
        };
        fileReader.readAsText(this.selectedFile);
    }

    onCancel(): void {
        this.closeModalEvent.emit();
    }
    private handleError(error: Error, fallbackMessage: string): void {
        const errorMessage = error?.message || fallbackMessage;
        this.sessionService.openSnackBar(errorMessage);
    }
}
