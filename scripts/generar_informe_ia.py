# -*- coding: utf-8 -*-
"""
generar_informe_ia.py — Borrador automático del informe ComparaSalud
====================================================================
Toma el mensaje de WhatsApp que te llega desde el simulador y genera
el BORRADOR del informe de una página, listo para pegar en la plantilla
Word, validar precios GES y firmar.

Funciona con dos motores (elige uno):

  A) OLLAMA LOCAL (gratis, privado, sin API key) — recomendado
     1. Instala Ollama (ollama.com) y ejecuta:  ollama pull qwen2.5:7b
     2. Corre:  python scripts/generar_informe_ia.py

  B) API DE QWEN EN LA NUBE (DashScope / Alibaba Cloud)
     1. Crea tu API key en dashscope (modelstudio.console.alibabacloud.com)
     2. Define la variable de entorno y corre:
        set QWEN_API_KEY=sk-xxxx        (Windows)
        python scripts/generar_informe_ia.py

⚠ IMPORTANTE: este script corre EN TU PC. Nunca pongas una API key
  dentro del index.html del sitio: GitHub Pages es público y cualquiera
  podría robarla y gastar tu saldo.
"""
import json
import os
import sys
import urllib.request

MODELO_OLLAMA = 'qwen2.5:7b'
MODELO_QWEN_API = 'qwen-plus'

PROMPT_SISTEMA = """Eres asistente de un asesor previsional independiente en Chile (ComparaSalud).
Recibirás los datos de un prospecto que usó un simulador de planes de isapre.
Redacta el BORRADOR del informe de una página con estas secciones y nada más:

SU SITUACIÓN: resumen en 3 líneas de renta, 7% legal, grupo familiar, región y prioridad.
PUNTOS A VERIFICAR CON LAS ISAPRES: lista de lo que el asesor debe confirmar
(prima GES por beneficiario, prestadores en convenio en su comuna, carencias
según su situación, precio final oficial).
BORRADOR DE RECOMENDACIÓN: 3-4 líneas honestas en tono cercano chileno formal
(trato de "usted"), mencionando también un punto débil de la opción sugerida.
PREGUNTAS PARA LA PRIMERA CONVERSACIÓN: 3 preguntas clave para calificar mejor
(preexistencias, isapre/plan actual, clínicas que frecuenta).

Reglas: no inventes precios ni coberturas que no estén en los datos; donde falte
información escribe [VERIFICAR]. Español de Chile, claro y sin tecnicismos."""


def llamar_ollama(mensaje):
    req = urllib.request.Request(
        'http://localhost:11434/api/chat',
        data=json.dumps({
            'model': MODELO_OLLAMA,
            'messages': [{'role': 'system', 'content': PROMPT_SISTEMA},
                         {'role': 'user', 'content': mensaje}],
            'stream': False
        }).encode(),
        headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=300) as r:
        return json.load(r)['message']['content']


def llamar_qwen_api(mensaje, api_key):
    req = urllib.request.Request(
        'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions',
        data=json.dumps({
            'model': MODELO_QWEN_API,
            'messages': [{'role': 'system', 'content': PROMPT_SISTEMA},
                         {'role': 'user', 'content': mensaje}]
        }).encode(),
        headers={'Content-Type': 'application/json',
                 'Authorization': f'Bearer {api_key}'})
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.load(r)['choices'][0]['message']['content']


if __name__ == '__main__':
    print('Pega el mensaje de WhatsApp del lead y termina con una línea vacía:\n')
    lineas = []
    for linea in sys.stdin:
        if not linea.strip() and lineas:
            break
        lineas.append(linea)
    mensaje = ''.join(lineas).strip()
    if not mensaje:
        sys.exit('No se ingresó ningún mensaje.')

    api_key = os.environ.get('QWEN_API_KEY', '').strip()
    try:
        if api_key:
            print('\n→ Usando API de Qwen (nube)...\n')
            borrador = llamar_qwen_api(mensaje, api_key)
        else:
            print(f'\n→ Usando Ollama local ({MODELO_OLLAMA})...\n')
            borrador = llamar_ollama(mensaje)
    except Exception as e:
        sys.exit(f'Error al llamar al modelo: {e}\n'
                 '¿Está Ollama corriendo? ¿O definiste QWEN_API_KEY?')

    print('═' * 60)
    print(borrador)
    print('═' * 60)
    with open('borrador_informe.txt', 'w', encoding='utf-8') as f:
        f.write(borrador)
    print('\n✓ Guardado en borrador_informe.txt — pégalo en la plantilla Word,')
    print('  valida los [VERIFICAR] con las isapres y firma.')
