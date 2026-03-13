from flask import Flask, render_template, request, send_file, jsonify
from pypdf import PdfReader, PdfWriter
import io
import json
import zipfile

app = Flask(__name__)

def parse_page_range(range_string, max_pages):
    """
    Parses a string like "1-3, 5, 8-10" into a set of 0-based page indices.
    """
    pages = set()
    # Normalize string: remove spaces
    range_string = range_string.replace(' ', '')
    
    parts = range_string.split(',')
    for part in parts:
        if not part:
            continue
        if '-' in part:
            try:
                start, end = map(int, part.split('-'))
                start = max(1, start) - 1
                end = min(max_pages, end) - 1
                if start <= end:
                    for i in range(start, end + 1):
                        pages.add(i)
            except ValueError:
                continue
        else:
            try:
                page = int(part)
                page = max(1, page) - 1
                if 0 <= page < max_pages:
                    pages.add(page)
            except ValueError:
                continue
    
    return sorted(list(pages))

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/split', methods=['POST'])
def split_pdf():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    # 'rules' will be a JSON string like:
    # [{"range": "1-10", "name": "front", "burst": false}, {"range": "11-20", "name": "abs", "burst": true}]
    rules_json = request.form.get('rules', '[]')
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not file.filename.lower().endswith('.pdf'):
        return jsonify({'error': 'Invalid file type. Please upload a PDF.'}), 400

    try:
        rules = json.loads(rules_json)
    except json.JSONDecodeError:
        return jsonify({'error': 'Invalid request parameters.'}), 400

    if not rules:
         return jsonify({'error': 'No split rules defined.'}), 400

    try:
        reader = PdfReader(file)
        max_pages = len(reader.pages)
        
        output_files = []

        for i, rule in enumerate(rules):
            range_str = rule.get('range', '')
            base_name = rule.get('name', '').strip() or f"part_{i+1}"
            is_burst = rule.get('burst', False)

            selected_pages = parse_page_range(range_str, max_pages)
            if not selected_pages:
                continue

            if is_burst:
                for page_num in selected_pages:
                    writer = PdfWriter()
                    writer.add_page(reader.pages[page_num])
                    
                    out = io.BytesIO()
                    writer.write(out)
                    out.seek(0)
                    
                    # 1-based index for filename in burst
                    fname = f"{base_name}_page_{page_num+1}.pdf"
                    output_files.append((fname, out))
            else:
                writer = PdfWriter()
                for page_num in selected_pages:
                    writer.add_page(reader.pages[page_num])
                
                out = io.BytesIO()
                writer.write(out)
                out.seek(0)
                
                fname = f"{base_name}.pdf"
                output_files.append((fname, out))

        if not output_files:
            return jsonify({'error': 'No valid pages selected to split.'}), 400

        # If only one file result, download expected file
        if len(output_files) == 1:
            fname, data = output_files[0]
            return send_file(
                data,
                as_attachment=True,
                download_name=fname,
                mimetype='application/pdf'
            )
        
        # Else ZIP
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
            for fname, data in output_files:
                zf.writestr(fname, data.getvalue())
        
        zip_buffer.seek(0)
        return send_file(
            zip_buffer,
            as_attachment=True,
            download_name=f"split_bundle_{file.filename.replace('.pdf', '')}.zip",
            mimetype='application/zip'
        )

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=3000)
