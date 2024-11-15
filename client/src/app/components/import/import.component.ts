import { Component, EventEmitter, Output } from '@angular/core';
@Component({
    selector: 'app-import',
    templateUrl: './import.component.html',
    styleUrl: './import.component.scss',
})
export class ImportComponent {
    @Output() closeModalEvent = new EventEmitter<void>();
    @Output() importGameEvent = new EventEmitter<any>();

    fileName: string | null = null;
    selectedFile: File | null = null;

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
                console.error('Invalid JSON file:', error);
            }
        };
        fileReader.readAsText(this.selectedFile);
    }

    onCancel(): void {
        this.closeModalEvent.emit();
    }
}
