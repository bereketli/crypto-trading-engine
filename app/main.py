from fastapi import FastAPI

app = FastAPI(title="Crypto Trading Engine")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
