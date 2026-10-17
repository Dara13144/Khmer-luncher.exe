from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os

app = FastAPI(title="Khmer Launcher Cape CDN API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

CAPES_DIR = "stored_capes"
PRESETS_DIR = "presets"
os.makedirs(CAPES_DIR, exist_ok=True)
os.makedirs(PRESETS_DIR, exist_ok=True)

@app.post("/api/cape/upload")
async def upload_cape(
    username: str = Form(...),
    cape: UploadFile = File(None),
    presetId: str = Form(None)
):
    target_path = os.path.join(CAPES_DIR, f"{username.lower()}.png")
    
    if cape:
        with open(target_path, "wb") as buffer:
            shutil.copyfileobj(cape.file, buffer)
        return {"status": "success", "message": f"Custom cape uploaded for {username}"}
    
    # If preset chosen, link the preset image
    if presetId:
        preset_source = os.path.join(PRESETS_DIR, f"{presetId}.png")
        if os.path.exists(preset_source):
            shutil.copyfile(preset_source, target_path)
            return {"status": "success", "message": f"Preset {presetId} equipped for {username}"}
        else:
            # Create a fallback placeholder cape if preset image doesn't exist
            with open(target_path, "wb") as f:
                f.write(b"")
            return {"status": "success", "message": f"Preset equipped for {username}"}
        
    raise HTTPException(status_code=400, detail="Invalid cape payload")

@app.get("/api/cape/{username}.png")
async def get_cape(username: str):
    file_path = os.path.join(CAPES_DIR, f"{username.lower()}.png")
    if os.path.exists(file_path):
        return FileResponse(file_path, media_type="image/png")
    raise HTTPException(status_code=404, detail="No custom cape found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
