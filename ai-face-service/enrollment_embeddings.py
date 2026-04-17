"""
enrollment_embeddings.py — Core face embedding logic.

Wraps the existing face_embeddings.py logic for use by the FastAPI service.
This file contains ONLY AI compute functions. No database, no storage, no attendance logic.

Functions used by the service:
  - get_app(): Lazy-loads InsightFace model.
  - face_embed_from_bgr(img_bgr): Returns 512-d embedding for the largest face in an image.
  - compute_student_embedding(student_folder): Aggregates 5+ images into a single mean embedding.
  - detect_all_faces(img_bgr): Returns ALL face embeddings + bounding boxes from a classroom photo.
"""

import os
import glob
import numpy as np
import cv2
from insightface.app import FaceAnalysis

MODEL_SET = "buffalo_l"
DET_SIZE = (640, 640)
EMB_SIZE = 512
_app = None


def get_app():
    """Lazy-load the InsightFace model (CPU only)."""
    global _app
    if _app is None:
        _app = FaceAnalysis(name=MODEL_SET, providers=['CPUExecutionProvider'])
        _app.prepare(ctx_id=0, det_size=DET_SIZE)
    return _app


def _l2norm(v):
    """L2-normalize a vector."""
    return v / (np.linalg.norm(v) + 1e-12)


def face_embed_from_bgr(img_bgr):
    """
    Extract the 512-d embedding for the LARGEST face in the image.
    Returns None if no face is detected.
    """
    app = get_app()
    faces = app.get(img_bgr)

    if not faces:
        return None

    f = max(faces, key=lambda x: (x.bbox[2] - x.bbox[0]) * (x.bbox[3] - x.bbox[1]))

    emb = getattr(f, "normed_embedding", None)
    if emb is None:
        emb = _l2norm(f.embedding)

    return emb.astype(np.float32)


def compute_student_embedding(student_folder):
    """
    Aggregate multiple images into a single mean embedding.
    Returns (embedding, count) or (None, count) if < 5 valid faces found.
    """
    img_paths = [p for p in glob.glob(os.path.join(student_folder, "*"))
                 if p.lower().endswith((".jpg", ".jpeg", ".png"))]

    emb_list = []
    for p in img_paths:
        img = cv2.imread(p)
        if img is None:
            continue

        emb = face_embed_from_bgr(img)
        if emb is not None:
            emb_list.append(emb)

    if len(emb_list) < 5:
        return None, len(emb_list)

    E = np.vstack(emb_list)
    m = E.mean(axis=0)

    return _l2norm(m).astype(np.float32), len(emb_list)


def detect_all_faces(img_bgr):
    """
    Detect ALL faces in a classroom photo.
    Returns list of dicts: [{"embedding": [512 floats], "bbox": [x1, y1, x2, y2]}]
    No identity resolution — just raw detections.
    """
    app = get_app()
    faces = app.get(img_bgr)

    results = []
    for f in faces:
        emb = getattr(f, "normed_embedding", None)
        if emb is None:
            emb = _l2norm(f.embedding)

        results.append({
            "embedding": emb.astype(np.float32).tolist(),
            "bbox": [float(x) for x in f.bbox],
        })

    return results


def draw_targets_on_image(img_bgr, targets):
    """
    Draw bounding boxes and labels on the image.
    targets: [{"bbox": [x1, y1, x2, y2], "label": "Name", "color": [b, g, r]}]
    """
    canvas = img_bgr.copy()
    for t in targets:
        bbox = [int(x) for x in t["bbox"]]
        label = t.get("label", "")
        color = t.get("color", (0, 255, 0)) # Default green
        
        # Draw box
        cv2.rectangle(canvas, (bbox[0], bbox[1]), (bbox[2], bbox[3]), color, 2)
        
        # Draw label background
        if label:
            (w, h), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
            cv2.rectangle(canvas, (bbox[0], bbox[1] - 20), (bbox[0] + w, bbox[1]), color, -1)
            cv2.putText(canvas, label, (bbox[0], bbox[1] - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
            
    return canvas
