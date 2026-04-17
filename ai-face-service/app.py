"""
app.py — FastAPI AI Microservice for Face Embeddings.

This service is STATELESS. It does NOT connect to any database.
It receives images, runs InsightFace inference, and returns embeddings.

Endpoints:
  POST /embedding/student    — Generate a single mean embedding from 3+ student photos.
  POST /embedding/classroom  — Detect all faces in classroom photos and return embeddings.
  GET  /health               — Health check.
"""

import os
import shutil
import uuid
import logging

import cv2
import numpy as np
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Security, Depends, Response
from fastapi.security.api_key import APIKeyHeader
from fastapi.responses import JSONResponse
import json

from enrollment_embeddings import compute_student_embedding, detect_all_faces, draw_targets_on_image

# Security
API_KEY_NAME = "X-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

def get_api_key(api_key_header: str = Security(api_key_header)):
    # Very basic static API key check for internal microservice auth
    expected_key = os.environ.get("API_KEY", "dev_api_key_123")
    if api_key_header == expected_key:
        return api_key_header
    raise HTTPException(status_code=403, detail="Could not validate credentials")

app = FastAPI(
    title="AI Face Embedding Service",
    description="Stateless face detection & embedding microservice. No database access.",
    version="1.0.0",
)

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ai-face-service")

TEMP_DIR = os.path.join(os.path.dirname(__file__), "temp")
os.makedirs(TEMP_DIR, exist_ok=True)


# -------------------------------------------------------
# Startup Event
# -------------------------------------------------------
@app.on_event("startup")
async def startup_event():
    # Eagerly initialize InsightFace models to prevent first-request timeouts
    logger.info("Initializing InsightFace model...")
    try:
        from enrollment_embeddings import get_app
        get_app()
        logger.info("InsightFace model initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize InsightFace model: {e}")

# -------------------------------------------------------
# Health Check
# -------------------------------------------------------
@app.get("/health")
async def health():
    return {"status": "ok", "service": "ai-face-service"}


# -------------------------------------------------------
# POST /embedding/student
# -------------------------------------------------------
@app.post("/embedding/student")
async def student_embedding(
    studentId: str = Form(...),
    images: list[UploadFile] = File(...),
    api_key: str = Depends(get_api_key),
):
    """
    Generate a single mean embedding from 5+ student face images.

    Input:
      - studentId (form field)
      - images[] (5+ image files)

    Output:
      { "studentId": "...", "embedding": [512 floats], "imagesUsed": N }

    Rejects if < 5 valid face embeddings can be extracted.
    """
    # Create a temporary folder for this request
    request_id = str(uuid.uuid4())
    student_folder = os.path.join(TEMP_DIR, request_id)
    os.makedirs(student_folder, exist_ok=True)

    try:
        # Save uploaded images to temp folder
        for img_file in images:
            file_path = os.path.join(student_folder, img_file.filename)
            with open(file_path, "wb") as f:
                content = await img_file.read()
                f.write(content)

        # Process using existing logic
        embedding, images_used = compute_student_embedding(student_folder)

        if embedding is None:
            raise HTTPException(
                status_code=422,
                detail=f"Could not extract 5+ valid face embeddings. Only {images_used} found. Please upload clearer photos.",
            )

        return JSONResponse(content={
            "studentId": studentId,
            "embedding": embedding.tolist(),
            "imagesUsed": images_used,
        })

    finally:
        # Always clean up temp files
        shutil.rmtree(student_folder, ignore_errors=True)


# -------------------------------------------------------
# POST /embedding/classroom
# -------------------------------------------------------
@app.post("/embedding/classroom")
async def classroom_embedding(
    images: list[UploadFile] = File(...),
    api_key: str = Depends(get_api_key),
):
    """
    Detect ALL faces in one or more classroom photos.

    Input:
      - images[] (1+ classroom photo files)

    Output:
      [ { "embedding": [512 floats], "bbox": [x1, y1, x2, y2] }, ... ]

    No identity resolution is performed — just raw face detections.
    """
    logger.info(f"Received classroom embedding request with {len(images)} files")
    
    if not images or (len(images) == 1 and images[0].size == 0):
         # Handle cases where multipart form might be sent but actually empty
         raise HTTPException(status_code=422, detail="No classroom images provided in the request.")

    all_detections = []

    for img_file in images:
        content = await img_file.read()
        if not content:
            logger.warning(f"File {img_file.filename} is empty, skipping.")
            continue
            
        np_arr = np.frombuffer(content, np.uint8)
        img_bgr = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if img_bgr is None:
            logger.error(f"Failed to decode image {img_file.filename}")
            continue  # Skip unreadable images

        detections = detect_all_faces(img_bgr)
        logger.info(f"Detected {len(detections)} faces in {img_file.filename}")
        all_detections.extend(detections)

    return JSONResponse(content=all_detections)


# -------------------------------------------------------
# POST /visualize
# -------------------------------------------------------
@app.post("/visualize")
async def visualize_attendance(
    image: UploadFile = File(...),
    targets_json: str = Form(...),
    api_key: str = Depends(get_api_key),
):
    """
    Draw bounding boxes on a classroom image.
    Input:
      - image (file)
      - targets_json (form field, JSON string): [{"bbox": [x1,y1,x2,y2], "label": "Name", "status": "present"|"absent"|"unknown"}]
    """
    content = await image.read()
    np_arr = np.frombuffer(content, np.uint8)
    img_bgr = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    if img_bgr is None:
        raise HTTPException(status_code=400, detail="Could not decode image.")

    try:
        targets = json.loads(targets_json)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid targets_json.")

    # Convert status to colors
    # present = Green (0, 255, 0)
    # absent = Red (0, 0, 255)
    # unknown = Red (0, 0, 255)
    processed_targets = []
    for t in targets:
        color = (0, 255, 0) if t.get("status") == "present" else (0, 0, 255)
        processed_targets.append({
            "bbox": t["bbox"],
            "label": t.get("label", ""),
            "color": color
        })

    marked_img = draw_targets_on_image(img_bgr, processed_targets)
    
    _, buffer = cv2.imencode(".jpg", marked_img)
    return Response(content=buffer.tobytes(), media_type="image/jpeg")


# -------------------------------------------------------
# Entry Point
# -------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
