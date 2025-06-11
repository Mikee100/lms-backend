import sys
import fitz  # PyMuPDF
import re
from transformers import T5ForConditionalGeneration, T5Tokenizer
import torch

def extract_text_from_pdf(file_path):
    print(f"[INFO] Extracting text from: {file_path}")
    doc = fitz.open(file_path)
    full_text = ""
    for page in doc:
        full_text += page.get_text()
    return full_text

def clean_text(text):
    # Remove extra spaces and normalize line breaks
    text = re.sub(r'\n+', '\n', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def chunk_text(text, max_tokens=512):
    # Break text into sentence chunks
    sentences = re.split(r'(?<=[.?!])\s+', text)
    chunks = []
    current_chunk = ""

    for sentence in sentences:
        if len(current_chunk) + len(sentence.split()) <= max_tokens:
            current_chunk += sentence + " "
        else:
            chunks.append(current_chunk.strip())
            current_chunk = sentence + " "
    if current_chunk:
        chunks.append(current_chunk.strip())
    return chunks

def generate_questions(text, max_questions=5):
    print("Device set to use", device)
    tokenizer = T5Tokenizer.from_pretrained("valhalla/t5-base-qg-hl", use_fast=False)
    model = T5ForConditionalGeneration.from_pretrained("valhalla/t5-base-qg-hl").to(device)

    chunks = chunk_text(text)
    questions = []
    for chunk in chunks:
        input_text = f"generate questions: {chunk}"
        encoding = tokenizer.encode_plus(
            input_text,
            return_tensors="pt",
            truncation=True,
            padding="max_length",
            max_length=512
        )
        input_ids = encoding["input_ids"].to(device)
        attention_mask = encoding["attention_mask"].to(device)

        outputs = model.generate(
            input_ids=input_ids,
            attention_mask=attention_mask,
            max_length=64,
            num_return_sequences=2,
            num_beams=4
        )

        for output in outputs:
            question = tokenizer.decode(output, skip_special_tokens=True)
            if question not in questions and len(questions) < max_questions:
                questions.append(question)

        if len(questions) >= max_questions:
            break

    return questions

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python Assignment.py <pdf_file_path>")
        sys.exit(1)

    pdf_path = sys.argv[1]
    raw_text = extract_text_from_pdf(pdf_path)
    cleaned_text = clean_text(raw_text)
    device = "cuda" if torch.cuda.is_available() else "cpu"
    final_questions = generate_questions(cleaned_text)

    print("\nGenerated Assignment Questions:")
    for i, q in enumerate(final_questions, 1):
        print(f"{i}. {q}")
