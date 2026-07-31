# Contract Token Analyzer

Aplicación web para analizar contratos de arrendamiento en PDF:
extracción de texto, conteo de tokens, resumen con IA y análisis de costos.

## Configuración e Instalación Multiplataforma

### 1. Configurar Backend

- **En Windows:**
  ```powershell
  cd backend
  python -m venv venv
  .\venv\Scripts\python.exe -m pip install -r requirements.txt
  .\venv\Scripts\python.exe app.py
  ```

- **En Linux / macOS:**
  ```bash
  cd backend
  python3 -m venv venv
  ./venv/bin/python -m pip install -r requirements.txt
  ./venv/bin/python app.py
  ```

### 2. Configurar Frontend (Cualquier SO)

```bash
cd frontend
npm install
npm run build
npm run dev # Inicia el servidor web local en http://localhost:3000
```
