# PDF Splitter

A web-based PDF splitting tool built with Flask that allows you to extract specific pages from PDF documents with precision and ease.

## Features

- **Upload PDF Files**: Drag and drop or browse to select PDF files
- **Flexible Page Selection**: Define custom page ranges (e.g., "1-3, 5, 8-10")
- **Custom Naming**: Assign custom names to split sections
- **Burst Mode**: Split individual pages into separate PDF files
- **Batch Processing**: Handle multiple split rules in one operation
- **Download Options**: Get results as individual PDFs or a ZIP bundle
- **Modern UI**: Clean, responsive interface with drag-and-drop support

## Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd flask-pdf-splitter
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Usage

1. Start the application:

   ```bash
   python app.py
   ```

2. Open your browser and navigate to `http://localhost:3000`

3. Upload a PDF file by dragging and dropping or clicking "Browse Files"

4. Add split rules:
   - Enter page ranges (e.g., "1-5" for pages 1 through 5, or "1,3,5" for specific pages)
   - Provide a custom name for the split section
   - Enable "Burst" mode to split each selected page into a separate file

5. Click "Split & Download" to process the PDF and download the results

## Requirements

- Python 3.6+
- Flask
- pypdf

## How It Works

The application uses the `pypdf` library to read and manipulate PDF files. When you upload a PDF and define split rules, the app:

1. Parses your page range specifications
2. Extracts the specified pages from the original PDF
3. Creates new PDF files for each rule
4. Returns the results as downloadable files or a ZIP archive

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).
