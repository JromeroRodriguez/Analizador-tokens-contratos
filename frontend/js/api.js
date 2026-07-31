const API_BASE = 'http://127.0.0.1:5000';

async function analyzeContract(file, mode = 'A') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('mode', mode);

  const response = await fetch(`${API_BASE}/api/analyze`, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Unexpected server error');
  }

  return data;
}
