import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  isUploadingCSV = false;

  constructor(private router: Router) {
    // Listen for upload completion
    window.addEventListener('csv-upload-complete', () => {
      this.isUploadingCSV = false;
    });
  }

  get isPosPage() {
    return this.router.url === '/';
  }

  toggleAddProduct() {
    // Use a custom event to notify PosComponent
    window.dispatchEvent(new CustomEvent('toggle-add-product'));
  }

  onCSVFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert('Please select a valid CSV file.');
      event.target.value = ''; // Reset file input
      return;
    }

    this.uploadCSV(file);
    event.target.value = ''; // Reset file input for next upload
  }

  uploadCSV(file: File) {
    this.isUploadingCSV = true;
    
    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const csvContent = e.target.result;
        this.processCSVContent(csvContent);
      } catch (error) {
        console.error('Error reading CSV file:', error);
        alert('Error reading CSV file. Please check the file format.');
        this.isUploadingCSV = false;
      }
    };
    
    reader.onerror = () => {
      alert('Error reading file. Please try again.');
      this.isUploadingCSV = false;
    };
    
    reader.readAsText(file);
  }

  processCSVContent(csvContent: string) {
    try {
      // Parse CSV content
      const lines = csvContent.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      // Validate headers
      const requiredHeaders = ['name', 'price', 'stock'];
      const hasValidHeaders = requiredHeaders.every(header => 
        headers.includes(header)
      );
      
      if (!hasValidHeaders) {
        alert('CSV must have columns: name, price, stock');
        this.isUploadingCSV = false;
        return;
      }
      
      // Process data rows
      const products = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length >= 3 && values[0]) { // Skip empty rows
          const nameIndex = headers.indexOf('name');
          const priceIndex = headers.indexOf('price');
          const stockIndex = headers.indexOf('stock');
          
          const product = {
            name: values[nameIndex],
            price: parseFloat(values[priceIndex]) || 0,
            stock: parseInt(values[stockIndex]) || 0
          };
          
          // Validate product data
          if (product.name && product.price > 0 && product.stock >= 0) {
            products.push(product);
          }
        }
      }
      
      if (products.length === 0) {
        alert('No valid products found in CSV file.');
        this.isUploadingCSV = false;
        return;
      }
      
      // Dispatch event to PosComponent with products data
      window.dispatchEvent(new CustomEvent('csv-products-upload', {
        detail: { products }
      }));
      
    } catch (error) {
      console.error('Error processing CSV:', error);
      alert('Error processing CSV file. Please check the file format.');
      this.isUploadingCSV = false;
    }
  }

  triggerFileInput() {
    const fileInput = document.getElementById('csvFileInput') as HTMLInputElement;
    fileInput?.click();
  }
}