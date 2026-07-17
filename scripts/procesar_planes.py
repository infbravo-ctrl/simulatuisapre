# -*- coding: utf-8 -*-
"""
Actualizador automático de planes_data.js
Descarga el Archivo Maestro de Planes de Salud más reciente desde la
Superintendencia de Salud, filtra los planes individuales en comercialización
de las 7 isapres abiertas y regenera planes_data.js.

Uso local:  pip install pandas requests  →  python scripts/procesar_planes.py
En GitHub Actions corre solo (ver .github/workflows/actualizar-planes.yml).
"""
import io, json, sys, zipfile
from datetime import date

import pandas as pd
import requests

ISAPRES = {'99': 'Banmédica', '67': 'Colmena', '107': 'Consalud',
           '78': 'Cruz Blanca', '81': 'Nueva Masvida', '80': 'Vida Tres',
           '108': 'Esencial'}
MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
         'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
MOD = {'Prestador Preferente': 'P', 'Libre elección': 'L', 'Plan Cerrado': 'C'}
URL = ('https://datos.superdesalud.gob.cl/archivos/Planes%20de%20Salud/'
       '{y}/Planes_de_Salud_{ym}.zip')


def meses_candidatos(n=8):
    """Desde hace 2 meses hacia atrás (el dato se publica con ~2 meses de rezago)."""
    y, m = date.today().year, date.today().month
    out = []
    for retro in range(2, 2 + n):
        yy, mm = y, m - retro
        while mm <= 0:
            mm += 12
            yy -= 1
        out.append((yy, mm))
    return out


def descargar():
    for yy, mm in meses_candidatos():
        ym = f'{yy}{mm:02d}'
        url = URL.format(y=yy, ym=ym)
        print(f'Probando {url} ...')
        r = requests.get(url, timeout=120)
        if r.status_code == 200 and len(r.content) > 100_000:
            print(f'  ✓ Encontrado: {ym} ({len(r.content)//1024} KB)')
            return ym, r.content
        print(f'  × No disponible ({r.status_code})')
    sys.exit('No se encontró ningún archivo en los últimos 8 meses.')


def procesar(ym, contenido):
    with zipfile.ZipFile(io.BytesIO(contenido)) as z:
        nombre = z.namelist()[0]
        with z.open(nombre) as f:
            df = pd.read_csv(f, sep='|', header=None, encoding='latin1', dtype=str)

    com = df[(df[8] == 'Si Comer.') & (df[1].isin(ISAPRES))
             & (df[10] == 'Individual') & (df[14] == 'UF')].copy()
    com['pb'] = pd.to_numeric(com[23], errors='coerce')
    com = com[com['pb'] > 0.3]

    planes = []
    for _, r in com.iterrows():
        planes.append({
            'i': ISAPRES[r[1]],
            'c': str(r[2]).strip(),
            'n': ' '.join(str(r[3]).split())[:60],
            'm': MOD.get(r[11], 'P'),
            'r': r[9],
            'pb': round(float(r['pb']), 3),
            'ca': int(float(r[26])), 'ch': int(float(r[27])),
            't': None if r[29] == 'Sin tope' else int(float(r[30])),
            'g': str(r[6]).strip(),
            'cf': 1 if str(r[28]).startswith('Si') else 0,
            'z': int(float(r[31])) if str(r[31]).strip().isdigit() else 0,
        })

    periodo = f'{MESES[int(ym[4:6]) - 1]} {ym[:4]}'
    data = {'periodo': periodo,
            'fuente': 'Superintendencia de Salud - Archivo Maestro de Planes Complementarios',
            'planes': planes}
    with open('planes_data.js', 'w', encoding='utf-8') as f:
        f.write('const PLANES_DATA = '
                + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';')
    print(f'✓ planes_data.js regenerado: {len(planes)} planes · periodo {periodo}')


if __name__ == '__main__':
    ym, contenido = descargar()
    procesar(ym, contenido)
