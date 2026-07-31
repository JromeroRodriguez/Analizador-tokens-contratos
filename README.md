# Contract Token Analyzer (Analizador de Tokens en Contratos)

Aplicación web para analizar contratos de arrendamiento en PDF que permite comparar el costo de enviar el texto completo (Opción A) vs un resumen estructurado en JSON mediante IA (Opción B), calculando el punto de equilibrio.

## Tecnologías

### Backend
- **Python 3.12** + **Flask** — Servidor REST API
- **PyMuPDF** — Extracción de texto de PDFs
- **tiktoken** — Conteo de tokens (modelo `cl100k_base`)
- **OpenAI Python SDK** — Cliente para API de NVIDIA (Llama 3.1 8B)
- **Flask-CORS** — Comunicación con el frontend

### Frontend
- **HTML5** + **CSS3** con **Tailwind CSS v4** — Diseño responsive
- **JavaScript vanilla (ES Modules)** — Lógica de UI, stepper de 6 pasos, toggle de vistas (Campos/Markdown/JSON)
- **Fetch API** — Comunicación con el backend

## Funcionalidades

- Subida de PDF de contratos de arrendamiento
- Extracción y conteo de tokens del texto completo
- Resumen con IA en JSON estructurado (tenant, landlord, start_date, expiration_date, monthly_rent, deposit, penalty_clause, renewal)
- Comparación de costos: texto completo (Opción A) vs resumen (Opción B)
- Cálculo de punto de equilibrio basado en volumen diario de contratos
- Vista conmutável del resumen: Campos formateados, Markdown o JSON raw
- Botones de copia y descarga de resultados
- Interfaz completamente en español
- Accesibilidad: ARIA, navegación por teclado, `prefers-reduced-motion`

## Estructura del Proyecto

```
contract-token-analyzer/
├── backend/
│   ├── app.py                    # Punto de entrada Flask
│   ├── config.py                 # Config (endpoints, costos, encoding)
│   ├── requirements.txt
│   ├── .env.example              # Template de variables de entorno
│   ├── controllers/
│   │   ├── analyze.py            # Lógica de procesamiento de PDF
│   │   └── health.py             # Health check
│   ├── services/
│   │   ├── pdf_extractor.py      # Extracción de texto con PyMuPDF
│   │   ├── summarizer.py         # Resumen con IA (NVIDIA Llama)
│   │   ├── cost_analyzer.py      # Cálculo de costos y break-even
│   │   └── token_counter.py      # Conteo de tokens con tiktoken
│   ├── routes/
│   │   ├── analyze.py            # POST /api/analyze
│   │   └── health.py             # GET /api/health
│   ├── models/
│   │   └── schemas.py            # Dataclasses / schemas
│   └── utils/
│       └── file_utils.py         # Utilidades de archivos
├── frontend/
│   ├── index.html                # UI principal (español)
│   ├── js/
│   │   ├── main.js               # Handlers, stepper, toggle, fmt()
│   │   └── api.js                # Wrapper de fetch para /api/analyze
│   ├── css/
│   │   └── styles.css            # Estilos personalizados
│   ├── src/
│   │   └── input.css             # Tailwind v4 theme tokens
│   └── package.json
└── .gitignore
```

## Configuración e Instalación

### 1. Backend

```bash
cd backend
python -m venv venv
# Windows: .\venv\Scripts\python.exe -m pip install -r requirements.txt
# Linux/macOS: ./venv/bin/python -m pip install -r requirements.txt
cp .env.example .env   # Editar .env con tu API key de NVIDIA
python app.py          # Inicia en http://localhost:8000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run build
npm run dev  # Inicia en http://localhost:3000
```

### Variables de Entorno (`.env`)

| Variable | Descripción |
|---|---|
| `NVIDIA_API_KEY` | API key para NVIDIA NIM (Llama 3.1 8B) |
| `NVIDIA_BASE_URL` | Endpoint de la API (por defecto `https://integrate.api.nvidia.com/v1`) |
| `MODEL_NAME` | Modelo a usar (por defecto `meta/llama-3.1-8b-instruct`) |

## Costos por Token

Configurables en `backend/config.py`:

| Concepto | Valor |
|---|---|
| Costo input (Opción A) | $0.00000013 / token |
| Costo output (Opción B) | $0.00000013 / token |
| Costo input (Opción B) | $0.00000010 / token |
| Costo output (Opción B) | $0.00000010 / token |

## Licencia

MIT
