from flask import Flask, render_template, request, send_file, flash, redirect
import img2pdf as im
from io import BytesIO
from pypdf import PdfReader, PdfWriter
from pypdf.errors import PdfReadError
import os
import tempfile

app = Flask(__name__)
app.secret_key = "your_secret_key_here"  

MAX_CONTENT_LENGTH = 16 * 1024 * 1024  
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff', 'webp'}
ALLOWED_PDF_EXTENSIONS = {'pdf'}

def allowed_image_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_IMAGE_EXTENSIONS

def allowed_pdf_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_PDF_EXTENSIONS

@app.route("/", methods=["GET"])
def home():
    return render_template("index.html")

@app.route("/upload_images", methods=["POST"])
def upload_images():
    try:
        images = request.files.getlist("img")

       
        if not images or all(img.filename == '' for img in images):
            flash("No images were selected.", "error")
            return redirect("/")

        
        image_streams = []
        processed_files = []

        for img in images:
            if not img or img.filename == '':
                continue
                
          
            if not allowed_image_file(img.filename):
                flash(f"File {img.filename} is not a supported image format.", "error")
                return redirect("/")
            
            
            if not img.content_type or not img.content_type.startswith("image/"):
                flash(f"File {img.filename} does not appear to be a valid image.", "error")
                return redirect("/")

            img.seek(0, 2)  
            file_size = img.tell()
            img.seek(0)  
            
            if file_size > 10 * 1024 * 1024:  
                flash(f"File {img.filename} is too large (max 10MB per image).", "error")
                return redirect("/")

            image_streams.append(img.stream)
            processed_files.append(img.filename)

        if not image_streams:
            flash("No valid images found to convert.", "error")
            return redirect("/")

        
        converted_img = im.convert(image_streams)
        pdf_streams = BytesIO(converted_img)

        flash(f"Successfully converted {len(processed_files)} images to PDF.", "success")
        
        return send_file(
            pdf_streams,
            as_attachment=True,
            download_name="converted_images.pdf",
            mimetype="application/pdf"
        )

    except Exception as e:
        flash(f"An error occurred during image conversion: {str(e)}", "error")
        return redirect("/")

@app.route("/merge_pdfs", methods=["POST"])
def merge_pdfs():
    temp_file = None
    try:
        files = request.files.getlist("pdfs")
        
        
        if not files or all(f.filename == '' for f in files):
            flash("No PDF files were selected.", "error")
            return redirect("/")

       
        writer = PdfWriter()
        processed_files = []
        total_pages = 0

        for file in files:
            if not file or file.filename == '':
                continue
                
            
            if not allowed_pdf_file(file.filename):
                flash(f"File {file.filename} is not a PDF file.", "error")
                return redirect("/")
            
           
            if not file.content_type or file.content_type != "application/pdf":
                flash(f"File {file.filename} does not appear to be a valid PDF.", "error")
                return redirect("/")

            try:
               
                reader = PdfReader(file.stream)
                
               
                if reader.is_encrypted:
                    flash(f"File {file.filename} is encrypted and cannot be merged.", "error")
                    return redirect("/")
                
                
                if len(reader.pages) == 0:
                    flash(f"File {file.filename} has no pages.", "error")
                    return redirect("/")
                
            
                for page in reader.pages:
                    writer.add_page(page)
                    
                processed_files.append(file.filename)
                total_pages += len(reader.pages)
                
            except PdfReadError as e:
                flash(f"Error reading PDF {file.filename}: {str(e)}", "error")
                return redirect("/")
            except Exception as e:
                flash(f"Error processing PDF {file.filename}: {str(e)}", "error")
                return redirect("/")

        if total_pages == 0:
            flash("No valid PDF pages found to merge.", "error")
            return redirect("/")

        
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
        
     
        with open(temp_file.name, "wb") as f:
            writer.write(f)
        
        flash(f"Successfully merged {len(processed_files)} PDFs with {total_pages} total pages.", "success")
        
    
        def remove_file(response):
            try:
                os.unlink(temp_file.name)
            except Exception:
                pass
            return response
        
        response = send_file(
            temp_file.name,
            as_attachment=True,
            download_name="merged_pdfs.pdf",
            mimetype="application/pdf"
        )
        
        
        response.call_on_close(lambda: os.unlink(temp_file.name) if os.path.exists(temp_file.name) else None)
        
        return response

    except Exception as e:
        if temp_file and os.path.exists(temp_file.name):
            try:
                os.unlink(temp_file.name)
            except Exception:
                pass
        
        flash(f"An error occurred during PDF merging: {str(e)}", "error")
        return redirect("/")

@app.errorhandler(413)
def too_large(e):
    flash("File is too large. Maximum size is 16MB.", "error")
    return redirect("/")

@app.errorhandler(500)
def internal_error(e):
    flash("An internal server error occurred. Please try again.", "error")
    return redirect("/")

if __name__ == "__main__":
    app.run(debug=True)